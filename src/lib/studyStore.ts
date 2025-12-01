/**
 * Global Study Store - Manages all study-related data in localStorage
 * Used for aggregating statistics, managing favorites, watch later queue, and study sessions
 */

// Check if we're in the browser
const isBrowser = typeof window !== "undefined";

// ==================== Types ====================

export interface Note {
  id: string;
  timestamp: string;
  content: string;
  createdAt: string;
  tags?: string[];
  isImportant?: boolean;
}

export interface Bookmark {
  id: string;
  timestamp: string;
  label: string;
  createdAt: string;
}

export interface VideoProgress {
  videoId: string;
  completed: boolean;
  lastWatched: string;
  watchedPercentage: number;
  rating: number;
  lastPosition?: number; // in seconds
}

export interface VideoStudyData {
  notes: Note[];
  bookmarks: Bookmark[];
  progress: VideoProgress;
}

export interface FavoriteVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  addedAt: string;
}

export interface WatchLaterItem {
  videoId: string;
  title: string;
  thumbnail: string;
  addedAt: string;
  priority: "low" | "medium" | "high";
}

export interface StudySession {
  id: string;
  videoId: string;
  videoTitle: string;
  startTime: string;
  endTime?: string;
  duration: number; // in seconds
  notes: string;
  focusMode: boolean;
}

export interface StudyStreak {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string;
  studyDates: string[]; // ISO date strings (YYYY-MM-DD)
}

export interface GlobalStudyData {
  favorites: FavoriteVideo[];
  watchLater: WatchLaterItem[];
  sessions: StudySession[];
  streak: StudyStreak;
  settings: StudySettings;
  totalWatchTime: number; // in seconds
}

export interface StudySettings {
  pomodoroLength: number; // in minutes
  breakLength: number; // in minutes
  autoResumeEnabled: boolean;
  keyboardShortcutsEnabled: boolean;
  defaultPlaybackSpeed: number;
}

export interface GlobalStats {
  totalVideosWatched: number;
  totalVideosCompleted: number;
  totalNotes: number;
  totalBookmarks: number;
  totalWatchTime: number; // seconds
  totalStudySessions: number;
  averageRating: number;
  currentStreak: number;
  longestStreak: number;
  favoriteCount: number;
  watchLaterCount: number;
}

// ==================== Storage Keys ====================

const STORAGE_KEYS = {
  VIDEO_STUDY_PREFIX: "video_study_",
  VIDEO_POSITION_PREFIX: "video_position_",
  GLOBAL_DATA: "study_global_data",
  ALL_VIDEO_IDS: "study_all_video_ids",
};

// ==================== Helper Functions ====================

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getDefaultGlobalData(): GlobalStudyData {
  return {
    favorites: [],
    watchLater: [],
    sessions: [],
    streak: {
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: "",
      studyDates: [],
    },
    settings: {
      pomodoroLength: 25,
      breakLength: 5,
      autoResumeEnabled: true,
      keyboardShortcutsEnabled: true,
      defaultPlaybackSpeed: 1,
    },
    totalWatchTime: 0,
  };
}

function getDefaultVideoStudyData(videoId: string): VideoStudyData {
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

// ==================== Global Data Functions ====================

export function loadGlobalData(): GlobalStudyData {
  if (!isBrowser) return getDefaultGlobalData();
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.GLOBAL_DATA);
    if (stored) {
      return { ...getDefaultGlobalData(), ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Error loading global study data:", e);
  }
  
  return getDefaultGlobalData();
}

export function saveGlobalData(data: GlobalStudyData): void {
  if (!isBrowser) return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.GLOBAL_DATA, JSON.stringify(data));
  } catch (e) {
    console.error("Error saving global study data:", e);
  }
}

// ==================== Video Study Data Functions ====================

export function loadVideoStudyData(videoId: string): VideoStudyData {
  if (!isBrowser) return getDefaultVideoStudyData(videoId);
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.VIDEO_STUDY_PREFIX + videoId);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading video study data:", e);
  }
  
  return getDefaultVideoStudyData(videoId);
}

export function saveVideoStudyData(videoId: string, data: VideoStudyData): void {
  if (!isBrowser) return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.VIDEO_STUDY_PREFIX + videoId, JSON.stringify(data));
    // Track this video ID
    addTrackedVideoId(videoId);
  } catch (e) {
    console.error("Error saving video study data:", e);
  }
}

// ==================== Video ID Tracking ====================

