---
name: ui-ux-pro-max
description: UI/UX design intelligence with searchable database
---

# ui-ux-pro-max

Comprehensive design guide for web, mobile, and desktop applications. Contains 67 styles, 161 color palettes, 57 font pairings, 99 UX guidelines, and 25 chart types across 22 technology stacks. Searchable database with priority-based recommendations.

> **Platform:** Gemini CLI  
> **Skill location:** `.gemini/skills/ui-ux-pro-max/`  
> **Script path:** `.gemini/skills/ui-ux-pro-max/scripts/search.py`

---

# Prerequisites

Check if Python is installed:

```bash
python3 --version || python --version
```

If Python is not installed, install it based on your OS:

**macOS:**
```bash
brew install python3
```

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install python3
```

**Windows:**
```powershell
winget install Python.Python.3.12
```

> **Note:** On Windows, use `python` instead of `python3` to run scripts (e.g., `python scripts/search.py` instead of `python3 scripts/search.py`).

---

## Installation

Install the skill using the CLI:

```bash
# Install CLI globally
npm install -g ui-ux-pro-max-cli

# Go to your project
cd /path/to/your/project

# Install for Gemini CLI
uipro init --ai gemini
```

This creates the `.gemini/skills/ui-ux-pro-max/` directory with all required files.

**Global install (available for all projects):**
```bash
uipro init --ai gemini --global
```

---

## How to Use This Skill

This skill activates automatically when you request any UI/UX work in Gemini CLI. Just chat naturally:

```
Build a landing page for my SaaS product
Create a dashboard for healthcare analytics
Design a portfolio website with dark mode
Make a mobile app UI for e-commerce
Build a fintech banking app with dark theme
```

Use this skill when the user requests any of the following:

| Scenario | Trigger Examples | Start From |
|----------|-----------------|------------|
| **New project / page** | "Build a landing page", "Create a dashboard" | Step 1 → Step 2 (design system) |
| **New component** | "Create a pricing card", "Add a modal" | Step 3 (domain search: style, ux) |
| **Choose style / color / font** | "What style fits a fintech app?", "Recommend color palette" | Step 2 (design system) |
| **Review existing UI** | "Review this page for UX issues", "Check accessibility" | Pre-delivery checklist |
| **Fix a UI bug** | "Button hover is broken", "Layout shifts on load" | Step 3 (domain search: ux) |
| **Improve / optimize** | "Make this faster", "Improve mobile experience" | Step 3 (domain search: ux, react) |
| **Implement dark mode** | "Add dark mode support" | Step 3 (domain: style "dark mode") |
| **Add charts / data viz** | "Add an analytics dashboard chart" | Step 3 (domain: chart) |
| **Stack best practices** | "React performance tips", "SwiftUI navigation" | Step 4 (stack search) |

---

## Workflow

Follow this 4-step workflow for every UI/UX request:

### Step 1: Analyze User Requirements

Extract key information from the user request:
- **Product type**: Entertainment (social, video, music, gaming), Tool (scanner, editor, converter), Productivity (task manager, notes, calendar), or hybrid
- **Target audience**: Consider age group and usage context (commute, leisure, work)
- **Style keywords**: playful, vibrant, minimal, dark mode, content-first, immersive, etc.
- **Stack**: The project's technology stack (React, Next.js, Vue, SwiftUI, etc.)

---

### Step 2: Generate Design System (REQUIRED)

**Always start with `--design-system`** to get comprehensive recommendations with reasoning:

```bash
python3 .gemini/skills/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
```

This command:
1. Searches all domains in parallel (product, style, color, landing, typography)
2. Applies 161 reasoning rules from `ui-reasoning.csv` to select best matches
3. Returns a complete design system: pattern, style, colors, typography, effects
4. Includes anti-patterns to avoid for the specific industry

**Example:**
```bash
python3 .gemini/skills/ui-ux-pro-max/scripts/search.py "beauty spa wellness service" --design-system -p "Serenity Spa"
```

**Example output:**
```
+----------------------------------------------------------------------------------------+
|  TARGET: Serenity Spa - RECOMMENDED DESIGN SYSTEM                                      |
+----------------------------------------------------------------------------------------+
|  PATTERN: Hero-Centric + Social Proof                                                  |
|  STYLE: Soft UI Evolution                                                              |
|  COLORS:                                                                               |
|     Primary:    #E8B4B8 (Soft Pink)                                                    |
|     Secondary:  #A8D5BA (Sage Green)                                                   |
|     CTA:        #D4AF37 (Gold)                                                         |
|     Background: #FFF5F5 (Warm White)                                                   |
|     Text:       #2D3436 (Charcoal)                                                     |
|  TYPOGRAPHY: Cormorant Garamond / Montserrat                                           |
|  AVOID: Bright neon colors, Harsh animations, AI purple/pink gradients                 |
+----------------------------------------------------------------------------------------+
```

---

### Step 2b: Persist Design System (Master + Overrides Pattern)

To save the design system for hierarchical retrieval across sessions:

```bash
python3 .gemini/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Project Name"
```

This creates:
- `design-system/MASTER.md` — Global Source of Truth with all design rules
- `design-system/pages/` — Folder for page-specific overrides

**With page-specific override:**
```bash
python3 .gemini/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Project Name" --page "dashboard"
```

This also creates:
- `design-system/pages/dashboard.md` — Page-specific deviations from Master

**How hierarchical retrieval works:**
1. When building a specific page (e.g., "Checkout"), first check `design-system/pages/checkout.md`
2. If the page file exists, its rules **override** the Master file
3. If not, use `design-system/MASTER.md` exclusively

**Context-aware retrieval prompt:**
```
I am building the [Page Name] page. Please read design-system/MASTER.md.
Also check if design-system/pages/[page-name].md exists.
If the page file exists, prioritize its rules.
If not, use the Master rules exclusively.
Now, generate the code...
```

---

### Step 3: Supplement with Detailed Searches (as needed)

After getting the design system, use domain searches to get additional details:

```bash
python3 .gemini/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain> [-n <max_results>]
```

**When to use detailed searches:**

| Need | Domain | Example |
|------|--------|---------|
| Product type patterns | `product` | `--domain product "entertainment social"` |
| More style options | `style` | `--domain style "glassmorphism dark"` |
| Color palettes | `color` | `--domain color "entertainment vibrant"` |
| Font pairings | `typography` | `--domain typography "playful modern"` |
| Chart recommendations | `chart` | `--domain chart "real-time dashboard"` |
| UX best practices | `ux` | `--domain ux "animation accessibility"` |
| Landing structure | `landing` | `--domain landing "hero social-proof"` |
| React/Next.js perf | `react` | `--domain react "rerender memo list"` |
| App interface a11y | `web` | `--domain web "accessibilityLabel touch safe-areas"` |
| AI prompt / CSS keywords | `prompt` | `--domain prompt "minimalism"` |

---

### Step 4: Stack Guidelines

Get implementation-specific best practices for the user's stack:

```bash
python3 .gemini/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --stack <stack>
```

**Available stacks:**

| Category | Stacks |
|----------|--------|
| **Web (HTML)** | `html-tailwind` (default) |
| **React Ecosystem** | `react`, `nextjs`, `shadcn` |
| **Vue Ecosystem** | `vue`, `nuxtjs`, `nuxt-ui` |
| **Other Web** | `svelte`, `astro`, `angular` |
| **PHP** | `laravel` |
| **3D / Visual** | `three` (Three.js) |
| **Desktop (Java)** | `javafx` |
| **iOS** | `swiftui` |
| **Android** | `jetpack-compose` |
| **Cross-Platform** | `react-native`, `flutter` |

**Examples:**
```bash
python3 .gemini/skills/ui-ux-pro-max/scripts/search.py "form validation" --stack react
python3 .gemini/skills/ui-ux-pro-max/scripts/search.py "responsive layout" --stack html-tailwind
python3 .gemini/skills/ui-ux-pro-max/scripts/search.py "tableview binding" --stack javafx
python3 .gemini/skills/ui-ux-pro-max/scripts/search.py "navigation animation" --stack swiftui
python3 .gemini/skills/ui-ux-pro-max/scripts/search.py "list performance" --stack react-native
```

---

## Search Reference

### Available Domains

| Domain | Use For | Example Keywords |
|--------|---------|------------------|
| `product` | Product type recommendations | SaaS, e-commerce, portfolio, healthcare, beauty, service |
| `style` | UI styles, colors, effects | glassmorphism, minimalism, dark mode, brutalism |
| `typography` | Font pairings, Google Fonts | elegant, playful, professional, modern |
| `color` | Color palettes by product type | saas, ecommerce, healthcare, beauty, fintech, service |
| `landing` | Page structure, CTA strategies | hero, hero-centric, testimonial, pricing, social-proof |
| `chart` | Chart types, library recommendations | trend, comparison, timeline, funnel, pie |
| `ux` | Best practices, anti-patterns | animation, accessibility, z-index, loading |
| `react` | React/Next.js performance | waterfall, bundle, suspense, memo, rerender, cache |
| `web` | App interface guidelines (iOS/Android/React Native) | accessibilityLabel, touch targets, safe areas, Dynamic Type |
| `prompt` | AI prompts, CSS keywords | (style name) |

### Search Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--domain <name>` | Restrict to a specific domain | `--domain style` |
| `--stack <name>` | Stack-specific guidelines | `--stack react` |
| `--design-system` | Full design system generation | `--design-system` |
| `-p "Name"` | Project name for design system | `-p "My App"` |
| `--persist` | Save design system to files | `--persist` |
| `--page "name"` | Page override file | `--page "dashboard"` |
| `-n <num>` | Limit number of results | `-n 5` |
| `-f markdown` | Markdown output format | `-f markdown` |
| `--max-length 0` | Unlimited output length | `--max-length 0` |

