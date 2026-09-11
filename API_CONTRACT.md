# SHIINIME API Contract

Base URL production: `https://api.example.com` (ubah sesuai deployment). Semua response memakai JSON.

## Envelope

Success: `{ "success": true, "data": {} }`

Error: `{ "success": false, "error": { "code": "ERROR_CODE", "message": "..." } }`

## Public Endpoints

| Method | URL | Auth | Query/body |
| --- | --- | --- |
| GET | `/health` | No | none |
| GET | `/anime/home` | No | none |
| GET | `/anime/schedule` | No | none |
| GET | `/anime/ongoing` | No | optional `page` |
| GET | `/anime/completed` | No | optional `page` |
| GET | `/anime/list` | No | optional `page` |
| GET | `/anime/search/:query` | No | optional `page` |
| GET | `/anime/:slug` | No | slug is URL-safe |
| GET | `/episode/:slug` | No | slug is URL-safe |

Collection data contains normalized `items`, `schedule`, `pagination`, and `providerData`. Anime detail contains `anime` and `providerData`.

### Episode

`GET /episode/:slug` returns:

```json
{
  "success": true,
  "data": {
    "episode": { "title": "...", "slug": "...", "number": "...", "releaseDate": "...", "url": "..." },
    "streams": [{
      "name": "Main Stream",
      "url": "provider URL",
      "server": null,
      "serverId": null,
      "quality": null,
      "resolution": null,
      "format": null,
      "mimeType": null,
      "subtitle": null,
      "audio": null,
      "type": null
    }],
    "downloads": [{ "name": "...", "url": "...", "resolution": "DL", "format": null }]
  }
}
```

`server`, server ID, quality, stream resolution, format, MIME type, subtitle, audio, and type are `null` because the inspected provider did not provide them. URLs are passed through unchanged. The `providerData` property preserves the original object for forward compatibility.

## Authenticated Endpoints

Send `Authorization: Bearer <Firebase ID Token>`.

| Method | URL | Body |
| --- | --- | --- |
| GET | `/profile` | none |
| GET | `/favorites` | none |
| POST | `/favorites` | `{ animeSlug, anime? }` |
| DELETE | `/favorites/:animeSlug` | none |
| GET | `/history` | none |
| GET | `/leaderboard` | none |
| POST | `/watch/start` | `{ episodeSlug, durationSeconds }` |
| POST | `/watch/heartbeat` | `{ sessionId, positionSeconds, durationSeconds }` |
| POST | `/watch/complete` | `{ sessionId, positionSeconds, durationSeconds }` |

The backend obtains UID only from the verified Firebase token. Watch rewards are transaction-based and duplicate completion rewards are rejected. Heartbeats clamp position, delta, and duration server-side.

Common errors: `VALIDATION_ERROR`, `UNAUTHORIZED`, `INVALID_TOKEN`, `FIREBASE_NOT_CONFIGURED`, `PROVIDER_ERROR`, `WATCH_SESSION_NOT_FOUND`, `COMPLETION_THRESHOLD_NOT_MET`, `INTERNAL_ERROR`.
