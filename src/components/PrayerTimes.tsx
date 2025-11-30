import { createSignal, onMount } from "solid-js";

interface PrayerTimes {
    Fajr: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
}

export default function PrayerTimes() {
    const [times, setTimes] = createSignal<PrayerTimes | null>(null);
    const [loading, setLoading] = createSignal(true);
    const [hijriDate, setHijriDate] = createSignal("");

    onMount(async () => {
        try {
            // Fetch prayer times for Cairo, Egypt
            const response = await fetch(
                "https://api.aladhan.com/v1/timingsByCity?city=Cairo&country=Egypt&method=5"
            );
            const data = await response.json();

            if (data.code === 200) {
                setTimes(data.data.timings);
                setHijriDate(`${data.data.date.hijri.day} ${data.data.date.hijri.month.ar} ${data.data.date.hijri.year}`);
            }
            setLoading(false);
        } catch (error) {
            console.error("Error fetching prayer times:", error);
            setLoading(false);
        }
    });

    const prayerNames = [
        { key: "Fajr", name: "الفجر" },
        { key: "Dhuhr", name: "الظهر" },
        { key: "Asr", name: "العصر" },
        { key: "Maghrib", name: "المغرب" },
        { key: "Isha", name: "العشاء" },
    ];

    return (
        <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div class="text-center mb-4">
                <h3 class="text-xl font-bold text-gray-900 mb-1 font-amiri">مواقيت الصلاة</h3>
                <p class="text-sm text-gray-500">القاهرة، مصر</p>
                {hijriDate() && (
                    <p class="text-xs text-primary font-bold mt-1">{hijriDate()} هـ</p>
                )}
            </div>

            {loading() ? (
                <div class="text-center py-8">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : times() ? (
                <div class="space-y-2">
                    {prayerNames.map((prayer) => (
                        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <span class="font-bold text-gray-900">{prayer.name}</span>
                            <span class="text-primary font-mono font-bold" dir="ltr">
                                {times()![prayer.key as keyof PrayerTimes]}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div class="text-center text-gray-500 py-4">
                    لا يمكن تحميل البيانات حالياً
                </div>
            )}
        </div>
    );
}
