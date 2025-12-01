/**
 * ===============================================
 * VIDEO LOADER UTILITIES
 * ===============================================
 * Helper functions to load videos from all playlists dynamically.
 * This module provides a clean API for pages to get all videos
 * without manually importing each playlist collection.
 * ===============================================
 */

import { getCollection, type CollectionEntry } from "astro:content";
import { playlists, channelInfo, getCollectionName, type Playlist, type PlaylistCategory } from "./lessons";

// Type for a video entry from any collection
export type VideoEntry = CollectionEntry<"channelVideos">;

// Transformed video type for client components
export interface TransformedVideo {
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
  playlistId?: string;
  playlistName?: string;
  category?: PlaylistCategory;
}

export interface PlaylistWithVideos extends Playlist {
  videos: TransformedVideo[];
}

/**
 * Transform a raw video entry to the client-friendly format
 */
export function transformVideo(entry: any, playlistInfo?: { id: string; name: string; category: PlaylistCategory }): TransformedVideo {
  return {
    id: entry.data.id,
    title: entry.data.title,
    description: entry.data.description || "",
    url: entry.data.url,
    publishedAt: entry.data.publishedAt instanceof Date 
      ? entry.data.publishedAt.toISOString() 
      : entry.data.publishedAt,
    duration: entry.data.duration,
    channelId: entry.data.channelId,
    channelTitle: entry.data.channelTitle,
    thumbnails: entry.data.thumbnails,
    tags: entry.data.tags,
    categoryId: entry.data.categoryId,
    viewCount: entry.data.viewCount,
    likeCount: entry.data.likeCount,
    commentCount: entry.data.commentCount,
    playlistId: playlistInfo?.id,
    playlistName: playlistInfo?.name,
    category: playlistInfo?.category,
  };
}

/**
 * Load channel videos
 */
export async function loadChannelVideos(): Promise<TransformedVideo[]> {
  const videos = await getCollection("channelVideos");
  return videos.map(v => transformVideo(v, { id: "channel", name: "القناة", category: "متنوع" }));
}

/**
 * Load videos from a specific playlist by its ID
 */
export async function loadPlaylistVideos(playlistId: string): Promise<TransformedVideo[]> {
  const playlist = playlists.find(p => p.id === playlistId);
  if (!playlist) {
    console.warn(`Playlist ${playlistId} not found in configuration`);
    return [];
  }
  
  const collectionName = getCollectionName(playlistId);
  
  try {
    // Dynamic import using the collection name
    const videos = await getCollection(collectionName as any);
    return videos.map(v => transformVideo(v, {
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
export async function loadAllPlaylistVideos(): Promise<Map<string, TransformedVideo[]>> {
  const result = new Map<string, TransformedVideo[]>();
  
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
export async function loadAllVideos(): Promise<TransformedVideo[]> {
  const [channelVideos, playlistVideosMap] = await Promise.all([
    loadChannelVideos(),
    loadAllPlaylistVideos(),
  ]);
  
  // Collect all videos
  const allVideos: TransformedVideo[] = [...channelVideos];
  
  for (const [, videos] of playlistVideosMap) {
    allVideos.push(...videos);
  }
  
  // Deduplicate by video ID, preferring ones with playlist info
  const videosMap = new Map<string, TransformedVideo>();
  
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
export async function loadVideosByCategory(): Promise<Map<PlaylistCategory, TransformedVideo[]>> {
  const allVideos = await loadAllVideos();
  const result = new Map<PlaylistCategory, TransformedVideo[]>();
  
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
    thumbnail: v.thumbnails.medium?.url || v.thumbnails.default?.url || "",
    duration: v.duration || "",
    publishedAt: v.publishedAt,
    playlistId: v.playlistId,
    playlistName: v.playlistName,
    category: v.category,
  }));
}

// Re-export useful items from lessons
export { playlists, categories, channelInfo, type Playlist, type PlaylistCategory } from "./lessons";
