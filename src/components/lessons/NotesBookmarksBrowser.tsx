import { createSignal, createMemo, For, Show, onMount } from "solid-js";
import { getAllNotesAsync, getAllBookmarksAsync } from "../../lib/studyStore";

// Types
interface Note {
  id: string;
  timestamp: string;
  content: string;
  createdAt: string;
  importance?: "high" | "medium" | "low" | "none";
  tags?: string[];
}

interface Bookmark {
  id: string;
  timestamp: string;
  label: string;
  createdAt: string;
}

interface StudyItem {
  type: "note" | "bookmark";
  videoId: string;
  videoTitle: string;
  playlistId?: string;
  playlistName?: string;
  category?: string;
  timestamp: string;
  content: string;
  createdAt: string;
  importance?: "high" | "medium" | "low" | "none";
  tags?: string[];
  id: string;
}

interface VideoInfo {
  id: string;
  title: string;
  playlistId?: string;
  playlistName?: string;
  category?: string;
}

interface PlaylistInfo {
  id: string;
  name: string;
  category: string;
}

interface NotesBookmarksBrowserProps {
  videos: VideoInfo[];
  playlists: PlaylistInfo[];
  categories: string[];
}

type ViewType = "all" | "notes" | "bookmarks";
type SortOption = "date" | "video" | "importance";

