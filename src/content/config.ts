// src/content/config.ts
import { defineCollection } from "astro:content";
import { cachedPlaylistLoader, cachedChannelLoader } from "../lib/cached-youtube-loader";
import { playlists, channelInfo, getCollectionName } from "../lib/lessons";

/**
 * ===============================================
 * AUTO-GENERATED CONTENT COLLECTIONS
 * ===============================================
 * Collections are automatically created based on the playlists
 * defined in src/lib/lessons.ts
 * 
 * Uses a custom caching system to:
 * - Avoid hitting YouTube API rate limits
 * - Cache data locally in .youtube-cache/
 * - Support marking playlists as "complete" (no refetch needed)
 * 
 * IMPORTANT: Run `pnpm cache:warmup` before building!
 * During build, the loader uses cache-only mode and won't make API calls.
 * 
 * DO NOT manually add playlist collections here!
 * Just add them to the playlists array in lessons.ts
 * ===============================================
 */

const API_KEY = import.meta.env.YOUTUBE_API_KEY;

// Load videos from the main channel
const channelVideos = defineCollection({
  loader: cachedChannelLoader({
    apiKey: API_KEY,
    channelId: channelInfo.id,
    maxResults: 100, // Recent channel videos
  }),
});

// Dynamically create playlist collections from the playlists config
const playlistCollections: Record<string, ReturnType<typeof defineCollection>> = {};

playlists.forEach((playlist) => {
  const collectionName = getCollectionName(playlist.id);
  playlistCollections[collectionName] = defineCollection({
    loader: cachedPlaylistLoader({
      apiKey: API_KEY,
      playlistId: playlist.id,
      playlistName: playlist.name,
      maxResults: 1000, // Support large playlists (up to 1000 videos)
      isComplete: playlist.isComplete || false,
    }),
  });
});

// Export all collections
export const collections = { 
  channelVideos,
  ...playlistCollections,
};
