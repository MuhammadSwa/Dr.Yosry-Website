import { For } from "solid-js";
import { lessonsData } from "../data";

export default function Lessons() {
    return (
        <section id="lessons" class="py-20 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl font-amiri mb-4">
                        أحدث الدروس والمحاضرات
                    </h2>
                    <p class="text-xl text-gray-500 max-w-2xl mx-auto">
                        مكتبة مرئية وصوتية شاملة لدروس فضيلة الشيخ في تفسير القرآن الكريم والسنة النبوية
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <For each={lessonsData}>
                        {(lesson) => (
                            <div class="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
                                <div class="relative h-48 overflow-hidden">
                                    <div class="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10"></div>
                                    <img
                                        src={lesson.image}
                                        alt={lesson.title}
                                        class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div class="absolute bottom-4 right-4 z-20">
                                        <span class="bg-primary text-white text-xs px-3 py-1 rounded-full">فيديو</span>
                                    </div>
                                </div>
                                <div class="p-6">
                                    <div class="text-sm text-gray-500 mb-2 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {lesson.date}
                                    </div>
                                    <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors font-amiri">
                                        {lesson.title}
                                    </h3>
                                    <a href="#" class="inline-flex items-center text-primary font-medium hover:text-primary-dark">
                                        شاهد الدرس
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        )}
                    </For>
                </div>

                <div class="mt-12 text-center">
                    <a
                        href="#"
                        class="inline-flex items-center justify-center px-8 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        عرض جميع الدروس
                    </a>
                </div>
            </div>
        </section>
    );
}
