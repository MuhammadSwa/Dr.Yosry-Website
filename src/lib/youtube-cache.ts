/**
 * ===============================================
 * YOUTUBE DATA CACHE SYSTEM
 * ===============================================
 * Simple YouTube data fetching with local JSON caching.
 * 
 * Features:
 * - Caches data to JSON files to avoid repeated API calls
 * - Supports marking playlists as "complete" (no new videos expected)
 * - Rate-limited fetching with retry logic
 * 
 * Usage:
 * 1. Run `pnpm cache:warmup` before build to populate cache
 * 2. Build uses cache-only mode (no API calls)
 * ===============================================
 */

import fs from "node:fs";
import path from "node:path";

// ===============================================
// TYPES
// ===============================================

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  duration?: string;
  channelId: string;
  channelTitle: string;
  thumbnails: {
    default?: { url: string; width?: number; height?: number };
    medium?: { url: string; width?: number; height?: number };
    high?: { url: string; width?: number; height?: number };
    standard?: { url: string; width?: number; height?: number };
    maxres?: { url: string; width?: number; height?: number };
  };
  tags?: string[];
  categoryId?: string;
  viewCount?: string;
  likeCount?: string;
  commentCount?: string;
  // Added: playlist context for videos
  playlistId?: string;
  playlistName?: string;
  category?: string;
}

export interface CachedPlaylist {
  id: string;
  name: string;
  lastFetched: string;
  isComplete: boolean;
  videoCount: number;
  videos: YouTubeVideo[];
}

export interface CacheMetadata {
  lastUpdated: string;
  playlists: Record<string, {
    lastFetched: string;
    isComplete: boolean;
    videoCount: number;
  }>;
  channel?: {
    lastFetched: string;
    videoCount: number;
  };
}

// ===============================================
// CONFIGURATION
// ===============================================

const CACHE_DIR = ".youtube-cache";
const METADATA_FILE = "metadata.json";
const CACHE_TTL_HOURS = 24;
const FETCH_DELAY_MS = 500;
const MAX_RETRIES = 3;

// ===============================================
// CACHE FILE OPERATIONS
// ===============================================

function getCacheDir(): string {
  return path.join(process.cwd(), CACHE_DIR);
}

function ensureCacheDir(): string {
  const cacheDir = getCacheDir();
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  return cacheDir;
}

function getMetadata(): CacheMetadata {
  const metadataPath = path.join(getCacheDir(), METADATA_FILE);
  
  if (fs.existsSync(metadataPath)) {
    try {
      return JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
    } catch {
      // Corrupted metadata, start fresh
    }
  }
  
  return { lastUpdated: new Date().toISOString(), playlists: {} };
}

function saveMetadata(updates: Partial<CacheMetadata>): void {
  const cacheDir = ensureCacheDir();
  const metadataPath = path.join(cacheDir, METADATA_FILE);
  
  const current = getMetadata();
  const merged: CacheMetadata = {
    lastUpdated: new Date().toISOString(),
    playlists: { ...current.playlists, ...updates.playlists },
    channel: updates.channel ?? current.channel,
  };
  
  fs.writeFileSync(metadataPath, JSON.stringify(merged, null, 2));
}

function getCachedPlaylist(playlistId: string): CachedPlaylist | null {
  const playlistPath = path.join(getCacheDir(), `playlist_${playlistId}.json`);
  
  try {
    if (fs.existsSync(playlistPath)) {
      return JSON.parse(fs.readFileSync(playlistPath, "utf-8"));
    }
  } catch {
    // Corrupted cache file
  }
  return null;
}

function savePlaylistCache(playlist: CachedPlaylist): void {
  const cacheDir = ensureCacheDir();
  const playlistPath = path.join(cacheDir, `playlist_${playlist.id}.json`);
  fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
}

function getCachedChannel(): YouTubeVideo[] | null {
  const channelPath = path.join(getCacheDir(), "channel.json");
  
  try {
    if (fs.existsSync(channelPath)) {
      return JSON.parse(fs.readFileSync(channelPath, "utf-8"));
    }
  } catch {
    // Corrupted cache file
  }
  return null;
}

