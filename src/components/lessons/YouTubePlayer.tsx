import { onMount, onCleanup } from "solid-js";
import { getVideoPositionAsync, saveVideoPositionAsync } from "../../lib/studyStore";

// Extend Window interface for YouTube player
interface YouTubeWindow extends Window {
  YT?: any;
  onYouTubeIframeAPIReady?: () => void;
  youtubePlayer?: any;
  getYouTubeTimestamp?: () => string;
  getYouTubeProgress?: () => { currentTime: number; duration: number; percentage: number };
  seekYouTubeTo?: (seconds: number) => void;
}

// Check if we're in the browser
const isBrowser = typeof window !== "undefined";

interface YouTubePlayerProps {
  videoId: string;
  title: string;
}

// Format seconds to timestamp string (MM:SS or HH:MM:SS)
function formatTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function YouTubePlayer(props: YouTubePlayerProps) {
  let playerContainer: HTMLDivElement | undefined;
  let player: any = null;

  // Expose function to get current timestamp globally
  const setupGlobalTimestampGetter = () => {
    if (!isBrowser) return;
    const win = window as YouTubeWindow;
    
    win.getYouTubeTimestamp = () => {
      if (player && typeof player.getCurrentTime === "function") {
        const currentTime = player.getCurrentTime();
        return formatTimestamp(currentTime);
      }
      return "00:00";
    };
    
    // Expose progress getter
    win.getYouTubeProgress = () => {
      if (player && typeof player.getCurrentTime === "function" && typeof player.getDuration === "function") {
        const currentTime = player.getCurrentTime() || 0;
        const duration = player.getDuration() || 0;
        const percentage = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
        return { currentTime, duration, percentage };
      }
      return { currentTime: 0, duration: 0, percentage: 0 };
    };
    
    // Expose seek function
    win.seekYouTubeTo = (seconds: number) => {
      if (player && typeof player.seekTo === "function") {
        player.seekTo(seconds, true);
      }
    };
    
    // Also expose the player itself
    win.youtubePlayer = player;
  };

  let progressInterval: ReturnType<typeof setInterval> | null = null;
  let savedStartPosition = 0;

  const initializePlayer = async () => {
    if (!isBrowser) return;
    const win = window as YouTubeWindow;
    
    if (!win.YT || !win.YT.Player) {
      // Wait for API to load
      setTimeout(initializePlayer, 100);
      return;
    }

    // Get saved position before creating player (from IndexedDB)
    savedStartPosition = await getVideoPositionAsync(props.videoId);

    player = new win.YT.Player(playerContainer, {
      videoId: props.videoId,
      playerVars: {
        autoplay: 0,
        modestbranding: 1,
        rel: 0,
        hl: "ar",
        cc_lang_pref: "ar",
        start: Math.floor(savedStartPosition), // Start from saved position
      },
      events: {
        onReady: () => {
          setupGlobalTimestampGetter();
          
          // If we have a more precise saved position, seek to it
          if (savedStartPosition > 0 && player && typeof player.seekTo === "function") {
            player.seekTo(savedStartPosition, true);
          }
          
          // Start tracking progress every 5 seconds
          progressInterval = setInterval(async () => {
            if (player && typeof player.getCurrentTime === "function" && typeof player.getPlayerState === "function") {
              const state = player.getPlayerState();
              // Only save if playing (1) or paused (2)
              if (state === 1 || state === 2) {
                const currentTime = player.getCurrentTime();
                if (currentTime > 0) {
                  await saveVideoPositionAsync(props.videoId, currentTime);
                  // Dispatch progress update event
                  window.dispatchEvent(new CustomEvent("youtubeProgressUpdate", {
                    detail: win.getYouTubeProgress ? win.getYouTubeProgress() : { currentTime: 0, duration: 0, percentage: 0 }
                  }));
                }
              }
            }
          }, 5000);
        },
        onStateChange: async (event: any) => {
          // Save position when paused or ended
          if (event.data === 2 || event.data === 0) { // 2 = paused, 0 = ended
            if (player && typeof player.getCurrentTime === "function") {
              const currentTime = player.getCurrentTime();
              await saveVideoPositionAsync(props.videoId, currentTime);
              // Dispatch progress update
              window.dispatchEvent(new CustomEvent("youtubeProgressUpdate", {
                detail: win.getYouTubeProgress ? win.getYouTubeProgress() : { currentTime: 0, duration: 0, percentage: 0 }
              }));
            }
          }
          // Mark as completed if ended
          if (event.data === 0) {
            window.dispatchEvent(new CustomEvent("youtubeVideoEnded"));
          }
        },
      },
    });
  };

  onMount(() => {
    if (!isBrowser) return;
    const win = window as YouTubeWindow;
    
    // Load YouTube IFrame API if not already loaded
    if (!win.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      win.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    } else {
      initializePlayer();
    }

    // Dispatch custom event when player is ready for other components to listen
    const checkPlayerReady = setInterval(() => {
      if (player && typeof player.getCurrentTime === "function") {
        window.dispatchEvent(new CustomEvent("youtubePlayerReady"));
        clearInterval(checkPlayerReady);
      }
    }, 100);
  });

  onCleanup(() => {
    if (!isBrowser) return;
    const win = window as YouTubeWindow;
    
    // Save final position before cleanup (fire and forget)
    if (player && typeof player.getCurrentTime === "function") {
      const currentTime = player.getCurrentTime();
      if (currentTime > 0) {
        saveVideoPositionAsync(props.videoId, currentTime);
      }
    }
    
    // Clear progress tracking interval
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
    
    if (player && typeof player.destroy === "function") {
      player.destroy();
    }
    // Clean up global functions
    if (win.getYouTubeTimestamp) {
      delete (win as any).getYouTubeTimestamp;
    }
    if (win.youtubePlayer) {
      delete (win as any).youtubePlayer;
    }
    if (win.getYouTubeProgress) {
      delete (win as any).getYouTubeProgress;
    }
    if (win.seekYouTubeTo) {
      delete (win as any).seekYouTubeTo;
    }
  });

  return (
    <div class="aspect-video w-full bg-black">
      <div 
        ref={playerContainer} 
        class="w-full h-full"
        id={`youtube-player-${props.videoId}`}
      />
    </div>
  );
}