---

## Output Formats

The `--design-system` flag supports two output formats:

```bash
# ASCII box (default) — best for terminal display
python3 .gemini/skills/ui-ux-pro-max/scripts/search.py "fintech crypto" --design-system

# Markdown — best for documentation and file persistence
python3 .gemini/skills/ui-ux-pro-max/scripts/search.py "fintech crypto" --design-system -f markdown
```

---

## Example Workflow

**User request:** "Build an AI-powered search homepage."

### Step 1: Analyze Requirements
- Product type: Tool (AI search engine)
- Target audience: End users looking for fast, intelligent search
- Style keywords: modern, minimal, content-first, dark mode
- Stack: Next.js

### Step 2: Generate Design System

```bash
python3 .gemini/skills/ui-ux-pro-max/scripts/search.py "AI search tool modern minimal" --design-system -p "AI Search"
```

### Step 3: Supplement with Detailed Searches

```bash
# More style options
python3 .gemini/skills/ui-ux-pro-max/scripts/search.py "minimalism dark mode" --domain style

# UX best practices for search interaction
python3 .gemini/skills/ui-ux-pro-max/scripts/search.py "search loading animation" --domain ux
```

### Step 4: Stack Guidelines

```bash
python3 .gemini/skills/ui-ux-pro-max/scripts/search.py "performance suspense bundle" --stack nextjs
```

