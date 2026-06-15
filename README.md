# Health Future Insights

> Understand your medical documents — without the jargon.

Health Future Insights is a mobile app built with React Native and Expo that helps users make sense of medical documents such as X-rays, scans, and reports by translating complex medical terminology into simple, plain-language insights.

---

## Features

- **Medical Document Analysis** — Upload or photograph a scan or report and receive an easy-to-understand breakdown
- **Personal Dashboard** — Access all your past scans in one place
- **Secure Authentication** — Email-based sign up and login via Supabase
- **Account Management** — Update profile or permanently delete your account
- **Offline-Ready Storage** — Local state persistence with AsyncStorage

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo |
| Navigation | Expo Router |
| Backend / Auth | Supabase |
| Database | Supabase (PostgreSQL with RLS) |
| File Storage | Supabase Storage |
| Local Storage | AsyncStorage |
| Insights Engine | Pluggable (placeholder → your ML pipeline) |

---

