# UI/UX Design System Specification
## AI Sales Content & Ads Marketing System

> **Versi:** v1.0 · April 2026 | **Status:** Production Ready  
> **Typefaces:** Fraunces (display) + DM Sans (body) + DM Mono (code)  
> **Framework:** Next.js 14 + Tailwind CSS v3 + shadcn/ui

---

## 1. Design Principles

| Prinsip | Deskripsi | Implementasi |
|---|---|---|
| **Clarity First** | Setiap elemen UI harus jelas fungsinya tanpa perlu penjelasan | Label eksplisit, ikon + teks, status color-coded |
| **Zero Friction** | Alur utama (generate → publish) maksimal 3 klik | Progressive disclosure, smart defaults |
| **Consistent Feedback** | User selalu tahu apa yang terjadi pada sistem | Loading skeleton, toast notif, progress bar |
| **Mobile-First** | 70%+ user pakai smartphone | Touch targets min 44px, bottom nav mobile |
| **AI-Transparent** | User tahu kapan AI sedang bekerja dan hasilnya bisa diedit | AI badge, editable results, confidence indicators |

---

## 2. Color System

### Brand Blue — Primary

| Token | Hex | Usage |
|---|---|---|
| `--brand-50` | `#EFF6FF` | Light backgrounds, hover states |
| `--brand-100` | `#DBEAFE` | Selected state backgrounds |
| `--brand-200` | `#BFDBFE` | Focus rings (3px) |
| `--brand-400` | `#60A5FA` | Decorative accents |
| `--brand-500` | `#3B82F6` | Active sidebar indicator |
| `--brand-600` | `#2563EB` | **Primary CTA buttons** |
| `--brand-700` | `#1D4ED8` | Button hover state |
| `--brand-800` | `#1E40AF` | Dark text on light bg |
| `--brand-900` | `#1E3A8A` | Sidebar background |

### Semantic Colors

```css
/* Success — Published, Active, Confirmed */
--green-50:  #F0FDF4   /* Alert backgrounds */
--green-500: #22C55E   /* Dot indicators */
--green-600: #16A34A   /* Text, borders */
--green-700: #15803D   /* Strong text */

/* Warning — Scheduled, Pending, Low stock */
--amber-50:  #FFFBEB
--amber-400: #FBBF24   /* Progress bars */
--amber-500: #F59E0B   /* Accent */
--amber-600: #D97706   /* Text */

/* Error — Failed, Rejected, Danger */
--red-50:    #FEF2F2
--red-500:   #EF4444   /* Borders */
--red-600:   #DC2626   /* Text, strong */
--red-700:   #B91C1C   /* Hover */

/* AI / Premium Feature */
--purple-50:  #F5F3FF
--purple-500: #8B5CF6
--purple-600: #7C3AED  /* AI badges, Pro features */

/* Teal — Additional accent */
--teal-50:  #F0FDFA
--teal-500: #14B8A6
--teal-600: #0D9488
```

### Neutral Gray Scale

```css
--gray-0:   #FFFFFF   /* Card backgrounds */
--gray-25:  #FAFAFA   /* App background variant */
--gray-50:  #F8FAFC   /* Page background */
--gray-100: #F1F5F9   /* Table header bg */
--gray-200: #E2E8F0   /* Default borders */
--gray-300: #CBD5E1   /* Input borders */
--gray-400: #94A3B8   /* Placeholder text */
--gray-500: #64748B   /* Secondary text */
--gray-600: #475569   /* Body text light */
--gray-700: #334155   /* Body text */
--gray-800: #1E293B   /* Strong text */
--gray-900: #0F172A   /* Headlines, sidebar */
--gray-950: #020617   /* Max contrast */
```

---

## 3. Typography

### Typeface Selections