Then synthesize the design system + detailed searches and implement the design.

---

## Available UI Styles (67 Total)

### General Styles (49)

| # | Style | Best For |
|---|-------|----------|
| 1 | Minimalism & Swiss Style | Enterprise apps, dashboards, documentation |
| 2 | Neumorphism | Health/wellness apps, meditation platforms |
| 3 | Glassmorphism | Modern SaaS, financial dashboards |
| 4 | Brutalism | Design portfolios, artistic projects |
| 5 | 3D & Hyperrealism | Gaming, product showcase, immersive |
| 6 | Vibrant & Block-based | Startups, creative agencies, gaming |
| 7 | Dark Mode (OLED) | Night-mode apps, coding platforms |
| 8 | Accessible & Ethical | Government, healthcare, education |
| 9 | Claymorphism | Educational apps, children's apps, SaaS |
| 10 | Aurora UI | Modern SaaS, creative agencies |
| 11 | Retro-Futurism | Gaming, entertainment, music platforms |
| 12 | Flat Design | Web apps, mobile apps, startup MVPs |
| 13 | Skeuomorphism | Legacy apps, gaming, premium products |
| 14 | Liquid Glass | Premium SaaS, high-end e-commerce |
| 15 | Motion-Driven | Portfolio sites, storytelling platforms |
| 16 | Micro-interactions | Mobile apps, touchscreen UIs |
| 17 | Inclusive Design | Public services, education, healthcare |
| 18 | Zero Interface | Voice assistants, AI platforms |
| 19 | Soft UI Evolution | Modern enterprise apps, SaaS |
| 20 | Neubrutalism | Gen Z brands, startups, Figma-style |
| 21 | Bento Box Grid | Dashboards, product pages, portfolios |
| 22 | Y2K Aesthetic | Fashion brands, music, Gen Z |
| 23 | Cyberpunk UI | Gaming, tech products, crypto apps |
| 24 | Organic Biophilic | Wellness apps, sustainability brands |
| 25 | AI-Native UI | AI products, chatbots, copilots |
| 26 | Memphis Design | Creative agencies, music, youth brands |
| 27 | Vaporwave | Music platforms, gaming, portfolios |
| 28 | Dimensional Layering | Dashboards, card layouts, modals |
| 29 | Exaggerated Minimalism | Fashion, architecture, portfolios |
| 30 | Kinetic Typography | Hero sections, marketing sites |
| 31 | Parallax Storytelling | Brand storytelling, product launches |
| 32 | Swiss Modernism 2.0 | Corporate sites, architecture, editorial |
| 33 | HUD / Sci-Fi FUI | Sci-fi games, space tech, cybersecurity |
| 34 | Pixel Art | Indie games, retro tools, creative |
| 35 | Bento Grids | Product features, dashboards, personal |
| 36 | Spatial UI (VisionOS) | Spatial computing apps, VR/AR |
| 37 | E-Ink / Paper | Reading apps, digital newspapers |
| 38 | Gen Z Chaos / Maximalism | Gen Z lifestyle, music artists |
| 39 | Biomimetic / Organic 2.0 | Sustainability tech, biotech, health |
| 40 | Anti-Polish / Raw Aesthetic | Creative portfolios, artist sites |
| 41 | Tactile Digital / Deformable UI | Modern mobile apps, playful brands |
| 42 | Nature Distilled | Wellness brands, sustainable products |
| 43 | Interactive Cursor Design | Creative portfolios, interactive |
| 44 | Voice-First Multimodal | Voice assistants, accessibility apps |
| 45 | 3D Product Preview | E-commerce, furniture, fashion |
| 46 | Gradient Mesh / Aurora Evolved | Hero sections, backgrounds, creative |
| 47 | Editorial Grid / Magazine | News sites, blogs, magazines |
| 48 | Chromatic Aberration / RGB Split | Music platforms, gaming, tech |
| 49 | Vintage Analog / Retro Film | Photography, music/vinyl brands |

