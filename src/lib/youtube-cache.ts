/**
 * ===============================================
 * YOUTUBE DATA CACHE SYSTEM
 * ===============================================
 * Custom YouTube data fetching with local caching.
 * - Caches data to JSON files to avoid repeated API calls
 * - Supports marking playlists as "complete" (no new videos expected)
 * - Rate-limited fetching to avoid API timeouts
 * - Thread-safe metadata updates with atomic writes
 * ===============================================
 */

import fs from "node:fs";
import path from "node:path";

// Types
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
}

export interface CachedPlaylist {
  id: string;
  name: string;
  lastFetched: string;
  isComplete: boolean; // If true, won't refetch
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

// Cache configuration
const CACHE_DIR = ".youtube-cache";
const METADATA_FILE = "metadata.json";
const LOCK_FILE = "cache.lock";
const CACHE_TTL_HOURS = 24; // Refetch non-complete playlists after this time
const FETCH_DELAY_MS = 500; // Delay between API calls to avoid rate limiting
const MAX_RETRIES = 3; // Maximum retries for API calls
const LOCK_TIMEOUT_MS = 30000; // Lock timeout in milliseconds

// In-memory cache for metadata to reduce disk reads
let metadataCache: CacheMetadata | null = null;
let metadataCacheTime = 0;
const METADATA_CACHE_TTL_MS = 5000; // 5 seconds

/**
 * Ensure cache directory exists
 */
function ensureCacheDir(): string {
  const cacheDir = path.join(process.cwd(), CACHE_DIR);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  return cacheDir;
}

/**
 * Acquire a lock for metadata operations
 */
async function acquireLock(): Promise<boolean> {
  const cacheDir = ensureCacheDir();
  const lockPath = path.join(cacheDir, LOCK_FILE);
  const startTime = Date.now();
  
  while (Date.now() - startTime < LOCK_TIMEOUT_MS) {
    try {
      // Try to create lock file exclusively
      const fd = fs.openSync(lockPath, 'wx');
      fs.writeSync(fd, String(Date.now()));
      fs.closeSync(fd);
      return true;
    } catch (err: any) {
      if (err.code === 'EEXIST') {
        // Check if lock is stale
        try {
          const lockContent = fs.readFileSync(lockPath, 'utf-8');
          const lockTime = parseInt(lockContent, 10);
          if (Date.now() - lockTime > LOCK_TIMEOUT_MS) {
            // Lock is stale, remove it
            fs.unlinkSync(lockPath);
            continue;
          }
        } catch {
          // Lock file corrupted, remove it
          try { fs.unlinkSync(lockPath); } catch {}
          continue;
        }
        // Wait and retry
        await delay(50);
      } else {
        throw err;
      }
    }
  }
  return false;
}

/**
 * Release the lock
 */
function releaseLock(): void {
  const cacheDir = path.join(process.cwd(), CACHE_DIR);
  const lockPath = path.join(cacheDir, LOCK_FILE);
  try {
    fs.unlinkSync(lockPath);
  } catch {}
}

/**
 * Atomic write to file (write to temp then rename)
 */
function atomicWriteFile(filePath: string, data: string): void {
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, data);
  fs.renameSync(tempPath, filePath);
}

/**
 * Get cache metadata with in-memory caching
 */
function getMetadata(): CacheMetadata {
  // Check if in-memory cache is still valid
  if (metadataCache && Date.now() - metadataCacheTime < METADATA_CACHE_TTL_MS) {
    return metadataCache;
  }
  
  const cacheDir = ensureCacheDir();
  const metadataPath = path.join(cacheDir, METADATA_FILE);
  
  if (fs.existsSync(metadataPath)) {
    try {
      const data = fs.readFileSync(metadataPath, "utf-8");
      metadataCache = JSON.parse(data);
      metadataCacheTime = Date.now();
      return metadataCache!;
    } catch {
      metadataCache = { lastUpdated: new Date().toISOString(), playlists: {} };
      metadataCacheTime = Date.now();
      return metadataCache;
    }
  }
  
  metadataCache = { lastUpdated: new Date().toISOString(), playlists: {} };
  metadataCacheTime = Date.now();
  return metadataCache;
}

/**
 * Save cache metadata with locking
 */
async function saveMetadataAsync(metadata: CacheMetadata): Promise<void> {
  const locked = await acquireLock();
  if (!locked) {
    console.warn('[youtube-cache] Could not acquire lock for metadata update');
    return;
  }
  
  try {
    const cacheDir = ensureCacheDir();
    const metadataPath = path.join(cacheDir, METADATA_FILE);
    
    // Re-read metadata to merge with any concurrent changes
    let currentMetadata: CacheMetadata;
    if (fs.existsSync(metadataPath)) {
      try {
        currentMetadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
      } catch {
        currentMetadata = { lastUpdated: new Date().toISOString(), playlists: {} };
      }
    } else {
      currentMetadata = { lastUpdated: new Date().toISOString(), playlists: {} };
    }
    
    // Merge the new data with existing data
    const mergedMetadata: CacheMetadata = {
      lastUpdated: new Date().toISOString(),
      playlists: { ...currentMetadata.playlists, ...metadata.playlists },
      channel: metadata.channel || currentMetadata.channel,
    };
    
    atomicWriteFile(metadataPath, JSON.stringify(mergedMetadata, null, 2));
    
    // Update in-memory cache
    metadataCache = mergedMetadata;
    metadataCacheTime = Date.now();
  } finally {
    releaseLock();
  }
}

