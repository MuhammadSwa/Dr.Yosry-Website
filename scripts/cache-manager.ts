#!/usr/bin/env node
/**
 * ===============================================
 * YOUTUBE CACHE MANAGEMENT CLI
 * ===============================================
 * Usage:
 *   pnpm cache:status     - Show cache statistics
 *   pnpm cache:clear      - Clear all cached data
 *   pnpm cache:warmup     - Sequentially fetch all playlists (recommended before build)
 *   pnpm cache:refresh    - Force refresh all playlists (ignores cache)
 *   pnpm cache:complete   - Mark all playlists as complete
 *   pnpm cache:validate   - Check if cache is valid and complete
 * ===============================================
 */

import { 
  getCacheStats, 
  clearCache, 
  markPlaylistComplete,
  loadPlaylistWithCache,
  loadChannelWithCache,
  validateCache,
  isCacheReady,
} from "../src/lib/youtube-cache.ts";
import { playlists, channelInfo } from "../src/lib/lessons.ts";

// ===============================================
// CONFIGURATION & HELPERS
// ===============================================

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  
  if (!key) {
    log("\n❌ YOUTUBE_API_KEY environment variable is required", "red");
    log("\nTo set the API key, run:", "yellow");
    log("  export YOUTUBE_API_KEY='your_api_key_here'", "cyan");
    log("\nOr create a .env file with:", "yellow");
    log("  YOUTUBE_API_KEY=your_api_key_here\n", "cyan");
    process.exit(1);
  }
  
  // Basic validation - API keys are typically 39 characters
  if (key.length < 30) {
    log("\n⚠️  Warning: YOUTUBE_API_KEY seems too short. Make sure it's valid.\n", "yellow");
  }
  
  return key;
}

// ===============================================
// CACHE WARMUP
// ===============================================

// ===============================================
// CACHE WARMUP
// ===============================================

