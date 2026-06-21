// apps/web-app/app/robots.ts
import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://beesell.ai'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/', '/dashboard/', '/content/', '/studio/', '/quick-tools/',
        '/marketing-kit/', '/campaign/', '/audience/', '/budget-optimizer/',
        '/analytics/', '/scheduler/', '/billing/', '/settings/', '/admin/',
        '/creator/', '/brand-kit/', '/credit/', '/onboarding/', '/library/', '/editor/',
      ],
    }],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}