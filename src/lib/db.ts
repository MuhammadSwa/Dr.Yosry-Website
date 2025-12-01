/**
 * Dexie Database Schema
 * IndexedDB-based storage for all study-related data
 * Replaces localStorage with better performance, indexing, and larger storage capacity
 */

import Dexie, { type Table } from "dexie";

// ==================== Types ====================

export interface Note {
  id: string;
  videoId: string;
  timestamp: string;
  content: string;
  createdAt: string;
  importance?: "high" | "medium" | "low" | "none";
  tags?: string[];
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
  lastPosition: number; // in seconds
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
  videosPerPage: number;
  totalWatchTime: number; // in seconds
}

// ==================== Database Class ====================

export class StudyDatabase extends Dexie {
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
      // Notes: indexed by id (primary), videoId for filtering, tags for searching
      notes: "id, videoId, createdAt, importance, *tags",
      
      // Bookmarks: indexed by id (primary), videoId for filtering
      bookmarks: "id, videoId, createdAt",
      
      // Video Progress: indexed by videoId (primary), for quick lookups
      videoProgress: "videoId, completed, lastWatched, watchedPercentage",
      
      // Favorites: indexed by videoId (primary)
      favorites: "videoId, addedAt",
      
      // Watch Later: indexed by videoId (primary), priority for sorting
      watchLater: "videoId, priority, addedAt",
      
      // Study Sessions: indexed by id (primary), videoId and startTime for filtering
      sessions: "id, videoId, startTime",
      
      // Streak: singleton table
      streak: "id",
      
      // Settings: singleton table
      settings: "id",
    });
  }
}

// ==================== Database Instance ====================

// Check if we're in the browser
const isBrowser = typeof window !== "undefined";

// Create database instance (only in browser)
export const db = isBrowser ? new StudyDatabase() : null as unknown as StudyDatabase;

// ==================== Helper Functions ====================

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

// ==================== Default Values ====================

export function getDefaultSettings(): StudySettings {
  return {
    id: "main",
    pomodoroLength: 25,
    breakLength: 5,
    autoResumeEnabled: true,
    keyboardShortcutsEnabled: true,
    defaultPlaybackSpeed: 1,
    videosPerPage: 24,
    totalWatchTime: 0,
  };
}

export function getDefaultStreak(): StudyStreak {
  return {
    id: "main",
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: "",
    studyDates: [],
  };
}

export function getDefaultVideoProgress(videoId: string): VideoProgress {
  return {
    videoId,
    completed: false,
    lastWatched: new Date().toISOString(),
    watchedPercentage: 0,
    rating: 0,
    lastPosition: 0,
  };
}

// ==================== Initialization ====================

/**
 * Initialize database with default values if empty
 */
