import { For } from "solid-js";
import { booksData } from "../data";

export default function Books() {
    return (
        <section id="books" class="py-20 bg-primary-dark text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div class="absolute inset-0 opacity-10">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="islamic-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M0 20 L20 0 L40 20 L20 40 Z" fill="none" stroke="currentColor" stroke-width="1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
                </svg>
            </div>

            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div class="flex flex-col md:flex-row justify-between items-end mb-12">
                    <div>
                        <h2 class="text-3xl font-extrabold sm:text-4xl font-amiri mb-4 text-white">
                            المؤلفات والكتب
                        </h2>
                        <p class="text-emerald-100 max-w-2xl text-lg">
                            مجموعة قيمة من المؤلفات العلمية والدعوية
                        </p>
                    </div>
                    <a href="#" class="hidden md:inline-flex items-center text-white border border-white/30 px-6 py-2 rounded-full hover:bg-white hover:text-primary-dark transition-all">
                        تصفح المكتبة
                    </a>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
                    <For each={booksData}>
                        {(book) => (
                            <div class="group relative">
                                <div class="aspect-[2/3] w-full overflow-hidden rounded-lg bg-gray-200 shadow-2xl transform transition-transform duration-300 group-hover:-translate-y-2">
                                    <img
                                        src={book.image}
                                        alt={book.title}
                                        class="h-full w-full object-cover object-center group-hover:opacity-75"
                                    />
                                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                                        <button class="bg-white text-primary-dark px-4 py-2 rounded-full text-sm font-bold shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                            تحميل الكتاب
                                        </button>
                                    </div>
                                </div>
                                <h3 class="mt-4 text-lg font-bold text-white text-center font-amiri">{book.title}</h3>
                            </div>
                        )}
                    </For>
                </div>

                <div class="mt-8 text-center md:hidden">
                    <a href="#" class="inline-flex items-center text-white border border-white/30 px-6 py-2 rounded-full hover:bg-white hover:text-primary-dark transition-all">
                        تصفح المكتبة
                    </a>
                </div>
            </div>
        </section>
    );
}