```
Display:  Fraunces     — Variable optical size font, editorial quality
          Usage: Page titles, KPI numbers, brand moments
          Weight: 600 (regular heading), 400 italic (emphasis)

Body:     DM Sans      — Humanist geometric sans-serif
          Usage: All UI text, body copy, navigation, labels
          Weight: 300 (light), 400 (regular), 500 (medium), 600 (semibold)

Code:     DM Mono      — Monospace for technical content
          Usage: Design tokens, code, data values, IDs
          Weight: 400, 500

Google Fonts CDN:
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@400;500&family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,400&display=swap');
```

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `text-xs` | 11px | 400/500 | 1.4 | Labels, metadata, captions |
| `text-sm` | 13px | 400/500 | 1.5 | Nav items, table rows, secondary |
| `text-base` | 15px | 400 | 1.65 | Body text, descriptions |
| `text-md` | 16px | 400/500 | 1.6 | Prominent body, form labels |
| `text-lg` | 18px | 500/600 | 1.4 | Section titles (DM Sans) |
| `text-xl` | 20px | 600 | 1.35 | Card titles, subsection heads |
| `text-2xl` | 24px | 600 | 1.3 | Page sub-headers |
| `text-3xl` | 30px | 600 | 1.2 | Page titles (Fraunces) |
| `text-4xl` | 36px | 600 | 1.1 | Hero headings |
| `text-5xl` | 48px | 700 | 1.0 | KPI numbers (Fraunces) |

---

## 4. Spacing & Layout

### Spacing Scale (4px base unit)

```css
--sp-1:  4px    /* Micro gaps, icon-text */
--sp-2:  8px    /* Tight spacing, badge padding */
--sp-3:  12px   /* Component internal */
--sp-4:  16px   /* Standard gaps */
--sp-5:  20px   /* Section internal */
--sp-6:  24px   /* Card padding */
--sp-8:  32px   /* Section gaps */
--sp-10: 40px   /* Large sections */
--sp-12: 48px   /* Page sections */
--sp-16: 64px   /* Empty state padding */
```

### Layout Structure

```
App Shell:
  Sidebar width:     240px (fixed)
  Header height:     60px (sticky)
  Content max-width: 1280px
  Page padding:      32px (horizontal), 32px (vertical)
  Grid gutter:       24px

Breakpoints:
  sm:  640px   (mobile large)
  md:  768px   (tablet)
  lg:  1024px  (desktop)
  xl:  1280px  (wide)
  2xl: 1536px  (ultra wide)

Mobile adaptations:
  < 768px: Sidebar collapse → bottom nav (5 main items)
  < 640px: Single column grid, full-width buttons
```

### Border Radius

```css
--r-sm:   4px     /* Badges, code chips */
--r-md:   8px     /* Buttons, inputs, dropdowns */
--r-lg:   12px    /* Cards, modals, panels */
--r-xl:   16px    /* Large cards, content blocks */
--r-2xl:  24px    /* Dialog, drawer */
--r-full: 9999px  /* Pills, avatar, toggle */
```

---

## 5. Component Library

### 5.1 Button Component

```typescript
// Button props interface
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size: 'sm' | 'base' | 'lg'
  shape?: 'default' | 'pill' | 'icon'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
}

// Sizing
sm:   padding: 6px 12px,  font: 12px, height: 28px
base: padding: 9px 16px,  font: 14px, height: 36px
lg:   padding: 12px 24px, font: 15px, height: 44px
icon: padding: 8px,       height: 36px × 36px (base)

// States
default:  solid fill, no shadow
hover:    darker shade + translateY(-1px) + shadow-md
active:   translateY(0), no shadow
focus:    3px ring in brand-200
disabled: opacity 0.45, cursor not-allowed, no pointer-events
loading:  spinner icon (left) + text dims to 70%

// Usage rules:
- Max 1 Primary button per view
- Group: Primary + Secondary + Ghost (left to right)
- Danger: only for destructive, irreversible actions
- Min width: 80px to prevent text overflow
```

### 5.2 Input / Form Components

```typescript
// Input states
default:  border --gray-300, bg white
focus:    border --brand-500, ring 3px brand-200 at 15% opacity
error:    border --red-500, ring 3px red at 15% opacity
success:  border --green-500
disabled: bg --gray-50, opacity 0.6, cursor not-allowed

// Input types supported
text, email, password, number, url, search
textarea: min-height 96px, resizable vertical only
select:   custom chevron arrow via background-image
checkbox: 16×16, accent-color --brand-500
toggle:   44×24px track, 18px thumb, transition 120ms

// Validation rules
- Always show label above input (never placeholder as label)
- Hint text below: gray-500, 11px
- Error text below: red-600, 11px, replaces hint
- Required marker: red-500 asterisk after label
- Character count: right-aligned for textarea
```

### 5.3 Card Component

