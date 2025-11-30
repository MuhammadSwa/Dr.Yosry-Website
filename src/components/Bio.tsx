import { bioData } from "../data";

export default function Bio() {
    return (
        <section id="bio" class="py-16 bg-gray-50 overflow-hidden">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                    <div class="relative">
                        <div class="absolute -top-4 -right-4 w-72 h-72 bg-accent/10 rounded-full blur-3xl opacity-50"></div>
                        <div class="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white transform rotate-2 hover:rotate-0 transition-transform duration-500">
                            <img
                                src="https://placehold.co/600x600/064e3b/white?text=Bio+Image"
                                alt="Dr. Yosry Gabr"
                                class="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    <div class="mt-10 lg:mt-0">
                        <div class="flex items-center gap-2 mb-4">
                            <span class="h-1 w-12 bg-accent rounded-full"></span>
                            <span class="text-accent font-bold tracking-wider uppercase text-sm">عن فضيلة الشيخ</span>
                        </div>
                        <h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl font-amiri mb-6">
                            {bioData.title}
                        </h2>
                        <p class="text-lg text-gray-600 leading-loose mb-8 font-cairo">
                            {bioData.content}
                        </p>

                        <div class="grid grid-cols-2 gap-6">
                            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <div class="text-3xl font-bold text-primary mb-1 font-amiri">+40</div>
                                <div class="text-sm text-gray-500">عاماً في الدعوة</div>
                            </div>
                            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <div class="text-3xl font-bold text-primary mb-1 font-amiri">+100</div>
                                <div class="text-sm text-gray-500">مؤلف وكتاب</div>
                            </div>
                        </div>

                        <div class="mt-8">
                            <a href="#" class="text-primary font-bold hover:text-primary-dark inline-flex items-center gap-2 group">
                                اقرأ السيرة الكاملة
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
