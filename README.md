# Dr. Yosry Website

موقع فضيلة الدكتور يسري جبر - أستاذ الفقه والتصوف

## 🎬 YouTube Caching System

This site uses a custom YouTube data caching system to:
- Avoid hitting YouTube API rate limits during builds
- Cache video data locally for faster builds
- Support large playlists (500+ videos)

### Workflow

1. **Set up your API key** in `.env`:
   ```
   YOUTUBE_API_KEY=your_api_key_here
   ```

2. **Warm up the cache** before building:
   ```sh
   pnpm cache:warmup
   ```
   This fetches all playlist data sequentially with rate limiting.

3. **Build the site**:
   ```sh
   pnpm build
   ```
   During build, only cached data is used (no API calls).

### Cache Commands

| Command | Description |
|---------|-------------|
| `pnpm cache:status` | Show cache statistics and missing playlists |
| `pnpm cache:warmup` | Fetch all playlists (uses existing cache when valid) |
| `pnpm cache:refresh` | Force refresh all playlists (ignores cache) |
| `pnpm cache:validate` | Check if cache is valid and complete |
| `pnpm cache:complete` | Mark all playlists as "complete" (no refetch needed) |
| `pnpm cache:clear` | Delete all cached data |

### Adding New Playlists

1. Edit `src/lib/lessons.ts` and add your playlist to the `playlists` array
2. Run `pnpm cache:warmup` to fetch the new playlist
3. Run `pnpm build` to rebuild the site

### Cache Configuration

- **Cache TTL**: 24 hours (non-complete playlists are refetched after this time)
- **Complete playlists**: Never refetched (set `isComplete: true` in playlist config)
- **Cache location**: `.youtube-cache/` (gitignored)

## 🚀 Project Structure

```text
/
├── .youtube-cache/        # YouTube data cache (gitignored)
├── public/
├── scripts/
│   └── cache-manager.ts   # Cache management CLI
├── src/
│   ├── components/
│   ├── content/
│   │   └── config.ts      # Content collections config
│   ├── layouts/
│   ├── lib/
│   │   ├── cached-youtube-loader.ts  # Astro content loader
│   │   ├── lessons.ts     # Playlist configuration
│   │   ├── youtube-cache.ts          # Cache implementation
│   │   └── videoLoader.ts # Video loading utilities
│   └── pages/
└── package.json
```

## 🧞 Commands

| Command | Action |
|---------|--------|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Start dev server at `localhost:4321` |
| `pnpm build` | Build production site to `./dist/` |
| `pnpm preview` | Preview build locally |
| `pnpm cache:warmup` | Warm up YouTube cache |
| `pnpm cache:status` | Show cache status |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `YOUTUBE_API_KEY` | YouTube Data API v3 key (required for cache warmup) |
