import { createSignal, Show, For } from "solid-js";

interface BackupData {
  version: string;
  exportDate: string;
  videoStudyData: Record<string, any>;
  favorites: string[];
  watchLater: string[];
  recentlyWatched: Array<{ videoId: string; title: string; lastWatched: string; thumbnail?: string }>;
  settings: Record<string, any>;
}

export default function DataBackup() {
  const [isOpen, setIsOpen] = createSignal(false);
  const [importStatus, setImportStatus] = createSignal<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = createSignal("");
  const [previewData, setPreviewData] = createSignal<BackupData | null>(null);

  // Gather all study data from localStorage
  const gatherAllData = (): BackupData => {
    const isBrowser = typeof window !== "undefined";
    if (!isBrowser) {
      return {
        version: "1.0",
        exportDate: new Date().toISOString(),
        videoStudyData: {},
        favorites: [],
        watchLater: [],
        recentlyWatched: [],
        settings: {},
      };
    }

    // Collect all video_study_ data
    const videoStudyData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("video_study_")) {
        try {
          videoStudyData[key] = JSON.parse(localStorage.getItem(key) || "{}");
        } catch (e) {
          console.error("Error parsing", key, e);
        }
      }
    }

    // Get other study-related data
    let favorites: string[] = [];
    let watchLater: string[] = [];
    let recentlyWatched: any[] = [];
    let settings: Record<string, any> = {};

    try {
      favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    } catch (e) {}
    try {
      watchLater = JSON.parse(localStorage.getItem("watch_later") || "[]");
    } catch (e) {}
    try {
      recentlyWatched = JSON.parse(localStorage.getItem("recently_watched") || "[]");
    } catch (e) {}
    try {
      settings = JSON.parse(localStorage.getItem("study_settings") || "{}");
    } catch (e) {}

    return {
      version: "1.0",
      exportDate: new Date().toISOString(),
      videoStudyData,
      favorites,
      watchLater,
      recentlyWatched,
      settings,
    };
  };

  // Export data as JSON file
  const exportData = () => {
    const data = gatherAllData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `study-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setStatusMessage("تم تصدير البيانات بنجاح!");
    setImportStatus("success");
    setTimeout(() => setImportStatus("idle"), 3000);
  };

  // Handle file selection for import
  const handleFileSelect = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as BackupData;
        
        // Validate structure
        if (!data.version || !data.exportDate) {
          throw new Error("Invalid backup file format");
        }
        
        setPreviewData(data);
        setImportStatus("idle");
        setStatusMessage("");
      } catch (err) {
        setStatusMessage("ملف غير صالح. تأكد من اختيار ملف النسخة الاحتياطية الصحيح.");
        setImportStatus("error");
        setPreviewData(null);
      }
    };
    reader.readAsText(file);
  };

  // Import data from backup
  const importData = (merge: boolean = false) => {
    const data = previewData();
    if (!data || typeof window === "undefined") return;

    try {
      // If not merging, clear existing data first
      if (!merge) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith("video_study_") || 
              key === "favorites" || 
              key === "watch_later" || 
              key === "recently_watched" ||
              key === "study_settings") {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }

      // Import video study data
      Object.entries(data.videoStudyData).forEach(([key, value]) => {
        if (merge) {
          // Merge with existing data
          const existing = localStorage.getItem(key);
          if (existing) {
            try {
              const existingData = JSON.parse(existing);
              // Merge notes (avoid duplicates by id)
              const existingNotes = existingData.notes || [];
              const newNotes = value.notes || [];
              const mergedNotes = [...existingNotes];
              newNotes.forEach((note: any) => {
                if (!mergedNotes.find((n: any) => n.id === note.id)) {
                  mergedNotes.push(note);
                }
              });
              
              // Similar for bookmarks
              const existingBookmarks = existingData.bookmarks || [];
              const newBookmarks = value.bookmarks || [];
              const mergedBookmarks = [...existingBookmarks];
              newBookmarks.forEach((bookmark: any) => {
                if (!mergedBookmarks.find((b: any) => b.id === bookmark.id)) {
                  mergedBookmarks.push(bookmark);
                }
              });
              
              // Keep higher progress
              const mergedProgress = {
                ...existingData.progress,
                watchedPercentage: Math.max(existingData.progress?.watchedPercentage || 0, value.progress?.watchedPercentage || 0),
                completed: existingData.progress?.completed || value.progress?.completed,
              };
              
              localStorage.setItem(key, JSON.stringify({
                notes: mergedNotes,
                bookmarks: mergedBookmarks,
                progress: mergedProgress,
              }));
            } catch (e) {
              localStorage.setItem(key, JSON.stringify(value));
            }
          } else {
            localStorage.setItem(key, JSON.stringify(value));
          }
        } else {
          localStorage.setItem(key, JSON.stringify(value));
        }
      });

      // Import favorites
      if (merge) {
        const existing = JSON.parse(localStorage.getItem("favorites") || "[]");
        const merged = [...new Set([...existing, ...data.favorites])];
        localStorage.setItem("favorites", JSON.stringify(merged));
      } else {
        localStorage.setItem("favorites", JSON.stringify(data.favorites));
      }

      // Import watch later
      if (merge) {
        const existing = JSON.parse(localStorage.getItem("watch_later") || "[]");
        const merged = [...new Set([...existing, ...data.watchLater])];
        localStorage.setItem("watch_later", JSON.stringify(merged));
      } else {
        localStorage.setItem("watch_later", JSON.stringify(data.watchLater));
      }

      // Import recently watched
      if (merge) {
        const existing = JSON.parse(localStorage.getItem("recently_watched") || "[]");
        const merged = [...existing];
        data.recentlyWatched.forEach(item => {
          if (!merged.find((m: any) => m.videoId === item.videoId)) {
            merged.push(item);
          }
        });
        // Keep only last 50
        localStorage.setItem("recently_watched", JSON.stringify(merged.slice(-50)));
      } else {
        localStorage.setItem("recently_watched", JSON.stringify(data.recentlyWatched));
      }

      // Import settings (always merge for settings)
      const existingSettings = JSON.parse(localStorage.getItem("study_settings") || "{}");
      localStorage.setItem("study_settings", JSON.stringify({ ...existingSettings, ...data.settings }));

      setStatusMessage("تم استيراد البيانات بنجاح! أعد تحميل الصفحة لرؤية التغييرات.");
      setImportStatus("success");
      setPreviewData(null);
      
      // Reset file input
      const fileInput = document.getElementById("backup-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
    } catch (err) {
      console.error("Import error:", err);
      setStatusMessage("حدث خطأ أثناء استيراد البيانات.");
      setImportStatus("error");
    }
  };

  // Clear all study data
  const clearAllData = () => {
    if (!confirm("هل أنت متأكد من حذف جميع بيانات الدراسة؟ لا يمكن التراجع عن هذا الإجراء!")) {
      return;
    }

    if (typeof window === "undefined") return;

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("video_study_") || 
          key?.startsWith("video_position_") ||
          key === "favorites" || 
          key === "watch_later" || 
          key === "recently_watched" ||
          key === "study_settings") {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    setStatusMessage("تم حذف جميع البيانات. أعد تحميل الصفحة.");
    setImportStatus("success");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div class="bg-emerald-900/50 rounded-2xl border border-emerald-700/50 p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-amber-400 flex items-center gap-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
          إدارة البيانات
        </h2>
        <button
          onClick={() => setIsOpen(!isOpen())}
          class="p-2 text-emerald-400 hover:text-amber-400 transition-colors"
        >
          <svg class={`w-5 h-5 transition-transform ${isOpen() ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <Show when={isOpen()}>
        <div class="space-y-6">
          {/* Status Message */}
          <Show when={importStatus() !== "idle"}>
            <div class={`p-4 rounded-xl ${importStatus() === "success" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
              {statusMessage()}
            </div>
          </Show>

          {/* Export Section */}
          <div class="bg-emerald-800/30 rounded-xl p-4">
            <h3 class="font-bold text-emerald-200 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              تصدير البيانات
            </h3>
            <p class="text-emerald-400 text-sm mb-4">
              قم بتصدير جميع بيانات الدراسة (الملاحظات، العلامات، التقدم، المفضلات) كملف JSON.
            </p>
            <button
              onClick={exportData}
              class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-lg font-medium transition-colors"
            >
              📤 تصدير النسخة الاحتياطية
            </button>
          </div>

          {/* Import Section */}
          <div class="bg-emerald-800/30 rounded-xl p-4">
            <h3 class="font-bold text-emerald-200 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              استيراد البيانات
            </h3>
            <p class="text-emerald-400 text-sm mb-4">
              استعد بياناتك من نسخة احتياطية سابقة.
            </p>
            
            <input
              type="file"
              id="backup-file-input"
              accept=".json"
              onChange={handleFileSelect}
              class="hidden"
            />
            <label
              for="backup-file-input"
              class="inline-block px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-emerald-50 rounded-lg font-medium cursor-pointer transition-colors"
            >
              📁 اختيار ملف
            </label>

            {/* Preview Import Data */}
            <Show when={previewData()}>
              <div class="mt-4 p-4 bg-emerald-900/50 rounded-lg border border-emerald-600">
                <h4 class="font-bold text-emerald-200 mb-2">معاينة النسخة الاحتياطية</h4>
                <div class="space-y-1 text-sm text-emerald-400 mb-4">
                  <p>📅 تاريخ التصدير: {formatDate(previewData()!.exportDate)}</p>
                  <p>📝 الفيديوهات: {Object.keys(previewData()!.videoStudyData).length}</p>
                  <p>❤️ المفضلات: {previewData()!.favorites.length}</p>
                  <p>⏰ للمشاهدة لاحقاً: {previewData()!.watchLater.length}</p>
                </div>
                <div class="flex gap-2">
                  <button
                    onClick={() => importData(false)}
                    class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition-colors"
                    title="سيحذف البيانات الحالية ويستبدلها بالنسخة الاحتياطية"
                  >
                    استبدال البيانات
                  </button>
                  <button
                    onClick={() => importData(true)}
                    class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-lg text-sm font-medium transition-colors"
                    title="سيدمج البيانات الجديدة مع الحالية"
                  >
                    دمج مع البيانات الحالية
                  </button>
                  <button
                    onClick={() => setPreviewData(null)}
                    class="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-emerald-50 rounded-lg text-sm transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </Show>
          </div>

          {/* Danger Zone */}
          <div class="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
            <h3 class="font-bold text-red-400 mb-3 flex items-center gap-2">
              ⚠️ منطقة الخطر
            </h3>
            <p class="text-red-300/70 text-sm mb-4">
              احذف جميع بيانات الدراسة من هذا الجهاز. هذا الإجراء لا يمكن التراجع عنه!
            </p>
            <button
              onClick={clearAllData}
              class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-colors"
            >
              🗑️ حذف جميع البيانات
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}
