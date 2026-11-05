import { SITE_NAME } from '../site.config.mjs';

/** Basic JSON-LD for an ordinary content page. */
export function webPageJsonLd(site: URL, path: string, name: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    url: new URL(path, site).href,
    description,
    inLanguage: 'en',
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: new URL('/', site).href },
  };
}
