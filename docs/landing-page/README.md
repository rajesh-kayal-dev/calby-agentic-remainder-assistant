# Calby Marketing Landing Page Documentation

This directory contains the documentation suite for the marketing landing page of Calby.

---

## Documentation Index

- **[audit.md](audit.md)**: Initial audit of the legacy calendar-centric landing page, reusable assets, and capability gap analysis.
- **[architecture.md](architecture.md)**: Component hierarchy, file structure under `client/src/components/marketing/landing/`, design system tokens, and performance conventions.
- **[content-map.md](content-map.md)**: Complete section-by-section copywriting, structural elements, visual assets, and message hierarchy.
- **[verification.md](verification.md)**: Automated type checking, build results, test suite status, browser subagent inspections, and responsive checks.

---

## Component Structure

All landing page marketing components reside in:
`client/src/components/marketing/landing/`

```text
client/src/components/marketing/landing/
├── navbar/
│   └── landing-navbar.tsx         # Top navigation header & mobile drawer
├── hero/
│   ├── landing-hero.tsx           # Primary headline & CTA section
│   └── hero-chat-mockup.tsx       # Realistic conversational mockup
├── audience/
│   └── landing-audience-ticker.tsx # Audience persona ticker
├── product-demo/
│   └── landing-product-demo.tsx   # 3-pane browser-style workspace mockup
├── features/
│   └── landing-features.tsx       # 6 core capability cards
├── conversations/
│   └── landing-conversations.tsx  # Conversational intelligence examples
├── memory/
│   └── landing-memory.tsx         # Context continuity & follow-up timeline
├── reports/
│   └── landing-reports.tsx        # Reports digest, Google Docs/Sheets & scheduling
├── integrations/
│   └── landing-integrations.tsx   # Connected tools & 12 LLM providers
├── security/
│   └── landing-security.tsx       # 4 verified security pillars
├── use-cases/
│   └── landing-use-cases.tsx      # Persona-based real scenarios
├── cta/
│   └── landing-final-cta.tsx      # Concluding CTA section
└── footer/
    └── landing-footer.tsx         # Global footer
```

---

## Modifying Content or Adding New Sections

1. **Copywriting & Cards**: Edit the respective component file under `client/src/components/marketing/landing/<section>/`.
2. **Page Assembly**: Section order is defined in `client/src/app/page.tsx`.
3. **Design Tokens**: Standardized on Tailwind v4 and `:root` theme colors in `client/src/app/globals.css`.
