import { brand } from '../../config/brand.js';

const root = document.documentElement;
Object.entries(brand.colors).forEach(([key, value]) => root.style.setProperty(`--${key}`, value));
document.querySelectorAll('[data-brand]').forEach(el => el.textContent = brand.name);
document.querySelectorAll('[data-tagline]').forEach(el => el.textContent = brand.tagline);
document.querySelectorAll('[data-email]').forEach(el => { el.textContent = brand.email; el.href = `mailto:${brand.email}`; });
document.querySelectorAll('[data-domain]').forEach(el => el.textContent = brand.domain);

document.querySelector('.menu-button')?.addEventListener('click', () => {
  const menu = document.querySelector('.nav-links');
  menu.classList.toggle('open');
});
