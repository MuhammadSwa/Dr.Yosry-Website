import { createSignal, createMemo, For, Show, onMount, createEffect } from "solid-js";
import type { PlaylistCategory, Playlist } from "../../lib/lessons";
import type { TransformedVideo, PlaylistWithVideos } from "../../lib/videoLoader";
import VideoProgressBadge from "./VideoProgressBadge";

// Re-export for compatibility
export type Video = TransformedVideo;
export type { PlaylistWithVideos };

interface LessonsAppProps {
  playlists: PlaylistWithVideos[];
  channelVideos: Video[];
  channelInfo: {
    id: string;
    name: string;
    description: string;
  };
  categories: PlaylistCategory[];
}

type ViewMode = "grid" | "list";
type SortOption = "date" | "views" | "title";

const VIDEOS_PER_PAGE_OPTIONS = [12, 24, 48, 96];

// Helper function to parse ISO 8601 duration
function parseDuration(duration?: string): string {
  if (!duration) return "";
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Format view count
function formatViews(views?: string): string {
  if (!views) return "";
  const num = parseInt(views);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return views;
}

// Format date in Arabic
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function LessonsApp(props: LessonsAppProps) {
  const [searchQuery, setSearchQuery] = createSignal("");
  const [selectedCategory, setSelectedCategory] = createSignal<PlaylistCategory | "all" | "channel">("all");
  const [selectedPlaylist, setSelectedPlaylist] = createSignal<string | null>(null);
  const [viewMode, setViewMode] = createSignal<ViewMode>("grid");
  const [sortBy, setSortBy] = createSignal<SortOption>("date");
  const [mounted, setMounted] = createSignal(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = createSignal(1);
  const [videosPerPage, setVideosPerPage] = createSignal(24);

  onMount(() => {
    setMounted(true);
    // Restore pagination preference from localStorage
    const savedPerPage = localStorage.getItem("lessons_per_page");
    if (savedPerPage) {
      setVideosPerPage(parseInt(savedPerPage));
    }
  });

  // Reset to page 1 when filters change
  createEffect(() => {
    // Track these dependencies
    searchQuery();
    selectedCategory();
    selectedPlaylist();
    sortBy();
    // Reset to page 1
    setCurrentPage(1);
  });

  // Navigate to video study page
  const openVideoPage = (video: Video) => {
    window.location.href = `/lessons/${video.id}`;
  };

  // Get all videos based on current selection
  const allVideos = createMemo(() => {
    if (selectedCategory() === "channel") {
      return props.channelVideos;
    }
    
    if (selectedPlaylist()) {
      const playlist = props.playlists.find(p => p.id === selectedPlaylist());
      return playlist?.videos || [];
    }
    
    if (selectedCategory() === "all") {
      // Return all videos from all playlists
      return props.playlists.flatMap(p => p.videos);
    }
    
    // Return videos from playlists in selected category
    return props.playlists
      .filter(p => p.category === selectedCategory())
      .flatMap(p => p.videos);
  });

  // Filter videos by search query
  const filteredVideos = createMemo(() => {
    const query = searchQuery().toLowerCase().trim();
    let videos = allVideos();
    
    if (query) {
      videos = videos.filter(v => 
        v.title.toLowerCase().includes(query) ||
        v.description.toLowerCase().includes(query) ||
        v.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Sort videos
    const sortOption = sortBy();
    return [...videos].sort((a, b) => {
      switch (sortOption) {
        case "date":
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case "views":
          return (parseInt(b.viewCount || "0")) - (parseInt(a.viewCount || "0"));
        case "title":
          return a.title.localeCompare(b.title, "ar");
        default:
          return 0;
      }
    });
  });

  // Pagination calculations
  const totalPages = createMemo(() => Math.ceil(filteredVideos().length / videosPerPage()));
  
  const paginatedVideos = createMemo(() => {
    const start = (currentPage() - 1) * videosPerPage();
    const end = start + videosPerPage();
    return filteredVideos().slice(start, end);
  });

  // Generate page numbers to display
  const pageNumbers = createMemo(() => {
    const total = totalPages();
    const current = currentPage();
    const pages: (number | "...")[] = [];
    
    if (total <= 7) {
      // Show all pages if 7 or less
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      // Always show first page
      pages.push(1);
      
      if (current > 3) {
        pages.push("...");
      }
      
      // Show pages around current
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      
      if (current < total - 2) {
        pages.push("...");
      }
      
      // Always show last page
      if (!pages.includes(total)) pages.push(total);
    }
    
    return pages;
  });

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages()) {
      setCurrentPage(page);
      // Scroll to top of video grid
      document.getElementById("video-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleVideosPerPageChange = (value: number) => {
    setVideosPerPage(value);
    setCurrentPage(1);
    localStorage.setItem("lessons_per_page", value.toString());
  };

  // Get playlists for selected category
  const categoryPlaylists = createMemo(() => {
    if (selectedCategory() === "all" || selectedCategory() === "channel") {
      return props.playlists;
    }
    return props.playlists.filter(p => p.category === selectedCategory());
  });

  // Statistics
  const stats = createMemo(() => ({
    totalVideos: props.playlists.reduce((acc, p) => acc + p.videos.length, 0) + props.channelVideos.length,
    totalPlaylists: props.playlists.length,
    categories: props.categories.filter(c => props.playlists.some(p => p.category === c)).length,
  }));

  const handleCategoryClick = (category: PlaylistCategory | "all" | "channel") => {
    setSelectedCategory(category);
    setSelectedPlaylist(null);
  };

  const handlePlaylistClick = (playlistId: string) => {
    setSelectedPlaylist(playlistId === selectedPlaylist() ? null : playlistId);
  };

  return (
    <div class="min-h-screen bg-emerald-950 text-emerald-50">
      {/* Header Section */}
      <header class="bg-gradient-to-b from-emerald-900 to-emerald-950 pt-24 pb-8">
        <div class="container mx-auto px-4">
          {/* Channel Info */}
          <div class="text-center mb-8">
            <h1 class="text-4xl md:text-5xl font-bold text-amber-400 mb-4 font-cairo">
              📚 المكتبة المرئية
            </h1>
            <p class="text-emerald-200 text-lg max-w-2xl mx-auto">
              {props.channelInfo.description}
            </p>
          </div>

          {/* Stats Cards */}
          <div class="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
            <div class="bg-emerald-800/50 rounded-xl p-4 text-center backdrop-blur-sm border border-emerald-700/50">
              <div class="text-2xl font-bold text-amber-400">{stats().totalVideos}</div>
              <div class="text-sm text-emerald-300">فيديو</div>
            </div>
            <div class="bg-emerald-800/50 rounded-xl p-4 text-center backdrop-blur-sm border border-emerald-700/50">
              <div class="text-2xl font-bold text-amber-400">{stats().totalPlaylists}</div>
              <div class="text-sm text-emerald-300">قائمة تشغيل</div>
            </div>
            <div class="bg-emerald-800/50 rounded-xl p-4 text-center backdrop-blur-sm border border-emerald-700/50">
              <div class="text-2xl font-bold text-amber-400">{stats().categories}</div>
              <div class="text-sm text-emerald-300">تصنيف</div>
            </div>
          </div>

          {/* Search Bar */}
          <div class="max-w-2xl mx-auto">
            <div class="relative">
              <input
                type="text"
                placeholder="ابحث في الدروس..."
                value={searchQuery()}
                onInput={(e) => setSearchQuery(e.currentTarget.value)}
                class="w-full px-6 py-4 pr-14 bg-emerald-800/70 border border-emerald-600 rounded-2xl text-emerald-50 placeholder-emerald-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg"
              />
              <div class="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main class="container mx-auto px-4 py-8">
        <div class="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Categories & Playlists */}
          <aside class="lg:w-72 shrink-0">
            <div class="sticky top-24 space-y-6">
              {/* Categories */}
              <div class="bg-emerald-900/50 rounded-2xl p-4 border border-emerald-700/50">
                <h3 class="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  التصنيفات
                </h3>
                <div class="space-y-2">
                  <button
                    onClick={() => handleCategoryClick("all")}
                    class={`w-full text-right px-4 py-2 rounded-lg transition-all duration-200 ${
                      selectedCategory() === "all"
                        ? "bg-amber-500 text-emerald-950 font-bold"
                        : "hover:bg-emerald-800 text-emerald-200"
                    }`}
                  >
                    الكل
                  </button>
                  <button
                    onClick={() => handleCategoryClick("channel")}
                    class={`w-full text-right px-4 py-2 rounded-lg transition-all duration-200 ${
                      selectedCategory() === "channel"
                        ? "bg-amber-500 text-emerald-950 font-bold"
                        : "hover:bg-emerald-800 text-emerald-200"
                    }`}
                  >
                    📺 القناة
                  </button>
                  <For each={props.categories}>
                    {(category) => {
                      const hasPlaylists = props.playlists.some(p => p.category === category);
                      return (
                        <Show when={hasPlaylists}>
                          <button
                            onClick={() => handleCategoryClick(category)}
                            class={`w-full text-right px-4 py-2 rounded-lg transition-all duration-200 ${
                              selectedCategory() === category
                                ? "bg-amber-500 text-emerald-950 font-bold"
                                : "hover:bg-emerald-800 text-emerald-200"
                            }`}
                          >
                            {category}
                          </button>
                        </Show>
                      );
                    }}
                  </For>
                </div>
              </div>

              {/* Playlists */}
              <Show when={selectedCategory() !== "channel"}>
                <div class="bg-emerald-900/50 rounded-2xl p-4 border border-emerald-700/50">
                  <h3 class="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    قوائم التشغيل
                  </h3>
                  <div class="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                    <For each={categoryPlaylists()}>
                      {(playlist) => (
                        <button
                          onClick={() => handlePlaylistClick(playlist.id)}
                          class={`w-full text-right px-4 py-3 rounded-lg transition-all duration-200 ${
                            selectedPlaylist() === playlist.id
                              ? "bg-amber-500/20 border border-amber-500 text-amber-400"
                              : "hover:bg-emerald-800 text-emerald-200 border border-transparent"
                          }`}
                        >
                          <div class="font-medium">{playlist.name}</div>
                          <div class="text-sm text-emerald-400">{playlist.videos.length} فيديو</div>
                        </button>
                      )}
                    </For>
                  </div>
                </div>
              </Show>
            </div>
          </aside>

          {/* Video Grid */}
          <div class="flex-1">
            {/* Controls Bar */}
            <div id="video-grid" class="flex flex-wrap items-center justify-between gap-4 mb-6 scroll-mt-24">
              <div class="text-emerald-300">
                <span class="font-bold text-amber-400">{filteredVideos().length}</span> نتيجة
                {searchQuery() && (
                  <span class="mr-2">للبحث عن "{searchQuery()}"</span>
                )}
                <Show when={totalPages() > 1}>
                  <span class="mr-2 text-emerald-400">
                    (صفحة {currentPage()} من {totalPages()})
                  </span>
                </Show>
              </div>
              
              <div class="flex flex-wrap items-center gap-4">
                {/* Videos Per Page */}
                <div class="flex items-center gap-2">
                  <span class="text-emerald-400 text-sm">عرض:</span>
                  <select
                    value={videosPerPage()}
                    onChange={(e) => handleVideosPerPageChange(parseInt(e.currentTarget.value))}
                    class="bg-emerald-800 border border-emerald-600 rounded-lg px-3 py-2 text-emerald-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  >
                    <For each={VIDEOS_PER_PAGE_OPTIONS}>
                      {(option) => (
                        <option value={option}>{option}</option>
                      )}
                    </For>
                  </select>
                </div>

                {/* Sort Dropdown */}
                <select
                  value={sortBy()}
                  onChange={(e) => setSortBy(e.currentTarget.value as SortOption)}
                  class="bg-emerald-800 border border-emerald-600 rounded-lg px-4 py-2 text-emerald-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="date">الأحدث</option>
                  <option value="views">الأكثر مشاهدة</option>
                  <option value="title">الاسم</option>
                </select>

                {/* View Mode Toggle */}
                <div class="flex bg-emerald-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    class={`p-2 rounded ${viewMode() === "grid" ? "bg-amber-500 text-emerald-950" : "text-emerald-300 hover:text-white"}`}
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    class={`p-2 rounded ${viewMode() === "list" ? "bg-amber-500 text-emerald-950" : "text-emerald-300 hover:text-white"}`}
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Videos Grid/List */}
            <Show
              when={filteredVideos().length > 0}
              fallback={
                <div class="text-center py-16">
                  <div class="text-6xl mb-4">🔍</div>
                  <h3 class="text-xl font-bold text-emerald-300 mb-2">لا توجد نتائج</h3>
                  <p class="text-emerald-400">جرب البحث بكلمات مختلفة أو اختر تصنيفًا آخر</p>
                </div>
              }
            >
              <div
                class={
                  viewMode() === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                }
              >
                <For each={paginatedVideos()}>
                  {(video) => (
                    <Show when={viewMode() === "grid"} fallback={
                      /* List View */
                      <a 
                        href={`/lessons/${video.id}`}
                        class="flex gap-4 bg-emerald-900/50 rounded-xl p-4 border border-emerald-700/50 hover:border-amber-500/50 cursor-pointer transition-all duration-300 hover:bg-emerald-900/70"
                      >
                        <div class="relative shrink-0">
                          <img
                            src={video.thumbnails.medium?.url || video.thumbnails.default?.url}
                            alt={video.title}
                            class="w-48 h-28 object-cover rounded-lg"
                          />
                          <Show when={video.duration}>
                            <span class="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                              {parseDuration(video.duration)}
                            </span>
                          </Show>
                        </div>
                        <div class="flex-1 min-w-0">
                          <h3 class="font-bold text-emerald-50 line-clamp-2 mb-2 hover:text-amber-400 transition-colors">
                            {video.title}
                          </h3>
                          <p class="text-emerald-400 text-sm line-clamp-2 mb-2">{video.description}</p>
                          <div class="flex flex-wrap gap-3 text-sm text-emerald-300">
                            <span>📅 {formatDate(video.publishedAt)}</span>
                            <Show when={video.viewCount}>
                              <span>👁️ {formatViews(video.viewCount)}</span>
                            </Show>
                          </div>
                          {/* Progress Badge */}
                          <Show when={mounted()}>
                            <VideoProgressBadge videoId={video.id} showProgress={true} showFavorite={true} showWatchLater={true} />
                          </Show>
                        </div>
                      </a>
                    }>
                      {/* Grid View */}
                      <a 
                        href={`/lessons/${video.id}`}
                        class="group bg-emerald-900/50 rounded-xl overflow-hidden border border-emerald-700/50 hover:border-amber-500/50 cursor-pointer transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/10"
                      >
                        <div class="relative">
                          <img
                            src={video.thumbnails.high?.url || video.thumbnails.medium?.url || video.thumbnails.default?.url}
                            alt={video.title}
                            class="w-full aspect-video object-cover"
                          />
                          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div class="bg-amber-500 rounded-full p-4">
                              <svg class="w-8 h-8 text-emerald-950" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                          <Show when={video.duration}>
                            <span class="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                              {parseDuration(video.duration)}
                            </span>
                          </Show>
                        </div>
                        <div class="p-4">
                          <h3 class="font-bold text-emerald-50 line-clamp-2 mb-2 group-hover:text-amber-400 transition-colors">
                            {video.title}
                          </h3>
                          <div class="flex justify-between items-center text-sm text-emerald-400">
                            <span>{formatDate(video.publishedAt)}</span>
                            <Show when={video.viewCount}>
                              <span>{formatViews(video.viewCount)} مشاهدة</span>
                            </Show>
                          </div>
                          {/* Progress Badge */}
                          <Show when={mounted()}>
                            <VideoProgressBadge videoId={video.id} showProgress={true} showFavorite={true} showWatchLater={true} />
                          </Show>
                        </div>
                      </a>
                    </Show>
                  )}
                </For>
              </div>

              {/* Pagination Controls */}
              <Show when={totalPages() > 1}>
                <div class="mt-8 flex flex-col items-center gap-4">
                  {/* Page Info */}
                  <div class="text-emerald-400 text-sm">
                    عرض {((currentPage() - 1) * videosPerPage()) + 1} - {Math.min(currentPage() * videosPerPage(), filteredVideos().length)} من {filteredVideos().length} فيديو
                  </div>
                  
                  {/* Pagination Buttons */}
                  <div class="flex flex-wrap items-center justify-center gap-2">
                    {/* First Page */}
                    <button
                      onClick={() => goToPage(1)}
                      disabled={currentPage() === 1}
                      class={`p-2 rounded-lg transition-all ${
                        currentPage() === 1
                          ? "text-emerald-600 cursor-not-allowed"
                          : "text-emerald-300 hover:bg-emerald-800 hover:text-amber-400"
                      }`}
                      title="الصفحة الأولى"
                    >
                      <svg class="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Previous Page */}
                    <button
                      onClick={() => goToPage(currentPage() - 1)}
                      disabled={currentPage() === 1}
                      class={`p-2 rounded-lg transition-all ${
                        currentPage() === 1
                          ? "text-emerald-600 cursor-not-allowed"
                          : "text-emerald-300 hover:bg-emerald-800 hover:text-amber-400"
                      }`}
                      title="الصفحة السابقة"
                    >
                      <svg class="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Page Numbers */}
                    <For each={pageNumbers()}>
                      {(page) => (
                        <Show
                          when={page !== "..."}
                          fallback={
                            <span class="px-2 text-emerald-500">...</span>
                          }
                        >
                          <button
                            onClick={() => goToPage(page as number)}
                            class={`min-w-[40px] h-10 rounded-lg font-medium transition-all ${
                              currentPage() === page
                                ? "bg-amber-500 text-emerald-950"
                                : "text-emerald-300 hover:bg-emerald-800 hover:text-amber-400"
                            }`}
                          >
                            {page}
                          </button>
                        </Show>
                      )}
                    </For>

                    {/* Next Page */}
                    <button
                      onClick={() => goToPage(currentPage() + 1)}
                      disabled={currentPage() === totalPages()}
                      class={`p-2 rounded-lg transition-all ${
                        currentPage() === totalPages()
                          ? "text-emerald-600 cursor-not-allowed"
                          : "text-emerald-300 hover:bg-emerald-800 hover:text-amber-400"
                      }`}
                      title="الصفحة التالية"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Last Page */}
                    <button
                      onClick={() => goToPage(totalPages())}
                      disabled={currentPage() === totalPages()}
                      class={`p-2 rounded-lg transition-all ${
                        currentPage() === totalPages()
                          ? "text-emerald-600 cursor-not-allowed"
                          : "text-emerald-300 hover:bg-emerald-800 hover:text-amber-400"
                      }`}
                      title="الصفحة الأخيرة"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Quick Jump */}
                  <div class="flex items-center gap-2 text-sm">
                    <span class="text-emerald-400">انتقل إلى:</span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages()}
                      value={currentPage()}
                      onChange={(e) => {
                        const page = parseInt(e.currentTarget.value);
                        if (page >= 1 && page <= totalPages()) {
                          goToPage(page);
                        }
                      }}
                      class="w-16 px-2 py-1 bg-emerald-800 border border-emerald-600 rounded text-center text-emerald-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span class="text-emerald-500">من {totalPages()}</span>
                  </div>
                </div>
              </Show>
            </Show>
          </div>
        </div>
      </main>

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
