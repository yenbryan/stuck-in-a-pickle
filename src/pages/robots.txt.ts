export function GET({ site }: { site?: URL }) {
  const base = site ?? new URL('https://thepickle.example');
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', base)}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