function addTrackedVideoId(videoId: string): void {
  if (!isBrowser) return;
  
  try {
    const ids = getTrackedVideoIds();
    if (!ids.includes(videoId)) {
      ids.push(videoId);
      localStorage.setItem(STORAGE_KEYS.ALL_VIDEO_IDS, JSON.stringify(ids));
    }
  } catch (e) {
    console.error("Error tracking video ID:", e);
  }
}

export function getTrackedVideoIds(): string[] {
  if (!isBrowser) return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ALL_VIDEO_IDS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error getting tracked video IDs:", e);
  }
  
  return [];
}

// ==================== Statistics Functions ====================

export function calculateGlobalStats(): GlobalStats {
  if (!isBrowser) {
    return {
      totalVideosWatched: 0,
      totalVideosCompleted: 0,
      totalNotes: 0,
      totalBookmarks: 0,
      totalWatchTime: 0,
      totalStudySessions: 0,
      averageRating: 0,
      currentStreak: 0,
      longestStreak: 0,
      favoriteCount: 0,
      watchLaterCount: 0,
    };
  }
  
  const videoIds = getTrackedVideoIds();
  const globalData = loadGlobalData();
  
  let totalVideosWatched = 0;
  let totalVideosCompleted = 0;
  let totalNotes = 0;
  let totalBookmarks = 0;
  let totalRating = 0;
  let ratedVideos = 0;
  
  for (const videoId of videoIds) {
    const data = loadVideoStudyData(videoId);
    
    if (data.progress.watchedPercentage > 0) {
      totalVideosWatched++;
    }
    
    if (data.progress.completed) {
      totalVideosCompleted++;
    }
    
    totalNotes += data.notes.length;
    totalBookmarks += data.bookmarks.length;
    
    if (data.progress.rating > 0) {
      totalRating += data.progress.rating;
      ratedVideos++;
    }
  }
  
  return {
    totalVideosWatched,
    totalVideosCompleted,
    totalNotes,
    totalBookmarks,
    totalWatchTime: globalData.totalWatchTime,
    totalStudySessions: globalData.sessions.length,
    averageRating: ratedVideos > 0 ? Math.round((totalRating / ratedVideos) * 10) / 10 : 0,
    currentStreak: globalData.streak.currentStreak,
    longestStreak: globalData.streak.longestStreak,
    favoriteCount: globalData.favorites.length,
    watchLaterCount: globalData.watchLater.length,
  };
}

// ==================== Favorites Functions ====================

export function addToFavorites(video: { id: string; title: string; thumbnail: string }): void {
  const globalData = loadGlobalData();
  
  if (!globalData.favorites.some(f => f.videoId === video.id)) {
    globalData.favorites.push({
      videoId: video.id,
      title: video.title,
      thumbnail: video.thumbnail,
      addedAt: new Date().toISOString(),
    });
    saveGlobalData(globalData);
  }
}

export function removeFromFavorites(videoId: string): void {
  const globalData = loadGlobalData();
  globalData.favorites = globalData.favorites.filter(f => f.videoId !== videoId);
  saveGlobalData(globalData);
}

export function isFavorite(videoId: string): boolean {
  const globalData = loadGlobalData();
  return globalData.favorites.some(f => f.videoId === videoId);
}

export function getFavorites(): FavoriteVideo[] {
  return loadGlobalData().favorites;
}

// ==================== Watch Later Functions ====================

export function addToWatchLater(
  video: { id: string; title: string; thumbnail: string },
  priority: "low" | "medium" | "high" = "medium"
): void {
  const globalData = loadGlobalData();
  
  if (!globalData.watchLater.some(w => w.videoId === video.id)) {
    globalData.watchLater.push({
      videoId: video.id,
      title: video.title,
      thumbnail: video.thumbnail,
      addedAt: new Date().toISOString(),
      priority,
    });
    saveGlobalData(globalData);
  }
}

export function removeFromWatchLater(videoId: string): void {
  const globalData = loadGlobalData();
  globalData.watchLater = globalData.watchLater.filter(w => w.videoId !== videoId);
  saveGlobalData(globalData);
}

export function isInWatchLater(videoId: string): boolean {
  const globalData = loadGlobalData();
  return globalData.watchLater.some(w => w.videoId === videoId);
}

export function getWatchLater(): WatchLaterItem[] {
  const globalData = loadGlobalData();
  // Sort by priority (high > medium > low) then by addedAt
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return globalData.watchLater.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
  });
}

