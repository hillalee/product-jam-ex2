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
- Errors: `400` for an invalid count; `502` if NASA fails or returns invalid
  data; `504` after 10 seconds; `503` if the API key is missing.
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

NASA's updated gateway returned its generic logo for real APOD dates, so I use
NASA's [documented dated feed](https://api.nasa.gov/assets/files/apod/APOD-APIs-and-RSS-info.pdf)
when that happens. I still get the random dates from the assignment's endpoint
and check the requested date against the replacement. The new feed includes
HTML and uses `hdurl` for the image, so I extract plain text and display the
image URL rather than rendering its HTML. Missing migrated entries are skipped
in random batches, so one missing date does not discard the available pictures.

The random-count request was too slow for a full batch, so the page asks for
six pictures and NASA has 30 seconds instead of 10. The API still accepts a
count up to 20. Gemini uses `gemini-3.8-flash`, with the same 30-second timeout
as planned.


A phone screenshot showed that the replacement feed can also return a generic
NASA thumbnail. I now reject those replacement URLs as well. The page loads its
six images immediately and shows the kit's Spinner until each image finishes,
with a message if it fails, so the user does not see unexplained empty space.
