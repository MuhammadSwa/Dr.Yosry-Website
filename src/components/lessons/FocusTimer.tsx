import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { getSettings, updateSettings } from "../../lib/studyStore";

interface FocusTimerProps {
  videoId?: string;
  onSessionEnd?: () => void;
}

type TimerState = "idle" | "focus" | "break" | "paused";

export default function FocusTimer(props: FocusTimerProps) {
  const [isExpanded, setIsExpanded] = createSignal(false);
  const [timerState, setTimerState] = createSignal<TimerState>("idle");
  const [timeLeft, setTimeLeft] = createSignal(0);
  const [totalFocusTime, setTotalFocusTime] = createSignal(0);
  const [sessionsCompleted, setSessionsCompleted] = createSignal(0);
  
  // Settings
  const [focusLength, setFocusLength] = createSignal(25);
  const [breakLength, setBreakLength] = createSignal(5);
  
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let pausedTime = 0;

  onMount(() => {
    const settings = getSettings();
    setFocusLength(settings.pomodoroLength);
    setBreakLength(settings.breakLength);
  });

  onCleanup(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startFocusSession = () => {
    setTimerState("focus");
    setTimeLeft(focusLength() * 60);
    startTimer();
    
    // Play notification sound (simple beep)
    playSound();
  };

  const startBreak = () => {
    setTimerState("break");
    setTimeLeft(breakLength() * 60);
    startTimer();
    playSound();
  };

  const startTimer = () => {
    if (intervalId) clearInterval(intervalId);
    
    intervalId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimerEnd();
          return 0;
        }
        
        // Track focus time
        if (timerState() === "focus") {
          setTotalFocusTime((t) => t + 1);
        }
        
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimerEnd = () => {
    if (intervalId) clearInterval(intervalId);
    playSound();
    
    if (timerState() === "focus") {
      setSessionsCompleted((s) => s + 1);
      // Show notification
      if (Notification.permission === "granted") {
        new Notification("🎉 أحسنت!", {
          body: "انتهت جلسة التركيز. خذ استراحة قصيرة!",
          icon: "/favicon.ico",
        });
      }
      // Auto-start break
      startBreak();
    } else if (timerState() === "break") {
      if (Notification.permission === "granted") {
        new Notification("⏰ انتهت الاستراحة", {
          body: "حان وقت العودة للدراسة!",
          icon: "/favicon.ico",
        });
      }
      setTimerState("idle");
    }
  };

  const pauseTimer = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    pausedTime = timeLeft();
    setTimerState("paused");
  };

  const resumeTimer = () => {
    setTimerState("focus");
    startTimer();
  };

  const stopTimer = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    setTimerState("idle");
    setTimeLeft(0);
  };

  const playSound = () => {
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      setTimeout(() => oscillator.stop(), 200);
    } catch (e) {
      // Fallback - no sound
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const saveSettings = () => {
    updateSettings({
      pomodoroLength: focusLength(),
      breakLength: breakLength(),
    });
  };

  return (
    <div class="bg-emerald-800/30 rounded-xl border border-emerald-700/50 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded())}
        class="w-full p-4 flex items-center justify-between text-right hover:bg-emerald-700/20 transition-colors"
      >
        <div class="flex items-center gap-3">
          <span class="text-2xl">🎯</span>
          <div>
            <div class="font-bold text-emerald-100">وضع التركيز</div>
            <div class="text-sm text-emerald-400">
              {timerState() === "idle" && "ابدأ جلسة تركيز"}
              {timerState() === "focus" && `جاري التركيز: ${formatTime(timeLeft())}`}
              {timerState() === "break" && `استراحة: ${formatTime(timeLeft())}`}
              {timerState() === "paused" && "متوقف مؤقتاً"}
            </div>
          </div>
        </div>
        <svg
          class={`w-5 h-5 text-emerald-400 transition-transform ${isExpanded() ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      <Show when={isExpanded()}>
        <div class="p-4 pt-0 space-y-4">
          {/* Timer Display */}
          <div class="text-center py-6">
            <div class={`text-6xl font-mono font-bold mb-2 ${
              timerState() === "focus" ? "text-amber-400" :
              timerState() === "break" ? "text-green-400" :
              "text-emerald-300"
            }`}>
              {timerState() === "idle" 
                ? formatTime(focusLength() * 60) 
                : formatTime(timeLeft())
              }
            </div>
            <div class="text-emerald-400">
              {timerState() === "idle" && "جاهز للبدء"}
              {timerState() === "focus" && "🧠 وقت التركيز"}
              {timerState() === "break" && "☕ وقت الاستراحة"}
              {timerState() === "paused" && "⏸️ متوقف"}
            </div>
          </div>

          {/* Controls */}
          <div class="flex gap-2 justify-center">
            <Show when={timerState() === "idle"}>
              <button
                onClick={() => {
                  requestNotificationPermission();
                  startFocusSession();
                }}
                class="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-xl font-bold transition-colors"
              >
                ▶️ ابدأ التركيز
              </button>
            </Show>
            
            <Show when={timerState() === "focus"}>
              <button
                onClick={pauseTimer}
                class="px-4 py-3 bg-emerald-700 hover:bg-emerald-600 text-emerald-50 rounded-xl font-medium transition-colors"
              >
                ⏸️ إيقاف مؤقت
              </button>
              <button
                onClick={stopTimer}
                class="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-medium transition-colors"
              >
                ⏹️ إنهاء
              </button>
            </Show>
            
            <Show when={timerState() === "paused"}>
              <button
                onClick={resumeTimer}
                class="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-xl font-bold transition-colors"
              >
                ▶️ استئناف
              </button>
              <button
                onClick={stopTimer}
                class="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-medium transition-colors"
              >
                ⏹️ إنهاء
              </button>
            </Show>
            
            <Show when={timerState() === "break"}>
              <button
                onClick={startFocusSession}
                class="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-xl font-bold transition-colors"
              >
                تخطي الاستراحة
              </button>
            </Show>
          </div>

          {/* Stats */}
          <div class="grid grid-cols-2 gap-3 mt-4">
            <div class="bg-emerald-900/50 rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-amber-400">{sessionsCompleted()}</div>
              <div class="text-xs text-emerald-400">جلسات مكتملة</div>
            </div>
            <div class="bg-emerald-900/50 rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-amber-400">{Math.floor(totalFocusTime() / 60)}</div>
              <div class="text-xs text-emerald-400">دقيقة تركيز</div>
            </div>
          </div>

          {/* Settings */}
          <Show when={timerState() === "idle"}>
            <div class="pt-4 border-t border-emerald-700/50 space-y-3">
              <h4 class="text-sm font-medium text-emerald-300">الإعدادات</h4>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs text-emerald-400 block mb-1">مدة التركيز (دقيقة)</label>
                  <input
                    type="number"
                    value={focusLength()}
                    onInput={(e) => {
                      setFocusLength(parseInt(e.currentTarget.value) || 25);
                      saveSettings();
                    }}
                    min="1"
                    max="120"
                    class="w-full px-3 py-2 bg-emerald-900/50 border border-emerald-600 rounded-lg text-emerald-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label class="text-xs text-emerald-400 block mb-1">مدة الاستراحة (دقيقة)</label>
                  <input
                    type="number"
                    value={breakLength()}
                    onInput={(e) => {
                      setBreakLength(parseInt(e.currentTarget.value) || 5);
                      saveSettings();
                    }}
                    min="1"
                    max="30"
                    class="w-full px-3 py-2 bg-emerald-900/50 border border-emerald-600 rounded-lg text-emerald-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          </Show>

          {/* Tips */}
          <div class="pt-3 border-t border-emerald-700/50">
            <p class="text-xs text-emerald-500 text-center">
              💡 تقنية بومودورو: ركز 25 دقيقة ثم استرح 5 دقائق
            </p>
          </div>
        </div>
      </Show>
    </div>
  );
}