export default function NotesBookmarksBrowser(props: NotesBookmarksBrowserProps) {
  const [isOpen, setIsOpen] = createSignal(true);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [allItems, setAllItems] = createSignal<StudyItem[]>([]);
  const [viewType, setViewType] = createSignal<ViewType>("all");
  const [filterImportance, setFilterImportance] = createSignal<string>("all");
  const [filterTag, setFilterTag] = createSignal<string>("all");
  const [filterCategory, setFilterCategory] = createSignal<string>("all");
  const [filterPlaylist, setFilterPlaylist] = createSignal<string>("all");
  const [filterVideo, setFilterVideo] = createSignal<string>("all");
  const [sortBy, setSortBy] = createSignal<SortOption>("date");
  
  // Build video info map
  const videoInfoMap = createMemo(() => {
    const map = new Map<string, VideoInfo>();
    props.videos.forEach(v => map.set(v.id, v));
    return map;
  });

  // Build playlist info map
  const playlistInfoMap = createMemo(() => {
    const map = new Map<string, PlaylistInfo>();
    props.playlists.forEach(p => map.set(p.id, p));
    return map;
  });
  
  // Load all notes and bookmarks from IndexedDB
  const loadAllItems = async () => {
    if (typeof window === "undefined") return;
    
    const items: StudyItem[] = [];
    
    try {
      // Load all notes from IndexedDB
      const notes = await getAllNotesAsync();
      notes.forEach((note) => {
        const videoInfo = videoInfoMap().get(note.videoId);
        const videoTitle = videoInfo?.title || "فيديو غير معروف";
        const playlistId = videoInfo?.playlistId;
        const playlistInfo = playlistId ? playlistInfoMap().get(playlistId) : undefined;
        
        items.push({
          type: "note",
          videoId: note.videoId,
          videoTitle,
          playlistId,
          playlistName: playlistInfo?.name,
          category: playlistInfo?.category || videoInfo?.category,
          timestamp: note.timestamp,
          content: note.content,
          createdAt: note.createdAt,
          importance: note.importance as "high" | "medium" | "low" | "none",
          tags: note.tags,
          id: note.id,
        });
      });
      
      // Load all bookmarks from IndexedDB
      const bookmarks = await getAllBookmarksAsync();
      bookmarks.forEach((bookmark) => {
        const videoInfo = videoInfoMap().get(bookmark.videoId);
        const videoTitle = videoInfo?.title || "فيديو غير معروف";
        const playlistId = videoInfo?.playlistId;
        const playlistInfo = playlistId ? playlistInfoMap().get(playlistId) : undefined;
        
        items.push({
          type: "bookmark",
          videoId: bookmark.videoId,
          videoTitle,
          playlistId,
          playlistName: playlistInfo?.name,
          category: playlistInfo?.category || videoInfo?.category,
          timestamp: bookmark.timestamp,
          content: bookmark.label,
          createdAt: bookmark.createdAt,
          id: bookmark.id,
        });
      });
    } catch (e) {
      console.error("Error loading data from IndexedDB", e);
    }
    
    setAllItems(items);
  };
  
  onMount(() => {
    loadAllItems();
  });
  
  // Get all unique tags
  const allTags = createMemo(() => {
    const tags = new Set<string>();
    allItems().forEach(item => {
      item.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  });

  // Get videos that have notes/bookmarks
  const videosWithData = createMemo(() => {
    const videoIds = new Set<string>();
    allItems().forEach(item => videoIds.add(item.videoId));
    return props.videos.filter(v => videoIds.has(v.id));
  });

  // Get playlists that have videos with notes/bookmarks
  const playlistsWithData = createMemo(() => {
    const playlistIds = new Set<string>();
    allItems().forEach(item => {
      if (item.playlistId) playlistIds.add(item.playlistId);
    });
    return props.playlists.filter(p => playlistIds.has(p.id));
  });

  // Get categories that have data
  const categoriesWithData = createMemo(() => {
    const cats = new Set<string>();
    allItems().forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return props.categories.filter(c => cats.has(c));
  });

  // Stats
  const stats = createMemo(() => {
    const items = allItems();
    return {
      total: items.length,
      notes: items.filter(i => i.type === "note").length,
      bookmarks: items.filter(i => i.type === "bookmark").length,
      highImportance: items.filter(i => i.importance === "high").length,
    };
  });
  
  // Filter and sort items
  const filteredItems = createMemo(() => {
    let filtered = allItems();
    
    // Type filter
    if (viewType() === "notes") {
      filtered = filtered.filter(item => item.type === "note");
    } else if (viewType() === "bookmarks") {
      filtered = filtered.filter(item => item.type === "bookmark");
    }
    
    // Search filter
    const query = searchQuery().toLowerCase().trim();
    if (query) {
      filtered = filtered.filter(item => 
        item.content.toLowerCase().includes(query) ||
        item.videoTitle.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        item.playlistName?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
      );
    }
    
    // Importance filter (only for notes)
    if (filterImportance() !== "all") {
      filtered = filtered.filter(item => 
        item.type === "bookmark" || (item.importance || "none") === filterImportance()
      );
    }
    
    // Tag filter
    if (filterTag() !== "all") {
      filtered = filtered.filter(item => item.tags?.includes(filterTag()));
    }

    // Category filter
    if (filterCategory() !== "all") {
      filtered = filtered.filter(item => item.category === filterCategory());
    }

    // Playlist filter
    if (filterPlaylist() !== "all") {
      filtered = filtered.filter(item => item.playlistId === filterPlaylist());
    }

    // Video filter
    if (filterVideo() !== "all") {
      filtered = filtered.filter(item => item.videoId === filterVideo());
    }
    
    // Sort
    switch (sortBy()) {
      case "date":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "video":
        filtered.sort((a, b) => a.videoTitle.localeCompare(b.videoTitle, "ar"));
        break;
      case "importance":
        const importanceOrder = { high: 0, medium: 1, low: 2, none: 3, undefined: 4 };
        filtered.sort((a, b) => {
          const aOrder = importanceOrder[a.importance as keyof typeof importanceOrder] ?? 4;
          const bOrder = importanceOrder[b.importance as keyof typeof importanceOrder] ?? 4;
          return aOrder - bOrder;
        });
        break;
    }
    
    return filtered;
  });
  
  // Get importance style
  const getImportanceStyle = (importance?: string) => {
    switch (importance) {
      case "high": return { color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/30", label: "مهم جداً" };
      case "medium": return { color: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/30", label: "متوسط" };
      case "low": return { color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30", label: "منخفض" };
      default: return { color: "text-emerald-300", bg: "", border: "border-emerald-700/30", label: "" };
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

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setViewType("all");
    setFilterImportance("all");
    setFilterTag("all");
    setFilterCategory("all");
    setFilterPlaylist("all");
    setFilterVideo("all");
    setSortBy("date");
  };

  // Check if any filter is active
  const hasActiveFilters = createMemo(() => {
    return searchQuery() !== "" ||
      viewType() !== "all" ||
      filterImportance() !== "all" ||
      filterTag() !== "all" ||
      filterCategory() !== "all" ||
      filterPlaylist() !== "all" ||
      filterVideo() !== "all";
  });

  return (
    <div class="bg-emerald-900/50 rounded-2xl border border-emerald-700/50 overflow-hidden">
      {/* Header */}
      <div class="p-6 border-b border-emerald-700/50">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-amber-400 flex items-center gap-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            مكتبة الملاحظات والعلامات
          </h2>
          <button
            onClick={() => { setIsOpen(!isOpen()); if (!isOpen()) loadAllItems(); }}
            class="p-2 text-emerald-400 hover:text-amber-400 transition-colors"
          >
            <svg class={`w-5 h-5 transition-transform ${isOpen() ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Stats Bar */}
        <div class="flex flex-wrap gap-4 text-sm">
          <span class="flex items-center gap-1 text-emerald-300">
            <span class="text-lg">📊</span>
            {stats().total} عنصر
          </span>
          <span class="flex items-center gap-1 text-blue-400">
            <span class="text-lg">📝</span>
            {stats().notes} ملاحظة
          </span>
          <span class="flex items-center gap-1 text-purple-400">
            <span class="text-lg">🔖</span>
            {stats().bookmarks} علامة
          </span>
          <Show when={stats().highImportance > 0}>
            <span class="flex items-center gap-1 text-red-400">
              <span class="text-lg">⚠️</span>
              {stats().highImportance} مهم
            </span>
          </Show>
        </div>
      </div>

      <Show when={isOpen()}>
        <div class="p-6 space-y-4">
          {/* Search Input */}
          <div class="relative">
            <input
              type="text"
              placeholder="ابحث في العناوين والمحتوى..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              class="w-full px-4 py-3 pr-12 bg-emerald-800/50 border border-emerald-600 rounded-xl text-emerald-50 placeholder-emerald-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Type Tabs */}
          <div class="flex gap-2 p-1 bg-emerald-800/30 rounded-xl">
            <button
              onClick={() => setViewType("all")}
              class={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewType() === "all"
                  ? "bg-amber-500 text-emerald-950"
                  : "text-emerald-300 hover:text-amber-400"
              }`}
            >
              الكل ({stats().total})
            </button>
            <button
              onClick={() => setViewType("notes")}
              class={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewType() === "notes"
                  ? "bg-blue-500 text-white"
                  : "text-emerald-300 hover:text-blue-400"
              }`}
            >
              📝 ملاحظات ({stats().notes})
            </button>
            <button
              onClick={() => setViewType("bookmarks")}
              class={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewType() === "bookmarks"
                  ? "bg-purple-500 text-white"
                  : "text-emerald-300 hover:text-purple-400"
              }`}
            >
              🔖 علامات ({stats().bookmarks})
            </button>
          </div>

          {/* Filters Row */}
          <div class="flex flex-wrap gap-2">
            {/* Category Filter */}
            <Show when={categoriesWithData().length > 0}>
              <select
                value={filterCategory()}
                onChange={(e) => { setFilterCategory(e.currentTarget.value); setFilterPlaylist("all"); setFilterVideo("all"); }}
                class="px-3 py-2 bg-emerald-800/50 border border-emerald-600 rounded-lg text-emerald-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">📚 كل التصنيفات</option>
                <For each={categoriesWithData()}>
                  {(cat) => <option value={cat}>{cat}</option>}
                </For>
              </select>
            </Show>

            {/* Playlist Filter */}
            <Show when={playlistsWithData().length > 0}>
              <select
                value={filterPlaylist()}
                onChange={(e) => { setFilterPlaylist(e.currentTarget.value); setFilterVideo("all"); }}
                class="px-3 py-2 bg-emerald-800/50 border border-emerald-600 rounded-lg text-emerald-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">📋 كل القوائم</option>
                <For each={filterCategory() === "all" ? playlistsWithData() : playlistsWithData().filter(p => p.category === filterCategory())}>
                  {(playlist) => <option value={playlist.id}>{playlist.name}</option>}
                </For>
              </select>
            </Show>

            {/* Video Filter */}
            <Show when={videosWithData().length > 0}>
              <select
                value={filterVideo()}
                onChange={(e) => setFilterVideo(e.currentTarget.value)}
                class="px-3 py-2 bg-emerald-800/50 border border-emerald-600 rounded-lg text-emerald-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 max-w-[200px]"
              >
                <option value="all">🎬 كل الفيديوهات</option>
                <For each={
                  filterPlaylist() !== "all" 
                    ? videosWithData().filter(v => v.playlistId === filterPlaylist())
                    : filterCategory() !== "all"
                      ? videosWithData().filter(v => v.category === filterCategory())
                      : videosWithData()
                }>
                  {(video) => <option value={video.id}>{video.title.substring(0, 40)}...</option>}
                </For>
              </select>
            </Show>

            {/* Importance Filter */}
            <Show when={viewType() !== "bookmarks"}>
              <select
                value={filterImportance()}
                onChange={(e) => setFilterImportance(e.currentTarget.value)}
                class="px-3 py-2 bg-emerald-800/50 border border-emerald-600 rounded-lg text-emerald-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">⭐ كل الأهمية</option>
                <option value="high">🔴 مهم جداً</option>
                <option value="medium">🟡 متوسط</option>
                <option value="low">🟢 منخفض</option>
                <option value="none">⚪ بدون</option>
              </select>
            </Show>

            {/* Tag Filter */}
            <Show when={allTags().length > 0}>
              <select
                value={filterTag()}
                onChange={(e) => setFilterTag(e.currentTarget.value)}
                class="px-3 py-2 bg-emerald-800/50 border border-emerald-600 rounded-lg text-emerald-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">🏷️ كل الوسوم</option>
                <For each={allTags()}>
                  {(tag) => <option value={tag}>#{tag}</option>}
                </For>
              </select>
            </Show>

            {/* Sort */}
            <select
              value={sortBy()}
              onChange={(e) => setSortBy(e.currentTarget.value as SortOption)}
              class="px-3 py-2 bg-emerald-800/50 border border-emerald-600 rounded-lg text-emerald-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="date">📅 الأحدث</option>
              <option value="video">🎬 حسب الفيديو</option>
              <option value="importance">⭐ حسب الأهمية</option>
            </select>

            {/* Clear Filters */}
            <Show when={hasActiveFilters()}>
              <button
                onClick={clearFilters}
                class="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
              >
                ✕ مسح الفلاتر
              </button>
            </Show>

            {/* Results Count */}
            <span class="text-sm text-emerald-400 mr-auto flex items-center px-3 py-2">
              {filteredItems().length} نتيجة
            </span>
          </div>

          {/* Results */}
          <div class="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
            <For each={filteredItems()}>
              {(item) => {
                const style = getImportanceStyle(item.importance);
                const isNote = item.type === "note";
                return (
                  <a
                    href={`/lessons/${item.videoId}`}
                    class={`block p-4 rounded-xl border transition-all hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 ${
                      isNote ? style.bg : "bg-purple-500/10"
                    } ${isNote ? style.border : "border-purple-500/30"}`}
                  >
                    {/* Header Row */}
                    <div class="flex items-start justify-between gap-3 mb-2">
                      <div class="flex-1 min-w-0">
                        {/* Type Badge & Video Title */}
                        <div class="flex items-center gap-2 mb-1">
                          <span class={`text-xs px-2 py-0.5 rounded-full ${
                            isNote ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                          }`}>
                            {isNote ? "📝 ملاحظة" : "🔖 علامة"}
                          </span>
                          <Show when={item.category}>
                            <span class="text-xs px-2 py-0.5 bg-emerald-700/50 text-emerald-300 rounded-full">
                              {item.category}
                            </span>
                          </Show>
                        </div>
                        
                        {/* Video Title */}
                        <h4 class="font-medium text-amber-400 text-sm truncate">
                          {highlightText(item.videoTitle, searchQuery())}
                        </h4>
                        
                        {/* Metadata Row */}
                        <div class="flex items-center gap-2 mt-1 flex-wrap">
                          <span class="text-amber-300/70 font-mono text-xs bg-amber-500/10 px-2 py-0.5 rounded">
                            ▶️ {item.timestamp}
                          </span>
                          <span class="text-emerald-500 text-xs">
                            {formatDate(item.createdAt)}
                          </span>
                          <Show when={item.playlistName}>
                            <span class="text-emerald-400/60 text-xs">
                              📋 {item.playlistName}
                            </span>
                          </Show>
                        </div>
                      </div>
                      
                      {/* Importance Badge */}
                      <Show when={isNote && item.importance && item.importance !== "none"}>
                        <span class={`text-xs px-2 py-0.5 rounded shrink-0 ${style.color} ${style.bg}`}>
                          {style.label}
                        </span>
                      </Show>
                    </div>

                    {/* Content */}
                    <p class="text-emerald-200 text-sm whitespace-pre-wrap line-clamp-3">
                      {highlightText(item.content, searchQuery())}
                    </p>

                    {/* Tags */}
                    <Show when={item.tags && item.tags.length > 0}>
                      <div class="flex flex-wrap gap-1 mt-2">
                        <For each={item.tags}>
                          {(tag) => (
                            <span 
                              class="text-xs px-2 py-0.5 bg-emerald-700/50 text-emerald-300 rounded-full hover:bg-emerald-600/50 cursor-pointer"
                              onClick={(e) => { e.preventDefault(); setFilterTag(tag); }}
                            >
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

            {/* Empty States */}
            <Show when={filteredItems().length === 0 && allItems().length > 0}>
              <div class="text-center py-12 text-emerald-400">
                <div class="text-5xl mb-3">🔍</div>
                <p class="text-lg">لا توجد نتائج مطابقة</p>
                <p class="text-sm text-emerald-500 mt-1">جرب تغيير معايير البحث أو الفلاتر</p>
                <button
                  onClick={clearFilters}
                  class="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-lg text-sm font-medium transition-colors"
                >
                  مسح جميع الفلاتر
                </button>
              </div>
            </Show>

            <Show when={allItems().length === 0}>
              <div class="text-center py-12 text-emerald-400">
                <div class="text-5xl mb-3">📚</div>
                <p class="text-lg">لا توجد ملاحظات أو علامات بعد</p>
                <p class="text-sm text-emerald-500 mt-1">ابدأ بتدوين ملاحظاتك أثناء مشاهدة الدروس</p>
                <a
                  href="/lessons"
                  class="inline-block mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-lg text-sm font-medium transition-colors"
                >
                  تصفح الدروس
                </a>
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
