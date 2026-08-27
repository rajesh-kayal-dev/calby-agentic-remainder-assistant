# Calby Landing Page Architecture

This document describes the component architecture, folder organization, performance considerations, and styling conventions for the new Calby marketing landing page.

---

## 1. Directory Structure

Marketing components are organized under `client/src/components/marketing/landing/` by section:

```text
client/src/
├── app/
│   ├── page.tsx                           # Main marketing landing route
│   └── layout.tsx                         # Root layout with SEO metadata & fonts
│
├── components/
│   ├── marketing/
│   │   └── landing/
│   │       ├── navbar/
│   │       │   └── landing-navbar.tsx     # Responsive, sticky/accessible navbar
│   │       ├── hero/
│   │       │   ├── landing-hero.tsx       # Primary headline & CTA
│   │       │   └── hero-chat-mockup.tsx   # Realistic multi-domain conversational visual
│   │       ├── product-demo/
│   │       │   └── landing-product-demo.tsx # Interactive-style 3-pane browser mockup
│   │       ├── features/
│   │       │   └── landing-features.tsx   # 6 core capability cards (Calendar, Tasks, Money, Reminders, Contacts, Reports)
│   │       ├── conversations/
│   │       │   └── landing-conversations.tsx # Conversational intelligence examples
│   │       ├── memory/
│   │       │   └── landing-memory.tsx     # Context continuity over time ("Tell Calby once")
│   │       ├── reports/
│   │       │   └── landing-reports.tsx    # Report generator, Google Docs/Sheets & scheduling
│   │       ├── integrations/
│   │       │   └── landing-integrations.tsx # Google, Gmail, Telegram, WhatsApp & 12 LLM providers
│   │       ├── security/
│   │       │   └── landing-security.tsx   # Verified security boundaries & data isolation
│   │       ├── use-cases/
│   │       │   └── landing-use-cases.tsx  # Persona-based real scenarios
│   │       ├── cta/
│   │       │   └── landing-final-cta.tsx  # High-impact concluding CTA
│   │       └── footer/
│   │           └── landing-footer.tsx     # Structured footer with updated navigation
│   └── ui/
│       ├── CalbyBackground.tsx            # Background ambient mesh
│       └── ScrollReveal.tsx               # Lightweight scroll reveal animation wrapper
```

---

## 2. Design System & Styling Conventions

1. **Aesthetics**:
   - Dark background: `bg-zinc-950` with zinc foreground text.
   - Accents: `lime-400` (`#a3e635`), emerald gradients.
   - Glassmorphism: `glass-card` (`rgba(24, 24, 27, 0.6)` with `backdrop-blur-md` and `border-white/10`).
   - Restrained ambient glows: subtle radial glows to avoid visual noise.
2. **Typography**:
   - Primary: Inter (`--font-sans`).
   - Monospace accents for dates, timestamps, amounts, and code chips.
3. **Motion & Accessibility**:
   - IntersectionObserver-powered `ScrollReveal`.
   - Complete `@media (prefers-reduced-motion: reduce)` support.
   - Keyboard accessible navigation with visible focus rings.

---

## 3. Separation of Concerns

- **Marketing vs. Authenticated Dashboard**:
  - The landing page components are strictly presentational marketing components.
  - No authenticated dashboard code, active API fetching, or Descope session tokens are embedded in public landing components.
  - CTAs route directly to `/sign-in`. Authenticated users navigating to `/` are immediately redirected to `/dashboard`.
