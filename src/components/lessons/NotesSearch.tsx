import { createSignal, createMemo, For, Show, onMount } from "solid-js";
import { getAllNotesAsync } from "../../lib/studyStore";

interface Note {
  id: string;
  timestamp: string;
  content: string;
  createdAt: string;
  importance?: "high" | "medium" | "low" | "none";
  tags?: string[];
}

interface VideoNote {
  videoId: string;
  videoTitle: string;
  note: Note;
}

interface VideoInfo {
  id: string;
  title: string;
}

interface NotesSearchProps {
  videos: VideoInfo[];
}

export default function NotesSearch(props: NotesSearchProps) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [allNotes, setAllNotes] = createSignal<VideoNote[]>([]);
  const [filterImportance, setFilterImportance] = createSignal<string>("all");
  const [filterTag, setFilterTag] = createSignal<string>("all");
  
  // Load all notes from IndexedDB
  const loadAllNotes = async () => {
    if (typeof window === "undefined") return;
    
    const notes: VideoNote[] = [];
    const videoTitleMap = new Map(props.videos.map(v => [v.id, v.title]));
    
    try {
      const allDbNotes = await getAllNotesAsync();
      
      allDbNotes.forEach((note) => {
        const videoTitle = videoTitleMap.get(note.videoId) || "فيديو غير معروف";
        notes.push({
          videoId: note.videoId,
          videoTitle,
          note: {
            id: note.id,
            timestamp: note.timestamp,
            content: note.content,
            createdAt: note.createdAt,
            importance: note.importance as "high" | "medium" | "low" | "none",
            tags: note.tags,
          },
        });
      });
    } catch (e) {
      console.error("Error loading notes from IndexedDB", e);
    }
    
    // Sort by creation date (newest first)
    notes.sort((a, b) => new Date(b.note.createdAt).getTime() - new Date(a.note.createdAt).getTime());
    setAllNotes(notes);
  };
  
  onMount(() => {
    loadAllNotes();
  });
  
  // Get all unique tags
  const allTags = createMemo(() => {
    const tags = new Set<string>();
    allNotes().forEach(item => {
      item.note.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  });
  
  // Filter notes based on search and filters
  const filteredNotes = createMemo(() => {
    let filtered = allNotes();
    
    // Search filter
    const query = searchQuery().toLowerCase().trim();
    if (query) {
      filtered = filtered.filter(item => 
        item.note.content.toLowerCase().includes(query) ||
        item.videoTitle.toLowerCase().includes(query) ||
        item.note.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Importance filter
    if (filterImportance() !== "all") {
      filtered = filtered.filter(item => (item.note.importance || "none") === filterImportance());
    }
    
    // Tag filter
    if (filterTag() !== "all") {
      filtered = filtered.filter(item => item.note.tags?.includes(filterTag()));
    }
    
    return filtered;
  });
  
  // Get importance style
  const getImportanceStyle = (importance: string) => {
    switch (importance) {
      case "high": return { color: "text-red-400", bg: "bg-red-500/20", label: "مهم جداً" };
      case "medium": return { color: "text-amber-400", bg: "bg-amber-500/20", label: "متوسط" };
      case "low": return { color: "text-emerald-400", bg: "bg-emerald-500/20", label: "منخفض" };
      default: return { color: "text-emerald-300", bg: "", label: "" };
    }
  };
  
  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  
  // Highlight search term in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) 
        ? <mark class="bg-amber-500/30 text-amber-200 px-0.5 rounded">{part}</mark>
        : part
    );
  };

  return (
    <div class="bg-emerald-900/50 rounded-2xl border border-emerald-700/50 p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-amber-400 flex items-center gap-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          البحث في الملاحظات
        </h2>
        <div class="flex items-center gap-3">
          <span class="text-sm text-emerald-400">{allNotes().length} ملاحظة</span>
          <button
            onClick={() => { setIsOpen(!isOpen()); if (!isOpen()) loadAllNotes(); }}
            class="p-2 text-emerald-400 hover:text-amber-400 transition-colors"
          >
            <svg class={`w-5 h-5 transition-transform ${isOpen() ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      <Show when={isOpen()}>
        <div class="space-y-4">
          {/* Search Input */}
          <div class="relative">
            <input
              type="text"
              placeholder="ابحث في جميع ملاحظاتك..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              class="w-full px-4 py-3 pr-12 bg-emerald-800/50 border border-emerald-600 rounded-xl text-emerald-50 placeholder-emerald-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filters */}
          <div class="flex flex-wrap gap-3">
            <select
              value={filterImportance()}
              onChange={(e) => setFilterImportance(e.currentTarget.value)}
              class="px-3 py-2 bg-emerald-800/50 border border-emerald-600 rounded-lg text-emerald-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">كل الأهمية</option>
              <option value="high">مهم جداً</option>
              <option value="medium">متوسط</option>
              <option value="low">منخفض</option>
              <option value="none">بدون</option>
            </select>

            <Show when={allTags().length > 0}>
              <select
                value={filterTag()}
                onChange={(e) => setFilterTag(e.currentTarget.value)}
                class="px-3 py-2 bg-emerald-800/50 border border-emerald-600 rounded-lg text-emerald-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">كل الوسوم</option>
                <For each={allTags()}>
                  {(tag) => <option value={tag}>{tag}</option>}
                </For>
              </select>
            </Show>

            <span class="text-sm text-emerald-400 mr-auto flex items-center">
              {filteredNotes().length} نتيجة
            </span>
          </div>

          {/* Results */}
          <div class="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
            <For each={filteredNotes()}>
              {(item) => {
                const style = getImportanceStyle(item.note.importance || "none");
                return (
                  <a
                    href={`/lessons/${item.videoId}`}
                    class={`block p-4 rounded-xl border border-emerald-700/30 hover:border-amber-500/50 transition-colors ${item.note.importance && item.note.importance !== "none" ? style.bg : "bg-emerald-800/30"}`}
                  >
                    {/* Video Title & Timestamp */}
                    <div class="flex items-start justify-between gap-2 mb-2">
                      <div class="flex-1 min-w-0">
                        <h4 class="font-medium text-amber-400 text-sm truncate">
                          {item.videoTitle}
                        </h4>
                        <div class="flex items-center gap-2 mt-1">
                          <span class="text-amber-300/70 font-mono text-xs bg-amber-500/10 px-2 py-0.5 rounded">
                            ▶️ {item.note.timestamp}
                          </span>
                          <span class="text-emerald-500 text-xs">
                            {formatDate(item.note.createdAt)}
                          </span>
                        </div>
                      </div>
                      <Show when={item.note.importance && item.note.importance !== "none"}>
                        <span class={`text-xs px-2 py-0.5 rounded shrink-0 ${style.color} ${style.bg}`}>
                          {style.label}
                        </span>
                      </Show>
                    </div>

                    {/* Note Content */}
                    <p class="text-emerald-200 text-sm whitespace-pre-wrap line-clamp-3">
                      {highlightText(item.note.content, searchQuery())}
                    </p>

                    {/* Tags */}
                    <Show when={item.note.tags && item.note.tags.length > 0}>
                      <div class="flex flex-wrap gap-1 mt-2">
                        <For each={item.note.tags}>
                          {(tag) => (
                            <span class="text-xs px-2 py-0.5 bg-emerald-700/50 text-emerald-300 rounded-full">
                              #{tag}
                            </span>
                          )}
                        </For>
                      </div>
                    </Show>
                  </a>
                );
              }}
            </For>

            <Show when={filteredNotes().length === 0 && allNotes().length > 0}>
              <div class="text-center py-8 text-emerald-400">
                <div class="text-4xl mb-2">🔍</div>
                <p>لا توجد نتائج مطابقة</p>
                <p class="text-sm text-emerald-500 mt-1">جرب كلمات بحث مختلفة</p>
              </div>
            </Show>

            <Show when={allNotes().length === 0}>
              <div class="text-center py-8 text-emerald-400">
                <div class="text-4xl mb-2">📝</div>
                <p>لا توجد ملاحظات بعد</p>
                <p class="text-sm text-emerald-500 mt-1">ابدأ بتدوين ملاحظاتك أثناء مشاهدة الفيديوهات</p>
              </div>
            </Show>
          </div>
        </div>
      </Show>

      {/* Custom Scrollbar */}
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
