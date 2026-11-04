# Interests page setup

The home page keeps About Me and an animated Interests link. The separate scrolling page is `#/interests`; all five sections stay visible. Its animated top directory scrolls to About Me, Valorant, Music, Likes, and Dislikes and highlights the current section. Shareable paths such as `#/interests/music` jump directly to that section.

## Run the website and its API

1. Copy `.env.example` to `.env.local` and fill the values below.
2. Run `npm run build`.
3. Run `npm start` and open `http://127.0.0.1:3001`.

For development, also run `npm run dev`. Vite proxies `/api` to the local backend on port 3001. A static-only deployment can show the page design, manual Valorant profile, and curated favorite tracks, but live Spotify listening data requires this backend or equivalent server-side routes. To bind the production server externally, set `HOST` for your hosting environment; the owner setup routes stay restricted to loopback requests.

Spotify tokens and saved song selections stay on the server. `.env.local` and `.data/` are ignored by Git. Use persistent storage for `.data` when deploying. Spotify is the site's only connected API; Valorant data is entered manually.

## Spotify

Create your own app in the [Spotify developer dashboard](https://developer.spotify.com/dashboard). Spotify's current development mode requires the app owner to have Premium. Register the **exact** redirect URI below:

```text
http://127.0.0.1:3001/api/spotify/callback
```

Add the app's Client ID as `SPOTIFY_CLIENT_ID` in `.env.local`, then restart the backend. This integration uses PKCE; it does not need your client secret or password.

Open `http://127.0.0.1:3001/api/spotify/setup` on this computer, connect your account, and select favorites by pasting up to 12 Spotify track links, one per line. Their order is preserved and duplicate links appear once. The public site shows those exact tracks with their titles, artists, and uncropped album covers. It also shows your top artists, three albums inferred from your top tracks, and currently playing track. Visitors do not log in and cannot modify your favorites. Nothing plays automatically.

Curated favorites can be displayed before Spotify is connected. The backend accepts public default metadata as `defaultFavorites: [{ url, title, artists, artwork }]` in `createSpotifyService`. These defaults supply the initial selection only when the private favorites file is absent. Saving a selection overrides them; saving an empty list clears it. Disconnected responses retain only curated metadata matching the saved selection, and connected responses refresh that metadata from Spotify. Currently playing and top artists stay empty until the account is connected.

The read scopes are `user-read-currently-playing` and `user-top-read`. Favorites are manually selected, not inferred from Liked Songs. Top albums are inferred from the first 50 medium-term top tracks: albums are grouped by Spotify album ID and ordered by how many top tracks they contain, with ties resolved by the earliest-ranked track. This is a top-track-based selection, not a count of album plays; separate editions retain separate IDs. No additional authorization scope is needed.

The frontend refreshes every 15 seconds while the tab is visible and also refreshes when returning to the tab. Playback is cached for 12 seconds; artists, albums, and favorite-track metadata are cached for 60 seconds. The vinyl, moving ring, and equalizer run only during reported playback and honor reduced motion, viewport visibility, and the Motion pause control. The backend refreshes access tokens; Spotify may require account reauthorization when a refresh token expires.

### Local setup troubleshooting

- If the Connect Spotify button is missing after creating or editing `.env.local`, restart the backend with `npm.cmd start`. Vite hot reload does not reload the backend's environment variables.
- The backend also loads the project folder's `.env.local` when started directly with `node server/index.mjs`, including from VS Code. Keep that configuration file beside `package.json`.
- Setup opened through Vite or `localhost` redirects to the configured loopback callback origin before creating its cookies. For the default configuration, use `http://127.0.0.1:3001/api/spotify/setup`.
- Reload setup after restarting the backend or leaving the form open for more than ten minutes. Its temporary form and authorization tokens expire; the page offers a return link if a request needs to be retried.
- A successful favorites submission returns to setup and displays “Your favorite tracks were saved.” It does not require Spotify authorization. Live playback and top artists require completing Connect Spotify.

References: [PKCE](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow), [quota modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes), [redirect URIs](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri), [design requirements](https://developer.spotify.com/documentation/design).

## Manual Valorant profile

The Valorant layout stays on the Interests page and requires no API connection or key. Edit the `valorant` object in `src/data/siteData.js`:

| Field | Content |
| --- | --- |
| `riotId` | Your displayed Riot ID. |
| `introduction` | Your introductory Valorant story, displayed above the player profile. |
| `player.name`, `player.tag` | The player name and tag shown beside the card. |
| `player.cardImage` | A public image URL or a local image path such as `/images/player-card.jpg`. |
| `player.cardName` | The card name used in the image description. |
| `player.title` | Your displayed player title. |
| `currentRank`, `peakRank` | Current and peak rank text. |
| `currentRankImage`, `peakRankImage` | Rank icon image paths. |
| `rankDescription` | An optional short description of your rank or play style. |
| `agents` | Your most-played agents, added in the order you want to show them. |
| `experience` | Your professional or tournament experience. |
| `earnings` | Your verified earnings, written as display text. |

An agent entry can include the following fields; only add usage numbers you know:

```js
{
  name: 'Agent name',
  role: 'Agent role',
  image: '/images/agent.png',
  hours: null,
  lifetimeKills: null,
  bestMap: '',
}
```

Click an agent card to expand these three stats. Leave values empty until ready; zero is a valid value. No stats are looked up automatically.

Put local images inside `public/images/` and reference them from `/images/`. Empty values keep the section's placeholders. The website does not look up ranks, agent usage, player cards, experience, or earnings automatically.

## Personal content

Edit `profile.about`, the Likes/Dislikes item arrays, and the manual Valorant fields in `src/data/siteData.js`. Unknown personal facts remain placeholders.

Run `npm test` for the API service checks and `npm run build` for the production build. Live account verification requires your own credentials and authorization; tests use mocked API responses.
