import { createSignal, createEffect, createMemo, onMount, For, Show } from "solid-js";

// Extend Window interface for YouTube player
interface YouTubeWindow extends Window {
  getYouTubeTimestamp?: () => string;
  getYouTubeProgress?: () => { currentTime: number; duration: number; percentage: number };
  seekYouTubeTo?: (seconds: number) => void;
  youtubePlayer?: any;
}

declare const window: YouTubeWindow;

interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  duration?: string;
  channelId: string;
  channelTitle: string;
  thumbnails: any;
  tags?: string[];
  viewCount?: string;
  likeCount?: string;
  commentCount?: string;
}

// Note importance levels
type NoteImportance = "high" | "medium" | "low" | "none";

interface Note {
  id: string;
  timestamp: string;
  content: string;
  createdAt: string;
  importance?: NoteImportance;
  tags?: string[];
}

interface Bookmark {
  id: string;
  timestamp: string;
  label: string;
  createdAt: string;
}

interface StudyProgress {
  videoId: string;
  completed: boolean;
  lastWatched: string;
  watchedPercentage: number;
  rating: number;
}

interface VideoStudyData {
  notes: Note[];
  bookmarks: Bookmark[];
  progress: StudyProgress;
}

interface VideoStudyProps {
  video: Video;
  videoId: string;
}

// Storage key prefix
const STORAGE_KEY_PREFIX = "video_study_";

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format timestamp for display
function formatTimestamp(timestamp: string): string {
  if (!timestamp) return "00:00";
  return timestamp;
}

// Get storage key for a video
function getStorageKey(videoId: string): string {
  return `${STORAGE_KEY_PREFIX}${videoId}`;
}

// Load study data from localStorage
function loadStudyData(videoId: string): VideoStudyData {
  if (typeof window === "undefined") {
    return getDefaultStudyData(videoId);
  }
  
  try {
    const stored = localStorage.getItem(getStorageKey(videoId));
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading study data:", e);
  }
  
  return getDefaultStudyData(videoId);
}

// Save study data to localStorage
function saveStudyData(videoId: string, data: VideoStudyData): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(getStorageKey(videoId), JSON.stringify(data));
  } catch (e) {
    console.error("Error saving study data:", e);
  }
}

// Get default study data
function getDefaultStudyData(videoId: string): VideoStudyData {
  return {
    notes: [],
    bookmarks: [],
    progress: {
      videoId,
      completed: false,
      lastWatched: new Date().toISOString(),
      watchedPercentage: 0,
      rating: 0,
    },
  };
}

