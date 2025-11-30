import { createSignal, onMount, onCleanup, For } from "solid-js";
import { testimonialsData } from "../data";

export default function Testimonials() {
    const [currentIndex, setCurrentIndex] = createSignal(0);
    let intervalId: number;

    const nextTestimonial = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonialsData.length);
    };

    const prevTestimonial = () => {
        setCurrentIndex((prev) => (prev - 1 + testimonialsData.length) % testimonialsData.length);
    };

    const goToTestimonial = (index: number) => {
        setCurrentIndex(index);
    };

    onMount(() => {
        // Auto-advance every 5 seconds
        intervalId = setInterval(nextTestimonial, 5000) as unknown as number;
    });

    onCleanup(() => {
        if (intervalId) clearInterval(intervalId);
    });

    return (
        <section class="py-20 bg-gradient-to-br from-primary-dark via-primary to-primary-dark text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div class="absolute inset-0 opacity-5">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="testimonial-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                            <circle cx="30" cy="30" r="2" fill="white" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#testimonial-pattern)" />
                </svg>
            </div>

            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div class="text-center mb-12">
                    <h2 class="text-3xl font-extrabold sm:text-4xl font-amiri mb-4">
                        آراء طلاب العلم
                    </h2>
                    <p class="text-xl text-emerald-100 max-w-2xl mx-auto">
                        ماذا يقول متابعونا عن دروس ومؤلفات فضيلة الدكتور
                    </p>
                </div>

                {/* Testimonial Carousel */}
                <div class="max-w-4xl mx-auto">
                    <div class="relative bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
                        {/* Quote Icon */}
                        <div class="absolute top-6 right-6 text-white/20">
                            <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 32 32">
                                <path d="M10 8c-3.314 0-6 2.686-6 6s2.686 6 6 6c1.657 0 3.157-.672 4.243-1.757C13.533 19.953 12.343 22 10 22v2c4.418 0 8-4.477 8-10S14.418 4 10 4v4zm12 0c-3.314 0-6 2.686-6 6s2.686 6 6 6c1.657 0 3.157-.672 4.243-1.757C25.533 19.953 24.343 22 22 22v2c4.418 0 8-4.477 8-10S26.418 4 22 4v4z" />
                            </svg>
                        </div>

                        {/* Testimonial Content */}
                        <div class="text-center">
                            <div class="mb-6">
                                <img
                                    src={testimonialsData[currentIndex()].avatar}
                                    alt={testimonialsData[currentIndex()].name}
                                    class="w-20 h-20 rounded-full mx-auto border-4 border-white/30 shadow-xl"
                                />
                            </div>

                            <p class="text-xl md:text-2xl text-white leading-relaxed mb-8 font-amiri italic">
                                "{testimonialsData[currentIndex()].content}"
                            </p>

                            <div class="mb-4">
                                <h4 class="text-xl font-bold text-white">{testimonialsData[currentIndex()].name}</h4>
                                <p class="text-emerald-200">{testimonialsData[currentIndex()].role}</p>
                            </div>

                            {/* Stars */}
                            <div class="flex justify-center gap-1 mb-8">
                                <For each={Array(testimonialsData[currentIndex()].rating).fill(0)}>
                                    {() => (
                                        <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    )}
                                </For>
                            </div>
                        </div>

                        {/* Navigation Arrows */}
                        <button
                            onClick={prevTestimonial}
                            class="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
                            aria-label="Previous testimonial"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <button
                            onClick={nextTestimonial}
                            class="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
                            aria-label="Next testimonial"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>

                    {/* Dots Navigation */}
                    <div class="flex justify-center gap-2 mt-8">
                        <For each={testimonialsData}>
                            {(_, index) => (
                                <button
                                    onClick={() => goToTestimonial(index())}
                                    class={`w-3 h-3 rounded-full transition-all ${currentIndex() === index()
                                            ? "bg-white w-8"
                                            : "bg-white/40 hover:bg-white/60"
                                        }`}
                                    aria-label={`Go to testimonial ${index() + 1}`}
                                />
                            )}
                        </For>
                    </div>
                </div>
            </div>
        </section>
    );
}
