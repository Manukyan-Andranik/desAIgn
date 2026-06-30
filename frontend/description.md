# DesAIgn — Website Redesign Specification
### Pages: Home · About · Pricing · Login/Registration · Profile · Workspace · Pricing Plan (Account)

**Scope note:** This spec covers visual and UX redesign only. All existing functionality, data flows, API behavior, account logic, and feature sets must remain unchanged — this document specifies *how things look and feel*, not what they do. Every screen below maps to an existing page/flow; nothing here proposes new functionality unless explicitly marked "(optional / new)."

---

## 0. Brand Foundations (applies to every page)

The palette shifts the brand from a dark, high-tech aesthetic to a **light, warm, organic** one — still precise and modern, but grounded in natural materials (sage, forest green, terracotta, clay) rather than glass-and-circuitry. Theme is **light-mode by default**.

| Color Name | Hex | Target Usage Share | Role |
|---|---|---|---|
| Off-White | `#F2F2EE` | **64%** | Primary background — page body, app shell, card interiors. The dominant surface everywhere. |
| Terracotta / Rust | `#AE5A40` | **6%** | Secondary structural color — section bands, secondary buttons, borders, tags, illustrative accents. The "warmth" layer. |
| Dark Forest Green | `#3F5E3B` | **13%** | Primary typography color (headings + body), icons, nav text — the "ink" of the brand. High contrast against Off-White. |
| Muted Medium Green | `#7A9679` | **8%** | Supporting UI — input borders, dividers, secondary icons, inactive states, muted text. |
| Vibrant Orange | `#F18A31` | **5%** | Primary accent — CTA buttons, active states, AI-highlight moments, focus rings. The "magic"/energy color (replaces the old Electric Cyan role). |
| Light Sage Green | `#CEDBC4` | **4%** | Tertiary accent — hover fills, subtle card backgrounds, success states, soft highlight panels. |

**How the percentages translate to UI weight:**
- Backgrounds (page, cards, panels) → **Off-White**, by far the majority surface.
- Headings/body copy → **Dark Forest Green** (not pure black) for a softer, organic contrast against Off-White.
- Primary CTA buttons / key interactive highlights → **Vibrant Orange**.
- Secondary buttons, dividers, section bands, tags, image-frame accents → **Terracotta/Rust**.
- Borders, icon strokes, secondary/disabled states, captions → **Muted Medium Green**.
- Hover states, soft highlight chips, success/positive feedback, subtle card tints → **Light Sage Green**.

| Token | Old role (deprecated) | New equivalent |
|---|---|---|
| Obsidian Black background | dark primary bg | **Off-White** primary bg |
| Graphite Gray cards/panels | dark secondary bg | **Off-White** card with a thin **Muted Medium Green** border, or a **Light Sage Green** tint for emphasis |
| Electric Cyan (CTA/highlight) | cyan accent | **Vibrant Orange** |
| Soft Teal (secondary accent/hover) | teal accent | **Terracotta/Rust** (structural) / **Light Sage Green** (hover) |
| Minimalist White (text) | light text on dark | **Dark Forest Green** text on light |

**Typography (unchanged):**
- Headings/Logo: Space Grotesk (or Clash Display), Bold/Medium, set in **Dark Forest Green**
- Body/UI: Inter, Regular/Medium, set in **Dark Forest Green** (body) / **Muted Medium Green** (secondary/caption text)

**Signature effects (re-themed for light mode):**
- **Soft panels instead of glassmorphism-on-dark:** translucent Off-White panels with backdrop-blur and a subtle **Muted Medium Green** hairline border, floating over architectural imagery — same layered, "digital-meets-physical" feeling, adapted for a light surface.
- **Micro-interactions:** hovering a material swatch triggers a soft **Vibrant Orange** glow/border (the "AI scanning" moment), rather than cyan.
- **Motion:** subtle, fast (150–250ms ease-out), precise rather than bouncy.

---

## 1. Home (Marketing Landing Page)

**Goal:** Convert visitors (architects, real estate agents, homeowners) into signups by demonstrating the "magic" of instant AI redesign within seconds of landing.

**Structure (top to bottom):**