### Landing Page Styles (8)

| # | Style | Best For |
|---|-------|----------|
| 1 | Hero-Centric Design | Products with strong visual identity |
| 2 | Conversion-Optimized | Lead generation, sales pages |
| 3 | Feature-Rich Showcase | SaaS, complex products |
| 4 | Minimal & Direct | Simple products, apps |
| 5 | Social Proof-Focused | Services, B2C products |
| 6 | Interactive Product Demo | Software, tools |
| 7 | Trust & Authority | B2B, enterprise, consulting |
| 8 | Storytelling-Driven | Brands, agencies, nonprofits |

### BI/Analytics Dashboard Styles (10)

| # | Style | Best For |
|---|-------|----------|
| 1 | Data-Dense Dashboard | Complex data analysis |
| 2 | Heat Map & Heatmap Style | Geographic/behavior data |
| 3 | Executive Dashboard | C-suite summaries |
| 4 | Real-Time Monitoring | Operations, DevOps |
| 5 | Drill-Down Analytics | Detailed exploration |
| 6 | Comparative Analysis Dashboard | Side-by-side comparisons |
| 7 | Predictive Analytics | Forecasting, ML insights |
| 8 | User Behavior Analytics | UX research, product analytics |
| 9 | Financial Dashboard | Finance, accounting |
| 10 | Sales Intelligence Dashboard | Sales teams, CRM |

---

## Industry Reasoning Rules (161 Categories)

The reasoning engine includes specialized rules for:

| Category | Examples |
|----------|----------|
| **Tech & SaaS** | SaaS, Micro SaaS, B2B Service, Developer Tool / IDE, AI/Chatbot Platform, Cybersecurity Platform |
| **Finance** | Fintech/Crypto, Banking, Insurance, Personal Finance Tracker, Invoice & Billing Tool |
| **Healthcare** | Medical Clinic, Pharmacy, Dental, Veterinary, Mental Health, Medication Reminder |
| **E-commerce** | General, Luxury, Marketplace (P2P), Subscription Box, Food Delivery |
| **Services** | Beauty/Spa, Restaurant, Hotel, Legal, Home Services, Booking & Appointment |
| **Creative** | Portfolio, Agency, Photography, Gaming, Music Streaming, Photo/Video Editor |
| **Lifestyle** | Habit Tracker, Recipe & Cooking, Meditation, Weather, Diary, Mood Tracker |
| **Emerging Tech** | Web3/NFT, Spatial Computing, Quantum Computing, Autonomous Drone Fleet |

