/**
 * Global Study Store - Manages all study-related data using Dexie (IndexedDB)
 * Migrated from localStorage for better performance and larger storage capacity
 */

import Dexie, { type Table } from "dexie";

// Check if we're in the browser
const isBrowser = typeof window !== "undefined";

// ==================== Types ====================

export interface Note {
  id: string;
  videoId: string;
  timestamp: string;
  content: string;
  createdAt: string;
  tags?: string[];
  importance?: "high" | "medium" | "low" | "none";
}

export interface Bookmark {
  id: string;
  videoId: string;
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
  id: string; // Always "main" - singleton record
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string;
  studyDates: string[]; // ISO date strings (YYYY-MM-DD)
}

export interface StudySettings {
  id: string; // Always "main" - singleton record
  pomodoroLength: number; // in minutes
  breakLength: number; // in minutes
  autoResumeEnabled: boolean;
  keyboardShortcutsEnabled: boolean;
  defaultPlaybackSpeed: number;
  totalWatchTime: number; // in seconds
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

// ==================== Dexie Database ====================

class StudyDatabase extends Dexie {
  notes!: Table<Note, string>;
  bookmarks!: Table<Bookmark, string>;
  videoProgress!: Table<VideoProgress, string>;
  favorites!: Table<FavoriteVideo, string>;
  watchLater!: Table<WatchLaterItem, string>;
  sessions!: Table<StudySession, string>;
  streak!: Table<StudyStreak, string>;
  settings!: Table<StudySettings, string>;

