import { createResource, Show, For, Suspense } from "solid-js";

// Configuration
const INSTANCE_URL = "https://inv.nadeko.net";
// Note: Valid YouTube Channel IDs usually start with 'UC'. 
// 'dryosrygabr' looks like a Video ID or a Username. 
// If this ID causes a 404, try replacing it with a standard ID like 'UC_x5XG1OV2P6uZZ5FSM9Ttw' (Google Developers) to test.
const CHANNEL_ID = "dryosrygabr";

// Types (Optional, helpful for understanding structure)
// interface ChannelData {
//   author: string;
//   authorId: string;
//   authorThumbnails: { url: string; width: number; height: number }[];
//   subCount: number;
//   description: string;
// }
// interface PlaylistData {
//   title: string;
//   playlistId: string;
//   videoCount: number;
//   playlistThumbnail: string;
// }

// Fetcher function to get Channel Info AND Playlists in parallel
const fetchChannelData = async (id) => {
  const headers = { Accept: "application/json" };

  // 1. Fetch Basic Channel Info
  const channelPromise = fetch(`${INSTANCE_URL}/api/v1/channels/${id}`, { headers });

  // 2. Fetch Playlists associated with the channel
  const playlistsPromise = fetch(`${INSTANCE_URL}/api/v1/channels/${id}/playlists`, { headers });

  const [channelRes, playlistsRes] = await Promise.all([channelPromise, playlistsPromise]);

  if (!channelRes.ok) {
    throw new Error(`Error fetching channel: ${channelRes.status} ${channelRes.statusText}`);
  }
  if (!playlistsRes.ok) {
    throw new Error(`Error fetching playlists: ${playlistsRes.status} ${playlistsRes.statusText}`);
  }

  const channel = await channelRes.json();
  const playlistsData = await playlistsRes.json();

  return {
    info: channel,
    playlists: playlistsData.playlists || []
  };
};

export const ChannelInfo = () => {
  // Create a resource that triggers the fetcher when CHANNEL_ID is present
  const [data] = createResource(CHANNEL_ID, fetchChannelData);

  return (
    <div style={{ padding: "20px", "font-family": "sans-serif", "max-width": "800px", margin: "0 auto" }}>
      <Suspense fallback={<div class="loading">Loading channel data...</div>}>
        <Show when={data.error}>
          <div style={{ color: "red", border: "1px solid red", padding: "10px", "border-radius": "4px" }}>
            <strong>Error:</strong> {data.error.message}
            <br />
            <small>Note: Please check if '{CHANNEL_ID}' is a valid Channel ID (usually starts with 'UC').</small>
          </div>
        </Show>

        <Show when={data()}>
          {(channelData) => (
            <>
              {/* Channel Header Section */}
              <header style={{ "display": "flex", "align-items": "center", "gap": "20px", "margin-bottom": "30px", "border-bottom": "2px solid #eee", "padding-bottom": "20px" }}>
                <Show when={channelData().info.authorThumbnails?.length > 0}>
                  <img
                    src={channelData().info.authorThumbnails[0].url}
                    alt={channelData().info.author}
                    style={{ "border-radius": "50%", width: "80px", height: "80px", "object-fit": "cover" }}
                  />
                </Show>
                <div>
                  <h1 style={{ margin: "0 0 5px 0" }}>{channelData().info.author}</h1>
                  <div style={{ color: "#666" }}>
                    <span>{channelData().info.subCount.toLocaleString()} subscribers</span>
                  </div>
                </div>
              </header>

              {/* Playlists Section */}
              <section>
                <h2>Channel Playlists</h2>
                <Show when={channelData().playlists.length === 0}>
                  <p>No playlists found for this channel.</p>
                </Show>

                <div style={{ display: "grid", "grid-template-columns": "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
                  <For each={channelData().playlists}>
                    {(playlist) => (
                      <div style={{ border: "1px solid #ddd", "border-radius": "8px", overflow: "hidden", "box-shadow": "0 2px 4px rgba(0,0,0,0.1)" }}>
                        {/* Playlist Thumbnail */}
                        <div style={{ height: "120px", background: "#f0f0f0", position: "relative" }}>
                          <Show when={playlist.playlistThumbnail}>
                            <img
                              src={playlist.playlistThumbnail}
                              alt={playlist.title}
                              style={{ width: "100%", height: "100%", "object-fit": "cover" }}
                            />
                          </Show>
                          <div style={{ position: "absolute", bottom: "5px", right: "5px", background: "rgba(0,0,0,0.7)", color: "#fff", padding: "2px 6px", "border-radius": "4px", "font-size": "12px" }}>
                            {playlist.videoCount} videos
                          </div>
                        </div>

                        {/* Playlist Info */}
                        <div style={{ padding: "10px" }}>
                          <h3 style={{ "font-size": "16px", margin: "0 0 5px 0", "white-space": "nowrap", overflow: "hidden", "text-overflow": "ellipsis" }} title={playlist.title}>
                            {playlist.title}
                          </h3>
                          <a
                            href={`https://inv.nadeko.net/playlist?list=${playlist.playlistId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ "font-size": "14px", color: "#0066cc", "text-decoration": "none" }}
                          >
                            View on Invidious &rarr;
                          </a>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </section>
            </>
          )}
        </Show>
      </Suspense>
    </div>
  );
};

export default ChannelInfo;