// ==================== Study Streak Functions ====================

export function updateStudyStreak(): void {
  const globalData = loadGlobalData();
  const today = getTodayDate();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  
  if (globalData.streak.lastStudyDate === today) {
    // Already studied today
    return;
  }
  
  if (!globalData.streak.studyDates.includes(today)) {
    globalData.streak.studyDates.push(today);
  }
  
  if (globalData.streak.lastStudyDate === yesterday) {
    // Consecutive day
    globalData.streak.currentStreak++;
  } else if (globalData.streak.lastStudyDate !== today) {
    // Streak broken
    globalData.streak.currentStreak = 1;
  }
  
  if (globalData.streak.currentStreak > globalData.streak.longestStreak) {
    globalData.streak.longestStreak = globalData.streak.currentStreak;
  }
  
  globalData.streak.lastStudyDate = today;
  saveGlobalData(globalData);
}

// ==================== Study Session Functions ====================

export function startStudySession(videoId: string, videoTitle: string, focusMode: boolean = false): string {
  const globalData = loadGlobalData();
  const sessionId = generateId();
  
  globalData.sessions.push({
    id: sessionId,
    videoId,
    videoTitle,
    startTime: new Date().toISOString(),
    duration: 0,
    notes: "",
    focusMode,
  });
  
  // Update streak
  updateStudyStreak();
  
  saveGlobalData(globalData);
  return sessionId;
}

export function endStudySession(sessionId: string, notes: string = ""): void {
  const globalData = loadGlobalData();
  const session = globalData.sessions.find(s => s.id === sessionId);
  
  if (session && !session.endTime) {
    session.endTime = new Date().toISOString();
    session.duration = Math.floor(
      (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000
    );
    session.notes = notes;
    
    // Update total watch time
    globalData.totalWatchTime += session.duration;
    
    saveGlobalData(globalData);
  }
}

export function getRecentSessions(limit: number = 10): StudySession[] {
  const globalData = loadGlobalData();
  return globalData.sessions
    .filter(s => s.endTime) // Only completed sessions
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, limit);
}

// ==================== Recently Watched Functions ====================

export function getRecentlyWatched(limit: number = 10): { videoId: string; lastWatched: string; percentage: number }[] {
  const videoIds = getTrackedVideoIds();
  const recent: { videoId: string; lastWatched: string; percentage: number }[] = [];
  
  for (const videoId of videoIds) {
    const data = loadVideoStudyData(videoId);
    if (data.progress.watchedPercentage > 0) {
      recent.push({
        videoId,
        lastWatched: data.progress.lastWatched,
        percentage: data.progress.watchedPercentage,
      });
    }
  }
  
  return recent
    .sort((a, b) => new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime())
    .slice(0, limit);
}

// ==================== Settings Functions ====================

export function getSettings(): StudySettings {
  return loadGlobalData().settings;
}

export function updateSettings(newSettings: Partial<StudySettings>): void {
  const globalData = loadGlobalData();
  globalData.settings = { ...globalData.settings, ...newSettings };
  saveGlobalData(globalData);
}

// ==================== Data Export/Import Functions ====================

export interface ExportData {
  version: string;
  exportedAt: string;
  globalData: GlobalStudyData;
  videoData: Record<string, VideoStudyData>;
}

export function exportAllData(): ExportData {
  const videoIds = getTrackedVideoIds();
  const videoData: Record<string, VideoStudyData> = {};
  
  for (const videoId of videoIds) {
    videoData[videoId] = loadVideoStudyData(videoId);
  }
  
  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    globalData: loadGlobalData(),
    videoData,
  };
}

export function importAllData(data: ExportData): boolean {
  if (!isBrowser) return false;
  
  try {
    // Import global data
    saveGlobalData(data.globalData);
    
    // Import video data
    for (const [videoId, studyData] of Object.entries(data.videoData)) {
      saveVideoStudyData(videoId, studyData);
    }
    
    return true;
  } catch (e) {
    console.error("Error importing data:", e);
    return false;
  }
}

export function downloadExportFile(): void {
  if (!isBrowser) return;
  
  const data = exportAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `study-data-${getTodayDate()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ==================== Utility Functions ====================

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} ساعة ${minutes > 0 ? `و ${minutes} دقيقة` : ""}`;
  }
  return `${minutes} دقيقة`;
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "الآن";
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  
  return date.toLocaleDateString("ar-EG", {
    month: "short",
    day: "numeric",
  });
}