Each rule includes: recommended pattern, style priority, color mood, typography mood, key effects, and anti-patterns to avoid.

---

## Common Rules for Professional UI

These are frequently overlooked issues that make UI look unprofessional.

> **Scope notice:** The rules below are for App UI (iOS/Android/React Native/Flutter), not desktop-web interaction patterns.

### Icons & Visual Elements

| Rule | Standard | Avoid | Why It Matters |
|------|----------|--------|----------------|
| **No Emoji as Structural Icons** | Use vector-based icons (Phosphor, Heroicons, react-native-vector-icons) | Using emojis (🎨 🚀 ⚙️) for navigation or controls | Emojis are font-dependent, inconsistent across platforms, and uncontrollable via tokens |
| **Vector-Only Assets** | Use SVG or platform vector icons that scale cleanly and support theming | Raster PNG icons that blur or pixelate | Ensures scalability, crisp rendering, and dark/light mode adaptability |
| **Consistent Icon Sizing** | Define icon sizes as design tokens (icon-sm, icon-md = 24pt, icon-lg) | Mixing arbitrary values like 20pt / 24pt / 28pt randomly | Maintains rhythm and visual hierarchy across the interface |
| **Stroke Consistency** | Use a consistent stroke width within the same visual layer (1.5px or 2px) | Mixing thick and thin stroke styles arbitrarily | Inconsistent strokes reduce perceived polish and cohesion |
| **Touch Target Minimum** | Minimum 44×44pt interactive area (use hitSlop if icon is smaller) | Small icons without expanded tap area | Meets accessibility and platform usability standards |
| **Icon Contrast** | Follow WCAG contrast: 4.5:1 for small elements, 3:1 minimum for larger glyphs | Low-contrast icons that blend into the background | Ensures accessibility in both light and dark modes |

**Default icon library:** Phosphor (`@phosphor-icons/react`). If a Phosphor icon doesn't fit, use Heroicons (`@heroicons/react`) as a fallback — keep style consistent (line/filled, stroke weight, corner radius).

### Interaction (App)

| Rule | Do | Don't |
|------|----|-------|
| **Tap feedback** | Clear pressed feedback (ripple/opacity/elevation) within 80–150ms | No visual response on tap |
| **Animation timing** | Micro-interactions ~150–300ms with platform-native easing | Instant transitions or slow animations (>500ms) |
| **Accessibility focus** | Screen reader focus order matches visual order, labels are descriptive | Unlabeled controls or confusing focus traversal |
| **Disabled state clarity** | Use disabled semantics, reduced emphasis, and no tap action | Controls that look tappable but do nothing |
| **Touch target minimum** | ≥44×44pt (iOS) or ≥48×48dp (Android), expand hit area when icon is smaller | Tiny tap targets or icon-only hit areas without padding |
| **Gesture conflict prevention** | One primary gesture per region, avoid nested tap/drag conflicts | Overlapping gestures causing accidental actions |

### Light/Dark Mode Contrast

| Rule | Do | Don't |
|------|----|-------|
| **Text contrast (light)** | Body text contrast ≥4.5:1 against light surfaces | Low-contrast gray body text |
| **Text contrast (dark)** | Primary text ≥4.5:1 and secondary text ≥3:1 on dark surfaces | Dark mode text that blends into background |
| **Token-driven theming** | Semantic color tokens mapped per theme | Hardcoded per-screen hex values |
| **State contrast parity** | Keep interaction states distinguishable in both themes | Defining interaction states for one theme only |

### Layout & Spacing

| Rule | Do | Don't |
|------|----|-------|
| **Safe-area compliance** | Respect top/bottom safe areas for headers, tab bars, CTA bars | Placing fixed UI under notch, status bar, or gesture area |
| **8dp spacing rhythm** | Consistent 4/8dp spacing system for padding/gaps/sections | Random spacing increments with no rhythm |
| **Scroll and fixed element coexistence** | Add bottom/top content insets so lists aren't hidden behind fixed bars | Scroll content obscured by sticky headers/footers |
| **Adaptive gutters by breakpoint** | Increase horizontal insets on larger widths and landscape | Same narrow gutter on all device sizes |

