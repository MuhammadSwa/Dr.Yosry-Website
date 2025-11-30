import { For } from "solid-js";
import { newsData } from "../data";

export default function News() {
    return (
        <section id="news" class="py-20 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-12">
                    <div class="flex items-center justify-center gap-2 mb-4">
                        <span class="h-1 w-8 bg-accent rounded-full"></span>
                        <span class="text-accent font-bold tracking-wider uppercase text-sm">آخر الأخبار</span>
                        <span class="h-1 w-8 bg-accent rounded-full"></span>
                    </div>
                    <h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl font-amiri mb-4">
                        الأخبار والإعلانات
                    </h2>
                    <p class="text-xl text-gray-500 max-w-2xl mx-auto">
                        تابع آخر الأخبار والفعاليات والإصدارات الجديدة
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <For each={newsData}>
                        {(news) => (
                            <article class="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100">
                                <div class="relative h-48 overflow-hidden">
                                    <img
                                        src={news.image}
                                        alt={news.title}
                                        class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div class="absolute top-4 right-4">
                                        <span class="bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                                            {news.category}
                                        </span>
                                    </div>
                                </div>

                                <div class="p-6">
                                    <time class="text-sm text-gray-500 flex items-center gap-2 mb-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {news.date}
                                    </time>

                                    <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors font-amiri leading-tight">
                                        {news.title}
                                    </h3>

                                    <p class="text-gray-600 mb-4 leading-relaxed line-clamp-3">
                                        {news.excerpt}
                                    </p>

                                    <a
                                        href="#"
                                        class="inline-flex items-center text-primary font-bold hover:text-primary-dark group/link"
                                    >
                                        اقرأ المزيد
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 transform group-hover/link:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </a>
                                </div>
                            </article>
                        )}
                    </For>
                </div>

                <div class="mt-12 text-center">
                    <a
                        href="#"
                        class="inline-flex items-center justify-center px-8 py-3 border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold rounded-full transition-all shadow-sm hover:shadow-lg"
                    >
                        عرض جميع الأخبار
                    </a>
                </div>
            </div>
        </section>
    );
}
