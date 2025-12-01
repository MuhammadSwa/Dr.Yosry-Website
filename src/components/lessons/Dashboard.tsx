import { createSignal, createMemo, onMount, For, Show } from "solid-js";
import {
  calculateGlobalStatsAsync,
  getFavoritesAsync,
  getWatchLaterAsync,
  getRecentlyWatchedAsync,
  getRecentSessionsAsync,
  removeFromFavoritesAsync,
  removeFromWatchLaterAsync,
  exportAllDataAsync,
  importAllDataAsync,
  formatDuration,
  formatRelativeTime,
  type GlobalStats,
  type Favorite,
  type WatchLater,
  type Session,
} from "../../lib/studyStore";

interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  publishedAt: string;
}

interface DashboardProps {
  videos: VideoInfo[];
}

// Parse duration
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

export default function StudyDashboard(props: DashboardProps) {
  const [stats, setStats] = createSignal<GlobalStats | null>(null);
  const [favorites, setFavorites] = createSignal<Favorite[]>([]);
  const [watchLater, setWatchLater] = createSignal<WatchLater[]>([]);
  const [recentlyWatched, setRecentlyWatched] = createSignal<{ videoId: string; lastWatched: string; percentage: number }[]>([]);
  const [recentSessions, setRecentSessions] = createSignal<Session[]>([]);
  const [activeTab, setActiveTab] = createSignal<"overview" | "favorites" | "watchlater" | "history" | "settings">("overview");
  const [isLoaded, setIsLoaded] = createSignal(false);

  // Video lookup map
  const videoMap = createMemo(() => {
    const map = new Map<string, VideoInfo>();
    for (const video of props.videos) {
      map.set(video.id, video);
    }
    return map;
  });

  // Get video info by ID
  const getVideoInfo = (videoId: string): VideoInfo | undefined => {
    return videoMap().get(videoId);
  };

  // Refresh data
  const refreshData = async () => {
    setStats(await calculateGlobalStatsAsync());
    setFavorites(await getFavoritesAsync());
    setWatchLater(await getWatchLaterAsync());
    setRecentlyWatched(await getRecentlyWatchedAsync(10));
    setRecentSessions(await getRecentSessionsAsync(10));
  };

  onMount(async () => {
    await refreshData();
    setIsLoaded(true);
  });

  // Handle remove from favorites
  const handleRemoveFavorite = async (videoId: string) => {
    await removeFromFavoritesAsync(videoId);
    await refreshData();
  };

  // Handle remove from watch later
  const handleRemoveWatchLater = async (videoId: string) => {
    await removeFromWatchLaterAsync(videoId);
    await refreshData();
  };

  // Handle export
  const handleExport = async () => {
    try {
      const data = await exportAllDataAsync();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `study-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert("خطأ في تصدير البيانات");
    }
  };

  // Handle import
  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          await importAllDataAsync(data, true);
          await refreshData();
          alert("تم استيراد البيانات بنجاح!");
        } catch (err) {
          alert("خطأ في استيراد الملف");
        }
      }
    };
    input.click();
  };

  return (
    <div class="min-h-screen bg-emerald-950 text-emerald-50 pt-20">
      {/* Header */}
      <header class="bg-gradient-to-b from-emerald-900 to-emerald-950 py-8">
        <div class="container mx-auto px-4">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h1 class="text-3xl md:text-4xl font-bold text-amber-400 mb-2">
                📊 لوحة التحكم
              </h1>
              <p class="text-emerald-300">تتبع تقدمك في الدراسة وإدارة قوائمك</p>
            </div>
            <a
              href="/lessons"
              class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-lg font-medium transition-colors"
            >
              ← العودة للدروس
            </a>
          </div>

          {/* Navigation Tabs */}
          <div class="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("overview")}
              class={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab() === "overview"
                  ? "bg-amber-500 text-emerald-950"
                  : "bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700/50"
              }`}
            >
              📈 نظرة عامة
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              class={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab() === "favorites"
                  ? "bg-amber-500 text-emerald-950"
                  : "bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700/50"
              }`}
            >
              ⭐ المفضلة ({favorites().length})
            </button>
            <button
              onClick={() => setActiveTab("watchlater")}
              class={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab() === "watchlater"
                  ? "bg-amber-500 text-emerald-950"
                  : "bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700/50"
              }`}
            >
              📋 شاهد لاحقاً ({watchLater().length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              class={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab() === "history"
                  ? "bg-amber-500 text-emerald-950"
                  : "bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700/50"
              }`}
            >
              🕐 السجل
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              class={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab() === "settings"
                  ? "bg-amber-500 text-emerald-950"
                  : "bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700/50"
              }`}
            >
              ⚙️ الإعدادات
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main class="container mx-auto px-4 py-8">
        <Show when={!isLoaded()}>
          <div class="text-center py-16">
            <div class="animate-spin text-4xl mb-4">⏳</div>
            <p class="text-emerald-400">جاري التحميل...</p>
          </div>
        </Show>

        <Show when={isLoaded()}>
          {/* Overview Tab */}
          <Show when={activeTab() === "overview"}>
            <div class="space-y-8">
              {/* Stats Grid */}
              <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div class="bg-emerald-900/50 rounded-2xl p-6 border border-emerald-700/50 text-center">
                  <div class="text-4xl font-bold text-amber-400 mb-2">{stats()?.totalVideosWatched || 0}</div>
                  <div class="text-emerald-300">فيديو شوهد</div>
                </div>
                <div class="bg-emerald-900/50 rounded-2xl p-6 border border-emerald-700/50 text-center">
                  <div class="text-4xl font-bold text-green-400 mb-2">{stats()?.totalVideosCompleted || 0}</div>
                  <div class="text-emerald-300">فيديو مكتمل</div>
                </div>
                <div class="bg-emerald-900/50 rounded-2xl p-6 border border-emerald-700/50 text-center">
                  <div class="text-4xl font-bold text-blue-400 mb-2">{stats()?.totalNotes || 0}</div>
                  <div class="text-emerald-300">ملاحظة</div>
                </div>
                <div class="bg-emerald-900/50 rounded-2xl p-6 border border-emerald-700/50 text-center">
                  <div class="text-4xl font-bold text-purple-400 mb-2">{stats()?.totalBookmarks || 0}</div>
                  <div class="text-emerald-300">علامة مرجعية</div>
                </div>
                <div class="bg-emerald-900/50 rounded-2xl p-6 border border-emerald-700/50 text-center">
                  <div class="text-4xl font-bold text-orange-400 mb-2">{stats()?.currentStreak || 0}</div>
                  <div class="text-emerald-300">يوم متتالي 🔥</div>
                </div>
              </div>

              {/* Streak & Time Cards */}
              <div class="grid md:grid-cols-2 gap-6">
                {/* Study Streak */}
                <div class="bg-emerald-900/50 rounded-2xl p-6 border border-emerald-700/50">
                  <h3 class="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
                    🔥 سلسلة الدراسة
                  </h3>
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="text-5xl font-bold text-orange-400">{stats()?.currentStreak || 0}</div>
                      <div class="text-emerald-400">يوم متتالي</div>
                    </div>
                    <div class="text-left">
                      <div class="text-emerald-300 mb-1">أطول سلسلة</div>
                      <div class="text-2xl font-bold text-emerald-100">{stats()?.longestStreak || 0} يوم</div>
                    </div>
                  </div>
                  <div class="mt-4 pt-4 border-t border-emerald-700/50">
                    <p class="text-emerald-400 text-sm">
                      {stats()?.currentStreak === 0 
                        ? "ابدأ بمشاهدة درس اليوم لبناء سلسلتك! 💪"
                        : `أحسنت! استمر في الدراسة للحفاظ على سلسلتك 🌟`
                      }
                    </p>
                  </div>
                </div>

                {/* Total Watch Time */}
                <div class="bg-emerald-900/50 rounded-2xl p-6 border border-emerald-700/50">
                  <h3 class="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
                    ⏱️ وقت المشاهدة
                  </h3>
                  <div class="text-3xl font-bold text-emerald-100 mb-2">
                    {formatDuration(stats()?.totalWatchTime || 0)}
                  </div>
                  <div class="text-emerald-400">إجمالي وقت الدراسة</div>
                  <div class="mt-4 pt-4 border-t border-emerald-700/50">
                    <div class="flex justify-between text-sm">
                      <span class="text-emerald-400">متوسط التقييم</span>
                      <span class="text-amber-400 font-bold">
                        {stats()?.averageRating || 0} ★
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recently Watched */}
              <div class="bg-emerald-900/50 rounded-2xl p-6 border border-emerald-700/50">
                <h3 class="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
                  🕐 شوهد مؤخراً
                </h3>
                <Show
                  when={recentlyWatched().length > 0}
                  fallback={
                    <div class="text-center py-8 text-emerald-400">
                      <div class="text-4xl mb-2">📺</div>
                      <p>لم تشاهد أي فيديو بعد</p>
                      <a href="/lessons" class="text-amber-400 hover:text-amber-300 mt-2 inline-block">
                        ابدأ المشاهدة الآن ←
                      </a>
                    </div>
                  }
                >
                  <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <For each={recentlyWatched().slice(0, 5)}>
                      {(item) => {
                        const video = getVideoInfo(item.videoId);
                        return (
                          <a
                            href={`/lessons/${item.videoId}`}
                            class="group relative rounded-xl overflow-hidden border border-emerald-700/50 hover:border-amber-500/50 transition-all"
                          >
                            <img
                              src={video?.thumbnail || `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`}
                              alt={video?.title || "فيديو"}
                              class="w-full aspect-video object-cover"
                            />
                            {/* Progress bar */}
                            <div class="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                              <div
                                class="h-full bg-amber-500"
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                              <span class="text-white text-xs line-clamp-2">{video?.title || "فيديو"}</span>
                            </div>
                            <Show when={item.percentage === 100}>
                              <div class="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                                ✓
                              </div>
                            </Show>
                          </a>
                        );
                      }}
                    </For>
                  </div>
                </Show>
              </div>
            </div>
          </Show>

          {/* Favorites Tab */}
          <Show when={activeTab() === "favorites"}>
            <div class="bg-emerald-900/50 rounded-2xl p-6 border border-emerald-700/50">
              <h3 class="text-xl font-bold text-amber-400 mb-4">⭐ المفضلة</h3>
              <Show
                when={favorites().length > 0}
                fallback={
                  <div class="text-center py-12 text-emerald-400">
                    <div class="text-5xl mb-4">⭐</div>
                    <p class="text-lg mb-2">لا توجد مفضلات بعد</p>
                    <p class="text-sm text-emerald-500">أضف فيديوهات للمفضلة من صفحة الدرس</p>
                  </div>
                }
              >
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <For each={favorites()}>
                    {(fav) => {
                      const video = getVideoInfo(fav.videoId);
                      return (
                        <div class="group relative bg-emerald-800/30 rounded-xl overflow-hidden border border-emerald-700/50">
                          <a href={`/lessons/${fav.videoId}`}>
                            <img
                              src={fav.thumbnail || video?.thumbnail}
                              alt={fav.videoTitle}
                              class="w-full aspect-video object-cover"
                            />
                          </a>
                          <div class="p-3">
                            <a
                              href={`/lessons/${fav.videoId}`}
                              class="font-medium text-emerald-100 hover:text-amber-400 line-clamp-2 text-sm"
                            >
                              {fav.videoTitle || video?.title}
                            </a>
                            <div class="flex items-center justify-between mt-2">
                              <span class="text-xs text-emerald-500">
                                أضيف {formatRelativeTime(fav.addedAt)}
                              </span>
                              <button
                                onClick={() => handleRemoveFavorite(fav.videoId)}
                                class="text-emerald-500 hover:text-red-400 transition-colors"
                                title="إزالة من المفضلة"
                              >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </Show>
            </div>
          </Show>

          {/* Watch Later Tab */}
          <Show when={activeTab() === "watchlater"}>
            <div class="bg-emerald-900/50 rounded-2xl p-6 border border-emerald-700/50">
              <h3 class="text-xl font-bold text-amber-400 mb-4">📋 شاهد لاحقاً</h3>
              <Show
                when={watchLater().length > 0}
                fallback={
                  <div class="text-center py-12 text-emerald-400">
                    <div class="text-5xl mb-4">📋</div>
                    <p class="text-lg mb-2">قائمة المشاهدة فارغة</p>
                    <p class="text-sm text-emerald-500">أضف فيديوهات للمشاهدة لاحقاً من صفحة الدرس</p>
                  </div>
                }
              >
                <div class="space-y-3">
                  <For each={watchLater()}>
                    {(item, index) => {
                      const video = getVideoInfo(item.videoId);
                      const priorityColors = {
                        high: "border-red-500/50 bg-red-500/10",
                        medium: "border-amber-500/50 bg-amber-500/10",
                        low: "border-emerald-500/50 bg-emerald-500/10",
                      };
                      const priorityLabels = {
                        high: "عالي",
                        medium: "متوسط",
                        low: "منخفض",
                      };
                      const priority = (item.priority || "medium") as "high" | "medium" | "low";
                      return (
                        <div class={`flex gap-4 p-4 rounded-xl border ${priorityColors[priority]}`}>
                          <span class="text-emerald-500 font-mono text-lg shrink-0">{index() + 1}</span>
                          <a href={`/lessons/${item.videoId}`} class="shrink-0">
                            <img
                              src={item.thumbnail || video?.thumbnail}
                              alt={item.videoTitle}
                              class="w-32 aspect-video object-cover rounded-lg"
                            />
                          </a>
                          <div class="flex-1 min-w-0">
                            <a
                              href={`/lessons/${item.videoId}`}
                              class="font-medium text-emerald-100 hover:text-amber-400 line-clamp-2"
                            >
                              {item.videoTitle || video?.title}
                            </a>
                            <div class="flex items-center gap-3 mt-2 text-sm">
                              <span class={`px-2 py-0.5 rounded text-xs ${
                                priority === "high" ? "bg-red-500/20 text-red-300" :
                                priority === "medium" ? "bg-amber-500/20 text-amber-300" :
                                "bg-emerald-500/20 text-emerald-300"
                              }`}>
                                {priorityLabels[priority]}
                              </span>
                              <span class="text-emerald-500">
                                أضيف {formatRelativeTime(item.addedAt)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveWatchLater(item.videoId)}
                            class="shrink-0 p-2 text-emerald-500 hover:text-red-400 transition-colors"
                            title="إزالة"
                          >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </Show>
            </div>
          </Show>

          {/* History Tab */}
          <Show when={activeTab() === "history"}>
            <div class="space-y-6">
              {/* Recent Sessions */}
              <div class="bg-emerald-900/50 rounded-2xl p-6 border border-emerald-700/50">
                <h3 class="text-xl font-bold text-amber-400 mb-4">📚 جلسات الدراسة</h3>
                <Show
                  when={recentSessions().length > 0}
                  fallback={
                    <div class="text-center py-8 text-emerald-400">
                      <div class="text-4xl mb-2">📚</div>
                      <p>لا توجد جلسات دراسة مسجلة</p>
                    </div>
                  }
                >
                  <div class="space-y-3">
                    <For each={recentSessions()}>
                      {(session) => (
                        <div class="flex items-center gap-4 p-4 bg-emerald-800/30 rounded-xl">
                          <div class="shrink-0 w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                            <span class="text-xl">📖</span>
                          </div>
                          <div class="flex-1 min-w-0">
                            <a
                              href={`/lessons/${session.videoId}`}
                              class="font-medium text-emerald-100 hover:text-amber-400 line-clamp-1"
                            >
                              {session.videoTitle}
                            </a>
                            <div class="flex items-center gap-3 mt-1 text-sm text-emerald-400">
                              <span>{formatDuration(session.duration)}</span>
                              <span>•</span>
                              <span>{formatRelativeTime(session.startTime)}</span>
                              <Show when={session.focusMode}>
                                <span class="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                                  وضع التركيز
                                </span>
                              </Show>
                            </div>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
              </div>

              {/* All Watched Videos */}
              <div class="bg-emerald-900/50 rounded-2xl p-6 border border-emerald-700/50">
                <h3 class="text-xl font-bold text-amber-400 mb-4">🕐 سجل المشاهدة</h3>
                <Show
                  when={recentlyWatched().length > 0}
                  fallback={
                    <div class="text-center py-8 text-emerald-400">
                      <div class="text-4xl mb-2">🕐</div>
                      <p>لا يوجد سجل مشاهدة</p>
                    </div>
                  }
                >
                  <div class="space-y-2">
                    <For each={recentlyWatched()}>
                      {(item) => {
                        const video = getVideoInfo(item.videoId);
                        return (
                          <a
                            href={`/lessons/${item.videoId}`}
                            class="flex items-center gap-4 p-3 bg-emerald-800/20 rounded-xl hover:bg-emerald-800/40 transition-colors"
                          >
                            <img
                              src={video?.thumbnail || `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`}
                              alt={video?.title}
                              class="w-24 aspect-video object-cover rounded-lg shrink-0"
                            />
                            <div class="flex-1 min-w-0">
                              <div class="font-medium text-emerald-100 line-clamp-1">
                                {video?.title || "فيديو"}
                              </div>
                              <div class="text-sm text-emerald-400 mt-1">
                                {formatRelativeTime(item.lastWatched)}
                              </div>
                            </div>
                            <div class="shrink-0 text-left">
                              <div class="text-amber-400 font-bold">{item.percentage}%</div>
                              <div class="w-16 h-1.5 bg-emerald-700 rounded-full overflow-hidden">
                                <div
                                  class="h-full bg-amber-500"
                                  style={{ width: `${item.percentage}%` }}
                                />
                              </div>
                            </div>
                          </a>
                        );
                      }}
                    </For>
                  </div>
                </Show>
              </div>
            </div>
          </Show>

          {/* Settings Tab */}
          <Show when={activeTab() === "settings"}>
            <div class="max-w-2xl space-y-6">
              {/* Export/Import */}
              <div class="bg-emerald-900/50 rounded-2xl p-6 border border-emerald-700/50">
                <h3 class="text-xl font-bold text-amber-400 mb-4">💾 النسخ الاحتياطي</h3>
                <p class="text-emerald-300 mb-4">
                  قم بتصدير بياناتك للاحتفاظ بنسخة احتياطية أو نقلها لجهاز آخر
                </p>
                <div class="flex gap-4">
                  <button
                    onClick={handleExport}
                    class="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-lg font-medium transition-colors"
                  >
                    📤 تصدير البيانات
                  </button>
                  <button
                    onClick={handleImport}
                    class="flex-1 px-4 py-3 bg-emerald-700 hover:bg-emerald-600 text-emerald-50 rounded-lg font-medium transition-colors"
                  >
                    📥 استيراد البيانات
                  </button>
                </div>
              </div>

              {/* Data Summary */}
              <div class="bg-emerald-900/50 rounded-2xl p-6 border border-emerald-700/50">
                <h3 class="text-xl font-bold text-amber-400 mb-4">📊 ملخص البيانات</h3>
                <div class="space-y-3">
                  <div class="flex justify-between py-2 border-b border-emerald-700/50">
                    <span class="text-emerald-300">فيديوهات شوهدت</span>
                    <span class="text-emerald-100 font-medium">{stats()?.totalVideosWatched || 0}</span>
                  </div>
                  <div class="flex justify-between py-2 border-b border-emerald-700/50">
                    <span class="text-emerald-300">فيديوهات مكتملة</span>
                    <span class="text-emerald-100 font-medium">{stats()?.totalVideosCompleted || 0}</span>
                  </div>
                  <div class="flex justify-between py-2 border-b border-emerald-700/50">
                    <span class="text-emerald-300">إجمالي الملاحظات</span>
                    <span class="text-emerald-100 font-medium">{stats()?.totalNotes || 0}</span>
                  </div>
                  <div class="flex justify-between py-2 border-b border-emerald-700/50">
                    <span class="text-emerald-300">إجمالي العلامات</span>
                    <span class="text-emerald-100 font-medium">{stats()?.totalBookmarks || 0}</span>
                  </div>
                  <div class="flex justify-between py-2 border-b border-emerald-700/50">
                    <span class="text-emerald-300">المفضلة</span>
                    <span class="text-emerald-100 font-medium">{stats()?.favoriteCount || 0}</span>
                  </div>
                  <div class="flex justify-between py-2">
                    <span class="text-emerald-300">شاهد لاحقاً</span>
                    <span class="text-emerald-100 font-medium">{stats()?.watchLaterCount || 0}</span>
                  </div>
                </div>
              </div>

              {/* About */}
              <div class="bg-emerald-900/50 rounded-2xl p-6 border border-emerald-700/50">
                <h3 class="text-xl font-bold text-amber-400 mb-4">ℹ️ عن المكتبة</h3>
                <p class="text-emerald-300 leading-relaxed">
                  مركز دراسة متكامل لمتابعة دروس فضيلة الدكتور يسري جبر. 
                  يتيح لك تدوين الملاحظات، وإضافة العلامات المرجعية، 
                  وتتبع تقدمك في الدراسة، والاستئناف من حيث توقفت.
                </p>
              </div>
            </div>
          </Show>
        </Show>
      </main>
    </div>
  );
}
