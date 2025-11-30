import { For } from "solid-js";
import { youtubeData } from "../data";

export default function YouTube() {
    return (
        <section id="youtube" class="py-20 bg-gradient-to-br from-red-50 via-white to-red-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div class="text-center mb-12">
                    <div class="inline-flex items-center gap-3 bg-red-100 px-6 py-2 rounded-full mb-4">
                        <svg class="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                        <span class="text-red-600 font-bold">قناة اليوتيوب الرسمية</span>
                    </div>
                    <h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl font-amiri mb-4">
                        تابعونا على يوتيوب
                    </h2>
                    <p class="text-xl text-gray-500 max-w-2xl mx-auto">
                        آلاف الدروس والمحاضرات القيمة في التفسير والحديث والفقه
                    </p>
                </div>

                {/* Subscribe CTA */}
                <div class="text-center mb-16">
                    <a
                        href={youtubeData.channelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full text-lg font-bold shadow-xl shadow-red-600/30 transform hover:scale-105 transition-all"
                    >
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                        اشترك في القناة
                    </a>
                </div>

                {/* Video Grid */}
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <For each={youtubeData.videos}>
                        {(video) => (
                            <div class="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                                <div class="relative aspect-video bg-gray-900">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${video.id}`}
                                        title={video.title}
                                        class="absolute inset-0 w-full h-full"
                                        frameborder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowfullscreen
                                    />
                                </div>
                                <div class="p-4">
                                    <h3 class="font-bold text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors font-amiri">
                                        {video.title}
                                    </h3>
                                </div>
                            </div>
                        )}
                    </For>
                </div>

                {/* View More */}
                <div class="mt-12 text-center">
                    <a
                        href={youtubeData.channelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-2 text-red-600 font-bold hover:text-red-700 text-lg group"
                    >
                        شاهد المزيد على القناة
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </a>
                </div>
            </div>
        </section>
    );
}
