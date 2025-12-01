export type PlaylistCategory = "تصوف" | "فقه" | "تفسير" | "حديث" | "عقيدة" | "سيرة" | "متنوع" | "ردود" | "صلوات" | "خطب";

export interface Playlist {
  id: string;
  name: string;
  category: PlaylistCategory;
  description?: string;
  /** If true, the playlist won't be refetched (no new videos expected) */
  isComplete?: boolean;
}

/**
 * ===============================================
 * PLAYLIST CONFIGURATION
 * ===============================================
 * Add your playlists here. The app will automatically:
 * 1. Fetch videos from YouTube with caching
 * 2. Display them in the lessons page with proper categorization
 * 
 * To add a new playlist:
 * 1. Get the playlist ID from YouTube URL (after list=)
 * 2. Add an entry below with id, name, category, and optional description
 * 3. Set isComplete: true if the playlist won't receive new videos (saves API calls)
 * ===============================================
 */
export const playlists: Playlist[] = [
  // ============ تصوف ============
  {
    id: "PLEkQk5xrP-tly7ti7Qb_lS7xjUg_fwlNP",
    name: "شرح كتاب الدولة المكية بالمادة الغيبية",
    category: "تصوف",
    isComplete: true,
  },
  {
    id: "PLEkQk5xrP-tmsEDdkkXMM1ca2-AquQYad",
    name: "شرح كتاب مدارج الحقيقة في الرابطة عند أهل الطريقة",
    category: "تصوف",
  },
  {
    id: "PLEkQk5xrP-tmiUfQ-2Tsn7QIak4EsvaZW",
    name: "كتاب التيسير المعين بشرح معاني منازل السائرين",
    category: "تصوف",
  },
  {
    id: "PLEkQk5xrP-tnpkdZki6rPTtMak1bnI5g-",
    name: "شرح كتاب مختصر الفتوحات المكية (لواقح الأنوار القدسية)",
    category: "تصوف",
  },
  {
    id: "PLEkQk5xrP-tmf5ToOwmW-q0JwxkapbrMN",
    name: "شرح كتاب إرشاد البرية إلى بعض معاني الحكم العطائية",
    category: "تصوف",
  },
  {
    id: "PLEkQk5xrP-tkHAGOwIKr4pc5ehhyQ5HMJ",
    name: "كتاب الرسالة القشيرية",
    category: "تصوف",
  },
  {
    id: "PLEkQk5xrP-tmmI87XkWepRdTpisz2Lfgr",
    name: "باب في ذكر مشايخ هذه الطريقة من شرح كتاب الرسالة القشيرية",
    category: "تصوف",
  },
  {
    id: "PLEkQk5xrP-tk3OeVFoMfKhOhyINnlPeYZ",
    name: "الحَضْرَةُ الصِّدِّيقِيَّة والأوْرَاد",
    category: "تصوف",
  },
  {
    id: "PLEkQk5xrP-tnzc5Igd5ZE8_G2H6afJ4L5",
    name: "مجالس رحلة سيدي أبي الحسن الشاذلي",
    category: "تصوف",
  },
  {
    id: "PLEkQk5xrP-tl1OLT5J2vthcf9QHpjNkWx",
    name: "شرح كتاب الإشارات الزروقيّة علی الآيات القرآنية",
    category: "تصوف",
  },
  {
    id: "PLEkQk5xrP-tlm5F9ID5I_--LMV7PcWjp_",
    name: "شرح الحزب الكبير لسيدى أبي الحسن الشاذلي",
    category: "تصوف",
  },
  {
    id: "PLEkQk5xrP-tkI_meE148wc7V7XHlB0WPb",
    name: "من الحكم العطائية",
    category: "تصوف",
  },
  {
    id: "PLEkQk5xrP-tnLYi_5_tSRVBwqcs7ISV7Y",
    name: "شرح كتاب منازل السائرين للإمام الهروي",
    category: "تصوف",
  },

  // ============ عقيدة ============
  {
    id: "PLEkQk5xrP-tmNuYT8JAh6clwa4krsgkNo",
    name: "شرح كتاب الفُتُوحات اليُسريَّة في عقائد الأُمَّة المُحمَّديَّة",
    category: "عقيدة",
  },
  {
    id: "PLEkQk5xrP-tkD_AX8yqxtDm_BTp877wi6",
    name: "شرح منظومة منجية العبيد في علم التوحيد",
    category: "عقيدة",
  },
  {
    id: "PLEkQk5xrP-tlc2t-K4tRFtzhmE-e6jziG",
    name: "شرح عقيدة العوام",
    category: "عقيدة",
  },
  {
    id: "PLEkQk5xrP-tm5wKaFaltLbztkXrGxixKu",
    name: "شرح كتاب اتحاف الاذكياء بجواز التوسل بالأنبياء والأولياء",
    category: "عقيدة",
  },
  {
    id: "PLEkQk5xrP-tnI6h_R1hvYgrrstFAJCvv9",
    name: "شرح الخريدة البهية",
    category: "عقيدة",
  },
  {
    id: "PLEkQk5xrP-tlaIFSMSnIOJlJRcxLeTosY",
    name: "شرح رسالة التوحيد للعارف بالله الشيخ أرسلان الدمشقى",
    category: "عقيدة",
  },
  {
    id: "PLEkQk5xrP-tnBp9yUT_R2vtqSPOlcyAZe",
    name: "برنامج عصمة الأنبياء",
    category: "عقيدة",
  },

  // ============ فقه ============
  {
    id: "PLEkQk5xrP-tkXuPs-0sXfWQDWzBKmcjWN",
    name: "فتح القريب المجيب في شرح ألفاظ التقريب (فقه شافعيّ)",
    category: "فقه",
  },
  {
    id: "PLEkQk5xrP-tnXN9VywgB4qmBFO8geIZTV",
    name: "أحكام الحج من كتاب فتح القريب المجيب",
    category: "فقه",
  },
  {
    id: "PLEkQk5xrP-tkeI_WVPfuoTJO46aVkpaz0",
    name: "شرح كتاب ميزان الاعتدال لحفظ الدين والأحوال",
    category: "فقه",
  },
  {
    id: "PLEkQk5xrP-tnZyxWbCSqTSMV9BJLUL-zN",
    name: "شرح كتاب تنوير البصيرة ببيان علامات الكبيرة",
    category: "فقه",
  },
  {
    id: "PLEkQk5xrP-tnC6BRuqMjyO-484iqXeg0o",
    name: "شرح كتاب الموطأ للإمام مالك",
    category: "فقه",
  },
  {
    id: "PLEkQk5xrP-tlyOgfNBZTZgoATzVW4mI20",
    name: "كتاب فتح القريب المجيب (علم الفقه الشافعي)",
    category: "فقه",
  },
  {
    id: "PLEkQk5xrP-tkWS57Ubysh0ifJR8dmuEtE",
    name: "شرح كتاب الأذكار للإمام النووي",
    category: "فقه",
  },

  // ============ حديث ============
  {
    id: "PLEkQk5xrP-tkKprIuGrSdEuBSMsyg5We1",
    name: "شرح مسند الإمام أحمد بن حنبل",
    category: "حديث",
  },
  {
    id: "PLEkQk5xrP-tk_MCBZ706ORCw6gFtFyaGj",
    name: "شرح سنن الإمام الدارقطني",
    category: "حديث",
  },
  {
    id: "PLEkQk5xrP-tmAg-FuWjY057X_h5NmGmAa",
    name: "شرح سنن الدارمي (كاملا)",
    category: "حديث",
  },
  {
    id: "PLEkQk5xrP-tlDtaqY0qhNXAiZ19gaGzKI",
    name: "شرح مسند الإمام محمد بن إدريس الشافعيّ",
    category: "حديث",
  },
  {
    id: "PLEkQk5xrP-tmKNjtYLfhATC37QdIsTMe0",
    name: "شرح كتاب اللؤلؤ والمرجان فيما اتفق عليه الشيخان",
    category: "حديث",
  },
  {
    id: "PLEkQk5xrP-tmHtx4cjd_IK-SgBg00N_ZN",
    name: "الأربعون النووية",
    category: "حديث",
  },
  {
    id: "PLEkQk5xrP-tkc9DXvSLguqX5-FYp6ASR4",
    name: "دليل الفالحين لطرق رياض الصالحين",
    category: "حديث",
  },
  {
    id: "PLEkQk5xrP-tkKcTKLIthzWrdXY7QaOjh_",
    name: "قراءة صحيح البخاري كاملاً في إندونيسيا",
    category: "حديث",
  },
  {
    id: "PLEkQk5xrP-tlyEB2iywk4VchTQROnBrU6",
    name: "بهجة النفوس من أوله",
    category: "حديث",
  },
  {
    id: "PLEkQk5xrP-tlhpr-bJBjCsJw3j1S-LD9B",
    name: "كتابُ الأدَبِ - المجلس الأول",
    category: "حديث",
  },
  {
    id: "PLEkQk5xrP-tkxPmHx3gvtTmm9g4hFTw7Q",
    name: "شرح الحديث (١٦٠) حديث الإسراء والمعراج من كتاب بهجة النفوس",
    category: "حديث",
  },
  {
    id: "PLEkQk5xrP-tlEerGoLa1AFy-2XvQ-sovv",
    name: "شرح صحيح البخاري (كاملا)",
    category: "حديث",
  },
  {
    id: "PLEkQk5xrP-tnu6of679SvxdVx0qSrJzmb",
    name: "شرح سنن الإمام الترمذي",
    category: "حديث",
  },
  {
    id: "PLEkQk5xrP-tnzqzkOeEPbbPLsxgy-MYcW",
    name: "شرح حديث سبعة يظلهم الله يوم القيامة في ظل عرشه - كتاب بهجة النفوس",
    category: "حديث",
  },
  {
    id: "PLEkQk5xrP-tnl7vb7KeAoPd5ZlqKKW8KV",
    name: "شرح كتاب بهجة النفوس",
    category: "حديث",
  },
  {
    id: "PLEkQk5xrP-tmJuzaj4GWRenFoFx9gdbFX",
    name: "شرح كتاب صحيح الإمام البخاري",
    category: "حديث",
  },

  // ============ تفسير / علوم القرآن ============
  {
    id: "PLEkQk5xrP-tlKBnMFB7ry6dhZC6YzNtAq",
    name: "شرح كتاب يسر البيان قراءة في كتاب التبيان في آداب حملة القرآن",
    category: "تفسير",
  },
  {
    id: "PLEkQk5xrP-tlPw10KGJKagu7zm4Ry2Tge",
    name: "شرح الإتقان في علوم القرآن",
    category: "تفسير",
  },
  {
    id: "PLEkQk5xrP-tnW3iBL7HkKziOFCFZbTlf0",
    name: "شرح البرهان في علوم القرآن",
    category: "تفسير",
  },
  {
    id: "PLEkQk5xrP-tkSGrPLMt1BEmJ54cGWYgtp",
    name: "كتابُ بِدَعِ التَفَاسِيرِ",
    category: "تفسير",
  },
  {
    id: "PLEkQk5xrP-tnUSUj0uyJhA-kwNC7Gkx_j",
    name: "مقرأة الفجر - بداية من سورة الإسراء حتى سورة الناس",
    category: "تفسير",
  },
  {
    id: "PLEkQk5xrP-tnmTYsyW6xNdyfhPq0Bhrhj",
    name: "مقرأة الفجر - القُرْآنُ الكَرِيمُ - خَتْمَةُ التَّدَبُّرِ",
    category: "تفسير",
  },

  // ============ سيرة ============
  {
    id: "PLEkQk5xrP-tlnvX_MSpJzq0sTimnumdYK",
    name: "كيف تعرفُ نبيّك؟",
    category: "سيرة",
  },
  {
    id: "PLEkQk5xrP-tkCtkJ_fVpP3CmkJhWYYZtt",
    name: "قراءةُ كتابِ الشَّمَائِلِ المُحَمَّدِيَّة للإِمام التِّرمذيّ",
    category: "سيرة",
  },
  {
    id: "PLEkQk5xrP-tkUKP083yQli9ADnyTpMmgU",
    name: "شرح كتاب الآية الكبرى في الإسراء والعراج",
    category: "سيرة",
  },
  {
    id: "PLEkQk5xrP-tmobcu_1bgkLNfeJXVsmjFZ",
    name: "شرح بردة الإمام البوصيري",
    category: "سيرة",
  },
  {
    id: "PLEkQk5xrP-tloQiuCfhC2DE160-EZBhdz",
    name: "مجموعة الشمائل المحمدية",
    category: "سيرة",
  },
  {
    id: "PLEkQk5xrP-tkxpL07FfuZbVfwJKhAVbcE",
    name: "عِقد اللول من سيرة الزهراء البتول",
    category: "سيرة",
  },
  {
    id: "PLEkQk5xrP-tl2t4NQx1IhKnAJCMzF0Nli",
    name: "شرح كتاب نور اليقين في سيرة سيد المرسلين",
    category: "سيرة",
  },
  {
    id: "PLEkQk5xrP-tmhJ_gpAAFyOpEsHp0_VAJ-",
    name: "برنامج اعرف نبيك في رمضان",
    category: "سيرة",
  },
  {
    id: "PLEkQk5xrP-tl6Mu_Mz3QMUSv5T6XBH-Dg",
    name: "برنامج اعرف نبيك",
    category: "سيرة",
  },
  {
    id: "PLEkQk5xrP-tm74ioQU4BIuXLs8a9babvA",
    name: "شرح كتاب الشمائل المحمدية للإمام الترمذى",
    category: "سيرة",
  },

  // ============ صلوات على النبي ﷺ ============
  {
    id: "PLEkQk5xrP-tk92TNE3xhWCFNr9VshA9Zj",
    name: "الصلوات اليسرية على خير البرية ﷺ",
    category: "صلوات",
  },
  {
    id: "PLEkQk5xrP-tnAXVT9Huen-nNMlvs5w6UI",
    name: "دلائل الخيرات و شوارق الأنوار في ذكر الصلاة على النَّبيّ المختار ﷺ",
    category: "صلوات",
  },
  {
    id: "PLEkQk5xrP-tkFEtMu56Xb9U9FCZBTXiLf",
    name: "شرح صلوات الأولياء على خاتم الأنبياء ﷺ",
    category: "صلوات",
  },
  {
    id: "PLEkQk5xrP-tlAzcbIpuqjdFICW-knvTlR",
    name: "شرح كتاب دلائل الخيرات وشوارق الأنوار",
    category: "صلوات",
  },
  {
    id: "PLEkQk5xrP-tknLQLcWmVVpecUHkbu7cHh",
    name: "شرح صلوات مختارة على النبي ﷺ",
    category: "صلوات",
  },
  {
    id: "PLEkQk5xrP-tmuP5s2o33O9gAOC4ACxsma",
    name: "صَلَواتُ الأَسْمَاءِ الْحُسْنَى شَرْحُ الصَّلَواتِ الْيُسْرِيَّةِ عَلَى خَيرِ الْبَرِيَّةِ",
    category: "صلوات",
  },
  {
    id: "PLEkQk5xrP-tlXZQuhEiJGJka1QcRw7fbW",
    name: "شرح الصلوات الدرديرية لسيدي أحمد الدردير",
    category: "صلوات",
  },
  {
    id: "PLEkQk5xrP-tlB8lmbwjAKR8KRgiykGKhb",
    name: "حضرات يسرية ومدائح نبوية",
    category: "صلوات",
  },

  // ============ ردود ============
  {
    id: "PLEkQk5xrP-tlG4r6Zxis5AqEnE9aNyJdV",
    name: "الرد على المعترضين على د. يسري جبر",
    category: "ردود",
  },
  {
    id: "PLEkQk5xrP-tle_3XnHjhmEc-uhNO000kx",
    name: "الرد على الوهابية",
    category: "ردود",
  },
  {
    id: "PLEkQk5xrP-tnAJa3yfebXD7wNC_ECfZNt",
    name: "كتاب النفحة الذكية في أن الهجر بدعة شركية",
    category: "ردود",
  },
  {
    id: "PLEkQk5xrP-tl5sZd_31jJw-5LldLW46Dv",
    name: "كتاب الحق المبين في الرد على من تطاول على الدين",
    category: "ردود",
  },

  // ============ خطب ============
  {
    id: "PLEkQk5xrP-tnQB6107-Ua00lbndu0_Sti",
    name: "Voices of the Minbar | Friday Sermons",
    category: "خطب",
  },
  {
    id: "PLEkQk5xrP-tnTGoEr4TI_tnp8L7Ujv9dx",
    name: "خطب العيد",
    category: "خطب",
  },
  {
    id: "PLEkQk5xrP-tmYN0y2PQUkx881GYBxD16g",
    name: "درس الجمعة",
    category: "خطب",
  },
  {
    id: "PLEkQk5xrP-tlArtGpeLWaqNM7h7IDeAVC",
    name: "خطب الجمعة",
    category: "خطب",
  },

  // ============ متنوع ============
  {
    id: "PLEkQk5xrP-tldWjDFs_8nrqZBMYoSiPq7",
    name: "برنامج مدد",
    category: "متنوع",
  },
  {
    id: "PLEkQk5xrP-tkGXuZ9atE3k_7it12rUPTs",
    name: "أسئلة المتابعين",
    category: "متنوع",
  },
  {
    id: "PLEkQk5xrP-tl6tFiMFGUucCTvLgnWyAfz",
    name: "حياة الأستاذ الدكتور يسري جبر",
    category: "متنوع",
  },
  {
    id: "PLEkQk5xrP-tmJzNvLntpzW0uPanPzxA0c",
    name: "لقاءات ومحاضرات",
    category: "متنوع",
  },
  {
    id: "PLEkQk5xrP-tm8ZIu74nTOZN9KJUJu416J",
    name: "مقاطع مُهمَّة (يُسريَّات)",
    category: "متنوع",
  },
  {
    id: "PLEkQk5xrP-tknyGbcSBAVJFDqvkFJCtDq",
    name: "فيلم وثائقي عن حقيقة الزمن ووجوده",
    category: "متنوع",
  },
  {
    id: "PLEkQk5xrP-tlJd4vTDfdmzoQf4xWWKMby",
    name: "الاحتفال بالمولد النبوى الشريف 1437 - 1438",
    category: "متنوع",
  },
  {
    id: "PLEkQk5xrP-tna48sTO8GZ77fBCf3PgzNc",
    name: "شرح القصيدة المنفرجة لابن النحوي",
    category: "متنوع",
  },
  {
    id: "PLEkQk5xrP-tnGIBX_2vhkIRBBnEr76KDk",
    name: "احتفال مضيفة الشيخ إسماعيل صادق العدوى",
    category: "متنوع",
  },
];

