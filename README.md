# Bonga Survey — User & Operator Guide

An SMS-first survey builder and response tracker built with Laravel 12, Inertia React v2, and Tailwind CSS v4. Create surveys, invite contacts or groups, collect SMS responses, and analyze results.

## Features
- Survey builder with branching logic and scheduling
- AI-assisted survey generation (draft and apply)
- SMS webhook ingestion for inbound replies
- Phonebook: contacts, groups, and mappings
- Dashboard and detailed responses views
- Light/dark theme, responsive UI

## Technology Stack
- Backend: PHP 8.2+/8.3+, Laravel 12, Fortify (auth), Sanctum (SPA/API auth)
- SPA: Inertia v2 + React 19 + TypeScript
- Styling: Tailwind CSS v4, Radix UI primitives
- Tooling: Vite 7, ESLint 9, Prettier 3, Laravel Pint, Rector
- Testing: Pest v4 (with Laravel plugin)

See DEVELOPER_GUIDE.md for deeper technical details.

## Quick Start
1. Prerequisites
   - PHP 8.2+ with extensions required by Laravel
   - Composer, Node.js 20+ and npm
   - SQLite (default) or another database supported by Laravel

2. Install dependencies
   ```bash
   composer install
   npm ci
   ```

3. Environment and app key
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. Database setup (SQLite by default)
   ```bash
   php artisan migrate --force
   ```

   Alternatively, use the predefined setup script:
   ```bash
   composer run setup
   ```

5. Run the app (development)
   - Client-only SPA: `composer run dev`
   - With Inertia SSR: `composer run dev:ssr`

   Open the printed local URL to access the app. If you don’t see frontend changes, run `npm run dev` or `npm run build`.

## Authentication
- Email/password via Fortify
- Optional email verification for some routes

## SMS Webhook
- Endpoints: `/sms/incoming` and `/sms/webhook`
- Accepts GET/POST without CSRF; extracts flexible `phone` and `message` keys
- Processes via `App\Actions\Survey\HandleIncomingSurveyMessage`

Configure your SMS provider to POST to one of these endpoints.

## Surveys
- Create/edit surveys (name, dates, trigger word, invitation/completion messaging)
- Add questions with options; reorder and set branching logic
- Add recipients by contact or group; schedule or publish
- View responses and per-contact details

## Phonebook
- Manage Contacts
- Manage Groups
- Map Contacts to Groups (many-to-many via maps)

## Scripts
- `composer run dev` — PHP server, queue worker, Vite
- `composer run dev:ssr` — Above plus SSR and logs
- `composer test` — Lint + run tests (Pest)
- `composer format` — Rector then Pint formatting
- `npm run dev` — Vite dev server
- `npm run build` — Production build (client)
- `npm run build:ssr` — Build client + SSR bundle
- `npm run lint` — ESLint

## Testing
- Run all tests: `php artisan test --compact`
- Filter tests: `php artisan test --compact --filter=Survey`

## Troubleshooting
- Vite manifest error: run `npm run build` or `npm run dev`
- Styling not applied: ensure Vite is running and `resources/css/app.css` is imported
- 419 CSRF on SMS webhooks: use the `/sms/*` endpoints which explicitly disable CSRF

## License
Private project. All rights reserved unless stated otherwise.