```typescript
// Card variants
default:  bg white, border gray-200, radius r-xl, shadow-xs, padding sp-6
hover:    border brand-300, shadow-md, translateY(-2px), cursor pointer
flat:     no shadow, border gray-200
ghost:    no border, no shadow, bg gray-50
dashed:   border dashed gray-200, bg gray-50 (dropzone, empty)

// KPI Card structure
- Label: 11px, uppercase, letter-spacing 0.06em, gray-500
- Value: 40-48px, Fraunces 700, gray-900 (or semantic color)
- Change indicator: 12px, up=green-600 ↑, down=red-600 ↓
- Progress bar (optional): 6px track, amber for warning threshold

// Content Card structure
- Header: badge (status) + overflow menu (three-dot)
- Media zone: 80-120px height, border-radius r-md
- Title: 15px, font-weight 600
- Description: 13px, gray-500, max 2 lines (line-clamp)
- Footer: platform badges + timestamp
```

### 5.4 Badge / Status Chip

```
Sizes:   Default (12px) | Large (13px with leading dot)
Shapes:  Pill (r-full)

Semantic mapping:
  green:  Published, Active, Connected, Confirmed
  amber:  Scheduled, Pending, Under Review, Draft
  blue:   Generating, Loading, Info, Instagram
  red:    Failed, Error, Rejected, Expired
  purple: AI, Pro Feature, Premium, Bulk
  gray:   Default, Inactive, Archived, TikTok
  teal:   Trending, New, Beta

Usage: badge-dot + text for status, text-only for categories/tags
Max 3 badges visible per card; remainder = "+N" chip
```

### 5.5 Alert / Toast

```
Types: info (blue) | success (green) | warning (amber) | error (red)

Structure:
  icon (20px, semantic color) + content
  content: title (13px, 600) + body (13px, 400)

Position (toast):
  Desktop: bottom-right, 24px from edge, stacked up
  Mobile:  bottom-center, full width minus 32px margin

Timing:
  info/success: auto-dismiss 4 seconds
  warning:      auto-dismiss 6 seconds
  error:        persistent (manual dismiss required)

Animation:
  Enter: slideInUp 200ms ease-out + opacity 0→1
  Exit:  slideOutRight 150ms + opacity 1→0
```

### 5.6 Navigation — Sidebar

```
Structure:
  Logo area:     40px height, 56px horizontal padding
  Nav groups:    labeled sections (Foundations, Components, etc.)
  Nav items:     icon (16px) + label (13px), 36px height
  Active item:   brand-500 left border (2px) + brand-15% bg + white text
  Hover:         gray-800 bg + white text

Sidebar behavior:
  Desktop (≥ 1024px): Fixed, always visible, 240px
  Tablet (768-1023px): Collapsible, icon-only mode (64px)
  Mobile (< 768px):   Hidden, replaced by bottom navigation bar

Bottom nav (mobile):
  5 items: Dashboard, Konten, Scheduler, Ads, Affiliasi
  Active: brand-600 icon + label
  Height: 64px + safe area inset
```

### 5.7 Data Table

```
Header:
  bg: gray-50
  text: 11px, uppercase, letter-spacing 0.05em, gray-500
  height: 44px

Row:
  height: 52px (standard), 72px (with subtitle)
  hover: gray-50 bg
  selected: brand-50 bg + brand-200 left border
  
Pagination:
  Page size options: 10, 20, 50, 100
  Show: "Showing 1-20 of 150"
  Controls: < Previous | Page numbers | Next >

Sorting:
  Sortable columns: up/down caret icon
  Active sort: brand-600 color + filled caret

Empty state:
  Icon (40px) + title + description + CTA button
  Center-aligned within table body area
```

---

## 6. Motion & Animation

```css
/* Easing functions */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);    /* Default spring-like */
--ease-in:  cubic-bezier(0.4, 0, 1, 1);        /* Exit animations */
--ease-io:  cubic-bezier(0.4, 0, 0.2, 1);      /* In-out */

/* Duration scale */
--t-instant: 50ms    /* Immediate feedback (checkbox check) */
--t-fast:    120ms   /* Micro interactions (button hover) */
--t-base:    200ms   /* Standard transitions (modal open) */
--t-slow:    350ms   /* Larger elements (sidebar slide) */
--t-xslow:   500ms   /* Page transitions, hero animations */

/* Skeleton loading */
animation: shimmer 1.8s ease infinite
background: linear-gradient(90deg, gray-200 25%, gray-100 37%, gray-200 63%)
background-size: 400% 100%

/* Modal entry */
backdrop: opacity 0→0.5, 200ms
panel: translateY(8px)→translateY(0) + opacity, 200ms ease-out

/* Toast entry */
slideInUp: translateY(16px)→translateY(0) + opacity 0→1, 200ms

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after { animation-duration: 0.01ms !important; }
}
```

