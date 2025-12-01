import { onMount, onCleanup, createSignal } from "solid-js";

interface YouTubeWindow extends Window {
  youtubePlayer?: any;
  seekYouTubeTo?: (seconds: number) => void;
  getYouTubeTimestamp?: () => string;
}

interface KeyboardShortcutsProps {
  onNewNote?: () => void;
  onNewBookmark?: () => void;
  videoId: string;
}

// Check if we're in the browser
const isBrowser = typeof window !== "undefined";

export default function KeyboardShortcuts(props: KeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = createSignal(false);
  const [lastAction, setLastAction] = createSignal<string | null>(null);

  const showActionFeedback = (action: string) => {
    setLastAction(action);
    setTimeout(() => setLastAction(null), 1500);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }

    const win = window as YouTubeWindow;
    const player = win.youtubePlayer;

    switch (e.key.toLowerCase()) {
      case " ": // Space - Play/Pause
        e.preventDefault();
        if (player && typeof player.getPlayerState === "function") {
          const state = player.getPlayerState();
          if (state === 1) {
            player.pauseVideo();
            showActionFeedback("⏸️ إيقاف مؤقت");
          } else {
            player.playVideo();
            showActionFeedback("▶️ تشغيل");
          }
        }
        break;

      case "k": // K - Also Play/Pause (YouTube style)
        e.preventDefault();
        if (player && typeof player.getPlayerState === "function") {
          const state = player.getPlayerState();
          if (state === 1) {
            player.pauseVideo();
            showActionFeedback("⏸️ إيقاف مؤقت");
          } else {
            player.playVideo();
            showActionFeedback("▶️ تشغيل");
          }
        }
        break;

      case "arrowleft": // Left Arrow - Seek back 5s
        e.preventDefault();
        if (player && typeof player.getCurrentTime === "function") {
          const currentTime = player.getCurrentTime();
          player.seekTo(Math.max(0, currentTime - 5), true);
          showActionFeedback("⏪ -5 ثواني");
        }
        break;

      case "arrowright": // Right Arrow - Seek forward 5s
        e.preventDefault();
        if (player && typeof player.getCurrentTime === "function") {
          const currentTime = player.getCurrentTime();
          player.seekTo(currentTime + 5, true);
          showActionFeedback("⏩ +5 ثواني");
        }
        break;

      case "j": // J - Seek back 10s (YouTube style)
        e.preventDefault();
        if (player && typeof player.getCurrentTime === "function") {
          const currentTime = player.getCurrentTime();
          player.seekTo(Math.max(0, currentTime - 10), true);
          showActionFeedback("⏪ -10 ثواني");
        }
        break;

      case "l": // L - Seek forward 10s (YouTube style)
        e.preventDefault();
        if (player && typeof player.getCurrentTime === "function") {
          const currentTime = player.getCurrentTime();
          player.seekTo(currentTime + 10, true);
          showActionFeedback("⏩ +10 ثواني");
        }
        break;

      case "arrowup": // Up Arrow - Volume up
        e.preventDefault();
        if (player && typeof player.getVolume === "function") {
          const volume = player.getVolume();
          player.setVolume(Math.min(100, volume + 10));
          showActionFeedback(`🔊 ${Math.min(100, volume + 10)}%`);
        }
        break;

      case "arrowdown": // Down Arrow - Volume down
        e.preventDefault();
        if (player && typeof player.getVolume === "function") {
          const volume = player.getVolume();
          player.setVolume(Math.max(0, volume - 10));
          showActionFeedback(`🔈 ${Math.max(0, volume - 10)}%`);
        }
        break;

      case "m": // M - Mute/Unmute
        e.preventDefault();
        if (player && typeof player.isMuted === "function") {
          if (player.isMuted()) {
            player.unMute();
            showActionFeedback("🔊 إلغاء كتم الصوت");
          } else {
            player.mute();
            showActionFeedback("🔇 كتم الصوت");
          }
        }
        break;

      case "f": // F - Fullscreen
        e.preventDefault();
        const iframe = document.querySelector("iframe");
        if (iframe) {
          if (document.fullscreenElement) {
            document.exitFullscreen();
            showActionFeedback("تصغير الشاشة");
          } else {
            iframe.requestFullscreen();
            showActionFeedback("ملء الشاشة");
          }
        }
        break;

      case "n": // N - New note
        if (e.ctrlKey || e.metaKey) return; // Don't interfere with Ctrl+N
        e.preventDefault();
        if (props.onNewNote) {
          props.onNewNote();
          showActionFeedback("📝 ملاحظة جديدة");
        }
        break;

      case "b": // B - New bookmark
        if (e.ctrlKey || e.metaKey) return; // Don't interfere with Ctrl+B
        e.preventDefault();
        if (props.onNewBookmark) {
          props.onNewBookmark();
          showActionFeedback("🔖 علامة جديدة");
        }
        break;

      case "0":
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
        // Number keys - Seek to percentage of video
        e.preventDefault();
        if (player && typeof player.getDuration === "function") {
          const duration = player.getDuration();
          const percentage = parseInt(e.key) * 10;
          player.seekTo((duration * percentage) / 100, true);
          showActionFeedback(`${percentage}%`);
        }
        break;

      case ",": // < (with Shift) - Slow down
        if (e.shiftKey && player && typeof player.getPlaybackRate === "function") {
          e.preventDefault();
          const rate = player.getPlaybackRate();
          const newRate = Math.max(0.25, rate - 0.25);
          player.setPlaybackRate(newRate);
          showActionFeedback(`🐢 ${newRate}x`);
        }
        break;

      case ".": // > (with Shift) - Speed up
        if (e.shiftKey && player && typeof player.getPlaybackRate === "function") {
          e.preventDefault();
          const rate = player.getPlaybackRate();
          const newRate = Math.min(2, rate + 0.25);
          player.setPlaybackRate(newRate);
          showActionFeedback(`🐇 ${newRate}x`);
        }
        break;

      case "?": // ? - Show help
        e.preventDefault();
        setShowHelp(!showHelp());
        break;

      case "escape":
        if (showHelp()) {
          setShowHelp(false);
        }
        break;
    }
  };

  onMount(() => {
    if (isBrowser) {
      window.addEventListener("keydown", handleKeyDown);
    }
  });

  onCleanup(() => {
    if (isBrowser) {
      window.removeEventListener("keydown", handleKeyDown);
    }
  });

  return (
    <>
      {/* Action Feedback Toast */}
      <div
        class={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/80 text-white rounded-xl font-bold text-lg transition-all duration-300 z-50 ${
          lastAction() ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {lastAction()}
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      <div
        class={`fixed inset-0 bg-black/70 flex items-center justify-center z-50 transition-opacity duration-300 ${
          showHelp() ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setShowHelp(false)}
      >
        <div
          class="bg-emerald-900 rounded-2xl p-6 max-w-lg w-full mx-4 border border-emerald-700 max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-amber-400">⌨️ اختصارات لوحة المفاتيح</h3>
            <button
              onClick={() => setShowHelp(false)}
              class="p-2 text-emerald-400 hover:text-white transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <h4 class="text-emerald-300 font-medium mb-2">التشغيل</h4>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="flex justify-between bg-emerald-800/50 px-3 py-2 rounded">
                  <span class="text-emerald-300">تشغيل/إيقاف</span>
                  <kbd class="bg-emerald-700 px-2 rounded">Space</kbd>
                </div>
                <div class="flex justify-between bg-emerald-800/50 px-3 py-2 rounded">
                  <span class="text-emerald-300">تشغيل/إيقاف</span>
                  <kbd class="bg-emerald-700 px-2 rounded">K</kbd>
                </div>
                <div class="flex justify-between bg-emerald-800/50 px-3 py-2 rounded">
                  <span class="text-emerald-300">ملء الشاشة</span>
                  <kbd class="bg-emerald-700 px-2 rounded">F</kbd>
                </div>
                <div class="flex justify-between bg-emerald-800/50 px-3 py-2 rounded">
                  <span class="text-emerald-300">كتم الصوت</span>
                  <kbd class="bg-emerald-700 px-2 rounded">M</kbd>
                </div>
              </div>
            </div>

            <div>
              <h4 class="text-emerald-300 font-medium mb-2">التنقل</h4>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="flex justify-between bg-emerald-800/50 px-3 py-2 rounded">
                  <span class="text-emerald-300">-5 ثواني</span>
                  <kbd class="bg-emerald-700 px-2 rounded">←</kbd>
                </div>
                <div class="flex justify-between bg-emerald-800/50 px-3 py-2 rounded">
                  <span class="text-emerald-300">+5 ثواني</span>
                  <kbd class="bg-emerald-700 px-2 rounded">→</kbd>
                </div>
                <div class="flex justify-between bg-emerald-800/50 px-3 py-2 rounded">
                  <span class="text-emerald-300">-10 ثواني</span>
                  <kbd class="bg-emerald-700 px-2 rounded">J</kbd>
                </div>
                <div class="flex justify-between bg-emerald-800/50 px-3 py-2 rounded">
                  <span class="text-emerald-300">+10 ثواني</span>
                  <kbd class="bg-emerald-700 px-2 rounded">L</kbd>
                </div>
                <div class="flex justify-between bg-emerald-800/50 px-3 py-2 rounded col-span-2">
                  <span class="text-emerald-300">انتقال لنسبة معينة</span>
                  <kbd class="bg-emerald-700 px-2 rounded">0-9</kbd>
                </div>
              </div>
            </div>

            <div>
              <h4 class="text-emerald-300 font-medium mb-2">الصوت والسرعة</h4>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="flex justify-between bg-emerald-800/50 px-3 py-2 rounded">
                  <span class="text-emerald-300">رفع الصوت</span>
                  <kbd class="bg-emerald-700 px-2 rounded">↑</kbd>
                </div>
                <div class="flex justify-between bg-emerald-800/50 px-3 py-2 rounded">
                  <span class="text-emerald-300">خفض الصوت</span>
                  <kbd class="bg-emerald-700 px-2 rounded">↓</kbd>
                </div>
                <div class="flex justify-between bg-emerald-800/50 px-3 py-2 rounded">
                  <span class="text-emerald-300">تبطيء</span>
                  <kbd class="bg-emerald-700 px-2 rounded">Shift + &lt;</kbd>
                </div>
                <div class="flex justify-between bg-emerald-800/50 px-3 py-2 rounded">
                  <span class="text-emerald-300">تسريع</span>
                  <kbd class="bg-emerald-700 px-2 rounded">Shift + &gt;</kbd>
                </div>
              </div>
            </div>

            <div>
              <h4 class="text-emerald-300 font-medium mb-2">الدراسة</h4>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="flex justify-between bg-emerald-800/50 px-3 py-2 rounded">
                  <span class="text-emerald-300">ملاحظة جديدة</span>
                  <kbd class="bg-emerald-700 px-2 rounded">N</kbd>
                </div>
                <div class="flex justify-between bg-emerald-800/50 px-3 py-2 rounded">
                  <span class="text-emerald-300">علامة جديدة</span>
                  <kbd class="bg-emerald-700 px-2 rounded">B</kbd>
                </div>
                <div class="flex justify-between bg-emerald-800/50 px-3 py-2 rounded col-span-2">
                  <span class="text-emerald-300">عرض الاختصارات</span>
                  <kbd class="bg-emerald-700 px-2 rounded">?</kbd>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-emerald-700">
            <p class="text-emerald-500 text-sm text-center">
              اضغط <kbd class="bg-emerald-700 px-2 rounded">?</kbd> في أي وقت لعرض هذه القائمة
            </p>
          </div>
        </div>
      </div>

      {/* Help Button */}
      <button
        onClick={() => setShowHelp(true)}
        class="fixed bottom-4 left-4 p-3 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-300 hover:text-white rounded-full transition-colors z-40 shadow-lg"
        title="اختصارات لوحة المفاتيح (?)"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </>
  );
}
