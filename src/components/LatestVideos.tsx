import { createResource, For, Show } from "solid-js";

// 1. Channel Configuration
const CHANNEL_ID = "UCHUZYEvS7utmviL1C3EYrwA"; // Dr. Yosry Gabr's Channel ID
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
// We use rss2json to bypass CORS restrictions on the client side
const API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`;

interface VideoItem {
  title: string;
  link: string;
  pubDate: string;
  guid: string;
  thumbnail: string;
}

// 2. Fetcher Function
const fetchVideos = async (): Promise<VideoItem[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Failed to fetch videos");
  const data = await response.json();

  // Clean up data
  return data.items.map((item: any) => {
    // Extract high-quality thumbnail from video ID logic
    // The default RSS thumbnail is sometimes low res, so we reconstruct the URL
    const videoId = item.guid.split(":")[2];
    return {
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      guid: item.guid,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    };
  });
};

export default function LatestVideos() {
  const [videos] = createResource(fetchVideos);

  // Helper to format date to Arabic
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <section class="py-20 bg-gradient-to-l from-emerald-900 via-emerald-800 to-emerald-950 relative overflow-hidden text-right" dir="rtl">

      {/* Background Pattern */}
      <div class="absolute inset-0 opacity-5 pointer-events-none">
        <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="videoPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M50 0 L100 50 L50 100 L0 50 Z" fill="none" stroke="currentColor" stroke-width="0.5" class="text-amber-300" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#videoPattern)" />
        </svg>
      </div>

      <div class="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div class="text-center mb-12">
          <div class="inline-flex items-center gap-3 justify-center mb-4">
            <div class="h-px w-12 bg-gradient-to-l from-amber-500/50 to-transparent"></div>
            <h2 class="text-3xl font-bold font-amiri text-amber-200">أحدث المرئيات</h2>
            <div class="h-px w-12 bg-gradient-to-r from-amber-500/50 to-transparent"></div>
          </div>
          <p class="text-emerald-100/70 font-amiri text-lg">
            مقتطفات ودروس حديثة من القناة الرسمية
          </p>
        </div>

        {/* Loading State */}
        <Show when={!videos.loading} fallback={
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <For each={[1, 2, 3]}>{() => (
              <div class="bg-white/5 rounded-2xl h-80 animate-pulse border border-white/10"></div>
            )}</For>
          </div>
        }>

          {/* Error State */}
          <Show when={!videos.error} fallback={
            <div class="text-center text-red-300 font-amiri bg-red-900/20 p-6 rounded-xl border border-red-500/20">
              عذراً، حدث خطأ أثناء تحميل الفيديوهات. يرجى المحاولة لاحقاً.
            </div>
          }>

            {/* Videos Grid */}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <For each={videos()?.slice(0, 6)}>{(video) => (
                <a
                  href={video.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group relative bg-white/5 backdrop-blur-md border border-emerald-500/20 rounded-2xl overflow-hidden hover:border-amber-400/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/40 flex flex-col"
                >
                  {/* Thumbnail Container */}
                  <div class="relative aspect-video overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                    {/* Overlay & Play Button */}
                    <div class="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
                    <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-50 group-hover:scale-100">
                      <div class="bg-red-600 text-white rounded-full p-3 shadow-lg">
                        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div class="p-5 flex-1 flex flex-col">
                    <div class="flex items-center gap-2 text-xs text-amber-400/80 mb-3 font-amiri">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span>{formatDate(video.pubDate)}</span>
                    </div>

                    <h3 class="text-white font-amiri text-lg font-bold leading-relaxed mb-4 line-clamp-2 group-hover:text-amber-200 transition-colors">
                      {video.title}
                    </h3>

                    <div class="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-sm">
                      <span class="text-emerald-200/60 group-hover:text-white transition-colors">مشاهدة الفيديو</span>
                      <svg class="w-5 h-5 text-amber-500 transform group-hover:-translate-x-2 transition-transform rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </a>
              )}</For>
            </div>

            <div class="mt-12 text-center">
              <a
                href="https://www.youtube.com/@dryosrygabr"
                target="_blank"
                class="inline-flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-all shadow-lg hover:shadow-red-900/30 font-amiri"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                اشترك في القناة
              </a>
            </div>

          </Show>
        </Show>

      </div>
    </section>
  );
}