---

## 7. Accessibility (WCAG 2.1 AA)

### Color Contrast Requirements

| Context | Min Ratio | Example |
|---|---|---|
| Normal text on white | 4.5:1 | gray-600 (#475569) on white = 5.48:1 ✓ |
| Large text (18px+) on white | 3:1 | brand-500 (#3B82F6) on white = 3.01:1 ✓ |
| UI components, borders | 3:1 | gray-300 on white = 3.1:1 ✓ |
| White text on brand-600 | 4.5:1 | White on #2563EB = 5.12:1 ✓ |

### Interactive Element Standards

```
Focus:
  - Visible focus ring: 3px solid brand-200 (or brand-500 for dark bg)
  - Never remove outline without replacement
  - Tab order: logical DOM order

Touch Targets:
  - Minimum: 44×44px (WCAG 2.5.5 AAA recommendation)
  - Recommended: 48×48px for mobile

Keyboard Navigation:
  - All interactive elements reachable via Tab
  - Modal: focus trap inside, Escape to close
  - Dropdown: Arrow keys to navigate, Enter to select

Screen Reader:
  - Images: meaningful alt text
  - Icons: aria-label or aria-hidden (if decorative)
  - Status badges: aria-live="polite" for dynamic updates
  - Forms: label elements linked via htmlFor/id
  - Errors: aria-describedby linking to error message
  - Loading: aria-busy="true" during async operations
```

---

## 8. Wireframe Annotations per Module

### 8.1 Dashboard (UF-09)

**Layout:** Sidebar (240px) + Main (fluid)

**Sections (top to bottom):**
1. Page title + period filter (7d / 30d / 90d / Custom)
2. KPI Row — 4 cards: Total Reach, ROAS, Komisi Afiliasi, Konten Diproduksi
3. Trend Chart (2/3 width) + Platform Mix Donut (1/3 width)
4. Top Content Table + AI Insights Panel (side by side)
5. Upcoming Schedule preview

**Interactions:**
- Period filter → refetch all widgets
- KPI card click → drill-down ke analytics detail
- AI Insight card click → aksi yang direkomendasikan

---

### 8.2 Content Creator (UF-02)

**Layout:** Split panel — Input (40%) | Result (60%)

**Left Panel:**
1. Input type selector: URL / Foto / Manual
2. Dynamic input based on type
3. Product data preview (editable)
4. Content type selector: Caption / Gambar / Video / Semua
5. Config: Tone, Language, Platform, Variations
6. Generate button (primary CTA)
7. Quota indicator

**Right Panel:**
1. Variant tabs (Variasi 1, 2, 3)
2. Preview area (inline editable)
3. Hashtag chips (editable)
4. Action bar: Download | Jadwalkan | Publish Now
5. Regenerate with feedback input

**Loading states:**
- Generate button → spinner + "Generating..."
- Result panel → skeleton while waiting
- Progress indicator for video (percentage + ETA)

---

### 8.3 Scheduler / Calendar (UF-05)

**Layout:** Full width with mini sidebar for filters

**Top toolbar:**
- Month navigation (← April 2026 →)
- View switch: Week | Month | List
- Heatmap toggle (AI Best Time)
- "+ Jadwalkan Baru" CTA

**Calendar grid:**
- 7 columns (Mon–Sun), labeled
- Peak-time cells highlighted amber (from AI)
- Content slots: color-coded by platform, thumbnail visible
- Drag-and-drop enabled with ghost preview
- Click slot: quick-add popover

**Status colors in calendar:**
- Green: Published
- Amber: Scheduled/Queued
- Red: Failed (with retry option on hover)
- Blue: Draft/Pending approval

---

### 8.4 Ads Manager (UF-06, UF-07)

**Layout:** Sidebar with nested nav + main content

**Sub-navigation:** Campaigns | Ad Sets | Creatives | A/B Tests | Audiences

**Campaign list view:**
- AI Alert banner (amber) when anomaly detected
- KPI summary row: Spend, ROAS, Conversions, CTR
- Table with inline actions (pause/resume toggle)
- Status color-coding consistent with global system

**Campaign detail:**
- Performance charts (daily spend + ROAS over time)
- Ad Sets accordion
- Creative carousel (sortable by performance)
- Optimization rules panel (for auto-optimize)

---

### 8.5 Affiliate Hub (UF-08)

**Layout:** Sub-nav (left) + content (right) split

**Product Discovery tab:**
- Filter bar: Platform, Niche, Min Komisi %, Trend Score
- Product list: thumbnail + name + commission + trend badge
- Trending score bar (0-100)
- Click to expand: profit calculator, competitor count, seasonality chart

**My Links tab:**
- Paste URL input + Generate button
- Generated link row: short URL | copy | QR | UTM | analytics

**Earnings tab:**
- Summary card: total pending / confirmed / paid
- Per-platform breakdown table
- Monthly chart

---

### 8.6 Analytics (UF-09)

**Layout:** Full width, sub-nav for sections

**Overview tab:**
- 5-column KPI row (Reach, Engagement Rate, Ad Spend, ROAS, Commission)
- Multi-line trend chart (30 days)
- Calendar heatmap (engagement intensity by day)
- Top Content table
- AI Insights panel (3 cards, dismissible)

**Content tab:**
- Filter: type, platform, date range, sort
- Grid or table view toggle
- Per-content detail drawer on click

**Report tab:**
- Template selector
- Preview panel (live update on filter change)
- Schedule auto-send settings

---

## 9. Icon System

```
Library: Lucide Icons (tree-shakeable, consistent stroke style)
Size scale: 14px (xs), 16px (sm, default), 20px (md), 24px (lg)
Stroke width: 1.5px (default), 2px (emphasis)
Color: inherit (matches parent text color)

Key icons used:
  Dashboard:   LayoutDashboard
  Content:     FileText / Image / Video
  Bulk:        Layers
  Scheduler:   Calendar
  Ads:         TrendingUp
  Affiliate:   Link2
  Analytics:   BarChart2
  Settings:    Settings2
  Generate AI: Zap (amber)
  Premium/Pro: Star / Crown
  Success:     CheckCircle2
  Error:       XCircle
  Warning:     AlertTriangle
  Info:        Info
  Upload:      Upload / CloudUpload
  Download:    Download
  Copy:        Copy
  Delete:      Trash2
  Edit:        Pencil
  More:        MoreHorizontal
  Close:       X
  Arrow:       ArrowRight / ChevronRight
  Refresh:     RefreshCw
  AI Badge:    Sparkles (purple)
```

---

## 10. Dark Mode Specification

```css
/* Dark mode via CSS class on <html> or prefers-color-scheme */
/* Semantic tokens automatically adapt */

[data-theme="dark"] {
  /* Surfaces */
  --surface-1: #0F172A;   /* App background */
  --surface-2: #1E293B;   /* Card background */
  --surface-3: #334155;   /* Elevated card */
  --surface-sidebar: #020617;

  /* Text */
  --text-primary:   #F1F5F9;
  --text-secondary: #94A3B8;
  --text-muted:     #64748B;

  /* Borders */
  --border-default: #1E293B;
  --border-strong:  #334155;

  /* Brand (stays similar, slightly adjusted for contrast) */
  --brand-active-bg: rgba(59, 130, 246, 0.2);
}
```

---

## 11. Component Implementation Notes

### Tailwind Config Extension

```javascript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        mono:    ['DM Mono', 'Menlo', 'monospace'],
      },
      colors: {
        brand: {
          50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE',
          400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB',
          700: '#1D4ED8', 800: '#1E40AF', 900: '#1E3A8A',
        }
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      },
      animation: {
        'shimmer': 'shimmer 1.8s ease infinite',
        'slide-in-up': 'slideInUp 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        shimmer: { '0%,100%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
        slideInUp: { from: { transform: 'translateY(8px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
      }
    }
  }
}
```

### shadcn/ui Component Overrides

```typescript
// components/ui/button.tsx — override shadcn default to match design system
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary:   "bg-brand-600 text-white hover:bg-brand-700 hover:-translate-y-px hover:shadow-md active:translate-y-0",
        secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400",
        ghost:     "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        danger:    "bg-red-600 text-white hover:bg-red-700",
        success:   "bg-green-600 text-white hover:bg-green-700",
      },
      size: {
        sm:   "h-7 px-3 text-xs",
        base: "h-9 px-4",
        lg:   "h-11 px-6 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: { variant: "secondary", size: "base" }
  }
)
```

---

*Last updated: April 2026 | Owner: Design Lead + Frontend Team*  
*Figma file: [aisales-design-system.figma] | Storybook: [storybook.aisales.id]*