# AI-DLC iteration 5: growth, community and admin

Roles for this iteration: product owner (what makes people return and share), designer (positive, never shaming), developer, and operator (the owner runs a small friends-and-family site, not a mass-market one).

## 1. Inception

**Problem.** Karma works for one person, but nothing brings them back tomorrow or lets them show a friend. The owner also cannot run the site: no view of who is using it, no way to speak to users, no settings.

**Goals**
1. Return daily: streaks, a weekly goal, a festival challenge, a daily reminder.
2. Be shared: one-tap cards for WhatsApp status, an invite link.
3. Gentle competition: one common punya ghada for everyone and a half-masked leaderboard of punya only, with a clear "beat the leader" call.
4. A real admin area for the owner.

**Out of scope for now:** push notifications from a server (needs a push service; the existing local reminder stays), family or group ghadas (phase 2), payments.

**Principles**
- Rank effort and merit only. Paap, acts and net scores never appear on any shared surface.
- Names on the board are half masked (`Jig**`, `Pan***`). A user can opt out. The owner can hide someone.
- Works in Gujarati, Hindi and English, on a phone first.
- Small data, no trackers.

## 2. Backlog (in build order)

| # | Story | Acceptance |
| --- | --- | --- |
| C1 | As a user I see one **common punya ghada** for the whole community this week and its goal | Shows the total, the goal from admin settings, fills in proportion, text is points not percent |
| C2 | As a user I see a **leaderboard of top punya earners** with half-masked names | Top 5, rank, masked name, points; my own row is marked even outside the top 5; paap and acts never returned |
| C3 | As a user I am **asked to beat the leader** | Shows the gap to rank 1 and to the next rank up, with a button that jumps to "say your day" |
| C4 | I can **opt out** of the board | Profile switch; hidden users are not listed but still count toward the common ghada |
| R1 | I see my **streak** | Consecutive days with a scored act and net >= 0; milestone words at 3, 7, 21, 108 |
| R2 | I have a **weekly goal** | Progress to 100 punya this week, with a finished state |
| R3 | I see a **festival challenge** when one is on | Computed from the tithi (Navratri, Diwali, Ekadashi, Shravan); says whether I did it today |
| R4 | I get a **weekly summary** | Punya change versus last week, strongest area, one area to grow; shareable |
| S1 | I can **share a card** | PNG with points/streak only, no private detail; Web Share on phones, download elsewhere |
| S2 | I can **share the day's shloka** as an image | Same share path |
| S3 | I can **invite a friend** | Share sheet with a short message and the link |
| A1 | Admin: **announcements** | Owner writes a message (en/gu/hi), turns it on or off, users see it on Home |
| A2 | Admin: **feedback inbox** | Lists "I disagree" notes with the act, points, user and date |
| A3 | Admin: **settings** | Community weekly goal and personal weekly goal |
| A4 | Admin: **manage admins** | Add or remove admin emails (not yourself) |
| A5 | Admin: **board moderation** | Hide or show a user on the leaderboard from their page |
| A6 | Admin: **system health** | Shows whether AI, voice transcription and the message key are configured |
| A7 | Admin: **export users CSV** | Downloads the visible list |

## 3. Design

**Data**
- `profiles.show_on_board boolean default true` (user choice) and `profiles.board_hidden boolean default false` (owner).
- `app_settings(key text primary key, value text)`: readable by everyone signed in, written only by admins through `admin_set_setting`.
- `announcements(id, message jsonb, active, created_at)`: active ones readable by everyone; written by admins through RPC.
- `community_board()` is a `security definer` function that returns only: week total, goal, top 5 `{rank, masked name, points}`, and the caller's own rank and points. Names are masked in SQL (`mask_name`: keep the first half of each word). Nothing else leaves the database.

**Why SQL does the masking.** The browser never receives a full name, so it cannot leak one.

**Streaks and goals** are computed on the client from the user's own actions (no new tables).

**Festivals** come from the tithi engine already in the app, so no hand-typed dates can be wrong.

**Share cards** are drawn on a canvas in the browser (no server, no upload) and handed to the Web Share API.

## 4. Construction

Each item is built with its tests, then the whole suite, lint, typecheck and build run before a commit. SQL ships as migrations plus a copy-paste block in `docs/DEPLOYMENT.md`.

## 5. Operations

- Run the new migrations once; deploy the `admin-users` function again.
- Watch in the admin Overview: new users per week, share of new users who analyse in the first day, active in 7 days.
- Review the feedback inbox weekly and feed good cases into `eval/cases.json`.

## 6. Risks

- A public punya board can tempt people to inflate what they write. Mitigations: points come from computed scoring with checked evidence, the board is weekly so newcomers can win, and the daily streak (not the score) is the main habit.
- Names, even half masked, are personal data: opt-out and owner moderation exist.
- Free AI limits cap how many analyses a minute the site can serve; see DEPLOYMENT.md.