function saveChannelCache(videos: YouTubeVideo[]): void {
  const cacheDir = ensureCacheDir();
  const channelPath = path.join(cacheDir, "channel.json");
  fs.writeFileSync(channelPath, JSON.stringify(videos, null, 2));
}

function isCacheStale(lastFetched: string, isComplete: boolean): boolean {
  if (isComplete) return false;
  
  const hoursSinceUpdate = (Date.now() - new Date(lastFetched).getTime()) / (1000 * 60 * 60);
  return hoursSinceUpdate > CACHE_TTL_HOURS;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===============================================
// API HELPERS
// ===============================================

async function fetchWithRetry(url: string): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : (2 ** attempt) * 1000;
        console.warn(`[youtube-cache] Rate limited, waiting ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < MAX_RETRIES - 1) {
        const waitTime = (2 ** attempt) * 1000;
        console.warn(`[youtube-cache] Retry ${attempt + 1}/${MAX_RETRIES} in ${waitTime}ms...`);
        await delay(waitTime);
      }
    }
  }
  
  throw lastError ?? new Error('Failed after all retries');
}

/**
 * Fetch ALL playlist items from YouTube API (handles pagination for playlists > 50 videos)
 */
async function fetchPlaylistItems(
  apiKey: string,
  playlistId: string,
  maxResults: number = 1000 // Default to 1000 to get all videos
): Promise<string[]> {
  const videoIds: string[] = [];
  let pageToken: string | undefined;
  let pageCount = 0;
  
  console.log(`[youtube-cache] Fetching playlist items for ${playlistId}...`);
  
  do {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "contentDetails");
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("maxResults", "50"); // Always fetch 50 per page (API max)
    url.searchParams.set("key", apiKey);
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    
    const response = await fetchWithRetry(url.toString());
    const data = await response.json();
    pageCount++;
    
    for (const item of data.items || []) {
      if (item.contentDetails?.videoId) {
        videoIds.push(item.contentDetails.videoId);
      }
    }
    
    pageToken = data.nextPageToken;
    
    // Log progress for large playlists
    if (pageToken) {
      console.log(`[youtube-cache]   Page ${pageCount}: ${videoIds.length} videos so far...`);
      await delay(FETCH_DELAY_MS);
    }
    
    // Safety limit to prevent infinite loops
    if (videoIds.length >= maxResults) {
      console.log(`[youtube-cache]   Reached maxResults limit (${maxResults})`);
      break;
    }
    
  } while (pageToken);
  
  console.log(`[youtube-cache]   Total: ${videoIds.length} videos found in ${pageCount} page(s)`);
  
  return videoIds.slice(0, maxResults);
}

/**
 * Fetch video details from YouTube API
 */
async function fetchVideoDetails(
  apiKey: string,
  videoIds: string[]
): Promise<YouTubeVideo[]> {
  const videos: YouTubeVideo[] = [];
  
  // YouTube API allows max 50 videos per request
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "snippet,contentDetails,statistics");
    url.searchParams.set("id", batch.join(","));
    url.searchParams.set("key", apiKey);
    
    const response = await fetchWithRetry(url.toString());
    const data = await response.json();
    
    for (const item of data.items || []) {
      videos.push({
        id: item.id,
        title: item.snippet?.title || "",
        description: item.snippet?.description || "",
        url: `https://www.youtube.com/watch?v=${item.id}`,
        publishedAt: item.snippet?.publishedAt || "",
        duration: item.contentDetails?.duration,
        channelId: item.snippet?.channelId || "",
        channelTitle: item.snippet?.channelTitle || "",
        thumbnails: item.snippet?.thumbnails || {},
        tags: item.snippet?.tags,
        categoryId: item.snippet?.categoryId,
        viewCount: item.statistics?.viewCount,
        likeCount: item.statistics?.likeCount,
        commentCount: item.statistics?.commentCount,
      });
    }
    
    // Log progress for large batches
    if (videoIds.length > 50) {
      console.log(`[youtube-cache]   Fetched details for ${Math.min(i + 50, videoIds.length)}/${videoIds.length} videos...`);
    }
    
    if (i + 50 < videoIds.length) {
      await delay(FETCH_DELAY_MS);
    }
  }
  
  return videos;
}

/**
 * Fetch channel videos from YouTube API
 */