export async function initializeDatabase(): Promise<void> {
  if (!isBrowser || !db) return;

  try {
    // Initialize settings if not exists
    const settings = await db.settings.get("main");
    if (!settings) {
      await db.settings.put(getDefaultSettings());
    }

    // Initialize streak if not exists
    const streak = await db.streak.get("main");
    if (!streak) {
      await db.streak.put(getDefaultStreak());
    }
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

// Auto-initialize on import (in browser only)
if (isBrowser && db) {
  initializeDatabase();
}

// ==================== Migration from localStorage ====================

/**
 * Migrate data from localStorage to IndexedDB
 * This should be called once when the user first loads the app after the update
 */
export async function migrateFromLocalStorage(): Promise<boolean> {
  if (!isBrowser || !db) return false;

  try {
    // Check if migration already done
    const settings = await db.settings.get("main");
    if (settings && settings.totalWatchTime > 0) {
      // Already migrated (or has data)
      return true;
    }

    console.log("Starting migration from localStorage to IndexedDB...");

    // Migrate video study data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Migrate video_study_ data
      if (key.startsWith("video_study_")) {
        try {
          const videoId = key.replace("video_study_", "");
          const data = JSON.parse(localStorage.getItem(key) || "{}");

          // Migrate notes
          if (data.notes && Array.isArray(data.notes)) {
            for (const note of data.notes) {
              await db.notes.put({
                ...note,
                videoId,
                importance: note.importance || "none",
              });
            }
          }

          // Migrate bookmarks
          if (data.bookmarks && Array.isArray(data.bookmarks)) {
            for (const bookmark of data.bookmarks) {
              await db.bookmarks.put({
                ...bookmark,
                videoId,
              });
            }
          }

          // Migrate progress
          if (data.progress) {
            await db.videoProgress.put({
              videoId,
              completed: data.progress.completed || false,
              lastWatched: data.progress.lastWatched || new Date().toISOString(),
              watchedPercentage: data.progress.watchedPercentage || 0,
              rating: data.progress.rating || 0,
              lastPosition: data.progress.lastPosition || 0,
            });
          }
        } catch (e) {
          console.error("Error migrating", key, e);
        }
      }

      // Migrate video positions
      if (key.startsWith("video_position_")) {
        try {
          const videoId = key.replace("video_position_", "");
          const position = parseFloat(localStorage.getItem(key) || "0");
          
          const existing = await db.videoProgress.get(videoId);
          if (existing) {
            await db.videoProgress.update(videoId, { lastPosition: position });
          } else {
            await db.videoProgress.put({
              ...getDefaultVideoProgress(videoId),
              lastPosition: position,
            });
          }
        } catch (e) {
          console.error("Error migrating position", key, e);
        }
      }
    }

    // Migrate favorites
    try {
      const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
      for (const fav of favorites) {
        if (typeof fav === "string") {
          // Old format: just video IDs
          await db.favorites.put({
            videoId: fav,
            title: "",
            thumbnail: "",
            addedAt: new Date().toISOString(),
          });
        } else if (fav.videoId) {
          await db.favorites.put(fav);
        }
      }
    } catch (e) {
      console.error("Error migrating favorites", e);
    }

    // Migrate watch later
    try {
      const watchLater = JSON.parse(localStorage.getItem("watch_later") || "[]");
      for (const item of watchLater) {
        if (typeof item === "string") {
          await db.watchLater.put({
            videoId: item,
            title: "",
            thumbnail: "",
            addedAt: new Date().toISOString(),
            priority: "medium",
          });
        } else if (item.videoId) {
          await db.watchLater.put(item);
        }
      }
    } catch (e) {
      console.error("Error migrating watch later", e);
    }

    // Migrate global data
    try {
      const globalData = JSON.parse(localStorage.getItem("study_global_data") || "{}");
      
      // Migrate sessions
      if (globalData.sessions && Array.isArray(globalData.sessions)) {
        for (const session of globalData.sessions) {
          await db.sessions.put(session);
        }
      }

      // Migrate streak
      if (globalData.streak) {
        await db.streak.put({
          id: "main",
          ...getDefaultStreak(),
          ...globalData.streak,
        });
      }

      // Migrate settings
      if (globalData.settings || globalData.totalWatchTime) {
        const currentSettings = await db.settings.get("main") || getDefaultSettings();
        await db.settings.put({
          ...currentSettings,
          ...globalData.settings,
          totalWatchTime: globalData.totalWatchTime || 0,
        });
      }
    } catch (e) {
      console.error("Error migrating global data", e);
    }

    // Migrate lessons per page setting
    try {
      const lessonsPerPage = localStorage.getItem("lessons_per_page");
      if (lessonsPerPage) {
        const currentSettings = await db.settings.get("main") || getDefaultSettings();
        await db.settings.put({
          ...currentSettings,
          videosPerPage: parseInt(lessonsPerPage),
        });
      }
    } catch (e) {
      console.error("Error migrating lessons per page", e);
    }

    console.log("Migration completed successfully!");
    return true;
  } catch (error) {
    console.error("Migration failed:", error);
    return false;
  }
}