/**
 * Sync save metadata (for backwards compatibility)
 */
function saveMetadata(metadata: CacheMetadata): void {
  const cacheDir = ensureCacheDir();
  const metadataPath = path.join(cacheDir, METADATA_FILE);
  
  // Re-read and merge to prevent data loss
  let currentMetadata: CacheMetadata;
  if (fs.existsSync(metadataPath)) {
    try {
      currentMetadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
    } catch {
      currentMetadata = { lastUpdated: new Date().toISOString(), playlists: {} };
    }
  } else {
    currentMetadata = { lastUpdated: new Date().toISOString(), playlists: {} };
  }
  
  const mergedMetadata: CacheMetadata = {
    lastUpdated: new Date().toISOString(),
    playlists: { ...currentMetadata.playlists, ...metadata.playlists },
    channel: metadata.channel || currentMetadata.channel,
  };
  
  atomicWriteFile(metadataPath, JSON.stringify(mergedMetadata, null, 2));
  
  // Update in-memory cache
  metadataCache = mergedMetadata;
  metadataCacheTime = Date.now();
}

/**
 * Get cached playlist data
 */
function getCachedPlaylist(playlistId: string): CachedPlaylist | null {
  const cacheDir = ensureCacheDir();
  const playlistPath = path.join(cacheDir, `playlist_${playlistId}.json`);
  
  if (fs.existsSync(playlistPath)) {
    try {
      return JSON.parse(fs.readFileSync(playlistPath, "utf-8"));
    } catch {
      return null;
    }
  }
  
  return null;
}

/**
 * Save playlist to cache using atomic writes
 */
function savePlaylistCache(playlist: CachedPlaylist): void {
  const cacheDir = ensureCacheDir();
  const playlistPath = path.join(cacheDir, `playlist_${playlist.id}.json`);
  atomicWriteFile(playlistPath, JSON.stringify(playlist, null, 2));
}

/**
 * Get cached channel data
 */
function getCachedChannel(): YouTubeVideo[] | null {
  const cacheDir = ensureCacheDir();
  const channelPath = path.join(cacheDir, "channel.json");
  
  if (fs.existsSync(channelPath)) {
    try {
      return JSON.parse(fs.readFileSync(channelPath, "utf-8"));
    } catch {
      return null;
    }
  }
  
  return null;
}

/**
 * Save channel videos to cache using atomic writes
 */
function saveChannelCache(videos: YouTubeVideo[]): void {
  const cacheDir = ensureCacheDir();
  const channelPath = path.join(cacheDir, "channel.json");
  atomicWriteFile(channelPath, JSON.stringify(videos, null, 2));
}

/**
 * Check if cache is stale
 */
function isCacheStale(lastFetched: string, isComplete: boolean): boolean {
  if (isComplete) return false; // Complete playlists never go stale
  
  const lastFetchedDate = new Date(lastFetched);
  const now = new Date();
  const hoursSinceUpdate = (now.getTime() - lastFetchedDate.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceUpdate > CACHE_TTL_HOURS;
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with retry logic
 */
async function fetchWithRetry(
  url: string,
  retries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      
      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : (2 ** i) * 1000;
        console.warn(`[youtube-cache] Rate limited, waiting ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }
      
      // Handle other errors
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`YouTube API error: ${response.status} ${response.statusText} - ${errorBody}`);
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      if (i < retries - 1) {
        const waitTime = (2 ** i) * 1000;
        console.warn(`[youtube-cache] Request failed, retrying in ${waitTime}ms... (${error})`);
        await delay(waitTime);
      }
    }
  }
  
  throw lastError || new Error('Failed after all retries');
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
  const cacheDir = path.join(process.cwd(), CACHE_DIR);
  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true });
    metadataCache = null;
    metadataCacheTime = 0;
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
  const playlists = Object.values(metadata.playlists);
  
  return {
    totalPlaylists: playlists.length,
    completePlaylists: playlists.filter(p => p.isComplete).length,
    totalVideos: playlists.reduce((sum, p) => sum + p.videoCount, 0) + (metadata.channel?.videoCount || 0),
    lastUpdated: metadata.lastUpdated,
    playlists: metadata.playlists,
  };
}

/**
 * Check if cache exists and is valid
 */
export function isCacheReady(): boolean {
  const cacheDir = path.join(process.cwd(), CACHE_DIR);
  const metadataPath = path.join(cacheDir, METADATA_FILE);
  
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
  const cacheDir = ensureCacheDir();
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
