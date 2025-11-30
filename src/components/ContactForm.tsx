import { createSignal } from "solid-js";
import { contactInfo } from "../data";

export default function ContactForm() {
  const [formData, setFormData] = createSignal({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [submitStatus, setSubmitStatus] = createSignal<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus("success");
      // Reset form
      setFormData({ name: "", email: "", subject: "", message: "" });

      // Reset status after 3 seconds
      setTimeout(() => setSubmitStatus("idle"), 5000);
    }, 1500);
  };

  return (
    <section id="contact" class="py-20 pt-32 bg-gradient-to-l from-emerald-900 via-emerald-800 to-emerald-950 relative overflow-hidden">

      {/* 1. Background Pattern */}
      <div class="absolute inset-0 opacity-10 pointer-events-none">
        <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="contactPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M50 0 L100 50 L50 100 L0 50 Z" fill="none" stroke="currentColor" stroke-width="0.5" class="text-amber-300" />
              <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" stroke-width="0.5" class="text-amber-300" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#contactPattern)" />
        </svg>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div class="text-center mb-12">
          <div class="inline-block relative">
            <h2 class="text-3xl font-extrabold sm:text-4xl font-amiri mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200">
              تواصل معنا
            </h2>
            <div class="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full"></div>
          </div>
          <p class="text-xl text-emerald-100/80 max-w-2xl mx-auto mt-4 font-amiri">
            نسعد بتواصلكم واستفساراتكم في أي وقت
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Sidebar: Contact Info */}
          <div class="lg:col-span-1 space-y-6">

            {/* Email Card */}
            <div class="bg-emerald-900/40 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-emerald-500/20 hover:border-amber-400/30 transition-all duration-300 group">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-12 h-12 bg-emerald-800/50 rounded-xl flex items-center justify-center border border-emerald-500/30 group-hover:bg-amber-500/10 group-hover:border-amber-500/30 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-emerald-200 group-hover:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-bold text-amber-100 mb-1 font-amiri text-lg">البريد الإلكتروني</h3>
                  <a href={`mailto:${contactInfo.email}`} class="text-emerald-200 hover:text-amber-300 transition-colors text-sm break-all">
                    {contactInfo.email}
                  </a>
                </div>
              </div>
            </div>

            {/* Location Card */}
            <a
              href="https://maps.app.goo.gl/vt25FWGCwVDbHwiB9"
              target="_blank"
              rel="noopener noreferrer"
              class="block bg-emerald-900/40 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-emerald-500/20 hover:border-amber-400/30 transition-all duration-300 group relative"
            >
              <div class="absolute top-4 left-4 text-emerald-500/50 group-hover:text-amber-400 transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>

              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-12 h-12 bg-emerald-800/50 rounded-xl flex items-center justify-center border border-emerald-500/30 group-hover:bg-amber-500/10 group-hover:border-amber-500/30 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-emerald-200 group-hover:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-bold text-amber-100 mb-1 font-amiri text-lg group-hover:text-amber-300 transition-colors">العنوان</h3>
                  <p class="text-emerald-200/90 text-sm font-amiri leading-relaxed">{contactInfo.address}</p>
                  <p class="text-xs text-amber-400/80 mt-3 font-medium flex items-center gap-1">
                    <span>عرض على الخريطة</span>
                    <span class="group-hover:-translate-x-1 transition-transform">&larr;</span>
                  </p>
                </div>
              </div>
            </a>
          </div>

          {/* Contact Form */}
          <div class="lg:col-span-2">
            <form onSubmit={handleSubmit} class="bg-emerald-900/40 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-emerald-500/20 relative">

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label for="name" class="block text-sm font-bold text-emerald-100 mb-2 font-amiri">الاسم الكامل *</label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData().name}
                    onInput={(e) => setFormData({ ...formData(), name: e.currentTarget.value })}
                    class="w-full px-4 py-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-white placeholder-emerald-500/50 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all outline-none"
                    placeholder="أدخل اسمك الكامل"
                  />
                </div>

                <div>
                  <label for="email" class="block text-sm font-bold text-emerald-100 mb-2 font-amiri">البريد الإلكتروني *</label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData().email}
                    onInput={(e) => setFormData({ ...formData(), email: e.currentTarget.value })}
                    class="w-full px-4 py-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-white placeholder-emerald-500/50 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all outline-none"
                    placeholder="example@email.com"
                  />
                </div>
              </div>

              <div class="mb-6">
                <label for="subject" class="block text-sm font-bold text-emerald-100 mb-2 font-amiri">الموضوع *</label>
                <input
                  type="text"
                  id="subject"
                  required
                  value={formData().subject}
                  onInput={(e) => setFormData({ ...formData(), subject: e.currentTarget.value })}
                  class="w-full px-4 py-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-white placeholder-emerald-500/50 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all outline-none"
                  placeholder="موضوع الرسالة"
                />
              </div>

              <div class="mb-8">
                <label for="message" class="block text-sm font-bold text-emerald-100 mb-2 font-amiri">الرسالة *</label>
                <textarea
                  id="message"
                  required
                  rows="6"
                  value={formData().message}
                  onInput={(e) => setFormData({ ...formData(), message: e.currentTarget.value })}
                  class="w-full px-4 py-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-white placeholder-emerald-500/50 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all resize-none outline-none"
                  placeholder="اكتب رسالتك هنا..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting()}
                class="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-amiri text-lg group"
              >
                {isSubmitting() ? (
                  <>
                    <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span class="font-amiri">جاري الإرسال...</span>
                  </>
                ) : (
                  <>
                    <span class="font-amiri">إرسال الرسالة</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </>
                )}
              </button>

              {/* Success Message */}
              {submitStatus() === "success" && (
                <div class="mt-6 p-4 bg-emerald-500/20 border border-emerald-500/50 text-emerald-100 rounded-xl flex items-center gap-3 backdrop-blur-sm animate-fadeIn">
                  <div class="bg-emerald-500 rounded-full p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <span class="font-amiri">تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