/**
 * Available categories - add new ones as needed
 */
export const categories: PlaylistCategory[] = [
  "تصوف",
  "عقيدة",
  "فقه",
  "حديث",
  "تفسير",
  "سيرة",
  "صلوات",
  "ردود",
  "خطب",
  "متنوع",
];

/**
 * Channel configuration
 */
export const channelInfo = {
  id: "UCHUZYEvS7utmviL1C3EYrwA",
  name: "فضيلة الدكتور يسري جبر",
  description: "القناة الرسمية لفضيلة الدكتور يسري جبر - أستاذ الفقه والتصوف",
};

/**
 * Helper function to generate collection name from playlist ID
 * Uses the full playlist ID for uniqueness and reliability
 */
export function getCollectionName(playlistId: string): string {
  return `playlist_${playlistId}`;
}

/**
 * Get all collection names for dynamic imports
 */
export function getAllCollectionNames(): string[] {
  return ['channelVideos', ...playlists.map(p => getCollectionName(p.id))];
}

/**
 * Map of playlist IDs to their collection names
 */
export const playlistCollectionMap = new Map(
  playlists.map(p => [p.id, getCollectionName(p.id)])
);

/**
 * Map of collection names to playlist info
 */
export const collectionPlaylistMap = new Map(
  playlists.map(p => [getCollectionName(p.id), p])
);
