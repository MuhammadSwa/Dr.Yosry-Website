import { createSignal } from "solid-js";

export default function Newsletter() {
    const [email, setEmail] = createSignal("");
    const [isSubmitting, setIsSubmitting] = createSignal(false);
    const [isSuccess, setIsSuccess] = createSignal(false);

    const handleSubmit = (e: Event) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate submission
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
            setEmail("");

            setTimeout(() => setIsSuccess(false), 3000);
        }, 1000);
    };

    return (
        <div class="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 shadow-xl">
            <div class="text-center mb-6">
                <h3 class="text-2xl font-bold text-white mb-2 font-amiri">اشترك في النشرة البريدية</h3>
                <p class="text-emerald-100">احصل على آخر الدروس والأخبار في بريدك مباشرة</p>
            </div>

            <form onSubmit={handleSubmit} class="flex flex-col sm:flex-row gap-3">
                <input
                    type="email"
                    required
                    value={email()}
                    onInput={(e) => setEmail(e.currentTarget.value)}
                    placeholder="أدخل بريدك الإلكتروني"
                    class="flex-1 px-4 py-3 rounded-lg bg-white/90 backdrop-blur-sm border-2 border-transparent focus:border-white focus:outline-none transition-all"
                    disabled={isSubmitting()}
                />
                <button
                    type="submit"
                    disabled={isSubmitting()}
                    class="px-6 py-3 bg-accent hover:bg-gold text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 whitespace-nowrap"
                >
                    {isSubmitting() ? "جاري الاشتراك..." : "اشترك الآن"}
                </button>
            </form>

            {isSuccess() && (
                <div class="mt-4 p-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white text-center">
                    تم الاشتراك بنجاح! شكراً لك.
                </div>
            )}
        </div>
    );
}
