// apps/web-app/app/sitemap.ts
import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://beesell.com'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url:              siteUrl,
      lastModified:     new Date(),
      changeFrequency:  'weekly',
      priority:         1.0,
    },
    {
      url:              `${siteUrl}/login`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.7,
    },
    {
      url:              `${siteUrl}/register`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.8,
    },
    // Landing page anchors (treated as separate SEO targets)
    {
      url:              `${siteUrl}/#fitur`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.6,
    },
    {
      url:              `${siteUrl}/#harga`,
      lastModified:     new Date(),
      changeFrequency:  'weekly',
      priority:         0.7,
    },
  ]
}