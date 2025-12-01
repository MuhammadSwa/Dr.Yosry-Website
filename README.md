# Dr. Yosry Website

موقع فضيلة الدكتور يسري جبر - أستاذ الفقه والتصوف

A modern Astro-based website for Dr. Yosry Gabr featuring Islamic educational content, video lessons from YouTube playlists, and interactive study tools.

---

## 📋 Table of Contents

- [Overview](#overview)
- [YouTube Caching System](#-youtube-caching-system)
  - [Architecture](#architecture)
  - [How It Works](#how-it-works)
  - [Cache Files Structure](#cache-files-structure)
  - [API Rate Limiting Strategy](#api-rate-limiting-strategy)
- [Workflow](#-workflow)
- [Commands Reference](#-commands-reference)
- [Configuration](#-configuration)
  - [Adding New Playlists](#adding-new-playlists)
  - [Marking Playlists as Complete](#marking-playlists-as-complete)
  - [Cache TTL Settings](#cache-ttl-settings)
- [Troubleshooting](#-troubleshooting)
- [Project Structure](#-project-structure)
- [Technical Details](#-technical-details)

---

## Overview

This website serves as a comprehensive platform for Dr. Yosry Gabr's Islamic educational content. It automatically fetches and displays video lessons from multiple YouTube playlists, organized by category (تصوف، فقه، حديث، تفسير، etc.).

**Key Features:**
- 🎬 Automatic YouTube playlist synchronization with smart caching
- 📚 50+ playlists with 2000+ video lessons
- 🏷️ Categorized content (Tasawwuf, Fiqh, Hadith, Tafsir, etc.)
- 📱 Responsive design with RTL Arabic support
- ⚡ Fast builds using local cache (no API calls during build)

---

## 🎬 YouTube Caching System

### Architecture

The caching system consists of four main components:

```
┌─────────────────────────────────────────────────────────────────┐
│                     YouTube Caching System                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  cache-manager   │    │  youtube-cache   │                   │
│  │  (CLI Scripts)   │───▶│  (Core Logic)    │                   │
│  └──────────────────┘    └────────┬─────────┘                   │
│                                   │                              │
│                                   ▼                              │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │ cached-youtube-  │    │  .youtube-cache/ │                   │
│  │ loader (Astro)   │◀───│  (JSON Files)    │                   │
│  └──────────────────┘    └──────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

| Component | File | Purpose |
|-----------|------|---------|
| **youtube-cache.ts** | `src/lib/youtube-cache.ts` | Core caching logic, API fetching, file I/O |
| **cached-youtube-loader.ts** | `src/lib/cached-youtube-loader.ts` | Astro content loader integration |
| **cache-manager.ts** | `scripts/cache-manager.ts` | CLI tool for cache management |
| **lessons.ts** | `src/lib/lessons.ts` | Playlist configuration and metadata |

### How It Works

#### 1. Cache Warmup Phase (Before Build)

```
pnpm cache:warmup
      │
      ▼
┌─────────────────────────────────────┐
│  For each playlist (sequentially):  │
│  1. Check if cache exists           │
│  2. Check if cache is stale (>24h)  │
│  3. Check if playlist is "complete" │
│  4. Fetch from YouTube API if needed│
│  5. Save to .youtube-cache/         │
│  6. Wait 2 seconds (rate limiting)  │
└─────────────────────────────────────┘
```

**Key behaviors:**
- Playlists are processed **sequentially** to avoid rate limits
- Each playlist waits 2 seconds before processing the next
- Already-cached playlists are skipped (unless stale)
- "Complete" playlists are never refetched

#### 2. Build Phase (No API Calls)

```
pnpm build
      │
      ▼
┌─────────────────────────────────────┐
│  Astro Content Loader:              │
│  1. Enable cache-only mode          │
│  2. Read from .youtube-cache/       │
│  3. Never call YouTube API          │
│  4. Return empty array if no cache  │
└─────────────────────────────────────┘
```

**Why cache-only during build?**
- Astro loads all collections **in parallel**
- Parallel API calls would hit rate limits immediately
- Build reproducibility (same cache = same output)
- Faster builds (no network latency)

### Cache Files Structure

```
.youtube-cache/
├── metadata.json                              # Cache state and timestamps
├── channel.json                               # Channel videos cache
├── playlist_PLEkQk5xrP-tly7ti7Qb_lS7xjUg_fwlNP.json   # Playlist cache
├── playlist_PLEkQk5xrP-tmsEDdkkXMM1ca2-AquQYad.json   # Another playlist
└── ...
```

#### metadata.json Structure

```json
{}
  "lastUpdated": "2025-12-01T13:44:08.103Z",
  "playlists": {}
    "PLEkQk5xrP-tly7ti7Qb_lS7xjUg_fwlNP": {}
      "lastFetched": "2025-12-01T13:41:59.141Z",
      "isComplete": true,
      "videoCount": 7
    },
    "PLEkQk5xrP-tmsEDdkkXMM1ca2-AquQYad": {}
      "lastFetched": "2025-12-01T13:42:02.009Z",
      "isComplete": false,
      "videoCount": 12
    }
  },
  "channel": {}
    "lastFetched": "2025-12-01T13:41:56.789Z",
    "videoCount": 5
  }
}
```

#### Playlist Cache Structure

```json
{}
  "id": "PLEkQk5xrP-tly7ti7Qb_lS7xjUg_fwlNP",
  "name": "شرح كتاب الدولة المكية بالمادة الغيبية",
  "lastFetched": "2025-12-01T13:41:59.141Z",
  "isComplete": true,
  "videoCount": 7,
  "videos": []
    {}
      "id": "abc123",
      "title": "Video Title",
      "description": "...",
      "url": "https://www.youtube.com/watch?v=abc123",
      "publishedAt": "2024-01-15T10:30:00Z",
      "duration": "PT45M30S",
      "channelId": "UCHUZYEvS7utmviL1C3EYrwA",
      "channelTitle": "فضيلة الدكتور يسري جبر",
      "thumbnails": {}
        "default": { "url": "...", "width": 120, "height": 90 }, }
        "medium": { "url": "...", "width": 320, "height": 180 }, }
        "high": { "url": "...", "width": 480, "height": 360 } }
      },
      "viewCount": "1234",
      "likeCount": "56"
    }
  ]
}
```

### API Rate Limiting Strategy

YouTube Data API v3 has strict quotas:
- **10,000 units/day** default quota
- **playlistItems.list**: 1 unit per request (50 items max)
- **videos.list**: 1 unit per request (50 videos max)

**Our mitigation strategies:**

| Strategy | Implementation |
|----------|----------------|
| **Sequential Processing** | Warmup processes playlists one at a time |
| **Request Delays** | 500ms between API calls, 2s between playlists |
| **Pagination Handling** | Fetches all pages for large playlists (500+ videos) |
| **Cache TTL** | 24-hour cache prevents unnecessary refetches |
| **Complete Flag** | Finished playlists never refetch |
| **Retry with Backoff** | Exponential backoff on failures (1s, 2s, 4s) |
| **429 Handling** | Respects Retry-After header on rate limits |

---

## 🚀 Workflow

### Initial Setup

```bash
# 1. Clone and install
git clone <repo>
cd dryosrywebsite
pnpm install

# 2. Set up environment
echo 'YOUTUBE_API_KEY=your_api_key_here' > .env

# 3. Warm up cache (first time takes ~10-15 minutes)
export YOUTUBE_API_KEY="your_key" && pnpm cache:warmup

# 4. Build the site
pnpm build

# 5. Preview
pnpm preview
```

### Daily Development

```bash
# Start dev server (uses existing cache)
pnpm dev

# Check cache status
pnpm cache:status

# If playlists have new videos, refresh cache
export YOUTUBE_API_KEY="your_key" && pnpm cache:warmup
```

### Deployment

```bash
# 1. Ensure cache is up to date
pnpm cache:status

# 2. Warm up if needed
export YOUTUBE_API_KEY="your_key" && pnpm cache:warmup

# 3. Build
pnpm build

# 4. Deploy dist/ folder
```

**CI/CD Note:** The `.youtube-cache/` directory should be:
- **Option A:** Committed to repo (for reproducible builds)
- **Option B:** Cached between CI runs (faster, uses storage)
- **Option C:** Regenerated each deploy (uses API quota)

---

## 📦 Commands Reference

### Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server at localhost:4321 |
| `pnpm build` | Build production site to `./dist/` |
| `pnpm preview` | Preview production build locally |

### Cache Management Commands

| Command | Description | API Calls? |
|---------|-------------|------------|
| `pnpm cache:status` | Show cache statistics and missing playlists | No |
| `pnpm cache:warmup` | Fetch missing/stale playlists | Yes |
| `pnpm cache:refresh` | Force refetch ALL playlists | Yes |
| `pnpm cache:validate` | Check cache integrity | No |
| `pnpm cache:complete` | Mark all playlists as complete | No |
| `pnpm cache:clear` | Delete all cache files | No |

### Command Details

#### `pnpm cache:status`
Shows current cache state:
```
📊 YouTube Cache Statistics:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: ✓ Ready
Total Playlists Cached: 50 / 50
Complete Playlists: 15
Total Videos: 2347
Last Updated: 12/1/2025, 3:44:08 PM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### `pnpm cache:warmup`
Fetches playlists that are:
- Not yet cached
- Cached but stale (>24 hours old)
- Not marked as "complete"

```
🔄 Warming up YouTube cache...

📊 Total playlists to process: 50
⏱️  Estimated time: 3 - 5 minutes

📺 Fetching channel videos...
   ✓ Channel: 5 videos

[1/50] شرح كتاب الدولة المكية بالمادة الغيبية
   Category: تصوف | ID: PLEkQk5xrP-tly7ti7Qb_lS7xjUg_fwlNP
   ✓ Loaded 7 videos

[2/50] شرح كتاب مدارج الحقيقة في الرابطة عند أهل الطريقة
   Category: تصوف | ID: PLEkQk5xrP-tmsEDdkkXMM1ca2-AquQYad
[youtube-cache] Using cached data (12 videos)  ← Skipped, already cached
   ✓ Loaded 12 videos
...
```

---

## ⚙️ Configuration

### Adding New Playlists

Edit `src/lib/lessons.ts`:

```typescript
export const playlists: Playlist[] = []
  // Existing playlists...
  
  // Add new playlist:
  {}
    id: "PLEkQk5xrP-xxxxxxxxxxxxxx",  // From YouTube URL
    name: "اسم السلسلة",                // Arabic name
    category: "تصوف",                   // Category (see below)
    description: "وصف اختياري",         // Optional description
    isComplete: false,                  // Set true if no new videos expected
  },
];
```

**Available Categories:**
```typescript
type PlaylistCategory = 
  | "تصوف"    // Tasawwuf (Sufism)
  | "فقه"     // Fiqh (Jurisprudence)
  | "تفسير"   // Tafsir (Quran Exegesis)
  | "حديث"    // Hadith
  | "عقيدة"   // Aqeedah (Creed)
  | "سيرة"    // Seerah (Prophet's Biography)
  | "متنوع"   // Miscellaneous
  | "ردود"    // Responses/Refutations
  | "صلوات"   // Salawat (Prayers upon Prophet)
  | "خطب";    // Khutbah (Sermons)
```

**After adding:**
```bash
export YOUTUBE_API_KEY="your_key" && pnpm cache:warmup
pnpm build
```

### Marking Playlists as Complete

For playlists that won't receive new videos (finished series):

**Option 1:** In `lessons.ts`:
```typescript
{}
  id: "PLEkQk5xrP-tly7ti7Qb_lS7xjUg_fwlNP",
  name: "شرح كتاب الدولة المكية بالمادة الغيبية",
  category: "تصوف",
  isComplete: true,  // ← Add this
},
```

**Option 2:** Via CLI:
```bash
pnpm cache:complete  # Marks ALL playlists as complete
```

**Benefits of marking complete:**
- Never refetched (saves API quota)
- Faster warmup times
- Stable video ordering

### Cache TTL Settings

In `src/lib/youtube-cache.ts`:

```typescript
// How long before non-complete playlists are considered stale
const CACHE_TTL_HOURS = 24;

// Delay between API calls (rate limiting)
const FETCH_DELAY_MS = 500;

// Maximum retry attempts
const MAX_RETRIES = 3;
```

---

## 🔧 Troubleshooting

### "Cache not ready" during build

**Problem:** Build shows warnings about missing cache.

**Solution:**
```bash
export YOUTUBE_API_KEY="your_key" && pnpm cache:warmup
pnpm build
```

### API Rate Limit Errors (429)

**Problem:** `YouTube API error: 429 Too Many Requests`

**Solutions:**
1. Wait and retry (the system has automatic backoff)
2. Check your API quota in Google Cloud Console
3. Use `pnpm cache:complete` to reduce future API calls
4. Request quota increase from Google

### Missing Videos in Playlist

**Problem:** Some videos not appearing on the site.

**Possible causes:**
1. **Private/Unlisted videos:** Can't be fetched via API
2. **Recently added:** Run `pnpm cache:warmup` to refresh
3. **Cache is stale:** Run `pnpm cache:refresh` to force refresh

### Metadata Corruption

**Problem:** Cache status shows fewer playlists than expected.

**Solution:**
```bash
pnpm cache:clear
export YOUTUBE_API_KEY="your_key" && pnpm cache:warmup
```

### Build Fails with Empty Collections

**Problem:** `The collection "playlist_xxxx" does not exist or is empty`

**This is a warning, not an error.** It means the playlist hasn't been cached yet. Run warmup to fix.

---

## 🗂️ Project Structure

```
/
├── .youtube-cache/                    # YouTube data cache (gitignored)
│   ├── metadata.json                  # Cache state and timestamps
│   ├── channel.json                   # Channel videos
│   └── playlist_*.json                # Individual playlist caches
│
├── public/                            # Static assets
│   └── fonts/                         # Arabic fonts (Amiri, Cairo)
│
├── scripts/
│   └── cache-manager.ts               # CLI for cache management
│
├── src/
│   ├── assets/                        # Images, book covers
│   │
│   ├── components/
│   │   ├── lessons/                   # Video lesson components
│   │   │   ├── LessonsApp.tsx         # Main lessons browser
│   │   │   ├── YouTubePlayer.tsx      # Video player
│   │   │   └── ...
│   │   └── ...                        # Other components
│   │
│   ├── content/
│   │   └── config.ts                  # Astro content collections config
│   │
│   ├── layouts/
│   │   └── Layout.astro               # Main layout
│   │
│   ├── lib/
│   │   ├── cached-youtube-loader.ts   # Astro content loader
│   │   ├── lessons.ts                 # Playlist configuration
│   │   ├── youtube-cache.ts           # Core caching logic
│   │   ├── videoLoader.ts             # Video loading utilities
│   │   └── ...
│   │
│   ├── pages/
│   │   ├── index.astro                # Homepage
│   │   ├── lessons.astro              # All lessons page
│   │   ├── lessons/[videoId].astro    # Individual video pages
│   │   └── ...
│   │
│   └── styles/
│       └── global.css                 # Global styles + Tailwind
│
├── .env                               # Environment variables (gitignored)
├── astro.config.mjs                   # Astro configuration
├── package.json                       # Dependencies and scripts
└── tsconfig.json                      # TypeScript configuration
```

---

## 🔬 Technical Details

### Retry Logic with Backoff

```typescript
async function fetchWithRetry(url: string): Promise<Response> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url);
      if (response.status === 429) {
        // Rate limited - wait and retry
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 2 ** attempt * 1000;
        await delay(waitTime);
        continue;
      }
      return response;
    } catch (error) {
      await delay(2 ** attempt * 1000);  // Exponential backoff
    }
  }
  throw new Error('Failed after all retries');
}
```

### Build-Time Cache-Only Mode

```typescript
// In cached-youtube-loader.ts
const isBuildMode = process.env.NODE_ENV === 'production' 
  || process.argv.some(arg => arg.includes('build'))
  || !process.env.YOUTUBE_API_KEY; // Also use cache-only if no API key

// During build, never make API calls
const cacheOnly = options.cacheOnly ?? isBuildMode;
```

---

## 📄 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `YOUTUBE_API_KEY` | Yes (for warmup) | YouTube Data API v3 key |

**Getting an API Key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "YouTube Data API v3"
4. Create credentials (API Key)
5. (Optional) Restrict key to YouTube API only

---

## 📝 License

MIT License - See LICENSE file for details.
