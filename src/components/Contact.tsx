import { createSignal } from "solid-js";
import { contactInfo } from "../data";

export default function Contact() {
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
      setTimeout(() => setSubmitStatus("idle"), 3000);
    }, 1500);
  };

  return (
    <section id="contact" class="py-20 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl font-amiri mb-4">
            تواصل معنا
          </h2>
          <p class="text-xl text-gray-500 max-w-2xl mx-auto">
            نسعد بتواصلكم واستفساراتكم
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info Sidebar */}
          <div class="lg:col-span-1 space-y-6">
            <div class="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-bold text-gray-900 mb-1">البريد الإلكتروني</h3>
                  <a href={`mailto:${contactInfo.email}`} class="text-primary hover:text-primary-dark">
                    {contactInfo.email}
                  </a>
                </div>
              </div>
            </div>

            {/* <div class="bg-white rounded-2xl p-6 shadow-md border border-gray-100"> */}
            {/*   <div class="flex items-start gap-4"> */}
            {/*     <div class="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center"> */}
            {/*       <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"> */}
            {/*         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /> */}
            {/*       </svg> */}
            {/*     </div> */}
            {/*     <div> */}
            {/*       <h3 class="font-bold text-gray-900 mb-1">الهاتف</h3> */}
            {/*       <a href={`tel:${contactInfo.phone}`} class="text-primary hover:text-primary-dark" dir="ltr"> */}
            {/*         {contactInfo.phone} */}
            {/*       </a> */}
            {/*     </div> */}
            {/*   </div> */}
            {/* </div> */}

            <a
              href="https://maps.app.goo.gl/vt25FWGCwVDbHwiB9"
              target="_blank"
              rel="noopener noreferrer"
              class="group relative block bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg hover:border-primary/30 transition-all duration-300"
            >
              {/* External Link Indicator Icon (Top Left) */}
              <div class="absolute top-4 left-4 text-gray-300 group-hover:text-primary transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>

              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors">العنوان</h3>
                  <p class="text-gray-600">{contactInfo.address}</p>
                  <p class="text-xs text-primary mt-2 font-medium">عرض على الخريطة &larr;</p>
                </div>
              </div>
            </a>
          </div>

          {/* Contact Form */}
          <div class="lg:col-span-2">
            <form onSubmit={handleSubmit} class="bg-white rounded-2xl p-8 shadow-md border border-gray-100">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label for="name" class="block text-sm font-bold text-gray-700 mb-2">الاسم الكامل *</label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData().name}
                    onInput={(e) => setFormData({ ...formData(), name: e.currentTarget.value })}
                    class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="أدخل اسمك الكامل"
                  />
                </div>

                <div>
                  <label for="email" class="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني *</label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData().email}
                    onInput={(e) => setFormData({ ...formData(), email: e.currentTarget.value })}
                    class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="example@email.com"
                  />
                </div>
              </div>

              <div class="mb-6">
                <label for="subject" class="block text-sm font-bold text-gray-700 mb-2">الموضوع *</label>
                <input
                  type="text"
                  id="subject"
                  required
                  value={formData().subject}
                  onInput={(e) => setFormData({ ...formData(), subject: e.currentTarget.value })}
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="موضوع الرسالة"
                />
              </div>

              <div class="mb-6">
                <label for="message" class="block text-sm font-bold text-gray-700 mb-2">الرسالة *</label>
                <textarea
                  id="message"
                  required
                  rows="6"
                  value={formData().message}
                  onInput={(e) => setFormData({ ...formData(), message: e.currentTarget.value })}
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                  placeholder="اكتب رسالتك هنا..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting()}
                class="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting() ? (
                  <>
                    <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    إرسال الرسالة
                  </>
                )}
              </button>

              {/* Success Message */}
              {submitStatus() === "success" && (
                <div class="mt-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