async function fetchChannelVideos(
  apiKey: string,
  channelId: string,
  maxResults: number = 50
): Promise<YouTubeVideo[]> {
  // First, search for videos from the channel
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "id");
  url.searchParams.set("channelId", channelId);
  url.searchParams.set("type", "video");
  url.searchParams.set("order", "date");
  url.searchParams.set("maxResults", Math.min(maxResults, 50).toString());
  url.searchParams.set("key", apiKey);
  
  const response = await fetchWithRetry(url.toString());
  const data = await response.json();
  const videoIds = (data.items || [])
    .filter((item: any) => item.id?.videoId)
    .map((item: any) => item.id.videoId);
  
  if (videoIds.length === 0) return [];
  
  await delay(FETCH_DELAY_MS);
  
  return fetchVideoDetails(apiKey, videoIds);
}

/**
 * Main function to load playlist with caching
 */
export async function loadPlaylistWithCache(
  apiKey: string,
  playlistId: string,
  playlistName: string,
  options: {
    maxResults?: number;
    forceRefresh?: boolean;
    isComplete?: boolean;
    cacheOnly?: boolean; // If true, only read from cache, never fetch
  } = {}
): Promise<YouTubeVideo[]> {
  const { maxResults = 1000, forceRefresh = false, isComplete = false, cacheOnly = false } = options;
  
  const metadata = getMetadata();
  const cached = getCachedPlaylist(playlistId);
  const playlistMeta = metadata.playlists[playlistId];
  
  // Check if we can use cached data
  if (cached && !forceRefresh) {
    const shouldRefetch = !playlistMeta || isCacheStale(playlistMeta.lastFetched, playlistMeta.isComplete);
    
    if (!shouldRefetch || cacheOnly) {
      console.log(`[youtube-cache] Using cached data for playlist: ${playlistName} (${cached.videos.length} videos)`);
      return cached.videos;
    }
  }
  
  // In cache-only mode, return empty if no cache
  if (cacheOnly) {
    console.log(`[youtube-cache] No cache found for playlist: ${playlistName} (cache-only mode)`);
    return [];
  }
  
  console.log(`[youtube-cache] Fetching playlist: ${playlistName}...`);
  
  try {
    // Fetch video IDs from playlist
    const videoIds = await fetchPlaylistItems(apiKey, playlistId, maxResults);
    
    if (videoIds.length === 0) {
      console.log(`[youtube-cache] No videos found in playlist: ${playlistName}`);
      return cached?.videos || [];
    }
    
    await delay(FETCH_DELAY_MS);
    
    // Fetch video details
    const videos = await fetchVideoDetails(apiKey, videoIds);
    
    // Save to cache
    const playlistCache: CachedPlaylist = {
      id: playlistId,
      name: playlistName,
      lastFetched: new Date().toISOString(),
      isComplete,
      videoCount: videos.length,
      videos,
    };
    
    savePlaylistCache(playlistCache);
    
    // Update metadata (using merge to prevent data loss from concurrent writes)
    const newMetadata: CacheMetadata = {
      lastUpdated: new Date().toISOString(),
      playlists: {
        [playlistId]: {
          lastFetched: playlistCache.lastFetched,
          isComplete,
          videoCount: videos.length,
        },
      },
    };
    saveMetadata(newMetadata);
    
    console.log(`[youtube-cache] Loaded ${videos.length} videos from playlist: ${playlistName}`);
    
    return videos;
  } catch (error) {
    console.error(`[youtube-cache] Error fetching playlist ${playlistName}:`, error);
    
    // Return cached data if available
    if (cached) {
      console.log(`[youtube-cache] Using stale cache for playlist: ${playlistName}`);
      return cached.videos;
    }
    
    return [];
  }
}

/**
 * Load channel videos with caching
 */