1. **Sticky Nav Bar** — Off-White, blurred/elevated on scroll with a thin Muted Medium Green bottom border. Logo left (Dark Forest Green wordmark); links (Product, Pricing, Gallery, About) in Dark Forest Green; "Log In" (ghost, Dark Forest Green text) + "Start Designing for Free" (solid **Vibrant Orange**, Off-White text) right.
2. **Hero**
   - Headline (Dark Forest Green, Space Grotesk Bold): "Redesign Reality in Seconds."
   - Subheadline (Muted Medium Green): "Transform architectural images into interactive, editable designs with simple AI-powered editing."
   - **Interactive Before/After slider** (full-bleed, draggable handle in **Vibrant Orange**) — dull room/facade on left, AI-redesigned version on right, framed with a thin Terracotta border. Preserve existing slider functionality, only restyle handle, shadow, and frame.
   - Primary CTA: "Start Designing for Free" (solid Vibrant Orange, Off-White text)
   - Secondary CTA: ghost-outline (Dark Forest Green border/text) "Watch Demo" or "See Examples"
3. **Trust strip** — logos/usage stats in Muted Medium Green, single row, low visual weight, on Off-White.
4. **Features Grid** (3 cards, Off-White cards with Light Sage Green tint background + Muted Medium Green border; on hover, border shifts to Vibrant Orange):
   - Facades — building exterior icon (Dark Forest Green)
   - Landscaping — leaf/tree icon
   - Interiors & Furniture — modern chair icon
   - Each card: icon, short headline (Dark Forest Green), one-line description (Muted Medium Green).
5. **How It Works** (3-step horizontal flow, connected by a thin Terracotta line with Vibrant Orange step markers):
   1. Upload a Photo
   2. Select AI Prompts
   3. Export Design
6. **Gallery / Social Proof** — masonry grid of user-generated before/afters; hover reveals a Vibrant Orange border + zoom; clicking opens lightbox (preserve existing gallery data/loading logic).
7. **Audience callout** (optional) — three short blurbs targeting Professionals / Real Estate / Enthusiasts, each with a one-line value prop, set on Light Sage Green chips.
8. **Final CTA band** — full-width **Terracotta/Rust** panel, Off-White headline text, Vibrant Orange button (or Off-White button with Terracotta text for contrast).
9. **Footer** — Off-White or very light Sage tint, Dark Forest Green links in Inter, organized in columns (Product, Company, Legal, Social).

---

## 2. About

**Goal:** Build trust and convey vision/mission to professional buyers (architects, developers) who need credibility before adopting a tool for client-facing work.

**Structure:**

1. **Page header** — bold statement of mission in Dark Forest Green: "We bridge imagination and reality." Subtext in Muted Medium Green expands on the brand mission.
2. **Vision/Mission block** — two-column layout: left = Mission statement, right = Vision statement, separated by a thin **Vibrant Orange** vertical rule.
3. **"Why DesAIgn" / Story section** — narrative on replacing tedious rendering with instant AI collaboration; supporting imagery can use a Terracotta/Sage duotone treatment instead of cyan-on-black line art.
4. **Team section** (if applicable) — grid of team cards on Light Sage Green tint, circular photo, name (Dark Forest Green), role (Muted Medium Green); Vibrant Orange ring on hover.
5. **Values strip** — 3–4 short value pillars (Precision, Speed, Accessibility, Empowerment) as icon (Terracotta) + label (Dark Forest Green), horizontal row.
6. **Press/partners logos** (optional, if existing), desaturated/muted to sit quietly on Off-White.
7. **CTA band** — same Terracotta CTA band as Home, reused as a shared component.
8. **Footer** — shared global footer component.

---

## 3. Pricing (Marketing Page)

**Goal:** Clearly communicate tiers and convert visitors into trial/paid signups. Preserve existing plan names, prices, feature lists, and billing toggle logic — redesign presentation only.

**Structure:**

1. **Page header** — "Plans for every kind of vision." Subtext in Muted Medium Green (no credit card for free tier, cancel anytime, etc., matching existing copy).
2. **Billing toggle** — Monthly / Annual switch, pill-shaped, **Vibrant Orange** active state on a Light Sage Green track, small Terracotta "Save X%" badge on Annual.
3. **Pricing cards** (3–4 tiers side by side, equal height):
   - Off-White cards with Muted Medium Green border; the recommended/most-popular tier gets a **Vibrant Orange** border + glow + "Most Popular" ribbon (Terracotta fill, Off-White text).
   - Each card: tier name (Dark Forest Green), price (large, Space Grotesk, Dark Forest Green), short description, feature checklist (Dark Forest Green checkmarks), CTA button (solid Vibrant Orange for highlighted tier, outline Dark Forest Green for others).
4. **Feature comparison table** (below cards) — Off-White rows alternating with a faint Light Sage Green tint, sticky header row in Dark Forest Green, checkmarks in Vibrant Orange / dashes in Muted Medium Green.
5. **FAQ accordion** — Off-White panels with Muted Medium Green hairline dividers, expand/collapse with a Terracotta chevron rotation.
6. **CTA band** — shared Terracotta component.
7. **Footer** — shared global footer.

