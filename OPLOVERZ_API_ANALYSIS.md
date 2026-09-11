# Oploverz API Analysis

Inspection dilakukan pada 11 September 2026 terhadap `https://www.sankavollerei.web.id` menggunakan HTTP request nyata. Tidak ada mock response yang dipakai.

## Base URL

`https://www.sankavollerei.web.id/anime/oploverz`

## Endpoint

| Provider endpoint | Observed response |
| --- | --- |
| `GET /home` | `{ status, creator, source, anime_list[] }` |
| `GET /schedule` | `{ status, creator, source, schedule }` |
| `GET /ongoing` | `{ status, creator, source, anime_list[], pagination }` |
| `GET /completed` | `{ status, creator, source, anime_list[], pagination }` |
| `GET /list` | `{ status, creator, source, anime_list[], pagination }` |
| `GET /search/:query` | Collection response dengan `anime_list[]` dan `pagination` |
| `GET /anime/:slug` | `{ status, creator, source, detail }` |
| `GET /episode/:slug` | `{ status, creator, source, episode_title, streams[], downloads[] }` |

## Collection Structure

Item `anime_list` yang teramati memiliki `title`, `slug`, `poster`, `type`, `episode`, `status`, dan `oploverz_url`. Pada response list, field `slug` dapat bernilai literal `anime`; URL canonical pada `oploverz_url` memuat slug sebenarnya. Normalizer memakai slug URL canonical bila kondisi ini terjadi.

`pagination` yang teramati memiliki `hasNext`, `hasPrev`, dan `currentPage`. Parameter `page=2` terobservasi mengubah `currentPage` menjadi `2`. Limit tidak diberikan oleh inspection.

`/schedule` mengembalikan object keyed by day, misalnya `thursday`, berisi item dengan `title`, `slug`, dan `episode_info`.

## Anime Detail

`detail` memiliki:

- `title`
- `poster`
- `synopsis`
- `info`: `status`, `studio`, `duration`, `season`, `type`, `casts`, `posted_by`, `released_on`, `updated_on`
- `genres[]`: `name`, `slug`, `url`
- `episode_list[]`: `slug`, `title`, `episode`, `release_date`, `url`

## Episode, Stream, Server, dan Resolution

Response nyata yang diambil:

```json
{
  "episode_title": "One Piece Episode 001  REMASTERED",
  "streams": [
    { "name": "Main Stream", "url": "..." },
    { "name": "Server 1 | sd]google-v2", "url": "..." }
  ],
  "downloads": [
    { "name": "One Drive", "resolution": "DL", "url": "..." },
    { "name": "Google Drive", "resolution": "DL", "url": "..." },
    { "name": "Mite", "resolution": "DL", "url": "..." }
  ]
}
```

Alur normalisasi:

```text
Provider response
       ↓
streams[] / downloads[]
       ↓
Stream / Download
       ↓
name dan URL provider
       ↓
resolution hanya dari field provider
```

Provider response yang diinspeksi **tidak menyediakan** field terpisah untuk server ID, quality, resolution stream, format, MIME type, subtitle, audio, atau type. Semua field tersebut: **NOT PROVIDED BY PROVIDER**. API internal mengembalikan `null` untuk field normalisasi yang tidak tersedia dan menyimpan object asli di `providerData`.

Download dipisahkan dari stream. Download yang teramati memiliki `resolution: "DL"`; itu tidak diperlakukan sebagai resolusi video stream. Tidak ada `360p`, `480p`, `720p`, atau `1080p` yang diberikan oleh response yang diinspeksi.

## Field Mapping

| Provider | SHIINIME |
| --- | --- |
| `title` | `title` |
| `slug` / canonical URL | `slug` |
| `poster` | `poster` |
| `episode` | `episode` / `number` |
| `episode_list` | `episodes` |
| `episode_title` | `episode.title` |
| `streams[].name` | `streams[].name` |
| `streams[].url` | `streams[].url` |
| `downloads[].name` | `downloads[].name` |
| `downloads[].resolution` | `downloads[].resolution` |
| `downloads[].url` | `downloads[].url` |

Provider tidak mengirim query parameter selain pagination `page` yang terobservasi. Tidak ada field tambahan yang dikarang.
