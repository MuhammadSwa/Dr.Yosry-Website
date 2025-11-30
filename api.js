const INSTANCES = [
  "https://inv.nadeko.net",        // The one that failed (Chile)
  "https://yewtu.be",             // Very reliable (Europe)
  "https://vid.puffyan.us",       // Reliable (USA)
  "https://invidious.drgns.space",// Reliable (USA)
];

const fetchWithFallback = async (endpoint) => {
  let lastError;

  for (const instance of INSTANCES) {
    try {
      console.log(`Trying instance: ${instance}...`);
      const response = await fetch(`${instance}${endpoint}`);

      // If the server replies, but says "Not Found" (404), stop trying other servers.
      // It means the connection worked, but the ID is wrong.
      if (response.status === 404) {
        throw new Error("Channel Not Found (404)");
      }

      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.warn(`Failed ${instance}: ${err.message}`);
      lastError = err;

      // If it was a 404, don't try other servers, just fail immediately
      if (err.message.includes("Not Found")) break;
    }
  }
  throw lastError || new Error("All instances failed");
};

// const INSTANCE_URL = "https://inv.nadeko.net";
// Note: Valid YouTube Channel IDs usually start with 'UC'. 
// 'dryosrygabr' looks like a Video ID or a Username. 
// If this ID causes a 404, try replacing it with a standard ID like 'UC_x5XG1OV2P6uZZ5FSM9Ttw' (Google Developers) to test.
const CHANNEL_ID = "UCHUZYEvS7utmviL1C3EYrwA";

// Main Fetcher
const fetchChannelData = async (id) => {
  // 1. Fetch Basic Info
  // Note: Invidious requires a valid 'UC...' ID. 
  // If 'dryosrygabr' is a handle (@dryosrygabr), we might need to search for it first.
  // For now, we try to fetch it directly.

  const info = await fetchWithFallback(`/api/v1/channels/${id}`);

  // 2. Fetch Playlists (using the same instance logic is complex in parallel, 
  // so we cheat slightly and use the fetchWithFallback sequentially or reuse the instance if we stored it. 
  // For simplicity here, we just call the fallback logic again).
  const playlistsData = await fetchWithFallback(`/api/v1/channels/${id}/playlists`);

  return {
    info: info,
    playlists: playlistsData.playlists || []
  };
};

await fetchChannelData(CHANNEL_ID);
