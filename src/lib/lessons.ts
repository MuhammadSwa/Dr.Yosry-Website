export type PlaylistCategory = "تصوف" | "فقه" | "تفسير" | "حديث" | "عقيدة" | "سيرة" | "متنوع";

export interface Playlist {
  id: string;
  name: string;
  category: PlaylistCategory;
  description?: string;
}

/**
 * ===============================================
 * PLAYLIST CONFIGURATION
 * ===============================================
 * Add your playlists here. The app will automatically:
 * 1. Create content collections for each playlist
 * 2. Fetch videos from YouTube
 * 3. Display them in the lessons page with proper categorization
 * 
 * To add a new playlist:
 * 1. Get the playlist ID from YouTube URL (after list=)
 * 2. Add an entry below with id, name, category, and optional description
 * ===============================================
 */
export const playlists: Playlist[] = [
  // ============ تصوف ============
  {
    id: "PLEkQk5xrP-tly7ti7Qb_lS7xjUg_fwlNP",
    name: "دروس التصوف",
    category: "تصوف",
    description: "شرح أصول التصوف والسلوك الروحي",
  },
  
  // ============ فقه ============
  {
    id: "PLEkQk5xrP-tmsEDdkkXMM1ca2-AquQYad",
    name: "دروس الفقه",
    category: "فقه",
    description: "شرح المسائل الفقهية والأحكام الشرعية",
  },
  
  // ============ Add more playlists below ============
  // Example:
  // {
  //   id: "PLxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  //   name: "اسم القائمة",
  //   category: "تفسير",
  //   description: "وصف اختياري",
  // },
];

/**
 * Available categories - add new ones as needed
 */
export const categories: PlaylistCategory[] = [
  "تصوف",
  "فقه", 
  "تفسير",
  "حديث",
  "عقيدة",
  "سيرة",
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
 * Uses the last 4 characters of the playlist ID for uniqueness
 */
export function getCollectionName(playlistId: string): string {
  return `playlist_${playlistId.slice(-4)}`;
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