export default function VideoStudy(props: VideoStudyProps) {
  const [activeTab, setActiveTab] = createSignal<"notes" | "bookmarks" | "progress">("notes");
  const [notes, setNotes] = createSignal<Note[]>([]);
  const [bookmarks, setBookmarks] = createSignal<Bookmark[]>([]);
  const [progress, setProgress] = createSignal<StudyProgress>(getDefaultStudyData(props.video.id).progress);
  const [playerReady, setPlayerReady] = createSignal(false);
  
  // Note form
  const [newNoteContent, setNewNoteContent] = createSignal("");
  const [newNoteTimestamp, setNewNoteTimestamp] = createSignal("");
  const [editingNoteId, setEditingNoteId] = createSignal<string | null>(null);
  const [newNoteImportance, setNewNoteImportance] = createSignal<NoteImportance>("none");
  const [newNoteTags, setNewNoteTags] = createSignal("");
  const [noteFilterImportance, setNoteFilterImportance] = createSignal<NoteImportance | "all">("all");
  const [noteFilterTag, setNoteFilterTag] = createSignal<string>("all");
  
  // Bookmark form
  const [newBookmarkLabel, setNewBookmarkLabel] = createSignal("");
  const [newBookmarkTimestamp, setNewBookmarkTimestamp] = createSignal("");
  
  // Current playback time display
  const [currentTimeDisplay, setCurrentTimeDisplay] = createSignal("00:00");
  const [videoDuration, setVideoDuration] = createSignal("00:00");
  
  // Format seconds to timestamp string
  const formatSecondsToTimestamp = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };
  
  // Get current timestamp from YouTube player
  const captureCurrentTimestamp = (): string => {
    if (typeof window !== "undefined" && window.getYouTubeTimestamp) {
      return window.getYouTubeTimestamp();
    }
    return "00:00";
  };

  // Capture and set timestamp for notes
  const captureTimestampForNote = () => {
    const timestamp = captureCurrentTimestamp();
    setNewNoteTimestamp(timestamp);
  };

  // Capture and set timestamp for bookmarks
  const captureTimestampForBookmark = () => {
    const timestamp = captureCurrentTimestamp();
    setNewBookmarkTimestamp(timestamp);
  };

  // Get all unique tags from notes
  const allTags = createMemo(() => {
    const tags = new Set<string>();
    notes().forEach(note => {
      note.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  });

  // Filter notes based on importance and tag filters
  const filteredNotes = createMemo(() => {
    let filtered = notes();
    
    // Filter by importance
    if (noteFilterImportance() !== "all") {
      filtered = filtered.filter(n => (n.importance || "none") === noteFilterImportance());
    }
    
    // Filter by tag
    if (noteFilterTag() !== "all") {
      filtered = filtered.filter(n => n.tags?.includes(noteFilterTag()));
    }
    
    // Sort by timestamp
    return filtered.sort((a, b) => {
      const aTime = a.timestamp.split(":").reduce((acc, t, i, arr) => acc + parseInt(t) * Math.pow(60, arr.length - 1 - i), 0);
      const bTime = b.timestamp.split(":").reduce((acc, t, i, arr) => acc + parseInt(t) * Math.pow(60, arr.length - 1 - i), 0);
      return aTime - bTime;
    });
  });

  // Get importance color and label
  const getImportanceStyle = (importance: NoteImportance) => {
    switch (importance) {
      case "high": return { color: "text-red-400", bg: "bg-red-500/20", label: "مهم جداً" };
      case "medium": return { color: "text-amber-400", bg: "bg-amber-500/20", label: "متوسط" };
      case "low": return { color: "text-emerald-400", bg: "bg-emerald-500/20", label: "منخفض" };
      default: return { color: "text-emerald-300", bg: "", label: "" };
    }
  };
  
  // Load data on mount
  onMount(() => {
    const data = loadStudyData(props.video.id);
    setNotes(data.notes);
    setBookmarks(data.bookmarks);
    setProgress(data.progress);
    
    // Update last watched
    const updatedProgress = {
      ...data.progress,
      lastWatched: new Date().toISOString(),
    };
    setProgress(updatedProgress);
    saveAllData();

    // Listen for YouTube player ready event
    const handlePlayerReady = () => {
      setPlayerReady(true);
      // Initial progress check
      if (window.getYouTubeProgress) {
        const prog = window.getYouTubeProgress();
        if (prog.duration > 0) {
          setVideoDuration(formatSecondsToTimestamp(prog.duration));
        }
      }
    };
    
    // Listen for progress updates from the player
    const handleProgressUpdate = (event: CustomEvent<{ currentTime: number; duration: number; percentage: number }>) => {
      const { currentTime, duration, percentage } = event.detail;
      setCurrentTimeDisplay(formatSecondsToTimestamp(currentTime));
      if (duration > 0) {
        setVideoDuration(formatSecondsToTimestamp(duration));
      }
      // Auto-update watched percentage
      setProgress(prev => ({
        ...prev,
        watchedPercentage: Math.max(prev.watchedPercentage, percentage),
        lastWatched: new Date().toISOString(),
      }));
    };
    
    // Listen for video ended event
    const handleVideoEnded = () => {
      setProgress(prev => ({
        ...prev,
        completed: true,
        watchedPercentage: 100,
        lastWatched: new Date().toISOString(),
      }));
    };
    
    window.addEventListener("youtubePlayerReady", handlePlayerReady);
    window.addEventListener("youtubeProgressUpdate", handleProgressUpdate as EventListener);
    window.addEventListener("youtubeVideoEnded", handleVideoEnded);
    
    // Check if player is already ready
    if (window.getYouTubeTimestamp) {
      setPlayerReady(true);
    }
    
    // Periodic progress check (every second for display)
    const displayInterval = setInterval(() => {
      if (window.getYouTubeProgress) {
        const prog = window.getYouTubeProgress();
        setCurrentTimeDisplay(formatSecondsToTimestamp(prog.currentTime));
        if (prog.duration > 0) {
          setVideoDuration(formatSecondsToTimestamp(prog.duration));
        }
      }
    }, 1000);

    return () => {
      window.removeEventListener("youtubePlayerReady", handlePlayerReady);
      window.removeEventListener("youtubeProgressUpdate", handleProgressUpdate as EventListener);
      window.removeEventListener("youtubeVideoEnded", handleVideoEnded);
      clearInterval(displayInterval);
    };
  });
  
  // Save all data helper
  const saveAllData = () => {
    saveStudyData(props.video.id, {
      notes: notes(),
      bookmarks: bookmarks(),
      progress: progress(),
    });
  };
  
  // Auto-save when data changes
  createEffect(() => {
    // Access signals to track them
    notes();
    bookmarks();
    progress();
    saveAllData();
  });
  
  // Add a new note
  const addNote = () => {
    const content = newNoteContent().trim();
    if (!content) return;
    
    // Parse tags from comma-separated string
    const tags = newNoteTags().trim()
      ? newNoteTags().split(",").map(t => t.trim()).filter(t => t)
      : [];
    
    const newNote: Note = {
      id: generateId(),
      timestamp: newNoteTimestamp() || "00:00",
      content,
      createdAt: new Date().toISOString(),
      importance: newNoteImportance(),
      tags: tags.length > 0 ? tags : undefined,
    };
    
    setNotes([...notes(), newNote]);
    setNewNoteContent("");
    setNewNoteTimestamp("");
    setNewNoteImportance("none");
    setNewNoteTags("");
  };
  
  // Delete a note
  const deleteNote = (id: string) => {
    setNotes(notes().filter(n => n.id !== id));
  };
  
  // Edit a note
  const startEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setNewNoteContent(note.content);
    setNewNoteTimestamp(note.timestamp);
    setNewNoteImportance(note.importance || "none");
    setNewNoteTags(note.tags?.join(", ") || "");
  };
  
  const saveEditNote = () => {
    const id = editingNoteId();
    if (!id) return;
    
    // Parse tags from comma-separated string
    const tags = newNoteTags().trim()
      ? newNoteTags().split(",").map(t => t.trim()).filter(t => t)
      : [];
    
    setNotes(notes().map(n => 
      n.id === id 
        ? { 
            ...n, 
            content: newNoteContent(), 
            timestamp: newNoteTimestamp(),
            importance: newNoteImportance(),
            tags: tags.length > 0 ? tags : undefined,
          }
        : n
    ));
    
    setEditingNoteId(null);
    setNewNoteContent("");
    setNewNoteTimestamp("");
    setNewNoteImportance("none");
    setNewNoteTags("");
  };
  
  const cancelEdit = () => {
    setEditingNoteId(null);
    setNewNoteContent("");
    setNewNoteTimestamp("");
    setNewNoteImportance("none");
    setNewNoteTags("");
  };
  
  // Add a bookmark
  const addBookmark = () => {
    const label = newBookmarkLabel().trim();
    const timestamp = newBookmarkTimestamp().trim();
    if (!label || !timestamp) return;
    
    const newBookmark: Bookmark = {
      id: generateId(),
      timestamp,
      label,
      createdAt: new Date().toISOString(),
    };
    
    setBookmarks([...bookmarks(), newBookmark]);
    setNewBookmarkLabel("");
    setNewBookmarkTimestamp("");
  };
  
  // Delete a bookmark
  const deleteBookmark = (id: string) => {
    setBookmarks(bookmarks().filter(b => b.id !== id));
  };
  
  // Toggle completed
  const toggleCompleted = () => {
    setProgress(prev => ({
      ...prev,
      completed: !prev.completed,
    }));
  };
  
  // Set rating
  const setRating = (rating: number) => {
    setProgress(prev => ({
      ...prev,
      rating,
    }));
  };
  
  // Update watch percentage
  const updateWatchPercentage = (percentage: number) => {
    setProgress(prev => ({
      ...prev,
      watchedPercentage: Math.min(100, Math.max(0, percentage)),
    }));
  };
  
  // Export notes as text
  const exportNotes = () => {
    const notesList = notes();
    if (notesList.length === 0) return;
    
    let text = `ملاحظات: ${props.video.title}\n`;
    text += `${"=".repeat(50)}\n\n`;
    
    notesList.forEach((note, index) => {
      text += `[${note.timestamp}] ملاحظة ${index + 1}:\n`;
      text += `${note.content}\n\n`;
    });
    
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes-${props.video.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy timestamp to seek in YouTube
  const copyTimestamp = (timestamp: string) => {
    // Parse timestamp to seconds
    const parts = timestamp.split(":").map(Number);
    let seconds = 0;
    if (parts.length === 3) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1];
    } else {
      seconds = parts[0] || 0;
    }
    
    const url = `${props.video.url}&t=${seconds}s`;
    navigator.clipboard.writeText(url);
  };

  // Seek video to timestamp
  const seekToTimestamp = (timestamp: string) => {
    // Parse timestamp to seconds
    const parts = timestamp.split(":").map(Number);
    let seconds = 0;
    if (parts.length === 3) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1];
    } else {
      seconds = parts[0] || 0;
    }
    
    // Seek using the exposed seekYouTubeTo function
    if (typeof window !== "undefined" && window.seekYouTubeTo) {
      window.seekYouTubeTo(seconds);
    } else if (typeof window !== "undefined" && window.youtubePlayer && typeof window.youtubePlayer.seekTo === "function") {
      // Fallback to direct player access
      window.youtubePlayer.seekTo(seconds, true);
    }
  };

  return (
    <div class="bg-emerald-900/50 rounded-2xl border border-emerald-700/50 sticky top-24">
      {/* Header */}
      <div class="p-4 border-b border-emerald-700/50">
        <h2 class="text-xl font-bold text-amber-400 flex items-center gap-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          أدوات الدراسة
        </h2>
      </div>

      {/* Tabs */}
      <div class="flex border-b border-emerald-700/50">
        <button
          onClick={() => setActiveTab("notes")}
          class={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab() === "notes"
              ? "text-amber-400 border-b-2 border-amber-400 bg-emerald-800/30"
              : "text-emerald-300 hover:text-emerald-100"
          }`}
        >
          📝 الملاحظات ({notes().length})
        </button>
        <button
          onClick={() => setActiveTab("bookmarks")}
          class={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab() === "bookmarks"
              ? "text-amber-400 border-b-2 border-amber-400 bg-emerald-800/30"
              : "text-emerald-300 hover:text-emerald-100"
          }`}
        >
          🔖 العلامات ({bookmarks().length})
        </button>
        <button
          onClick={() => setActiveTab("progress")}
          class={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab() === "progress"
              ? "text-amber-400 border-b-2 border-amber-400 bg-emerald-800/30"
              : "text-emerald-300 hover:text-emerald-100"
          }`}
        >
          📊 التقدم
        </button>
      </div>

      {/* Tab Content */}
      <div class="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {/* Notes Tab */}
        <Show when={activeTab() === "notes"}>
          <div class="space-y-4">
            {/* Add Note Form */}
            <div class="bg-emerald-800/30 rounded-xl p-4 space-y-3">
              <div class="flex gap-2">
                <input
                  type="text"
                  placeholder="التوقيت (مثل: 05:30)"
                  value={newNoteTimestamp()}
                  onInput={(e) => setNewNoteTimestamp(e.currentTarget.value)}
                  class="flex-1 px-3 py-2 bg-emerald-900/50 border border-emerald-600 rounded-lg text-emerald-50 placeholder-emerald-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={captureTimestampForNote}
                  class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                    playerReady()
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-emerald-700/50 text-emerald-400 cursor-not-allowed"
                  }`}
                  disabled={!playerReady()}
                  title={playerReady() ? "التقاط التوقيت الحالي" : "انتظر تحميل المشغل"}
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
                    <circle cx="12" cy="12" r="4"/>
                  </svg>
                  التقاط
                </button>
                <Show when={editingNoteId()}>
                  <button
                    onClick={cancelEdit}
                    class="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30"
                  >
                    إلغاء
                  </button>
                </Show>
              </div>
              <textarea
                placeholder="اكتب ملاحظتك هنا..."
                value={newNoteContent()}
                onInput={(e) => setNewNoteContent(e.currentTarget.value)}
                class="w-full px-3 py-2 bg-emerald-900/50 border border-emerald-600 rounded-lg text-emerald-50 placeholder-emerald-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                rows="3"
              />
              
              {/* Importance and Tags Row */}
              <div class="flex gap-2">
                {/* Importance Selector */}
                <div class="flex-1">
                  <label class="block text-xs text-emerald-400 mb-1">الأهمية</label>
                  <select
                    value={newNoteImportance()}
                    onChange={(e) => setNewNoteImportance(e.currentTarget.value as NoteImportance)}
                    class="w-full px-3 py-2 bg-emerald-900/50 border border-emerald-600 rounded-lg text-emerald-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="none">بدون</option>
                    <option value="low">منخفض</option>
                    <option value="medium">متوسط</option>
                    <option value="high">مهم جداً</option>
                  </select>
                </div>
                
                {/* Tags Input */}
                <div class="flex-1">
                  <label class="block text-xs text-emerald-400 mb-1">الوسوم (مفصولة بفاصلة)</label>
                  <input
                    type="text"
                    placeholder="عقيدة, فقه, تفسير..."
                    value={newNoteTags()}
                    onInput={(e) => setNewNoteTags(e.currentTarget.value)}
                    class="w-full px-3 py-2 bg-emerald-900/50 border border-emerald-600 rounded-lg text-emerald-50 placeholder-emerald-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              
              <div class="flex gap-2">
                <button
                  onClick={editingNoteId() ? saveEditNote : addNote}
                  class="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-lg font-medium text-sm transition-colors"
                >
                  {editingNoteId() ? "💾 حفظ التعديل" : "➕ إضافة ملاحظة"}
                </button>
                <Show when={notes().length > 0}>
                  <button
                    onClick={exportNotes}
                    class="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-emerald-50 rounded-lg text-sm transition-colors"
                    title="تصدير الملاحظات"
                  >
                    📤
                  </button>
                </Show>
              </div>
            </div>

            {/* Note Filters */}
            <Show when={notes().length > 0}>
              <div class="bg-emerald-800/20 rounded-lg p-3 flex flex-wrap gap-2 items-center">
                <span class="text-xs text-emerald-400">تصفية:</span>
                <select
                  value={noteFilterImportance()}
                  onChange={(e) => setNoteFilterImportance(e.currentTarget.value as NoteImportance | "all")}
                  class="px-2 py-1 bg-emerald-900/50 border border-emerald-600 rounded text-emerald-50 text-xs focus:outline-none"
                >
                  <option value="all">كل الأهمية</option>
                  <option value="high">مهم جداً</option>
                  <option value="medium">متوسط</option>
                  <option value="low">منخفض</option>
                  <option value="none">بدون</option>
                </select>
                <Show when={allTags().length > 0}>
                  <select
                    value={noteFilterTag()}
                    onChange={(e) => setNoteFilterTag(e.currentTarget.value)}
                    class="px-2 py-1 bg-emerald-900/50 border border-emerald-600 rounded text-emerald-50 text-xs focus:outline-none"
                  >
                    <option value="all">كل الوسوم</option>
                    <For each={allTags()}>
                      {(tag) => <option value={tag}>{tag}</option>}
                    </For>
                  </select>
                </Show>
                <span class="text-xs text-emerald-500 mr-auto">
                  {filteredNotes().length} / {notes().length} ملاحظة
                </span>
              </div>
            </Show>

            {/* Notes List */}
            <div class="space-y-3">
              <For each={filteredNotes()}>
                {(note) => {
                  const style = getImportanceStyle(note.importance || "none");
                  return (
                    <div class={`bg-emerald-800/20 rounded-xl p-4 border border-emerald-700/30 group ${note.importance && note.importance !== "none" ? style.bg : ""}`}>
                      <div class="flex items-start justify-between gap-2 mb-2">
                        <div class="flex items-center gap-2">
                          <button
                            onClick={() => seekToTimestamp(note.timestamp)}
                            onContextMenu={(e) => { e.preventDefault(); copyTimestamp(note.timestamp); }}
                            class="text-amber-400 font-mono text-sm bg-amber-500/10 px-2 py-1 rounded hover:bg-amber-500/20 transition-colors"
                            title="اضغط للانتقال • كليك يمين للنسخ"
                          >
                            ▶️ {formatTimestamp(note.timestamp)}
                          </button>
                          {/* Importance Badge */}
                          <Show when={note.importance && note.importance !== "none"}>
                            <span class={`text-xs px-2 py-0.5 rounded ${style.color} ${style.bg}`}>
                              {style.label}
                            </span>
                          </Show>
                        </div>
                        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEditNote(note)}
                            class="p-1 text-emerald-400 hover:text-amber-400 transition-colors"
                            title="تعديل"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteNote(note.id)}
                            class="p-1 text-emerald-400 hover:text-red-400 transition-colors"
                            title="حذف"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p class="text-emerald-200 text-sm whitespace-pre-wrap">{note.content}</p>
                      {/* Tags */}
                      <Show when={note.tags && note.tags.length > 0}>
                        <div class="flex flex-wrap gap-1 mt-2">
                          <For each={note.tags}>
                            {(tag) => (
                              <span 
                                class="text-xs px-2 py-0.5 bg-emerald-700/50 text-emerald-300 rounded-full cursor-pointer hover:bg-emerald-600/50"
                                onClick={() => setNoteFilterTag(tag)}
                                title={`تصفية حسب "${tag}"`}
                              >
                                #{tag}
                              </span>
                            )}
                          </For>
                        </div>
                      </Show>
                    </div>
                  );
                }}
              </For>
              
              <Show when={filteredNotes().length === 0 && notes().length > 0}>
                <div class="text-center py-8 text-emerald-400">
                  <div class="text-4xl mb-2">🔍</div>
                  <p>لا توجد ملاحظات تطابق الفلتر</p>
                  <button
                    onClick={() => { setNoteFilterImportance("all"); setNoteFilterTag("all"); }}
                    class="text-sm text-amber-400 hover:text-amber-300 mt-2"
                  >
                    إزالة الفلتر
                  </button>
                </div>
              </Show>
              
              <Show when={notes().length === 0}>
                <div class="text-center py-8 text-emerald-400">
                  <div class="text-4xl mb-2">📝</div>
                  <p>لا توجد ملاحظات بعد</p>
                  <p class="text-sm text-emerald-500">ابدأ بتدوين ملاحظاتك أثناء المشاهدة</p>
                </div>
              </Show>
            </div>
          </div>
        </Show>

        {/* Bookmarks Tab */}
        <Show when={activeTab() === "bookmarks"}>
          <div class="space-y-4">
            {/* Add Bookmark Form */}
            <div class="bg-emerald-800/30 rounded-xl p-4 space-y-3">
              <div class="flex gap-2">
                <input
                  type="text"
                  placeholder="التوقيت (مثل: 10:45)"
                  value={newBookmarkTimestamp()}
                  onInput={(e) => setNewBookmarkTimestamp(e.currentTarget.value)}
                  class="flex-1 px-3 py-2 bg-emerald-900/50 border border-emerald-600 rounded-lg text-emerald-50 placeholder-emerald-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={captureTimestampForBookmark}
                  class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                    playerReady()
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-emerald-700/50 text-emerald-400 cursor-not-allowed"
                  }`}
                  disabled={!playerReady()}
                  title={playerReady() ? "التقاط التوقيت الحالي" : "انتظر تحميل المشغل"}
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
                    <circle cx="12" cy="12" r="4"/>
                  </svg>
                  التقاط
                </button>
              </div>
              <input
                type="text"
                placeholder="عنوان العلامة..."
                value={newBookmarkLabel()}
                onInput={(e) => setNewBookmarkLabel(e.currentTarget.value)}
                class="w-full px-3 py-2 bg-emerald-900/50 border border-emerald-600 rounded-lg text-emerald-50 placeholder-emerald-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={addBookmark}
                class="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-lg font-medium text-sm transition-colors"
              >
                🔖 إضافة علامة مرجعية
              </button>
            </div>

            {/* Bookmarks List */}
            <div class="space-y-2">
              <For each={bookmarks().sort((a, b) => {
                const aTime = a.timestamp.split(":").reduce((acc, t, i, arr) => acc + parseInt(t) * Math.pow(60, arr.length - 1 - i), 0);
                const bTime = b.timestamp.split(":").reduce((acc, t, i, arr) => acc + parseInt(t) * Math.pow(60, arr.length - 1 - i), 0);
                return aTime - bTime;
              })}>
                {(bookmark) => (
                  <div class="flex items-center gap-3 bg-emerald-800/20 rounded-lg p-3 border border-emerald-700/30 group">
                    <button
                      onClick={() => seekToTimestamp(bookmark.timestamp)}
                      onContextMenu={(e) => { e.preventDefault(); copyTimestamp(bookmark.timestamp); }}
                      class="text-amber-400 font-mono text-sm bg-amber-500/10 px-2 py-1 rounded hover:bg-amber-500/20 transition-colors shrink-0"
                      title="اضغط للانتقال • كليك يمين للنسخ"
                    >
                      ▶️ {bookmark.timestamp}
                    </button>
                    <span class="text-emerald-200 text-sm flex-1">{bookmark.label}</span>
                    <button
                      onClick={() => deleteBookmark(bookmark.id)}
                      class="p-1 text-emerald-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="حذف"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </For>
              
              <Show when={bookmarks().length === 0}>
                <div class="text-center py-8 text-emerald-400">
                  <div class="text-4xl mb-2">🔖</div>
                  <p>لا توجد علامات مرجعية</p>
                  <p class="text-sm text-emerald-500">أضف علامات للنقاط المهمة في الفيديو</p>
                </div>
              </Show>
            </div>
          </div>
        </Show>

        {/* Progress Tab */}
        <Show when={activeTab() === "progress"}>
          <div class="space-y-6">
            {/* Current Playback Position */}
            <div class="bg-emerald-800/30 rounded-xl p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-emerald-200 font-medium flex items-center gap-2">
                  <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  الموقع الحالي
                </span>
                <span class="text-amber-400 font-mono text-lg font-bold">
                  {currentTimeDisplay()} / {videoDuration()}
                </span>
              </div>
              <p class="text-emerald-500 text-xs">
                ✨ يتم حفظ موقعك تلقائياً • ستستأنف من هنا عند العودة
              </p>
            </div>

            {/* Completion Status */}
            <div class="bg-emerald-800/30 rounded-xl p-4">
              <div class="flex items-center justify-between mb-4">
                <span class="text-emerald-200 font-medium">حالة الإكمال</span>
                <button
                  onClick={toggleCompleted}
                  class={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    progress().completed
                      ? "bg-green-500 text-white"
                      : "bg-emerald-700 text-emerald-200 hover:bg-emerald-600"
                  }`}
                >
                  {progress().completed ? "✅ مكتمل" : "⏳ قيد المشاهدة"}
                </button>
              </div>
            </div>

            {/* Watch Progress */}
            <div class="bg-emerald-800/30 rounded-xl p-4">
              <div class="flex items-center justify-between mb-3">
                <span class="text-emerald-200 font-medium">نسبة المشاهدة</span>
                <span class="text-amber-400 font-bold">{progress().watchedPercentage}%</span>
              </div>
              <div class="relative">
                <div class="w-full h-3 bg-emerald-700 rounded-lg overflow-hidden">
                  <div 
                    class="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
                    style={{ width: `${progress().watchedPercentage}%` }}
                  />
                </div>
              </div>
              <p class="text-emerald-500 text-xs mt-2">
                يتم تحديث النسبة تلقائياً أثناء المشاهدة
              </p>
            </div>

            {/* Rating */}
            <div class="bg-emerald-800/30 rounded-xl p-4">
              <span class="text-emerald-200 font-medium block mb-3">تقييم الدرس</span>
              <div class="flex justify-center gap-2">
                <For each={[1, 2, 3, 4, 5]}>
                  {(star) => (
                    <button
                      onClick={() => setRating(star)}
                      class={`text-3xl transition-transform hover:scale-110 ${
                        star <= progress().rating ? "text-amber-400" : "text-emerald-700"
                      }`}
                    >
                      ★
                    </button>
                  )}
                </For>
              </div>
            </div>

            {/* Last Watched */}
            <div class="bg-emerald-800/30 rounded-xl p-4">
              <div class="flex items-center justify-between">
                <span class="text-emerald-200 font-medium">آخر مشاهدة</span>
                <span class="text-emerald-400 text-sm">
                  {new Date(progress().lastWatched).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-emerald-800/30 rounded-xl p-4 text-center">
                <div class="text-2xl font-bold text-amber-400">{notes().length}</div>
                <div class="text-sm text-emerald-400">ملاحظة</div>
              </div>
              <div class="bg-emerald-800/30 rounded-xl p-4 text-center">
                <div class="text-2xl font-bold text-amber-400">{bookmarks().length}</div>
                <div class="text-sm text-emerald-400">علامة</div>
              </div>
            </div>
          </div>
        </Show>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(4, 120, 87, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d97706;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #f59e0b;
        }
      `}</style>
    </div>
  );
}
