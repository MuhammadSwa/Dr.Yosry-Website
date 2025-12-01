/**
 * ===============================================
 * CACHED YOUTUBE LOADER FOR ASTRO
 * ===============================================
 * A custom Astro content loader that uses our caching system
 * to avoid hitting YouTube API rate limits during builds.
 * 
 * IMPORTANT: During build, this loader uses cache-only mode
 * to prevent API calls. Run `pnpm cache:warmup` before building!
 * ===============================================
 */

import type { Loader, LoaderContext } from "astro/loaders";
import { z } from "astro/zod";
import { 
  loadPlaylistWithCache, 
  loadChannelWithCache,
  isCacheReady,
  type YouTubeVideo 
} from "./youtube-cache";

// Check if we're in build mode (not dev)
const isBuildMode = process.env.NODE_ENV === 'production' || process.argv.includes('build');

// Schema for YouTube video data
export const youtubeVideoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  url: z.string(),
  publishedAt: z.coerce.date(),
  duration: z.string().optional(),
  channelId: z.string(),
  channelTitle: z.string(),
  thumbnails: z.object({
    default: z.object({
      url: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
    }).optional(),
    medium: z.object({
      url: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
    }).optional(),
    high: z.object({
      url: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
    }).optional(),
    standard: z.object({
      url: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
    }).optional(),
    maxres: z.object({
      url: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
    }).optional(),
  }),
  tags: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  viewCount: z.string().optional(),
  likeCount: z.string().optional(),
  commentCount: z.string().optional(),
});

export type YouTubeVideoData = z.infer<typeof youtubeVideoSchema>;

interface CachedPlaylistLoaderOptions {
  apiKey: string;
  playlistId: string;
  playlistName: string;
  maxResults?: number;
  isComplete?: boolean;
  /** Force cache-only mode (no API calls) - defaults to true during build */
  cacheOnly?: boolean;
}

interface CachedChannelLoaderOptions {
  apiKey: string;
  channelId: string;
  maxResults?: number;
  /** Force cache-only mode (no API calls) - defaults to true during build */
  cacheOnly?: boolean;
}

/**
 * Cached playlist loader
 */
export function cachedPlaylistLoader(options: CachedPlaylistLoaderOptions): Loader {
  return {
    name: "cached-youtube-playlist",
    schema: youtubeVideoSchema,
    async load(context: LoaderContext) {
      const { store, logger, parseData } = context;
      
      // Use cache-only mode during build to prevent API calls
      const cacheOnly = options.cacheOnly ?? isBuildMode;
      
      if (cacheOnly && !isCacheReady()) {
        logger.warn(`Cache not ready for playlist: ${options.playlistName}. Run 'pnpm cache:warmup' first!`);
      }
      
      logger.info(`Loading playlist: ${options.playlistName}${cacheOnly ? ' (cache-only)' : ''}`);
      
      try {
        const videos = await loadPlaylistWithCache(
          options.apiKey,
          options.playlistId,
          options.playlistName,
          {
            maxResults: options.maxResults || 1000, // Support large playlists
            isComplete: options.isComplete || false,
            cacheOnly,
          }
        );
        
        store.clear();
        
        for (const video of videos) {
          const data = await parseData({
            id: video.id,
            data: {
              ...video,
              publishedAt: new Date(video.publishedAt),
            },
          });
          
          store.set({
            id: video.id,
            data,
          });
        }
        
        logger.info(`Loaded ${videos.length} videos from ${options.playlistName}`);
      } catch (error) {
        logger.error(`Failed to load playlist ${options.playlistName}: ${error}`);
      }
    },
  };
}

/**
 * Cached channel loader
 */
export function cachedChannelLoader(options: CachedChannelLoaderOptions): Loader {
  return {
    name: "cached-youtube-channel",
    schema: youtubeVideoSchema,
    async load(context: LoaderContext) {
      const { store, logger, parseData } = context;
      
      // Use cache-only mode during build to prevent API calls
      const cacheOnly = options.cacheOnly ?? isBuildMode;
      
      if (cacheOnly && !isCacheReady()) {
        logger.warn(`Cache not ready for channel. Run 'pnpm cache:warmup' first!`);
      }
      
      logger.info(`Loading channel videos${cacheOnly ? ' (cache-only)' : ''}`);
      
      try {
        const videos = await loadChannelWithCache(
          options.apiKey,
          options.channelId,
          {
            maxResults: options.maxResults || 100, // Recent channel videos
            cacheOnly,
          }
        );
        
        store.clear();
        
        for (const video of videos) {
          const data = await parseData({
            id: video.id,
            data: {
              ...video,
              publishedAt: new Date(video.publishedAt),
            },
          });
          
          store.set({
            id: video.id,
            data,
          });
        }
        
        logger.info(`Loaded ${videos.length} channel videos`);
      } catch (error) {
        logger.error(`Failed to load channel videos: ${error}`);
      }
    },
  };
}
