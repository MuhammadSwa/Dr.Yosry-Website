import { createSignal, For, Show } from "solid-js";
import { audioData } from "../data";

export default function Audio() {
    const [selectedCategory, setSelectedCategory] = createSignal("الكل");
    const categories = ["الكل", "تفسير", "حديث", "فقه", "ذكر"];

    const filteredAudio = () => {
        if (selectedCategory() === "الكل") return audioData;
        return audioData.filter(item => item.category === selectedCategory());
    };

    return (
        <section id="audio" class="py-20 bg-gray-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-12">
                    <h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl font-amiri mb-4">
                        المكتبة الصوتية
                    </h2>
                    <p class="text-xl text-gray-500 max-w-2xl mx-auto">
                        استمع إلى دروس ومحاضرات فضيلة الدكتور في أي وقت ومن أي مكان
                    </p>
                </div>

                {/* Category Filter */}
                <div class="flex justify-center mb-8 flex-wrap gap-2">
                    <For each={categories}>
                        {(category) => (
                            <button
                                onClick={() => setSelectedCategory(category)}
                                class={`px-6 py-2 rounded-full font-medium transition-all ${selectedCategory() === category
                                        ? "bg-primary text-white shadow-lg"
                                        : "bg-white text-gray-700 hover:bg-gray-100"
                                    }`}
                            >
                                {category}
                            </button>
                        )}
                    </For>
                </div>

                {/* Audio List */}
                <div class="space-y-4">
                    <For each={filteredAudio()}>
                        {(audio) => (
                            <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
                                <div class="flex items-center justify-between flex-wrap gap-4">
                                    <div class="flex items-center gap-4 flex-1 min-w-0">
                                        {/* Play Button */}
                                        <button class="flex-shrink-0 w-14 h-14 rounded-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                                            </svg>
                                        </button>

                                        {/* Audio Info */}
                                        <div class="flex-1 min-w-0">
                                            <h3 class="text-lg font-bold text-gray-900 mb-1 font-amiri truncate">
                                                {audio.title}
                                            </h3>
                                            <div class="flex items-center gap-4 text-sm text-gray-500">
                                                <span class="inline-flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {audio.duration}
                                                </span>
                                                <span class="inline-flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                    </svg>
                                                    {audio.category}
                                                </span>
                                                <span>{audio.date}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Download Button */}
                                    <a
                                        href={audio.audioUrl}
                                        download
                                        class="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        تحميل
                                    </a>
                                </div>

                                {/* Progress Bar (Placeholder) */}
                                <div class="mt-4">
                                    <div class="w-full bg-gray-200 rounded-full h-1">
                                        <div class="bg-primary h-1 rounded-full" style="width: 0%"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </For>
                </div>

                {/* Empty State */}
                <Show when={filteredAudio().length === 0}>
                    <div class="text-center py-12">
                        <p class="text-gray-500 text-lg">لا توجد دروس في هذا التصنيف حالياً</p>
                    </div>
                </Show>
            </div>
        </section>
    );
}
