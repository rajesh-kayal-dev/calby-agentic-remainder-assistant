# Calby Landing Page Audit

## 1. Executive Summary

This audit evaluates the legacy marketing landing page of Calby against its expanded capabilities as an agentic conversational personal assistant.

The original landing page was created when Calby was exclusively a Google Calendar assistant. Consequently, the messaging, visual mockups, feature cards, and value proposition centered solely around calendar scheduling ("Your calendar on autopilot", "Experience the Calby Interface", "Works with the calendar you already use").

Calby now provides cross-domain personal assistant intelligence spanning **Calendar + Tasks + Money + Reminders + Contacts + Reports + Multi-Channel Notifications + Multi-LLM Provider Support**.

---

## 2. Current Implementation Audit

### 2.1 Route & Entry Point
- **Route**: `client/src/app/page.tsx` (`"use client"`)
- **Authentication Guard**: Checks `useSession()`; redirects authenticated users to `/dashboard`.
- **Layout / Styling**: Wraps sections inside a `min-h-svh bg-zinc-950` shell with `CalbyBackground` (WebGL/UnicornStudio ambient mesh) and standard Next.js fonts (`--font-sans` Inter).

### 2.2 Existing Component Inventory (`client/src/components/landing/`)

| Component | Current Positioning | Assessment & Upgrade Path |
| :--- | :--- | :--- |
| **`Navbar.tsx`** | Calendar assistant links (Product, How it works, Integrations) | **Keep visual identity**; update navigation anchors (`#product`, `#capabilities`, `#how-it-works`, `#integrations`, `#security`), ensure accessible mobile menu and direct `/sign-in` routing. |
| **`Hero.tsx`** | "Your calendar on autopilot" | **Replace**: Reposition to "Tell Calby what needs to get done." Show real conversational assistant visual with cross-domain examples (Money + Reminders + Tasks). |
| **`HeroProductVisual.tsx`** | Calendar agenda + simple meeting chat | **Replace**: Create rich, multi-domain conversational bubble visual representing real Calby interactions. |
| **`TrustedBy.tsx`** | Infinite ticker of audience types ("Startups, Freelancers, Consultants") | **Retain/Refine**: Reusable as audience ticker, keeping it clean and without fake customer claims. |
| **`ProductShowcase.tsx`** | 3-column calendar-centric mockup | **Replace**: Create comprehensive browser-style product demo featuring sidebar navigation (Assistant, Calendar, Tasks, Money, Reminders, Contacts, Reports), center conversation, and right context panel. |
| **`Features.tsx`** | 3 calendar cards (Find time, Schedule meetings, Reschedule) | **Replace**: Create 6 core capability cards (Calendar, Tasks, Money, Reminders, Contacts, Reports). |
| **`HowItWorks.tsx`** | 4 calendar-only steps | **Superseded**: Modernized into the new IA flow (Conversational Intelligence & Memory). |
| **`AIAssistant.tsx`** | 3 simple calendar prompts | **Superseded**: Replaced by dedicated Conversational Intelligence & Memory / Follow-up sections. |
| **`Integrations.tsx`** | Google Calendar + Descope only | **Expand**: Accurately display Google Calendar, Gmail, Telegram, WhatsApp, Google Docs, and Google Sheets integrations. |
| **`FinalCTA.tsx`** | "Give your calendar less work" | **Replace**: "Stop keeping everything in your mind. Tell Calby what needs to happen." |
| **`Footer.tsx`** | Calendar description and outdated links | **Update**: Refresh branding copy, links to sections, security, and sign-in routes. |

---

## 3. Product Capabilities vs. Landing Page Mapping

| Capability in Codebase | Present on Old Landing Page? | Planned on New Landing Page? |
| :--- | :--- | :--- |
| **AI Conversational Engine** | Partial (Calendar only) | **Full (Cross-domain assistant)** |
| **Google Calendar** | Yes | **Yes (1 of 6 core domains)** |
| **Tasks & Task Lists** | No | **Yes (Core feature card & demo)** |
| **Money / Pending Ledger** | No | **Yes (Hero, demo, memory & feature)** |
| **Reminders (Scheduler)** | No | **Yes (Core feature card & memory)** |
| **Contacts & Balances** | No | **Yes (Core feature card & context)** |
| **Reports (Docs/Sheets)** | No | **Yes (Dedicated Reports + Automation section)** |
| **Multi-Channel (Gmail, TG, WA)** | No | **Yes (Integrations & Automation)** |
| **12 LLM Providers Support** | No | **Yes (Integrations & Security subsection)** |
| **OAuth Security & Isolation** | Partial (Descope mentioned) | **Yes (Verified security section)** |

---

## 4. Reusable Assets & Styling
- **Color Palette**: Dark theme (`#09090b`), Lime primary accent (`#a3e635`), Emerald secondary gradients, glass-card backgrounds with `rgba(24, 24, 27, 0.6)`.
- **Motion System**: CSS-accelerated `.reveal-init`, `.reveal-scale-init`, `ScrollReveal.tsx`, and `@media (prefers-reduced-motion)` fallbacks.
- **Logos & Icons**: `/logo.png`, `/Calby_text.png`, `/Calby.png`, Lucide React icons.
