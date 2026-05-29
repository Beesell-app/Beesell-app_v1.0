// apps/web-app/app/robots.ts
import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://beesell.id'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent:  '*',
        allow:      '/',
        disallow:   ['/api/', '/dashboard/', '/library/', '/content/', '/settings/', '/editor/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}