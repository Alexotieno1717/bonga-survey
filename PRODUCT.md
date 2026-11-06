# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

NGO and research field workers collecting data from communities via SMS, often on mobile devices in low-connectivity areas. They need to create surveys quickly, manage contact groups, and track responses without requiring respondents to have smartphones or internet access.

## Product Purpose

Bonga Survey is an SMS-first survey builder and response tracker. It enables field workers to create structured surveys, invite contacts or groups, collect SMS responses, and analyze results — all through a web interface. The core value is speed and simplicity: faster survey creation and deployment than traditional tools, with AI assistance for quick drafting.

## Positioning

Combines the reach of SMS (no smartphone or internet required for respondents) with the speed of AI-assisted survey creation and a clean web dashboard for management and analysis — a tool built for field operations rather than enterprise survey platforms.

## Operating Context

Field workers create surveys between shifts or from base camps, often on a phone or tablet. They manage recurring contact lists organized by groups (communities, regions, demographics). Respondents reply via plain SMS using trigger words. Results are reviewed on a web dashboard, typically after a campaign window closes.

## Capabilities and Constraints

- Survey builder with branching logic and scheduling.
- AI-assisted survey generation (draft and apply).
- SMS webhook ingestion for inbound replies.
- Phonebook with contacts, groups, and many-to-many mappings.
- Dashboard and detailed response views.
- Light/dark theme, responsive UI.
- No special accessibility or compliance requirements beyond standard web practices.

## Evidence on Hand

- Existing codebase with survey, phonebook, and response modules.
- SMS webhook endpoints (`/sms/incoming`, `/sms/webhook`).
- No customer testimonials, case studies, or press assets yet.

## Product Principles

1. Speed over ceremony — surveys should be created and deployed in minutes, not hours.
2. SMS is the channel, not a compromise — design for text-first responses, not as a fallback to web forms.
3. One action per screen — keep the interface focused for field workers on small devices.
4. Data clarity — responses should be readable and analyzable without extra tooling.
