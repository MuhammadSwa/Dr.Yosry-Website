// src/content/config.ts
import { defineCollection } from "astro:content";
import { youTubeLoader } from "@ascorbic/youtube-loader";
import { playlists, channelInfo, getCollectionName } from "../lib/lessons";

/**
 * ===============================================
 * AUTO-GENERATED CONTENT COLLECTIONS
 * ===============================================
 * Collections are automatically created based on the playlists
 * defined in src/lib/lessons.ts
 * 
 * DO NOT manually add playlist collections here!
 * Just add them to the playlists array in lessons.ts
 * ===============================================
 */

// Load videos from the main channel
const channelVideos = defineCollection({
  loader: youTubeLoader({
    type: "channel",
    apiKey: import.meta.env.YOUTUBE_API_KEY,
    channelId: channelInfo.id,
    maxResults: 50,
    order: "date",
    fetchFullDetails: true,
  }),
});

// Dynamically create playlist collections from the playlists config
const playlistCollections: Record<string, ReturnType<typeof defineCollection>> = {};

playlists.forEach((playlist) => {
  const collectionName = getCollectionName(playlist.id);
  playlistCollections[collectionName] = defineCollection({
    loader: youTubeLoader({
      type: "playlist",
      apiKey: import.meta.env.YOUTUBE_API_KEY,
      playlistId: playlist.id,
      maxResults: 50,
      fetchFullDetails: true,
    }),
  });
});

// Export all collections
export const collections = { 
  channelVideos,
  ...playlistCollections,
};
