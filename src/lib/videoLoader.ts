/**
 * ===============================================
 * VIDEO LOADER UTILITIES
 * ===============================================
 * Helper functions to load videos from all playlists.
 * Provides a clean API for pages to get all videos
 * without manually importing each playlist collection.
 * ===============================================
 */

import { getCollection, type CollectionEntry } from "astro:content";
import { playlists, channelInfo, getCollectionName, type Playlist, type PlaylistCategory } from "./lessons";
import type { YouTubeVideo } from "./youtube-cache";

// Re-export the video type from youtube-cache for convenience
export type { YouTubeVideo } from "./youtube-cache";

// Type for a video entry from any collection
export type VideoEntry = CollectionEntry<"channelVideos">;

// Extended video type with playlist context
export interface VideoWithContext extends YouTubeVideo {
  playlistId?: string;
  playlistName?: string;
  category?: PlaylistCategory;
}

export interface PlaylistWithVideos extends Playlist {
  videos: VideoWithContext[];
}

/**
 * Transform a raw video entry to include playlist context
 */
function addVideoContext(
  entry: any, 
  context?: { id: string; name: string; category: PlaylistCategory }
): VideoWithContext {
  const video = entry.data;
  return {
    ...video,
    publishedAt: video.publishedAt instanceof Date 
      ? video.publishedAt.toISOString() 
      : video.publishedAt,
    playlistId: context?.id,
    playlistName: context?.name,
    category: context?.category,
  };
}

/**
 * Load channel videos
 */
export async function loadChannelVideos(): Promise<VideoWithContext[]> {
  const videos = await getCollection("channelVideos");
  return videos.map(v => addVideoContext(v, { id: "channel", name: "القناة", category: "متنوع" }));
}

/**
 * Load videos from a specific playlist by its ID
 */
export async function loadPlaylistVideos(playlistId: string): Promise<VideoWithContext[]> {
  const playlist = playlists.find(p => p.id === playlistId);
  if (!playlist) {
    console.warn(`Playlist ${playlistId} not found in configuration`);
    return [];
  }
  
  const collectionName = getCollectionName(playlistId);
  
  try {
    const videos = await getCollection(collectionName as any);
    return videos.map(v => addVideoContext(v, {
      id: playlist.id,
      name: playlist.name,
      category: playlist.category,
    }));
  } catch (error) {
    console.error(`Error loading playlist ${playlistId}:`, error);
    return [];
  }
}

/**
 * Load all videos from all playlists
 */
export async function loadAllPlaylistVideos(): Promise<Map<string, VideoWithContext[]>> {
  const result = new Map<string, VideoWithContext[]>();
  
  for (const playlist of playlists) {
    const videos = await loadPlaylistVideos(playlist.id);
    result.set(playlist.id, videos);
  }
  
  return result;
}

/**
 * Load playlists with their videos - ready for the LessonsApp component
 */
export async function loadPlaylistsWithVideos(): Promise<PlaylistWithVideos[]> {
  const playlistVideosMap = await loadAllPlaylistVideos();
  
  return playlists.map(playlist => ({
    ...playlist,
    videos: playlistVideosMap.get(playlist.id) || [],
  }));
}

/**
 * Load ALL videos (channel + all playlists), deduplicated
 */
export async function loadAllVideos(): Promise<VideoWithContext[]> {
  const [channelVideos, playlistVideosMap] = await Promise.all([
    loadChannelVideos(),
    loadAllPlaylistVideos(),
  ]);
  
  // Collect all videos
  const allVideos: VideoWithContext[] = [...channelVideos];
  
  for (const [, videos] of playlistVideosMap) {
    allVideos.push(...videos);
  }
  
  // Deduplicate by video ID, preferring ones with playlist info
  const videosMap = new Map<string, VideoWithContext>();
  
  for (const video of allVideos) {
    const existing = videosMap.get(video.id);
    // Keep the one with playlist info, or the first one
    if (!existing || (video.playlistId && video.playlistId !== "channel")) {
      videosMap.set(video.id, video);
    }
  }
  
  return Array.from(videosMap.values());
}

/**
 * Get videos grouped by category
 */
export async function loadVideosByCategory(): Promise<Map<PlaylistCategory, VideoWithContext[]>> {
  const allVideos = await loadAllVideos();
  const result = new Map<PlaylistCategory, VideoWithContext[]>();
  
  for (const video of allVideos) {
    const category = video.category || "متنوع";
    const existing = result.get(category) || [];
    existing.push(video);
    result.set(category, existing);
  }
  
  return result;
}

/**
 * Get simple video info (for dashboard, etc.)
 */
export interface SimpleVideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  publishedAt: string;
  playlistId?: string;
  playlistName?: string;
  category?: string;
}

export async function loadSimpleVideoInfo(): Promise<SimpleVideoInfo[]> {
  const allVideos = await loadAllVideos();
  
  return allVideos.map(v => ({
    id: v.id,
    title: v.title,
    thumbnail: v.thumbnails?.medium?.url || v.thumbnails?.default?.url || "",
    duration: v.duration || "",
    publishedAt: v.publishedAt,
    playlistId: v.playlistId,
    playlistName: v.playlistName,
    category: v.category,
  }));
}

// Re-export useful items from lessons
export { playlists, categories, channelInfo, type Playlist, type PlaylistCategory } from "./lessons";

// For backwards compatibility, export VideoWithContext as TransformedVideo
export type TransformedVideo = VideoWithContext;