export async function loadChannelWithCache(
  apiKey: string,
  channelId: string,
  options: {
    maxResults?: number;
    forceRefresh?: boolean;
    cacheOnly?: boolean; // If true, only read from cache, never fetch
  } = {}
): Promise<YouTubeVideo[]> {
  const { maxResults = 50, forceRefresh = false, cacheOnly = false } = options;
  
  const metadata = getMetadata();
  const cached = getCachedChannel();
  
  // Check if we can use cached data
  if (cached && !forceRefresh && metadata.channel) {
    const shouldRefetch = isCacheStale(metadata.channel.lastFetched, false);
    
    if (!shouldRefetch || cacheOnly) {
      console.log(`[youtube-cache] Using cached channel data (${cached.length} videos)`);
      return cached;
    }
  }
  
  // In cache-only mode, return empty if no cache
  if (cacheOnly) {
    console.log(`[youtube-cache] No cache found for channel (cache-only mode)`);
    return [];
  }
  
  console.log(`[youtube-cache] Fetching channel videos...`);
  
  try {
    const videos = await fetchChannelVideos(apiKey, channelId, maxResults);
    
    // Save to cache
    saveChannelCache(videos);
    
    // Update metadata (using merge)
    const newMetadata: CacheMetadata = {
      lastUpdated: new Date().toISOString(),
      playlists: {},
      channel: {
        lastFetched: new Date().toISOString(),
        videoCount: videos.length,
      },
    };
    saveMetadata(newMetadata);
    
    console.log(`[youtube-cache] Loaded ${videos.length} channel videos`);
    
    return videos;
  } catch (error) {
    console.error(`[youtube-cache] Error fetching channel:`, error);
    
    // Return cached data if available
    if (cached) {
      console.log(`[youtube-cache] Using stale cache for channel`);
      return cached;
    }
    
    return [];
  }
}

/**
 * Mark a playlist as complete (no new videos expected)
 */
export function markPlaylistComplete(playlistId: string, isComplete: boolean = true): void {
  const metadata = getMetadata();
  
  if (metadata.playlists[playlistId]) {
    const newMetadata: CacheMetadata = {
      lastUpdated: new Date().toISOString(),
      playlists: {
        [playlistId]: {
          ...metadata.playlists[playlistId],
          isComplete,
        },
      },
    };
    saveMetadata(newMetadata);
    console.log(`[youtube-cache] Marked playlist ${playlistId} as ${isComplete ? "complete" : "active"}`);
  }
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  const cacheDir = getCacheDir();
  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true });
    console.log(`[youtube-cache] Cache cleared`);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  totalPlaylists: number;
  completePlaylists: number;
  totalVideos: number;
  lastUpdated: string;
  playlists: Record<string, { videoCount: number; isComplete: boolean; lastFetched: string }>;
} {
  const metadata = getMetadata();
  const playlistsList = Object.values(metadata.playlists);
  
  return {
    totalPlaylists: playlistsList.length,
    completePlaylists: playlistsList.filter(p => p.isComplete).length,
    totalVideos: playlistsList.reduce((sum, p) => sum + p.videoCount, 0) + (metadata.channel?.videoCount || 0),
    lastUpdated: metadata.lastUpdated,
    playlists: metadata.playlists,
  };
}

/**
 * Check if cache exists and is valid
 */
export function isCacheReady(): boolean {
  const metadataPath = path.join(getCacheDir(), METADATA_FILE);
  
  if (!fs.existsSync(metadataPath)) {
    return false;
  }
  
  try {
    const metadata = getMetadata();
    return Object.keys(metadata.playlists).length > 0 || !!metadata.channel;
  } catch {
    return false;
  }
}

/**
 * Validate all cache files exist
 */
export function validateCache(): { 
  isValid: boolean; 
  missingPlaylists: string[];
  errors: string[];
} {
  const metadata = getMetadata();
  const cacheDir = getCacheDir();
  const missingPlaylists: string[] = [];
  const errors: string[] = [];
  
  // Check channel cache
  if (metadata.channel) {
    const channelPath = path.join(cacheDir, "channel.json");
    if (!fs.existsSync(channelPath)) {
      errors.push("Channel cache file missing");
    }
  }
  
  // Check playlist caches
  for (const playlistId of Object.keys(metadata.playlists)) {
    const playlistPath = path.join(cacheDir, `playlist_${playlistId}.json`);
    if (!fs.existsSync(playlistPath)) {
      missingPlaylists.push(playlistId);
      errors.push(`Playlist cache file missing: ${playlistId}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    missingPlaylists,
    errors,
  };
}
