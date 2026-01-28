# Health Future Insights (React Native + Expo)

A pixel-perfect, animated mobile app that simplifies medical jargon from X-rays, scans, and reports. Includes Home (hero, features, testimonials), Auth (login/signup), Dashboard (past scans), and New Scan (upload/take photo → insights).

## Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI: `npm i -g expo-cli` (optional; `npx` works)

### Install & Run
```bash
cd c:/Projects/HealthFutureInsights
npm install
npx expo start
```
- Press `a` for Android emulator/device, `i` for iOS simulator (macOS), or scan QR with Expo Go.

## Build (Deploy Ready)
- Configure app identifiers in `app.json`.
- Use EAS for store builds:
```bash
npx expo login
npx eas build -p android --profile production
npx eas build -p ios --profile production
```

## Project Structure
- `app/` — Expo Router screens
  - `index.tsx` — Home
  - `auth/login.tsx`, `auth/signup.tsx`
  - `dashboard/index.tsx`
  - `scan/new.tsx`, `scan/result.tsx`
- `src/` — Logic & UI primitives
  - `context/AppContext.tsx` — Auth + scans state
  - `storage.ts` — AsyncStorage helpers
  - `insights.ts` — Simplified insights generator
  - `components/` — UI components

## Notes
- Insights are generated locally (placeholder) and saved to storage.
- Replace `generateInsightsFromImage()` with your backend/ML pipeline when ready.

## Supabase Setup
- Create a Supabase project and note the `Project URL` and `anon` key.
- In `app.json`, set under `expo.extra`:
  - `supabaseUrl`: your project URL
  - `supabaseAnonKey`: your anon key
  - `supabaseStorageBucket`: `scans` (create this storage bucket)

### Database Schema
Create a table `scans` with RLS enabled:
- Columns: `id uuid default gen_random_uuid() primary key`, `user_id uuid references auth.users not null`, `image_url text not null`, `created_at timestamp with time zone default now()`, `insights jsonb not null`

Policies:
- Select: `auth.uid() = user_id`
- Insert: `auth.uid() = user_id` (set `user_id` from client via session)
- Delete/Update: `auth.uid() = user_id`

### Storage
- Bucket: `scans` (public or signed URLs; current code uses public URLs). If you prefer private, use signed URLs from Supabase.

### Running with Supabase
```bash
cd c:/Projects/HealthFutureInsights
npm install
npx expo start
```
- Sign up/in via email/password; scans will upload to Storage and save rows in `scans`.
