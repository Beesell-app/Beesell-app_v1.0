/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"], // Mendukung Dark Mode Specification beesell-ai
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // 1. SYSTEM WARNA UTAMA (Brand Blue & Semantic)
      colors: {
        brand: {
          50: "#EFF6FF",  // Light backgrounds, hover states
          100: "#DBEAFE", // Selected state backgrounds
          200: "#BFDBFE", // Focus rings (3px)
          400: "#60A5FA", // Decorative accents
          500: "#3B82F6", // Active sidebar indicator
          600: "#2563EB", // Primary CTA buttons (Min Ratio 4.5:1 compliant)
          700: "#1D4ED8", // Button hover state
          800: "#1E40AF", // Dark text on light bg
          900: "#1E3A8A", // Sidebar background
        },
        // Integrasi Token Semantic untuk Status & Platform (Calendar/Ads)
        status: {
          success: "#22C55E", // Green: Published
          warning: "#F59E0B", // Amber: Scheduled / AI Alert Banner
          danger: "#EF4444",  // Red: Failed (with retry option)
          info: "#3B82F6",    // Blue: Draft / Pending Approval
        },
        // Pemetaan standar token shadcn/ui ke design system beesell-ai
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "#BFDBFE", // Menggunakan --brand-200 untuk Focus Rings
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#2563EB", // --brand-600 sebagai Primary CTA
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      // 2. TIPOGRAFI (Typeface Selections)
      fontFamily: {
        display: ["Fraunces", "serif"],      // Untuk KPI, Title, & Hero Headings
        sans: ["DM Sans", "sans-serif"],     // Untuk Body, Section, & Nav Items
        mono: ["DM Mono", "monospace"],       // Untuk Code/Technical Spec
      },
      // 3. TYPE SCALE (Spesifikasi Ukuran & Line Height Eksplisit)
      fontSize: {
        "xs": ["11px", { lineHeight: "1.4", fontWeight: "400" }],   // Labels, metadata
        "sm": ["13px", { lineHeight: "1.5", fontWeight: "400" }],   // Nav items, table rows
        "base": ["15px", { lineHeight: "1.65", fontWeight: "400" }], // Body text, descriptions
        "md": ["16px", { lineHeight: "1.6", fontWeight: "500" }],   // Prominent body, form labels
        "lg": ["18px", { lineHeight: "1.4", fontWeight: "600" }],   // Section titles (DM Sans)
        "xl": ["20px", { lineHeight: "1.35", fontWeight: "600" }],  // Card titles, subsections
        "2xl": ["24px", { lineHeight: "1.3", fontWeight: "600" }],  // Page sub-headers
        "3xl": ["30px", { lineHeight: "1.2", fontWeight: "600" }],  // Page titles (Fraunces)
        "4xl": ["36px", { lineHeight: "1.1", fontWeight: "600" }],  // Hero headings
        "5xl": ["48px", { lineHeight: "1.0", fontWeight: "700" }],  // KPI numbers (Fraunces)
      },
      // 4. STRUKTUR LAYOUT & UNIT BASE
      spacing: {
        '4base': '4px', // Skala dasar 4px unit
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};