  constructor() {
    super("StudyDatabase");
    
    this.version(1).stores({
      // Notes table with indexes for fast queries
      notes: "id, videoId, createdAt, importance, *tags",
      // Bookmarks table
      bookmarks: "id, videoId, createdAt",
      // Video progress - videoId is primary key
      videoProgress: "videoId, completed, lastWatched, watchedPercentage",
      // Favorites - videoId is primary key
      favorites: "videoId, addedAt",
      // Watch later queue
      watchLater: "videoId, addedAt, priority",
      // Study sessions
      sessions: "id, videoId, startTime, endTime",
      // Streak data (singleton)
      streak: "id",
      // Settings (singleton)
      settings: "id",
    });
  }
}

// Create database instance (only in browser)
let db: StudyDatabase | null = null;

function getDb(): StudyDatabase {
  if (!isBrowser) {
    throw new Error("Database can only be accessed in the browser");
  }
  if (!db) {
    db = new StudyDatabase();
  }
  return db;
}

// ==================== Helper Functions ====================

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getDefaultSettings(): StudySettings {
  return {
    id: "main",
    pomodoroLength: 25,
    breakLength: 5,
    autoResumeEnabled: true,
    keyboardShortcutsEnabled: true,
    defaultPlaybackSpeed: 1,
    totalWatchTime: 0,
  };
}

function getDefaultStreak(): StudyStreak {
  return {
    id: "main",
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: "",
    studyDates: [],
  };
}

function getDefaultVideoProgress(videoId: string): VideoProgress {
  return {
    videoId,
    completed: false,
    lastWatched: new Date().toISOString(),
    watchedPercentage: 0,
    rating: 0,
  };
}

// ==================== Video Study Data Functions ====================

export async function loadVideoStudyDataAsync(videoId: string): Promise<VideoStudyData> {
  if (!isBrowser) {
    return {
      notes: [],
      bookmarks: [],
      progress: getDefaultVideoProgress(videoId),
    };
  }

  try {
    const database = getDb();
    const [notes, bookmarks, progress] = await Promise.all([
      database.notes.where("videoId").equals(videoId).toArray(),
      database.bookmarks.where("videoId").equals(videoId).toArray(),
      database.videoProgress.get(videoId),
    ]);

    return {
      notes: notes || [],
      bookmarks: bookmarks || [],
      progress: progress || getDefaultVideoProgress(videoId),
    };
  } catch (e) {
    console.error("Error loading video study data:", e);
    return {
      notes: [],
      bookmarks: [],
      progress: getDefaultVideoProgress(videoId),
    };
  }
}

// Synchronous wrapper for backward compatibility
// NOTE: synchronous wrapper removed — use `loadVideoStudyDataAsync` instead.

export async function saveVideoStudyDataAsync(videoId: string, data: VideoStudyData): Promise<void> {
  if (!isBrowser) return;

  try {
    const database = getDb();
    
    await database.transaction("rw", [database.notes, database.bookmarks, database.videoProgress], async () => {
      // Clear existing notes and bookmarks for this video
      await database.notes.where("videoId").equals(videoId).delete();
      await database.bookmarks.where("videoId").equals(videoId).delete();
      
      // Add new notes with videoId
      if (data.notes.length > 0) {
        const notesWithVideoId = data.notes.map(n => ({ ...n, videoId }));
        await database.notes.bulkPut(notesWithVideoId);
      }
      
      // Add new bookmarks with videoId
      if (data.bookmarks.length > 0) {
        const bookmarksWithVideoId = data.bookmarks.map(b => ({ ...b, videoId }));
        await database.bookmarks.bulkPut(bookmarksWithVideoId);
      }
      
      // Update progress
      await database.videoProgress.put({ ...data.progress, videoId });
    });
  } catch (e) {
    console.error("Error saving video study data:", e);
  }
}

// ==================== Video Position Functions ====================

export async function getVideoPositionAsync(videoId: string): Promise<number> {
  if (!isBrowser) return 0;
  
  try {
    const progress = await getDb().videoProgress.get(videoId);
    return progress?.lastPosition || 0;
  } catch {
    return 0;
  }
}

export async function saveVideoPositionAsync(videoId: string, position: number): Promise<void> {
  if (!isBrowser) return;
  
  try {
    const database = getDb();
    const existing = await database.videoProgress.get(videoId);
    
    await database.videoProgress.put({
      ...(existing || getDefaultVideoProgress(videoId)),
      videoId,
      lastPosition: position,
      lastWatched: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Error saving video position:", e);
  }
}

// ==================== Statistics Functions ====================

export async function calculateGlobalStatsAsync(): Promise<GlobalStats> {
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

  try {
    const database = getDb();
    
    const [
      allProgress,
      notesCount,
      bookmarksCount,
      sessionsCount,
      favoritesCount,
      watchLaterCount,
      streak,
      settings,
    ] = await Promise.all([
      database.videoProgress.toArray(),
      database.notes.count(),
      database.bookmarks.count(),
      database.sessions.count(),
      database.favorites.count(),
      database.watchLater.count(),
      database.streak.get("main"),
      database.settings.get("main"),
    ]);

    const watchedVideos = allProgress.filter(p => p.watchedPercentage > 0);
    const completedVideos = allProgress.filter(p => p.completed);
    const ratedVideos = allProgress.filter(p => p.rating > 0);
    const totalRating = ratedVideos.reduce((sum, p) => sum + p.rating, 0);

    return {
      totalVideosWatched: watchedVideos.length,
      totalVideosCompleted: completedVideos.length,
      totalNotes: notesCount,
      totalBookmarks: bookmarksCount,
      totalWatchTime: settings?.totalWatchTime || 0,
      totalStudySessions: sessionsCount,
      averageRating: ratedVideos.length > 0 ? Math.round((totalRating / ratedVideos.length) * 10) / 10 : 0,
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      favoriteCount: favoritesCount,
      watchLaterCount: watchLaterCount,
    };
  } catch (e) {
    console.error("Error calculating stats:", e);
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
}

// NOTE: synchronous wrapper removed — use `calculateGlobalStatsAsync` instead.

// ==================== Favorites Functions ====================

export async function addToFavoritesAsync(video: { id: string; title: string; thumbnail: string }): Promise<void> {
  if (!isBrowser) return;
  
  try {
    const database = getDb();
    const existing = await database.favorites.get(video.id);
    
    if (!existing) {
      await database.favorites.put({
        videoId: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        addedAt: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.error("Error adding to favorites:", e);
  }
}

export function addToFavorites(video: { id: string; title: string; thumbnail: string }): void {
  addToFavoritesAsync(video);
}

export async function removeFromFavoritesAsync(videoId: string): Promise<void> {
  if (!isBrowser) return;
  
  try {
    await getDb().favorites.delete(videoId);
  } catch (e) {
    console.error("Error removing from favorites:", e);
  }
}

export function removeFromFavorites(videoId: string): void {
  removeFromFavoritesAsync(videoId);
}

export async function isFavoriteAsync(videoId: string): Promise<boolean> {
  if (!isBrowser) return false;
  
  try {
    const fav = await getDb().favorites.get(videoId);
    return !!fav;
  } catch {
    return false;
  }
}

export function isFavorite(videoId: string): boolean {
  // Synchronous check not possible with IndexedDB, return false initially
  // Components should use the async version
  return false;
}

export async function getFavoritesAsync(): Promise<FavoriteVideo[]> {
  if (!isBrowser) return [];
  
  try {
    return await getDb().favorites.orderBy("addedAt").reverse().toArray();
  } catch {
    return [];
  }
}

export function getFavorites(): FavoriteVideo[] {
  return [];
}

// ==================== Watch Later Functions ====================

export async function addToWatchLaterAsync(
  video: { id: string; title: string; thumbnail: string },
  priority: "low" | "medium" | "high" = "medium"
): Promise<void> {
  if (!isBrowser) return;
  
  try {
    const database = getDb();
    const existing = await database.watchLater.get(video.id);
    
    if (!existing) {
      await database.watchLater.put({
        videoId: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        addedAt: new Date().toISOString(),
        priority,
      });
    }
  } catch (e) {
    console.error("Error adding to watch later:", e);
  }
}

export function addToWatchLater(
  video: { id: string; title: string; thumbnail: string },
  priority: "low" | "medium" | "high" = "medium"
): void {
  addToWatchLaterAsync(video, priority);
}

export async function removeFromWatchLaterAsync(videoId: string): Promise<void> {
  if (!isBrowser) return;
  
  try {
    await getDb().watchLater.delete(videoId);
  } catch (e) {
    console.error("Error removing from watch later:", e);
  }
}

export function removeFromWatchLater(videoId: string): void {
  removeFromWatchLaterAsync(videoId);
}

export async function isInWatchLaterAsync(videoId: string): Promise<boolean> {
  if (!isBrowser) return false;
  
  try {
    const item = await getDb().watchLater.get(videoId);
    return !!item;
  } catch {
    return false;
  }
}

export function isInWatchLater(videoId: string): boolean {
  return false;
}

export async function getWatchLaterAsync(): Promise<WatchLaterItem[]> {
  if (!isBrowser) return [];
  
  try {
    const items = await getDb().watchLater.toArray();
    // Sort by priority (high > medium > low) then by addedAt
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return items.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
    });
  } catch {
    return [];
  }
}

export function getWatchLater(): WatchLaterItem[] {
  return [];
}

// ==================== Study Streak Functions ====================

export async function updateStudyStreakAsync(): Promise<void> {
  if (!isBrowser) return;
  
  try {
    const database = getDb();
    const today = getTodayDate();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    
    let streak = await database.streak.get("main");
    if (!streak) {
      streak = getDefaultStreak();
    }
    
    if (streak.lastStudyDate === today) {
      // Already studied today
      return;
    }
    
    if (!streak.studyDates.includes(today)) {
      streak.studyDates.push(today);
    }
    
    if (streak.lastStudyDate === yesterday) {
      // Consecutive day
      streak.currentStreak++;
    } else if (streak.lastStudyDate !== today) {
      // Streak broken
      streak.currentStreak = 1;
    }
    
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }
    
    streak.lastStudyDate = today;
    await database.streak.put(streak);
  } catch (e) {
    console.error("Error updating streak:", e);
  }
}

export function updateStudyStreak(): void {
  updateStudyStreakAsync();
}

// ==================== Study Session Functions ====================

export async function startStudySessionAsync(videoId: string, videoTitle: string, focusMode: boolean = false): Promise<string> {
  if (!isBrowser) return "";
  
  try {
    const sessionId = generateId();
    
    await getDb().sessions.put({
      id: sessionId,
      videoId,
      videoTitle,
      startTime: new Date().toISOString(),
      duration: 0,
      notes: "",
      focusMode,
    });
    
    // Update streak
    await updateStudyStreakAsync();
    
    return sessionId;
  } catch (e) {
    console.error("Error starting session:", e);
    return "";
  }
}

export function startStudySession(videoId: string, videoTitle: string, focusMode: boolean = false): string {
  startStudySessionAsync(videoId, videoTitle, focusMode);
  return generateId(); // Return a temp ID
}

export async function endStudySessionAsync(sessionId: string, notes: string = ""): Promise<void> {
  if (!isBrowser) return;
  
  try {
    const database = getDb();
    const session = await database.sessions.get(sessionId);
    
    if (session && !session.endTime) {
      session.endTime = new Date().toISOString();
      session.duration = Math.floor(
        (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000
      );
      session.notes = notes;
      
      await database.sessions.put(session);
      
      // Update total watch time
      const settings = (await database.settings.get("main")) || getDefaultSettings();
      settings.totalWatchTime += session.duration;
      await database.settings.put(settings);
    }
  } catch (e) {
    console.error("Error ending session:", e);
  }
}

export function endStudySession(sessionId: string, notes: string = ""): void {
  endStudySessionAsync(sessionId, notes);
}

export async function getRecentSessionsAsync(limit: number = 10): Promise<StudySession[]> {
  if (!isBrowser) return [];
  
  try {
    const sessions = await getDb().sessions
      .orderBy("startTime")
      .reverse()
      .filter(s => !!s.endTime)
      .limit(limit)
      .toArray();
    return sessions;
  } catch {
    return [];
  }
}

export function getRecentSessions(limit: number = 10): StudySession[] {
  return [];
}

// ==================== Recently Watched Functions ====================

export async function getRecentlyWatchedAsync(limit: number = 10): Promise<{ videoId: string; lastWatched: string; percentage: number }[]> {
  if (!isBrowser) return [];
  
  try {
    const progress = await getDb().videoProgress
      .filter(p => p.watchedPercentage > 0)
      .toArray();
    
    return progress
      .sort((a, b) => new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime())
      .slice(0, limit)
      .map(p => ({
        videoId: p.videoId,
        lastWatched: p.lastWatched,
        percentage: p.watchedPercentage,
      }));
  } catch {
    return [];
  }
}

export function getRecentlyWatched(limit: number = 10): { videoId: string; lastWatched: string; percentage: number }[] {
  return [];
}

// ==================== Settings Functions ====================

export async function getSettingsAsync(): Promise<StudySettings> {
  if (!isBrowser) return getDefaultSettings();
  
  try {
    const settings = await getDb().settings.get("main");
    return settings || getDefaultSettings();
  } catch {
    return getDefaultSettings();
  }
}

export function getSettings(): StudySettings {
  return getDefaultSettings();
}

export async function updateSettingsAsync(newSettings: Partial<StudySettings>): Promise<void> {
  if (!isBrowser) return;
  
  try {
    const database = getDb();
    const existing = (await database.settings.get("main")) || getDefaultSettings();
    await database.settings.put({ ...existing, ...newSettings, id: "main" });
  } catch (e) {
    console.error("Error updating settings:", e);
  }
}

export function updateSettings(newSettings: Partial<StudySettings>): void {
  updateSettingsAsync(newSettings);
}

// ==================== Notes & Bookmarks Search Functions ====================

export async function searchNotesAsync(query: string): Promise<Note[]> {
  if (!isBrowser || !query.trim()) return [];
  
  try {
    const allNotes = await getDb().notes.toArray();
    const lowerQuery = query.toLowerCase();
    
    return allNotes.filter(note =>
      note.content.toLowerCase().includes(lowerQuery) ||
      note.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  } catch {
    return [];
  }
}

export async function getAllNotesAsync(): Promise<Note[]> {
  if (!isBrowser) return [];
  
  try {
    return await getDb().notes.orderBy("createdAt").reverse().toArray();
  } catch {
    return [];
  }
}

export async function getAllBookmarksAsync(): Promise<Bookmark[]> {
  if (!isBrowser) return [];
  
  try {
    return await getDb().bookmarks.orderBy("createdAt").reverse().toArray();
  } catch {
    return [];
  }
}

export async function getNotesByVideoIdAsync(videoId: string): Promise<Note[]> {
  if (!isBrowser) return [];
  
  try {
    return await getDb().notes.where("videoId").equals(videoId).toArray();
  } catch {
    return [];
  }
}

export async function getBookmarksByVideoIdAsync(videoId: string): Promise<Bookmark[]> {
  if (!isBrowser) return [];
  
  try {
    return await getDb().bookmarks.where("videoId").equals(videoId).toArray();
  } catch {
    return [];
  }
}

// ==================== Data Export/Import Functions ====================

export interface ExportData {
  version: string;
  exportedAt: string;
  notes: Note[];
  bookmarks: Bookmark[];
  videoProgress: VideoProgress[];
  favorites: FavoriteVideo[];
  watchLater: WatchLaterItem[];
  sessions: StudySession[];
  streak: StudyStreak | null;
  settings: StudySettings | null;
}

export async function exportAllDataAsync(): Promise<ExportData> {
  if (!isBrowser) {
    return {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      notes: [],
      bookmarks: [],
      videoProgress: [],
      favorites: [],
      watchLater: [],
      sessions: [],
      streak: null,
      settings: null,
    };
  }

  try {
    const database = getDb();
    
    const [notes, bookmarks, videoProgress, favorites, watchLater, sessions, streak, settings] = await Promise.all([
      database.notes.toArray(),
      database.bookmarks.toArray(),
      database.videoProgress.toArray(),
      database.favorites.toArray(),
      database.watchLater.toArray(),
      database.sessions.toArray(),
      database.streak.get("main"),
      database.settings.get("main"),
    ]);

    return {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      notes,
      bookmarks,
      videoProgress,
      favorites,
      watchLater,
      sessions,
      streak: streak || null,
      settings: settings || null,
    };
  } catch (e) {
    console.error("Error exporting data:", e);
    return {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      notes: [],
      bookmarks: [],
      videoProgress: [],
      favorites: [],
      watchLater: [],
      sessions: [],
      streak: null,
      settings: null,
    };
  }
}

export function exportAllData(): ExportData {
  return {
    version: "2.0",
    exportedAt: new Date().toISOString(),
    notes: [],
    bookmarks: [],
    videoProgress: [],
    favorites: [],
    watchLater: [],
    sessions: [],
    streak: null,
    settings: null,
  };
}

export async function importAllDataAsync(data: ExportData, merge: boolean = false): Promise<boolean> {
  if (!isBrowser) return false;

  try {
    const database = getDb();

    await database.transaction("rw", [
      database.notes,
      database.bookmarks,
      database.videoProgress,
      database.favorites,
      database.watchLater,
      database.sessions,
      database.streak,
      database.settings,
    ], async () => {
      if (!merge) {
        // Clear all data if not merging
        await Promise.all([
          database.notes.clear(),
          database.bookmarks.clear(),
          database.videoProgress.clear(),
          database.favorites.clear(),
          database.watchLater.clear(),
          database.sessions.clear(),
          database.streak.clear(),
          database.settings.clear(),
        ]);
      }

      // Import data
      if (data.notes?.length) await database.notes.bulkPut(data.notes);
      if (data.bookmarks?.length) await database.bookmarks.bulkPut(data.bookmarks);
      if (data.videoProgress?.length) await database.videoProgress.bulkPut(data.videoProgress);
      if (data.favorites?.length) await database.favorites.bulkPut(data.favorites);
      if (data.watchLater?.length) await database.watchLater.bulkPut(data.watchLater);
      if (data.sessions?.length) await database.sessions.bulkPut(data.sessions);
      if (data.streak) await database.streak.put(data.streak);
      if (data.settings) await database.settings.put(data.settings);
    });

    return true;
  } catch (e) {
    console.error("Error importing data:", e);
    return false;
  }
}

export function importAllData(data: ExportData): boolean {
  importAllDataAsync(data, false);
  return true;
}

export async function downloadExportFileAsync(): Promise<void> {
  if (!isBrowser) return;

  const data = await exportAllDataAsync();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `study-data-${getTodayDate()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadExportFile(): void {
  downloadExportFileAsync();
}

// ==================== Clear All Data ====================

export async function clearAllDataAsync(): Promise<void> {
  if (!isBrowser) return;

  try {
    const database = getDb();
    await Promise.all([
      database.notes.clear(),
      database.bookmarks.clear(),
      database.videoProgress.clear(),
      database.favorites.clear(),
      database.watchLater.clear(),
      database.sessions.clear(),
      database.streak.clear(),
      database.settings.clear(),
    ]);
  } catch (e) {
    console.error("Error clearing data:", e);
  }
}

// ==================== Migration from localStorage ====================

export async function migrateFromLocalStorage(): Promise<boolean> {
  if (!isBrowser) return false;

  try {
    const database = getDb();
    
    // Check if migration already done
    const existingProgress = await database.videoProgress.count();
    if (existingProgress > 0) {
      console.log("Migration already completed or data exists");
      return false;
    }

    console.log("Starting migration from localStorage to IndexedDB...");
    
    // Migrate video study data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("video_study_")) {
        try {
          const videoId = key.replace("video_study_", "");
          const data = JSON.parse(localStorage.getItem(key) || "{}");
          
          // Migrate notes
          if (data.notes?.length) {
            const notes = data.notes.map((n: any) => ({ ...n, videoId }));
            await database.notes.bulkPut(notes);
          }
          
          // Migrate bookmarks
          if (data.bookmarks?.length) {
            const bookmarks = data.bookmarks.map((b: any) => ({ ...b, videoId }));
            await database.bookmarks.bulkPut(bookmarks);
          }
          
          // Migrate progress
          if (data.progress) {
            await database.videoProgress.put({ ...data.progress, videoId });
          }
        } catch (e) {
          console.error("Error migrating", key, e);
        }
      }
    }

    // Migrate global data
    try {
      const globalData = JSON.parse(localStorage.getItem("study_global_data") || "{}");
      
      if (globalData.favorites?.length) {
        await database.favorites.bulkPut(globalData.favorites);
      }
      
      if (globalData.watchLater?.length) {
        await database.watchLater.bulkPut(globalData.watchLater);
      }
      
      if (globalData.sessions?.length) {
        await database.sessions.bulkPut(globalData.sessions);
      }
      
      if (globalData.streak) {
        await database.streak.put({ ...globalData.streak, id: "main" });
      }
      
      if (globalData.settings) {
        await database.settings.put({
          ...getDefaultSettings(),
          ...globalData.settings,
          totalWatchTime: globalData.totalWatchTime || 0,
          id: "main",
        });
      }
    } catch (e) {
      console.error("Error migrating global data:", e);
    }

    // Migrate video positions
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("video_position_")) {
        try {
          const videoId = key.replace("video_position_", "");
          const position = parseFloat(localStorage.getItem(key) || "0");
          
          const existing = await database.videoProgress.get(videoId);
          if (existing) {
            existing.lastPosition = position;
            await database.videoProgress.put(existing);
          } else {
            await database.videoProgress.put({
              ...getDefaultVideoProgress(videoId),
              lastPosition: position,
            });
          }
        } catch (e) {
          console.error("Error migrating position", key, e);
        }
      }
    }

    console.log("Migration completed successfully!");
    return true;
  } catch (e) {
    console.error("Migration failed:", e);
    return false;
  }
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

// ==================== Global Data Functions (for backward compatibility) ====================

export interface GlobalStudyData {
  favorites: FavoriteVideo[];
  watchLater: WatchLaterItem[];
  sessions: StudySession[];
  streak: StudyStreak;
  settings: StudySettings;
  totalWatchTime: number;
}

export async function loadGlobalDataAsync(): Promise<GlobalStudyData> {
  if (!isBrowser) {
    return {
      favorites: [],
      watchLater: [],
      sessions: [],
      streak: getDefaultStreak(),
      settings: getDefaultSettings(),
      totalWatchTime: 0,
    };
  }

  try {
    const database = getDb();
    const [favorites, watchLater, sessions, streak, settings] = await Promise.all([
      database.favorites.toArray(),
      database.watchLater.toArray(),
      database.sessions.toArray(),
      database.streak.get("main"),
      database.settings.get("main"),
    ]);

    return {
      favorites: favorites || [],
      watchLater: watchLater || [],
      sessions: sessions || [],
      streak: streak || getDefaultStreak(),
      settings: settings || getDefaultSettings(),
      totalWatchTime: settings?.totalWatchTime || 0,
    };
  } catch (e) {
    console.error("Error loading global data:", e);
    return {
      favorites: [],
      watchLater: [],
      sessions: [],
      streak: getDefaultStreak(),
      settings: getDefaultSettings(),
      totalWatchTime: 0,
    };
  }
}

// NOTE: synchronous wrappers removed — use async `loadGlobalDataAsync` / `saveGlobalDataAsync`.

// ==================== Tracked Video IDs (for backward compatibility) ====================

// NOTE: use `getTrackedVideoIdsAsync` where needed. Synchronous variant removed.

// Backwards-compat migration helpers removed. The codebase now uses IndexedDB (Dexie) only.

// Export the database instance getter for advanced usage
export { getDb };
