import { createSignal, Show, For } from "solid-js";
import { exportAllDataAsync, importAllDataAsync, clearAllDataAsync, type ExportData } from "../../lib/studyStore";

// Support both v1.0 and v2.0 backup formats
interface BackupData {
  version: string;
  exportDate?: string;
  exportedAt?: string;
  // v2.0 format
  notes?: any[];
  bookmarks?: any[];
  videoProgress?: any[];
  favorites?: any[];
  watchLater?: any[];
  sessions?: any[];
  streak?: any;
  settings?: any;
  // v1.0 format
  videoStudyData?: Record<string, any>;
  recentlyWatched?: any[];
}

export default function DataBackup() {
  const [isOpen, setIsOpen] = createSignal(false);
  const [importStatus, setImportStatus] = createSignal<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = createSignal("");
  const [previewData, setPreviewData] = createSignal<BackupData | null>(null);
  const [isExporting, setIsExporting] = createSignal(false);
  const [isImporting, setIsImporting] = createSignal(false);

  // Export data as JSON file
  const exportData = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllDataAsync();
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
    } catch (err) {
      console.error("Export error:", err);
      setStatusMessage("حدث خطأ أثناء تصدير البيانات.");
      setImportStatus("error");
    } finally {
      setIsExporting(false);
    }
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
        
        // Validate structure - support both v1.0 and v2.0 formats
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
  const importData = async (merge: boolean = false) => {
    const data = previewData();
    if (!data || typeof window === "undefined") return;

    setIsImporting(true);
    try {
      // Convert to ExportData format if needed
      const exportData: ExportData = {
        version: data.version || "2.0",
        exportedAt: data.exportedAt || data.exportDate || new Date().toISOString(),
        notes: data.notes || [],
        bookmarks: data.bookmarks || [],
        videoProgress: data.videoProgress || [],
        favorites: data.favorites || [],
        watchLater: data.watchLater || [],
        sessions: data.sessions || [],
        streak: data.streak || null,
        settings: data.settings && !Array.isArray(data.settings) ? data.settings : null,
      };
      
      await importAllDataAsync(exportData, merge);
      
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
    } finally {
      setIsImporting(false);
    }
  };

  // Clear all study data
  const clearAllData = async () => {
    if (!confirm("هل أنت متأكد من حذف جميع بيانات الدراسة؟ لا يمكن التراجع عن هذا الإجراء!")) {
      return;
    }

    if (typeof window === "undefined") return;

    try {
      await clearAllDataAsync();
      setStatusMessage("تم حذف جميع البيانات. أعد تحميل الصفحة.");
      setImportStatus("success");
    } catch (err) {
      console.error("Clear error:", err);
      setStatusMessage("حدث خطأ أثناء حذف البيانات.");
      setImportStatus("error");
    }
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
              disabled={isExporting()}
              class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isExporting() ? "⏳ جاري التصدير..." : "📤 تصدير النسخة الاحتياطية"}
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
                  <p>📅 تاريخ التصدير: {formatDate(previewData()!.exportDate || previewData()!.exportedAt || "")}</p>
                  <p>📝 الملاحظات: {previewData()!.notes?.length || Object.keys((previewData() as any).videoStudyData || {}).length}</p>
                  <p>🔖 العلامات: {previewData()!.bookmarks?.length || 0}</p>
                  <p>❤️ المفضلات: {previewData()!.favorites?.length || 0}</p>
                  <p>⏰ للمشاهدة لاحقاً: {previewData()!.watchLater?.length || 0}</p>
                </div>
                <div class="flex gap-2">
                  <button
                    onClick={() => importData(false)}
                    disabled={isImporting()}
                    class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition-colors disabled:opacity-50"
                    title="سيحذف البيانات الحالية ويستبدلها بالنسخة الاحتياطية"
                  >
                    {isImporting() ? "⏳ جاري الاستيراد..." : "استبدال البيانات"}
                  </button>
                  <button
                    onClick={() => importData(true)}
                    disabled={isImporting()}
                    class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    title="سيدمج البيانات الجديدة مع الحالية"
                  >
                    {isImporting() ? "⏳ جاري الدمج..." : "دمج مع البيانات الحالية"}
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
