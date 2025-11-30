export default function LiveStream() {
    const isLive = false; // Toggle this based on actual live status

    return (
        <section id="live" class="py-20 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white relative overflow-hidden">
            {/* Animated Background */}
            <div class="absolute inset-0 opacity-20">
                <div class="absolute top-0 left-0 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
                <div class="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div class="text-center mb-12">
                    {/* Live Indicator */}
                    {isLive && (
                        <div class="inline-flex items-center gap-2 bg-red-600 px-4 py-2 rounded-full mb-4 animate-pulse">
                            <span class="relative flex h-3 w-3">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                            </span>
                            <span class="font-bold text-sm">مباشر الآن</span>
                        </div>
                    )}

                    <h2 class="text-3xl font-extrabold sm:text-4xl font-amiri mb-4">
                        البث المباشر
                    </h2>
                    <p class="text-xl text-purple-100 max-w-2xl mx-auto">
                        تابع الدروس والمحاضرات مباشرة مع فضيلة الدكتور
                    </p>
                </div>

                {/* Live Stream Player */}
                <div class="max-w-4xl mx-auto mb-12">
                    <div class="bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video">
                        {isLive ? (
                            <iframe
                                src="https://www.youtube.com/embed/live_stream?channel=UCxxxxx"
                                title="Live Stream"
                                class="w-full h-full"
                                frameborder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen
                            />
                        ) : (
                            <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-purple-700">
                                <div class="text-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto mb-4 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <h3 class="text-2xl font-bold mb-2 font-amiri">لا يوجد بث مباشر حالياً</h3>
                                    <p class="text-purple-200">سيتم الإعلان عن موعد البث القادم قريباً</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Upcoming Schedule */}
                <div class="max-w-4xl mx-auto">
                    <h3 class="text-2xl font-bold mb-6 text-center font-amiri">الجدول القادم</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                            <div class="flex items-start gap-4">
                                <div class="bg-purple-500 rounded-lg p-3 text-center min-w-[60px]">
                                    <div class="text-2xl font-bold">15</div>
                                    <div class="text-xs">ديسمبر</div>
                                </div>
                                <div class="flex-1">
                                    <h4 class="font-bold text-lg mb-1 font-amiri">درس التفسير الأسبوعي</h4>
                                    <p class="text-purple-200 text-sm mb-2">سورة البقرة - الآيات 100-120</p>
                                    <div class="flex items-center gap-2 text-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        السبت 8:00 مساءً
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                            <div class="flex items-start gap-4">
                                <div class="bg-purple-500 rounded-lg p-3 text-center min-w-[60px]">
                                    <div class="text-2xl font-bold">18</div>
                                    <div class="text-xs">ديسمبر</div>
                                </div>
                                <div class="flex-1">
                                    <h4 class="font-bold text-lg mb-1 font-amiri">مجلس الذكر</h4>
                                    <p class="text-purple-200 text-sm mb-2">أذكار المساء والصلاة الإبراهيمية</p>
                                    <div class="flex items-center gap-2 text-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        الثلاثاء 6:00 مساءً
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notification Signup */}
                <div class="mt-12 text-center">
                    <p class="text-purple-100 mb-4">احصل على إشعار عند بدء البث المباشر</p>
                    <div class="max-w-md mx-auto flex gap-2">
                        <input
                            type="email"
                            placeholder="البريد الإلكتروني"
                            class="flex-1 px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                        <button class="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors whitespace-nowrap">
                            اشترك
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