---

## 4. Login / Registration

**Goal:** Fast, frictionless entry — minimal distraction, maximum trust. Preserve all existing auth logic (SSO providers, validation rules, error states, password requirements) exactly as-is.

**Structure:**

- **Split-screen layout:**
   - Left (60%): full-bleed architectural/AI-generated hero image with a soft Off-White-to-transparent gradient overlay on the form-side edge so it doesn't compete with the form.
   - Right (40%): Off-White panel (or a translucent Off-White glass panel over the image on mobile/single-column), containing the form.
- **Form (Login)**
   - Logo at top (Dark Forest Green), centered or left
   - Headline: "Welcome back" (Dark Forest Green)
   - Email + Password fields — Off-White inputs, Muted Medium Green border, Vibrant Orange focus ring, Dark Forest Green text, Sage-tinted placeholder text
   - "Forgot password?" link, Terracotta
   - Primary CTA: solid **Vibrant Orange** "Log In" button, full width, Off-White text
   - Divider "or continue with" + SSO buttons (keep existing providers), outline style with Muted Medium Green border and provider icons
   - Footer link: "Don't have an account? Sign up" (Terracotta link)
- **Form (Registration)** — same shell, fields per existing requirements (name, email, password, password confirmation, terms checkbox); inline validation messages in Rust/Terracotta (reads as "caution" within this palette, no separate red needed) on a Light Sage Green or pale Off-White background; terms/privacy links in Terracotta.
- **Error/loading states:** preserve existing logic; restyle only — error banner as a soft panel with a Terracotta left border and Terracotta text; loading state shows a Vibrant Orange spinner inside the button (button text fades, spinner fades in).

---

## 5. Profile

**Goal:** Let users manage account identity, preferences, and settings with the same clarity as a professional design tool — not a generic SaaS settings page.

**Structure:**

1. **Page shell** — left-hand vertical settings nav (Off-White sidebar, Light Sage Green tint on the active item): Profile, Account, Pricing Plan, Notifications, Integrations, Security, etc. (mirror existing settings sections — do not add/remove tabs).
2. **Profile tab (default view):**
   - Avatar uploader — circular, **Vibrant Orange** ring on hover/edit state, soft overlay with camera icon on hover
   - Name, email, role/title (e.g., "Architect," "Homeowner") fields — same input styling as Login
   - Save button — solid Vibrant Orange, appears/activates only when a field changes (preserve existing dirty-state logic)
3. **Account/Security tab** — password change, connected SSO accounts, 2FA toggle (Vibrant Orange "on" state on Muted Medium Green track), session/device list if currently present.
4. **Notifications tab** — toggle list (same Vibrant Orange/Muted Green toggle) for existing notification preferences, grouped under clear Dark Forest Green subheadings.
5. **Danger zone** (delete account, etc.) — visually separated at the bottom, **Terracotta/Rust** accents (instead of orange) to signal "serious but on-brand," requires existing confirmation modal (Off-White panel, dark-tinted overlay backdrop).

---

## 6. Workspace (Core App / AI Editor)

**Goal:** This is the product itself — the "operating system" screen where users upload, prompt, and iterate. Design must get out of the way of the imagery while keeping AI tools fast to reach. **Preserve all existing tool functionality, prompt logic, undo/redo, export pipeline, and canvas behavior — this is a UI skin only.**

**Structure:**

1. **Top bar** (Off-White, soft shadow on scroll) — Logo/back-to-dashboard left, project name (editable inline, Dark Forest Green) center, Export/Share/Save actions right (Export as solid Vibrant Orange button, others as ghost/outline icons in Dark Forest Green).
2. **Main canvas** (center, largest area) — neutral Off-White/light gray surround so the architectural image stays the clear focal point; canvas itself shows the working image at full clarity (no tint/overlay on the image itself).
3. **Left tool rail** — slim icon sidebar (Off-White with Muted Medium Green border) for mode switches (Facade / Landscaping / Interior / Furniture, matching the Home feature-grid icons for brand consistency); active tool gets a **Vibrant Orange** left-border indicator + icon glow.
4. **Right panel** — soft translucent Off-White panel (backdrop-blur, Muted Medium Green hairline border) floating over the canvas edge, containing:
   - AI prompt input box (Off-White fill, Vibrant Orange focus glow, "Describe your redesign…" placeholder in Sage)
   - Material/style swatches — hovering a material (wood, marble, etc.) triggers the signature micro-interaction: cursor change + subtle glowing **Vibrant Orange** border around the swatch
   - Generation history / variations strip — horizontal thumbnail row, selected variation gets a Vibrant Orange outline
