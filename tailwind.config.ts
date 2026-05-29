// apps/web-app/tailwind.config.ts
// BeeSell AI · Design System v1.0
// Semua nilai dari: §2 Color · §3 Typography · §4 Spacing & Layout · §6.1 Motion

import type { Config } from 'tailwindcss'
import path            from 'path'

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],

  // FIX: pakai path.resolve() untuk absolute path
  // Turbopack Next.js 16 tidak support relative path '../../' yang keluar dari app folder
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    // Monorepo packages — pakai path.resolve untuk absolute path
    // Uncomment kalau sudah ada packages/ui:
    // path.resolve(__dirname, '../../packages/ui/src/**/*.{ts,tsx}'),
  ],

  theme: {
    extend: {
      /* ── §3.1 Font families ─────────────────────────────── */
      fontFamily: {
        sans:    ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono:    ['DM Mono', 'ui-monospace', 'monospace'],
      },

      /* ── §2 Color tokens ────────────────────────────────── */
      colors: {
        // Brand
        primary: {
          DEFAULT: '#2563EB',
          50:      '#EFF6FF',
          100:     '#DBEAFE',
          500:     '#3B82F6',
          600:     '#2563EB',
          700:     '#1D4ED8',
          900:     '#1E3A8A',
        },
        accent: {
          DEFAULT: '#7C3AED',
          500:     '#8B5CF6',
          600:     '#7C3AED',
          700:     '#6D28D9',
        },
        // Neutral
        gray: {
          0:   '#FFFFFF',
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        // Semantic
        success: { DEFAULT: '#16A34A', 50: '#F0FDF4', 500: '#22C55E' },
        warning: { DEFAULT: '#D97706', 50: '#FFFBEB', 500: '#F59E0B' },
        danger:  { DEFAULT: '#DC2626', 50: '#FEF2F2', 500: '#EF4444' },
      },

      /* ── §4 Spacing scale ───────────────────────────────── */
      spacing: {
        '0.5': '2px',
        '1':   '4px',
        '2':   '8px',
        '3':   '12px',
        '4':   '16px',
        '5':   '20px',
        '6':   '24px',
        '8':   '32px',
        '10':  '40px',
        '12':  '48px',
        '16':  '64px',
      },

      /* ── §4.2 Border radius ─────────────────────────────── */
      borderRadius: {
        sm:  '4px',
        md:  '8px',
        lg:  '12px',
        xl:  '16px',
        '2xl': '20px',
      },

      /* ── §6.1 Motion / easing ───────────────────────────── */
      transitionTimingFunction: {
        'in-out-smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        '150': '150ms',
        '250': '250ms',
        '400': '400ms',
      },

      /* ── Typography scale ───────────────────────────────── */
      fontSize: {
        xs:   ['11px', { lineHeight: '1.5' }],
        sm:   ['13px', { lineHeight: '1.5' }],
        base: ['14px', { lineHeight: '1.6' }],
        lg:   ['16px', { lineHeight: '1.5' }],
        xl:   ['18px', { lineHeight: '1.4' }],
        '2xl':['22px', { lineHeight: '1.3' }],
        '3xl':['28px', { lineHeight: '1.2' }],
      },

      /* ── Shadow ──────────────────────────────────────────── */
      boxShadow: {
        sm:  '0 1px 2px rgba(15, 23, 42, 0.04)',
        md:  '0 4px 12px rgba(15, 23, 42, 0.08)',
        lg:  '0 20px 60px rgba(15, 23, 42, 0.08)',
      },
    },
  },

  plugins: [],
}

export default config