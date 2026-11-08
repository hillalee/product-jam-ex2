# Design for parts 0–2

## Database

I will use SQL migrations and enable RLS without policies, as in `events`, so
all data access goes through the server. The routes will check ownership because
the server's key bypasses RLS.

### `games`

Each row is a completed game belonging to the account that saved it.

| Column       | Type          | Rules                                                      |
| ------------ | ------------- | ---------------------------------------------------------- |
| `id`         | `uuid`        | Primary key, default `gen_random_uuid()`                   |
| `owner_id`   | `uuid`        | Not null, references `auth.users(id)`, `on delete cascade` |
| `moves`      | `jsonb`       | Not null, an array of 5–16 moves                           |
| `result`     | `text`        | Not null, one of `X`, `O`, `draw`                          |
| `created_at` | `timestamptz` | Not null, default `now()`                                  |

I will store moves as cell numbers from 0 to 15 in row order, so the server can
replay them and calculate the result using the same pure functions as the page
in `shared/game/`. I will index `(owner_id, created_at desc)` for history.

### `apod_explanations`

Each row holds a picture's explanation, shared between users by date.

| Column       | Type          | Rules                                                       |
| ------------ | ------------- | ----------------------------------------------------------- |
| `date`       | `date`        | Primary key, at least `1995-06-16`                          |
| `status`     | `text`        | Not null, `pending`, `ready` or `failed`, default `pending` |
| `title_he`   | `text`        | Required and nonblank when ready, otherwise null            |
| `summary_he` | `text`        | Required and nonblank when ready, otherwise null            |
| `tags`       | `text[]`      | 1–5 allowed tags when ready, otherwise null                 |
| `created_at` | `timestamptz` | Not null, default `now()`                                   |

I will use a check constraint to require the output fields when the status is
ready and keep them null otherwise. Tags can be `galaxy`, `planet`, `nebula`,
`earth`, `sun`, `moon`, `star` or `spaceflight`, and Zod will reject repeated
tags. There are no foreign keys because explanations do not belong to individual
users.

I will insert a pending row before calling Gemini, so the unique date prevents
two requests from generating the same explanation. Failed or stuck rows need
manual review before retrying, since a timeout does not mean Gemini did no work.
This avoids automatic duplicate calls, but a failure to save cannot undo a
completed Gemini call.

## API

All endpoints require login and use shared Zod schemas, `validate()` and
`fail()`, with the same error format as `events`. They can return `401` for
authentication, or `503` if authentication is unavailable. API keys stay on the
server.

### `POST /api/games`

- Receives only `{ moves: number[] }`, with integer cell numbers 0–15.
- Returns `201` with `{ id, moves, result, created_at }`.
- Errors: `400` for invalid input, occupied cells, moves after the game ended or
  an unfinished game; `500` if saving fails.
- Writes `games`, with the replayed result and `c.get("user").id` as owner.

### `GET /api/games`

- Receives no parameters.
- Returns `200` with an array of `{ id, moves, result, created_at }`, newest
  first, or `[]` if there are no games.
- Errors: `500` if reading fails.
- Reads `games`, filtered by `.eq("owner_id", c.get("user").id)`.

### `GET /api/nasa/pictures?count=20`

- Receives optional integer `count`, from 1 to 20, default 20.
- Returns `200` with an array of
  `{ date, title, image_url, explanation, copyright? }` from NASA. Only images
  with usable HTTPS URLs are included, without repeated dates, so the result may
  contain fewer pictures.
- Errors: `400` for an invalid count; `502` if NASA fails, doesn't answer within
  15 seconds or returns invalid data.
- No tables used.

### `POST /api/nasa/explanations`

- Receives only `{ date: "YYYY-MM-DD" }`, a valid date from `1995-06-16` through
  today in UTC.
- Returns `200` with `{ date, title_he, summary_he, tags, cached }`. `cached` is
  true when returning a saved answer.
- Errors: `400` for invalid input or a non-image entry; `404` for a missing
  picture; `409` while generation is pending; `502` for NASA/Gemini failure or
  invalid output; `504` after 10 seconds for NASA or 30 for Gemini; `503` for
  missing keys or a previously failed generation; `500` for a database failure.
- Reads and writes `apod_explanations`.

The server will look up the date and return the saved explanation if there is
one. Otherwise, it will get the source text from NASA, reserve the date and ask
Gemini for a Hebrew title, a summary of 2 to 3 sentences for a ten-year-old and
1 to 5 tags. I will validate the output with Zod before saving it. A request
that finds the date already reserved will read that row instead of calling
Gemini again. Generation errors mark the row failed when possible; a failed save
leaves it reserved.

## Trade-off

I chose a shared cache because generating the same explanation for each user
would waste Gemini calls. A bad answer would also be shared, so the server gets
the text from NASA and checks the output before saving it.

## What changed and why

My first version followed this design closely and was much bigger than the
assignment needs, so I simplified it.

In `apod_explanations` I dropped the `pending`, `ready` and `failed` status and
its check constraint, so a row only holds a saved answer. The server returns the
saved row if there is one, and otherwise asks NASA and Gemini and saves the
answer. Two users asking for the same new picture at the same moment could make
Gemini answer twice, which I accepted because it is rare and cheap. Without the
status there are no `409` answers, and any NASA or Gemini failure is a `502`.
The new table is in `20261104203000_simplify_apod_explanations.sql`.

`api.nasa.gov/planetary/apod` stopped working in September, so the server now
uses only NASA's new `science.nasa.gov/wp-json/wp/v2/apod-basic` endpoint. It
needs no API key, so I removed `NASA_API_KEY`. The page shows 20 pictures again
and the server waits up to 15 seconds instead of 45.

I also removed the five-move minimum from the games schema, because the replay
already rejects unfinished games with `400`.