5. **Bottom bar (optional, if present)** — before/after toggle or opacity slider, styled consistently with the Home hero slider (same Vibrant Orange handle/Terracotta track treatment) for brand cohesion.
6. **Loading/generating state** — Vibrant Orange pulse/scan-line animation across the canvas edge, reinforcing the "AI scanning" motif; underlying generation/polling logic untouched.
7. **Empty state** (no image uploaded yet) — centered soft panel with drag-and-drop zone, dashed **Terracotta** border, Dark Forest Green upload icon, "Upload a Photo to begin" — echoes Home's "How It Works" step 1 for narrative consistency.

---

## 7. Pricing Plan (Account / Billing Screen)

**Goal:** In-app billing management — distinct from the marketing Pricing page, but visually consistent with it. Preserve all existing billing logic (Stripe/payment provider integration, invoice history, upgrade/downgrade rules, proration).

**Structure:**

1. Lives inside the Profile/Settings shell (see Section 5) as the "Pricing Plan" tab.
2. **Current plan card** — Off-White card with a **Vibrant Orange** accent border, shows plan name, renewal date, price, and a "Manage / Upgrade" Vibrant Orange button.
3. **Plan comparison** — reuse the same card/table component from the marketing Pricing page (Section 3) so users see a consistent visual when upgrading, with the current tier marked by a Vibrant Orange check badge instead of a CTA.
4. **Payment method** — card-on-file display (masked number, brand icon), "Update payment method" outline (Dark Forest Green) button, opens existing modal/flow unchanged.
5. **Invoice/billing history** — simple table, Off-White with faint Light Sage Green alternating rows, downloadable invoice links in Terracotta.
6. **Cancel/downgrade flow** — preserve existing confirmation steps; style as a soft modal with a Terracotta/Rust confirm button (visually distinct from the orange "positive" actions used everywhere else).

---

## 8. Shared Components Library (build once, reuse everywhere)

To keep the redesign consistent and minimize engineering effort:

- **Buttons:** Primary (solid Vibrant Orange / Off-White text), Secondary (solid or outline Terracotta), Ghost (text-only, Dark Forest Green), Destructive/Caution (Terracotta-Rust outline or fill)
- **Inputs:** Off-White fill, Muted Medium Green border, Vibrant Orange focus ring, Dark Forest Green text, Sage-tinted placeholder
- **Cards:** Off-White, 12–16px radius, Muted Medium Green hairline border by default, Vibrant Orange border for "highlighted/active" state, Light Sage Green tint for soft/secondary cards
- **Soft panel (glass-on-light):** translucent Off-White (≈85–90% opacity) + backdrop-blur, Muted Medium Green hairline border — used for nav-on-scroll, floating workspace panels, modals
- **Toggle switch:** Vibrant Orange when on, Muted Medium Green track when off
- **Before/After slider:** Vibrant Orange handle, Terracotta track — reused across Home hero and Workspace comparison tool
- **Loading/scan animation:** thin animated Vibrant Orange line or pulse, used for AI generation states across Workspace and Gallery loads
- **Footer & CTA band:** Terracotta CTA band, Off-White/light footer — identical across Home, About, Pricing

---

## 9. Color Usage Discipline (keeping to the target percentages)

Because Off-White must dominate (~64%) and the two greens + orange + terracotta are meant to stay as accents (5–13% each), the most common implementation mistake would be over-using Vibrant Orange or Terracotta as large fill areas. Guidelines to stay on-ratio:

- Never use Vibrant Orange or Terracotta as a full-page or full-section background except the single Final CTA band (Terracotta) — keep all other large surfaces Off-White.
- Dark Forest Green is for **text and icons**, not backgrounds — this is how an 8% share still reads as "everywhere" (it's in every headline) without overwhelming the palette.
- Light Sage Green and Muted Medium Green should stay confined to borders, tints, and secondary states — never a primary CTA color.
- If a screen feels "heavy" or "saturated," the first fix is almost always reducing Terracotta/Orange fill area and increasing Off-White negative space, not changing the palette itself.

---

## 10. Implementation Notes

- This is a **visual/UX redesign only** — no new data models, endpoints, or features are implied by this spec.
- Any place this document references "icons," "copy," or "tabs," default to the **existing** set already in production; do not add or remove items unless your team decides to scope that separately.
- Recommend implementing the Section 8 component library first, then applying it page-by-page, since most pages reuse the same primitives (buttons, cards, panels, inputs).