---

## Tips for Better Results

### Query Strategy

- Use **multi-dimensional keywords** — combine product + industry + tone + density: `"entertainment social vibrant content-dense"` not just `"app"`
- Try different keywords for the same need: `"playful neon"` → `"vibrant dark"` → `"content-first minimal"`
- Use `--design-system` first for full recommendations, then `--domain` to deep-dive any specific dimension
- Add `--stack <stack>` for implementation-specific guidance when the target stack is known

### Common Sticking Points

| Problem | What to Do |
|---------|------------|
| Can't decide on style/color | Re-run `--design-system` with different keywords |
| Dark mode contrast issues | Search `--domain ux "color-dark-mode color-accessible-pairs"` |
| Animations feel unnatural | Search `--domain ux "spring-physics easing exit-faster-than-enter"` |
| Form UX is poor | Search `--domain ux "inline-validation error-clarity focus-management"` |
| Navigation feels confusing | Search `--domain ux "nav-hierarchy bottom-nav-limit back-behavior"` |
| Layout breaks on small screens | Search `--domain ux "mobile-first breakpoint-consistency"` |
| Performance / jank | Search `--domain ux "virtualize-lists main-thread-budget debounce-throttle"` |

---

## Pre-Delivery Checklist

Before delivering UI code, verify these items:

> **Scope notice:** This checklist is for App UI (iOS/Android/React Native/Flutter).

### Visual Quality
- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons come from a consistent icon family and style
- [ ] Official brand assets are used with correct proportions and clear space
- [ ] Pressed-state visuals do not shift layout bounds or cause jitter
- [ ] Semantic theme tokens are used consistently (no ad-hoc hardcoded colors)

### Interaction
- [ ] All tappable elements provide clear pressed feedback (ripple/opacity/elevation)
- [ ] Touch targets meet minimum size (≥44×44pt iOS, ≥48×48dp Android)
- [ ] Micro-interaction timing stays in the 150–300ms range with native-feeling easing
- [ ] Disabled states are visually clear and non-interactive
- [ ] Screen reader focus order matches visual order, and interactive labels are descriptive
- [ ] Gesture regions avoid nested/conflicting interactions (tap/drag/back-swipe conflicts)

### Light/Dark Mode
- [ ] Primary text contrast ≥4.5:1 in both light and dark mode
- [ ] Secondary text contrast ≥3:1 in both light and dark mode
- [ ] Dividers/borders and interaction states are distinguishable in both modes
- [ ] Modal/drawer scrim opacity is strong enough (typically 40–60% black)
- [ ] Both themes tested before delivery (not inferred from a single theme)

### Layout
- [ ] Safe areas are respected for headers, tab bars, and bottom CTA bars
- [ ] Scroll content is not hidden behind fixed/sticky bars
- [ ] Verified on small phone, large phone, and tablet (portrait + landscape)
- [ ] Horizontal insets/gutters adapt correctly by device size and orientation
- [ ] 4/8dp spacing rhythm is maintained across component, section, and page levels
- [ ] Long-form text measure remains readable on larger devices

### Accessibility
- [ ] All meaningful images/icons have accessibility labels
- [ ] Form fields have labels, hints, and clear error messages
- [ ] Color is not the only indicator
- [ ] Reduced motion and dynamic text size are supported without layout breakage
- [ ] Accessibility traits/roles/states (selected, disabled, expanded) are announced correctly

---

## Troubleshooting

### Design system output is cut off / fields truncated

Use `--max-length` to increase or remove the truncation limit:

```bash
python3 .gemini/skills/ui-ux-pro-max/scripts/search.py "SaaS" --domain style --max-length 0
#                                                                               ^ 0 = unlimited
```

### Python not found when running design system commands

```bash
brew install python3        # macOS
sudo apt install python3    # Ubuntu/Debian
winget install Python.Python.3.12  # Windows
```

### Uninstalling the skill

```bash
uipro uninstall --ai gemini      # Remove Gemini CLI skill
uipro uninstall --global         # Remove global install

# Manual removal
rm -rf .gemini/skills/ui-ux-pro-max
```

---

## Resources

- **GitHub:** https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- **Website:** https://uupm.cc
- **CLI Package (npm):** `ui-ux-pro-max-cli`
- **License:** MIT