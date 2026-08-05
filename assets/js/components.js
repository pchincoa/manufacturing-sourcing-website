import { brand } from '../../config/brand.js';

const links = [['Services','services.html'],['Quality','quality.html'],['About','about.html']];
const brandBlock = `<a class="brand" href="index.html"><span class="brand-mark">${brand.logo ? `<img src="${brand.logo}" alt="">` : brand.shortName}</span><span class="brand-name">${brand.name}</span></a>`;

document.querySelector('#site-header')?.replaceChildren();
const header = document.querySelector('#site-header');
if(header) header.innerHTML = `<div class="container nav">${brandBlock}<button class="menu-button" aria-label="Open navigation">☰</button><nav class="nav-links">${links.map(([n,u])=>`<a href="${u}">${n}</a>`).join('')}<a class="nav-cta" href="request-quote.html">Request a Quote</a></nav></div>`;

const footer = document.querySelector('#site-footer');
if(footer) footer.innerHTML = `<div class="container"><div class="footer-grid"><div>${brandBlock}<p>${brand.tagline} Independent sourcing support for European industrial businesses.</p></div><div><h4>Capabilities</h4><a href="cnc-machining.html">CNC machining</a><a href="injection-molding.html">Injection molding</a><a href="sheet-metal.html">Sheet metal</a><a href="rapid-prototyping.html">Rapid prototyping</a></div><div><h4>Company</h4><a href="quality.html">Quality & certifications</a><a href="about.html">About</a><a href="request-quote.html">Request a quote</a><a data-email href="mailto:${brand.email}">${brand.email}</a></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} ${brand.name}</span><span>${brand.domain} · Privacy · Terms</span></div></div>`;
