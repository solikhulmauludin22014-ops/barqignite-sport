import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Izinkan semua crawler untuk halaman publik
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',    // Panel admin — tidak boleh di-index
          '/api/',      // Endpoint API internal
        ],
      },
    ],
    sitemap: 'https://www.barqignitesports.web.id/sitemap.xml',
  };
}
