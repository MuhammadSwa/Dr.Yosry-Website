import { createSignal, onMount, Show } from "solid-js";
import {
  isFavoriteAsync,
  addToFavoritesAsync,
  removeFromFavoritesAsync,
  isInWatchLaterAsync,
  addToWatchLaterAsync,
  removeFromWatchLaterAsync,
  updateStudyStreakAsync,
  startStudySessionAsync,
} from "../../lib/studyStore";

interface VideoActionsProps {
  videoId: string;
  videoTitle: string;
  thumbnail: string;
}

// Check if we're in the browser
const isBrowser = typeof window !== "undefined";

export default function VideoActions(props: VideoActionsProps) {
  const [isFav, setIsFav] = createSignal(false);
  const [isWatchLater, setIsWatchLater] = createSignal(false);
  const [showPriorityMenu, setShowPriorityMenu] = createSignal(false);
  const [showShareMenu, setShowShareMenu] = createSignal(false);
  const [copied, setCopied] = createSignal(false);

  onMount(async () => {
    if (isBrowser) {
      setIsFav(await isFavoriteAsync(props.videoId));
      setIsWatchLater(await isInWatchLaterAsync(props.videoId));
      
      // Update study streak when visiting a video
      await updateStudyStreakAsync();
      
      // Start a study session
      await startStudySessionAsync(props.videoId, props.videoTitle);
    }
  });

  const toggleFavorite = async () => {
    if (isFav()) {
      await removeFromFavoritesAsync(props.videoId);
      setIsFav(false);
    } else {
      await addToFavoritesAsync({
        videoId: props.videoId,
        videoTitle: props.videoTitle,
        thumbnail: props.thumbnail,
      });
      setIsFav(true);
    }
  };

  const toggleWatchLater = async () => {
    if (isWatchLater()) {
      await removeFromWatchLaterAsync(props.videoId);
      setIsWatchLater(false);
    } else {
      setShowPriorityMenu(true);
    }
  };

  const addToWatchLaterWithPriority = async (priority: "low" | "medium" | "high") => {
    await addToWatchLaterAsync(
      {
        videoId: props.videoId,
        videoTitle: props.videoTitle,
        thumbnail: props.thumbnail,
      },
      priority
    );
    setIsWatchLater(true);
    setShowPriorityMenu(false);
  };

  const copyLink = () => {
    const url = `${window.location.origin}/lessons/${props.videoId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setShowShareMenu(false);
    }, 1500);
  };

  const shareToTwitter = () => {
    const url = `${window.location.origin}/lessons/${props.videoId}`;
    const text = `أنصحكم بمشاهدة: ${props.videoTitle}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
    setShowShareMenu(false);
  };

  const shareToWhatsApp = () => {
    const url = `${window.location.origin}/lessons/${props.videoId}`;
    const text = `أنصحكم بمشاهدة: ${props.videoTitle}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    setShowShareMenu(false);
  };

  const shareToTelegram = () => {
    const url = `${window.location.origin}/lessons/${props.videoId}`;
    const text = `أنصحكم بمشاهدة: ${props.videoTitle}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
    setShowShareMenu(false);
  };

  return (
    <div class="flex flex-wrap items-center gap-2">
      {/* Favorite Button */}
      <button
        onClick={toggleFavorite}
        class={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
          isFav()
            ? "bg-amber-500 text-emerald-950"
            : "bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700/50"
        }`}
        title={isFav() ? "إزالة من المفضلة" : "إضافة للمفضلة"}
      >
        <svg 
          class={`w-5 h-5 ${isFav() ? "fill-current" : ""}`}
          fill={isFav() ? "currentColor" : "none"} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        {isFav() ? "مفضل" : "المفضلة"}
      </button>

      {/* Watch Later Button */}
      <div class="relative">
        <button
          onClick={toggleWatchLater}
          class={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            isWatchLater()
              ? "bg-purple-500 text-white"
              : "bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700/50"
          }`}
          title={isWatchLater() ? "إزالة من شاهد لاحقاً" : "شاهد لاحقاً"}
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {isWatchLater() ? "في القائمة" : "شاهد لاحقاً"}
        </button>

        {/* Priority Menu */}
        <Show when={showPriorityMenu()}>
          <div class="absolute top-full right-0 mt-2 bg-emerald-800 rounded-xl border border-emerald-700 shadow-xl z-50 overflow-hidden">
            <div class="p-2 text-emerald-300 text-xs border-b border-emerald-700">
              اختر الأولوية
            </div>
            <button
              onClick={() => addToWatchLaterWithPriority("high")}
              class="w-full px-4 py-2 text-right text-red-300 hover:bg-red-500/20 flex items-center gap-2"
            >
              <span class="w-2 h-2 bg-red-500 rounded-full"></span>
              عالي
            </button>
            <button
              onClick={() => addToWatchLaterWithPriority("medium")}
              class="w-full px-4 py-2 text-right text-amber-300 hover:bg-amber-500/20 flex items-center gap-2"
            >
              <span class="w-2 h-2 bg-amber-500 rounded-full"></span>
              متوسط
            </button>
            <button
              onClick={() => addToWatchLaterWithPriority("low")}
              class="w-full px-4 py-2 text-right text-emerald-300 hover:bg-emerald-500/20 flex items-center gap-2"
            >
              <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
              منخفض
            </button>
            <button
              onClick={() => setShowPriorityMenu(false)}
              class="w-full px-4 py-2 text-right text-emerald-400 hover:bg-emerald-700/50 text-sm border-t border-emerald-700"
            >
              إلغاء
            </button>
          </div>
        </Show>
      </div>

      {/* Share Button */}
      <div class="relative">
        <button
          onClick={() => setShowShareMenu(!showShareMenu())}
          class="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700/50 transition-all"
          title="مشاركة"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          مشاركة
        </button>

        {/* Share Menu */}
        <Show when={showShareMenu()}>
          <div class="absolute top-full right-0 mt-2 bg-emerald-800 rounded-xl border border-emerald-700 shadow-xl z-50 overflow-hidden min-w-[160px]">
            <button
              onClick={copyLink}
              class="w-full px-4 py-3 text-right text-emerald-200 hover:bg-emerald-700/50 flex items-center gap-3"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied() ? "✓ تم النسخ" : "نسخ الرابط"}
            </button>
            <button
              onClick={shareToWhatsApp}
              class="w-full px-4 py-3 text-right text-emerald-200 hover:bg-emerald-700/50 flex items-center gap-3"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              واتساب
            </button>
            <button
              onClick={shareToTwitter}
              class="w-full px-4 py-3 text-right text-emerald-200 hover:bg-emerald-700/50 flex items-center gap-3"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              تويتر
            </button>
            <button
              onClick={shareToTelegram}
              class="w-full px-4 py-3 text-right text-emerald-200 hover:bg-emerald-700/50 flex items-center gap-3"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              تيليغرام
            </button>
          </div>
        </Show>
      </div>

      {/* Dashboard Link */}
      <a
        href="/dashboard"
        class="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700/50 transition-all"
        title="لوحة التحكم"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        لوحة التحكم
      </a>
    </div>
  );
}
