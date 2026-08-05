import { brand } from '../../config/brand.js';

const routes = {
  home: { en: '/en/', de: '/de/', es: '/es/' },
  services: { en: '/en/services/', de: '/de/leistungen/', es: '/es/servicios/' },
  cnc: { en: '/en/cnc-machining/', de: '/de/cnc-bearbeitung/', es: '/es/mecanizado-cnc/' },
  molding: { en: '/en/injection-molding/', de: '/de/spritzguss/', es: '/es/moldeo-por-inyeccion/' },
  sheet: { en: '/en/sheet-metal-fabrication/', de: '/de/blechbearbeitung/', es: '/es/fabricacion-de-chapa/' },
  proto: { en: '/en/rapid-prototyping/', de: '/de/prototypenfertigung/', es: '/es/prototipado-rapido/' },
  quality: { en: '/en/quality/', de: '/de/qualitaet/', es: '/es/calidad/' },
  about: { en: '/en/about/', de: '/de/ueber-uns/', es: '/es/nosotros/' },
  rfq: { en: '/en/request-a-quote/', de: '/de/anfrage/', es: '/es/solicitar-presupuesto/' }
};

const labels = {
  en: { services: 'Services', quality: 'Quality', about: 'About', rfq: 'Request a Quote', cap: 'Capabilities', company: 'Company', q: 'Quality controls', custom: 'Custom components', footer: 'Independent sourcing support for European industrial businesses.', home: 'home' },
  de: { services: 'Leistungen', quality: 'Qualität', about: 'Über uns', rfq: 'Anfrage', cap: 'Leistungen', company: 'Unternehmen', q: 'Qualitätssicherung', custom: 'Sonder- und Zeichnungsteile', footer: 'Unabhängige Beschaffungsunterstützung für industrielle Unternehmen in Europa.', home: 'Startseite' },
  es: { services: 'Servicios', quality: 'Calidad', about: 'Nosotros', rfq: 'Solicitar presupuesto', cap: 'Capacidades', company: 'Empresa', q: 'Control de calidad', custom: 'Componentes industriales a medida', footer: 'Apoyo independiente para compras industriales y búsqueda de fabricantes en Europa.', home: 'inicio' }
};

const capabilities = {
  en: { cnc: 'CNC machining', molding: 'Injection molding', sheet: 'Sheet metal fabrication', proto: 'Rapid prototyping' },
  de: { cnc: 'CNC-Bearbeitung', molding: 'Spritzguss', sheet: 'Blechbearbeitung', proto: 'Prototypenfertigung' },
  es: { cnc: 'Mecanizado CNC', molding: 'Moldeo por inyección', sheet: 'Fabricación de chapa', proto: 'Prototipado rápido' }
};

const rootPath = document.currentScript?.src ? new URL('../../', document.currentScript.src).pathname : '/';
const localize = path => `${rootPath.replace(/\/$/, '')}${path}`;
const lang = document.body.dataset.lang || 'en';
const page = document.body.dataset.page || 'home';
const copy = labels[lang] || labels.en;
const names = capabilities[lang] || capabilities.en;
const brandMark = `<span class="brand-mark">${brand.logo ? `<img src="${localize(brand.logo)}" alt="">` : brand.shortName}</span>`;
const brandBlock = `<a class="brand" href="${localize(routes.home[lang])}">${brandMark}<span class="brand-name">${brand.name}</span></a>`;
const footerBrandBlock = `<a class="footer-brand" href="${localize(routes.home[lang])}" aria-label="${brand.name} ${copy.home}">${brandMark}<span class="brand-name">${brand.name}</span></a>`;
const languageSelector = `<div class="language-selector" aria-label="Language selector">${['en', 'de', 'es'].map(code => `<a href="${localize(routes[page][code])}" hreflang="${code}" lang="${code}"${code === lang ? ' aria-current="true"' : ''}>${code.toUpperCase()}</a>`).join('')}</div>`;
const navLinks = [['services', copy.services], ['quality', copy.quality], ['about', copy.about]];

const header = document.querySelector('#site-header');
if (header) {
  header.innerHTML = `<div class="container nav">${brandBlock}<button class="menu-button" aria-label="Open navigation" aria-expanded="false">☰</button><nav class="nav-links">${navLinks.map(([key, label]) => `<a href="${localize(routes[key][lang])}">${label}</a>`).join('')}<a class="nav-cta" href="${localize(routes.rfq[lang])}">${copy.rfq}</a>${languageSelector}</nav></div>`;
}

const footer = document.querySelector('#site-footer');
if (footer) {
  footer.innerHTML = `<div class="container"><div class="footer-grid"><div>${footerBrandBlock}<p>${brand.tagline} ${copy.footer}</p></div><div><h4>${copy.cap}</h4><a href="${localize(routes.cnc[lang])}">${names.cnc}</a><a href="${localize(routes.molding[lang])}">${names.molding}</a><a href="${localize(routes.sheet[lang])}">${names.sheet}</a><a href="${localize(routes.proto[lang])}">${names.proto}</a></div><div><h4>${copy.company}</h4><a href="${localize(routes.quality[lang])}">${copy.q}</a><a href="${localize(routes.about[lang])}">${copy.about}</a><a href="${localize(routes.rfq[lang])}">${copy.rfq}</a><a data-email href="mailto:${brand.email}">${brand.email}</a></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} ${brand.name}</span><span>${brand.domain}</span></div></div>`;
}

const jsonLdTarget = document.querySelector('#brand-jsonld');
if (jsonLdTarget) jsonLdTarget.textContent = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: brand.name,
  url: `${brand.baseUrl}${routes.home[lang]}`,
  email: brand.email,
  description: brand.tagline,
  image: `${brand.baseUrl}${brand.ogImage}`,
  areaServed: 'Europe',
  serviceType: ['Manufacturing sourcing', 'Supplier qualification', 'Quality coordination'],
  inLanguage: lang
});
