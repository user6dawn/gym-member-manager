## Database Schema Note

This project uses **Supabase/Postgres**. Below is the inferred schema based on the application code.

---

## `users`

**Purpose**: Stores gym member profiles.

**Columns**:
- **id**: `uuid` – primary key.
- **member_id**: `integer` – internal member number (displayed with leading zeros in the UI).
- **name**: `text` – full name.
- **phone**: `text` – phone number.
- **email**: `text | null` – email address.
- **address**: `text | null` – postal address.
- **gender**: `text | null` – values used: `'male'`, `'female'`.
- **image_url**: `text | null` – public URL or storage path to profile image in the `gym.members` bucket.
- **status**: `boolean` – active membership flag.
- **created_at**: `timestamp` – record creation time / signup time.
- **remarks**: `text | null` – free-text notes or remarks about the member.

**App-level uniqueness constraints (enforced in code)**:
- Email is treated as unique among users.
- Phone is treated as unique among users.
- Combination of `(name, address, gender)` is checked to avoid duplicate profiles.

**Relationships**:
- One-to-many with `subscriptions` via `subscriptions.user_id → users.id`.

---

## `subscriptions`

**Purpose**: Tracks each member’s subscription periods, days used, and pause/hold state.

**Columns**:
- **id**: `uuid` – primary key.
- **user_id**: `uuid` – foreign key to `users.id`.
- **created_at**: `date`/`timestamp` – subscription creation/start date.
- **payment_date**: `date` – when payment was made.
- **expiration_date**: `date` – when the subscription expires.
- **total_days**: `integer` – total days purchased.
- **active_days**: `integer` – number of days already counted as active.
- **inactive_days**: `integer` – number of days accumulated while membership is on hold.
- **inactive_start_date**: `date | null` – when the current pause/hold began.
- **days_remaining**: `integer | null` – remaining days when the membership is paused (null when actively counting down).
- **last_active_date**: `date | null` – last date the user was active.

**Relationships**:
- Many-to-one to `users` via `user_id`.
- Frequently queried via Supabase relational selects like:
  - From `users`: `select('..., subscriptions(...)')`.
  - From `subscriptions`: direct queries and updates by `id`.

**Behavior from edge function**:
- A scheduled function `update-active-days` recalculates `active_days` for active users:
  - Reads active `users` with associated `subscriptions`.
  - Computes current active days since `payment_date`.
  - Updates `subscriptions.active_days` when it increases (up to `total_days`).

---

## `user_roles`

**Purpose**: Stores roles for authenticated users (e.g., admin vs regular user).

**Columns** (inferred):
- **id**: `uuid` – matches Supabase Auth `user.id`.
- **role**: `text` – e.g. `'admin'` (and possibly `'user'` or other roles).

**Relationships**:
- Likely one-to-one with an auth user (same `id` as `auth.users.id`).
- Used to restrict admin-only actions in the dashboard.

---

## Supabase Storage (buckets)

Although not database tables, storage buckets are an important part of the data model.

### Bucket: `gym.members`

**Purpose**: Stores member profile images.

**Usage details**:
- Files are uploaded under paths like `profiles/<uuid>.<ext>`.
- After upload, a public URL is retrieved via `storage.from('gym.members').getPublicUrl(path)` and saved into `users.image_url`.
- The dashboard and profile pages use `image_url` (or derive a public URL from a storage path) to display the member’s avatar.

---

## Relationships Summary

- **`users` ↔ `subscriptions`**:
  - One `user` can have many `subscriptions`.
  - Accessed in code using relational selects (for dashboards, statistics, and active-days updates).

- **`auth.users` ↔ `user_roles`**:
  - One auth user is associated with one role row in `user_roles` via the same `id`.
  - Used to determine whether a signed-in user can access admin features (like viewing member details).

