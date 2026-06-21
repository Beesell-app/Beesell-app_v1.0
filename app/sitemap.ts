// apps/web-app/app/sitemap.ts
import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://beesell.ai'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: siteUrl,             lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${siteUrl}/#fitur`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/#harga`, lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${siteUrl}/#faq`,   lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]
}