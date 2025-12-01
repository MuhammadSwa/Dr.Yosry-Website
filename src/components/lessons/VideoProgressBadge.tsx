import { createSignal, onMount, Show } from "solid-js";
import { loadVideoStudyDataAsync, isFavoriteAsync, isInWatchLaterAsync } from "../../lib/studyStore";

interface VideoProgressBadgeProps {
  videoId: string;
  showProgress?: boolean;
  showFavorite?: boolean;
  showWatchLater?: boolean;
}

// Check if we're in the browser
const isBrowser = typeof window !== "undefined";

export default function VideoProgressBadge(props: VideoProgressBadgeProps) {
  // Default all options to true if not specified
  const showProgress = () => props.showProgress !== false;
  const showFavorite = () => props.showFavorite !== false;
  const showWatchLater = () => props.showWatchLater !== false;
  const [progress, setProgress] = createSignal<number>(0);
  const [completed, setCompleted] = createSignal(false);
  const [hasNotes, setHasNotes] = createSignal(false);
  const [isFav, setIsFav] = createSignal(false);
  const [isQueued, setIsQueued] = createSignal(false);

  onMount(async () => {
    if (isBrowser) {
      const data = await loadVideoStudyDataAsync(props.videoId);
      setProgress(data.progress.watchedPercentage);
      setCompleted(data.progress.completed);
      setHasNotes(data.notes.length > 0);
      setIsFav(await isFavoriteAsync(props.videoId));
      setIsQueued(await isInWatchLaterAsync(props.videoId));
    }
  });

  return (
    <>
      {/* Progress bar - only show if showProgress is enabled */}
      <Show when={showProgress() && progress() > 0}>
        <div class="mt-2 h-1.5 bg-emerald-800 rounded-full overflow-hidden">
          <div
            class={`h-full transition-all rounded-full ${completed() ? "bg-green-500" : "bg-amber-500"}`}
            style={{ width: `${progress()}%` }}
          />
        </div>
      </Show>

      {/* Status indicators row */}
      <div class="flex items-center gap-2 mt-2 flex-wrap">
        <Show when={showProgress() && completed()}>
          <span class="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            مكتمل
          </span>
        </Show>
        <Show when={showFavorite() && isFav()}>
          <span class="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full">
            ⭐ مفضل
          </span>
        </Show>
        <Show when={showWatchLater() && isQueued()}>
          <span class="bg-purple-500/20 text-purple-400 text-xs px-2 py-0.5 rounded-full">
            📋 للمشاهدة
          </span>
        </Show>
        <Show when={hasNotes()}>
          <span class="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full">
            📝 {progress() > 0 ? "" : "ملاحظات"}
          </span>
        </Show>
        <Show when={showProgress() && progress() > 0 && !completed()}>
          <span class="text-emerald-400 text-xs mr-auto">
            {Math.round(progress())}%
          </span>
        </Show>
      </div>
    </>
  );
}