async function warmupCache(forceRefresh: boolean = false) {
  const apiKey = getApiKey();
  
  log("\n🔄 Warming up YouTube cache...\n", "cyan");
  log(`📊 Total playlists to process: ${playlists.length}`, "blue");
  log(`⏱️  Estimated time: ${Math.ceil(playlists.length * 3 / 60)} - ${Math.ceil(playlists.length * 5 / 60)} minutes\n`, "yellow");
  
  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;
  let totalVideos = 0;
  
  // Refresh channel first
  log("📺 Fetching channel videos...", "blue");
  try {
    const channelVideos = await loadChannelWithCache(apiKey, channelInfo.id, { 
      forceRefresh,
      maxResults: 100,
    });
    totalVideos += channelVideos.length;
    log(`   ✓ Channel: ${channelVideos.length} videos`, "green");
  } catch (error) {
    log(`   ✗ Channel failed: ${error}`, "red");
    errorCount++;
  }
  
  // Add delay between channel and playlists
  await new Promise(r => setTimeout(r, 1000));
  
  // Process playlists sequentially with delays
  for (let i = 0; i < playlists.length; i++) {
    const playlist = playlists[i];
    const progress = `[${i + 1}/${playlists.length}]`;
    
    log(`\n${progress} ${playlist.name}`, "blue");
    log(`   Category: ${playlist.category} | ID: ${playlist.id}`, "cyan");
    
    try {
      const videos = await loadPlaylistWithCache(apiKey, playlist.id, playlist.name, {
        forceRefresh,
        isComplete: playlist.isComplete,
        maxResults: 1000, // Fetch all videos
      });
      
      totalVideos += videos.length;
      successCount++;
      log(`   ✓ Loaded ${videos.length} videos`, "green");
    } catch (error) {
      errorCount++;
      log(`   ✗ Error: ${error}`, "red");
    }
    
    // Add delay between playlists to avoid rate limiting (2 seconds)
    if (i < playlists.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  log("\n" + "═".repeat(50), "cyan");
  log("📊 Cache Warmup Complete!", "bright");
  log("═".repeat(50), "cyan");
  log(`✓ Successful: ${successCount}/${playlists.length} playlists`, "green");
  if (errorCount > 0) {
    log(`✗ Failed: ${errorCount} playlists`, "red");
  }
  log(`📹 Total videos: ${totalVideos}`, "blue");
  log(`⏱️  Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`, "yellow");
  log("═".repeat(50) + "\n", "cyan");
  
  if (errorCount > 0) {
    log("⚠️  Some playlists failed. You may want to run 'pnpm cache:warmup' again.", "yellow");
  } else {
    log("✅ Cache is ready! You can now run 'pnpm build'", "green");
  }
}

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case "status": {
      const stats = getCacheStats();
      const isReady = isCacheReady();
      
      log("\n📊 YouTube Cache Statistics:", "cyan");
      log("━".repeat(50), "cyan");
      log(`Status: ${isReady ? "✓ Ready" : "✗ Not Ready"}`, isReady ? "green" : "red");
      log(`Total Playlists Cached: ${stats.totalPlaylists} / ${playlists.length}`, "reset");
      log(`Complete Playlists: ${stats.completePlaylists}`, "reset");
      log(`Total Videos: ${stats.totalVideos}`, "reset");
      log(`Last Updated: ${new Date(stats.lastUpdated).toLocaleString()}`, "reset");
      log("━".repeat(50), "cyan");
      
      // Show missing playlists
      const cachedIds = new Set(Object.keys(stats.playlists));
      const missingPlaylists = playlists.filter(p => !cachedIds.has(p.id));
      
      if (missingPlaylists.length > 0) {
        log(`\n⚠️  Missing playlists (${missingPlaylists.length}):`, "yellow");
        for (const p of missingPlaylists.slice(0, 10)) {
          log(`   - ${p.name}`, "yellow");
        }
        if (missingPlaylists.length > 10) {
          log(`   ... and ${missingPlaylists.length - 10} more`, "yellow");
        }
        log(`\nRun 'pnpm cache:warmup' to fetch missing playlists.\n`, "cyan");
      }
      break;
    }
    
    case "clear": {
      log("\n🗑️  Clearing YouTube cache...", "yellow");
      clearCache();
      log("✅ Cache cleared successfully!\n", "green");
      break;
    }
    
    case "warmup": {
      await warmupCache(false);
      break;
    }
    
    case "refresh": {
      await warmupCache(true);
      break;
    }
    
    case "complete": {
      log("\n✓ Marking all playlists as complete...", "cyan");
      
      for (const playlist of playlists) {
        markPlaylistComplete(playlist.id, true);
      }
      
      log("✅ All playlists marked as complete!\n", "green");
      break;
    }
    
    case "validate": {
      log("\n🔍 Validating cache...", "cyan");
      
      const validation = validateCache();
      const stats = getCacheStats();
      
      if (validation.isValid) {
        log("✅ Cache is valid!", "green");
        log(`   Total videos: ${stats.totalVideos}`, "blue");
      } else {
        log("❌ Cache validation failed:", "red");
        for (const error of validation.errors) {
          log(`   - ${error}`, "red");
        }
        log(`\nRun 'pnpm cache:warmup' to fix missing data.\n`, "yellow");
      }
      break;
    }
    
    default: {
      log(`
📦 YouTube Cache Management

Usage:
  pnpm cache:status    Show cache statistics
  pnpm cache:clear     Clear all cached data
  pnpm cache:warmup    Sequentially fetch all playlists (recommended before build)
  pnpm cache:refresh   Force refresh all playlists (ignores cache)
  pnpm cache:complete  Mark all playlists as complete (won't be refetched)
  pnpm cache:validate  Check if cache is valid and complete

Environment:
  YOUTUBE_API_KEY      Your YouTube Data API key (required for warmup/refresh)

Workflow:
  1. Set YOUTUBE_API_KEY in .env file
  2. Run 'pnpm cache:warmup' to populate cache
  3. Run 'pnpm build' to build the site (uses cache only)
  4. Optionally run 'pnpm cache:complete' to mark playlists as complete
      `, "reset");
    }
  }
}

main().catch(console.error);
