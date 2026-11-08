/**
 * Banners de demonstração (1920×1080) desenhados em SVG e rasterizados com
 * sharp. A fonte vem do sistema: Inter na imagem Docker (fonts-inter) e a
 * sans-serif padrão como alternativa.
 */
export const BANNER_WIDTH = 1920;
export const BANNER_HEIGHT = 1080;

const FONT = `Inter, 'Inter Variable', 'Helvetica Neue', Arial, 'DejaVu Sans', sans-serif`;

export interface DemoBanner {
  slug: string;
  name: string;
  svg: string;
}

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface Palette {
  from: string;
  via: string;
  to: string;
  glowA: string;
  glowB: string;
  ink: string;
}

function frame(palette: Palette, content: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${BANNER_WIDTH}" height="${BANNER_HEIGHT}" viewBox="0 0 ${BANNER_WIDTH} ${BANNER_HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.from}"/>
      <stop offset="0.55" stop-color="${palette.via}"/>
      <stop offset="1" stop-color="${palette.to}"/>
    </linearGradient>
    <radialGradient id="glowA"><stop offset="0" stop-color="${palette.glowA}" stop-opacity="0.85"/><stop offset="1" stop-color="${palette.glowA}" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowB"><stop offset="0" stop-color="${palette.glowB}" stop-opacity="0.7"/><stop offset="1" stop-color="${palette.glowB}" stop-opacity="0"/></radialGradient>
    <pattern id="dots" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="#ffffff" fill-opacity="0.12"/></pattern>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="18"/></filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <circle cx="1650" cy="160" r="620" fill="url(#glowA)"/>
  <circle cx="220" cy="1020" r="560" fill="url(#glowB)"/>
  <rect x="1180" y="0" width="740" height="1080" fill="url(#dots)"/>
  <circle cx="1560" cy="560" r="330" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="2"/>
  <circle cx="1560" cy="560" r="410" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="2"/>
  ${content}
</svg>`;
}

function eyebrow(text: string, y = 250): string {
  const width = 70 + text.length * 19;
  return `<rect x="140" y="${y - 46}" width="${width}" height="64" rx="32" fill="#ffffff" fill-opacity="0.16"/>
  <text x="${140 + width / 2}" y="${y}" font-family="${FONT}" font-size="26" font-weight="700" letter-spacing="5" fill="#ffffff" text-anchor="middle">${esc(text.toUpperCase())}</text>`;
}

function headline(lines: string[], startY: number, size = 150): string {
  return lines
    .map(
      (line, i) =>
        `<text x="134" y="${startY + i * size * 1.02}" font-family="${FONT}" font-size="${size}" font-weight="800" letter-spacing="-4" fill="#ffffff">${esc(line)}</text>`,
    )
    .join('\n  ');
}

function subtitle(text: string, y: number): string {
  return `<text x="140" y="${y}" font-family="${FONT}" font-size="44" font-weight="500" fill="#ffffff" fill-opacity="0.85">${esc(text)}</text>`;
}

function cta(text: string, y: number, ink: string): string {
  const width = 110 + text.length * 22;
  return `<rect x="140" y="${y}" width="${width}" height="92" rx="46" fill="#ffffff"/>
  <text x="${140 + width / 2}" y="${y + 59}" font-family="${FONT}" font-size="36" font-weight="700" fill="${ink}" text-anchor="middle">${esc(text)}</text>`;
}

function hero(opts: {
  palette: Palette;
  eyebrow: string;
  title: string[];
  subtitle: string;
  cta: string;
  side: string;
}): string {
  const titleY = 430;
  const afterTitle = titleY + (opts.title.length - 1) * 153;
  return frame(
    opts.palette,
    `${eyebrow(opts.eyebrow)}
  ${headline(opts.title, titleY)}
  ${subtitle(opts.subtitle, afterTitle + 105)}
  ${cta(opts.cta, afterTitle + 175, opts.palette.ink)}
  ${opts.side}`,
  );
}

const sideText = (big: string, small: string) => `
  <text x="1560" y="610" font-family="${FONT}" font-size="250" font-weight="900" letter-spacing="-10" fill="#ffffff" text-anchor="middle">${esc(big)}</text>
  <text x="1560" y="700" font-family="${FONT}" font-size="64" font-weight="800" letter-spacing="14" fill="#ffffff" fill-opacity="0.9" text-anchor="middle">${esc(small)}</text>`;

function menu(palette: Palette): string {
  const items: [string, string][] = [
    ['Prato executivo', 'R$ 32,90'],
    ['Salada da casa', 'R$ 24,90'],
    ['Massa ao pesto', 'R$ 38,50'],
    ['Suco natural', 'R$ 9,90'],
    ['Sobremesa do dia', 'R$ 12,00'],
  ];
  const rows = items
    .map(([dish, price], i) => {
      const y = 380 + i * 112;
      return `<text x="980" y="${y}" font-family="${FONT}" font-size="46" font-weight="600" fill="#ffffff">${esc(dish)}</text>
  <text x="1720" y="${y}" font-family="${FONT}" font-size="46" font-weight="800" fill="#ffffff" text-anchor="end">${esc(price)}</text>
  ${i < items.length - 1 ? `<line x1="980" y1="${y + 46}" x2="1720" y2="${y + 46}" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2" stroke-dasharray="4 10"/>` : ''}`;
    })
    .join('\n  ');

  return frame(
    palette,
    `${eyebrow('Hoje', 330)}
  ${headline(['Cardápio', 'do dia'], 510, 140)}
  ${subtitle('Servido das 11h às 15h', 770)}
  <rect x="910" y="250" width="880" height="640" rx="40" fill="#000000" fill-opacity="0.22"/>
  <rect x="910" y="250" width="880" height="640" rx="40" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2"/>
  ${rows}`,
  );
}

function social(palette: Palette, handle: string): string {
  return frame(
    palette,
    `<g transform="translate(960 300)">
    <rect x="-95" y="-95" width="190" height="190" rx="56" fill="none" stroke="#ffffff" stroke-width="14"/>
    <circle cx="0" cy="0" r="44" fill="none" stroke="#ffffff" stroke-width="14"/>
    <circle cx="52" cy="-52" r="11" fill="#ffffff"/>
  </g>
  <text x="960" y="560" font-family="${FONT}" font-size="128" font-weight="800" letter-spacing="-3" fill="#ffffff" text-anchor="middle">Siga-nos no Instagram</text>
  <text x="960" y="680" font-family="${FONT}" font-size="64" font-weight="600" fill="#ffffff" fill-opacity="0.92" text-anchor="middle">${esc(handle)}</text>
  <rect x="580" y="760" width="760" height="92" rx="46" fill="#ffffff"/>
  <text x="960" y="820" font-family="${FONT}" font-size="36" font-weight="700" fill="${palette.ink}" text-anchor="middle">Novidades e promoções toda semana</text>`,
  );
}

export const DEMO_BANNERS: DemoBanner[] = [
  {
    slug: 'promocao-de-verao',
    name: 'Promoção de Verão',
    svg: hero({
      palette: {
        from: '#ff8a00',
        via: '#ff3d6e',
        to: '#c2185b',
        glowA: '#ffd54f',
        glowB: '#ff6f00',
        ink: '#c2185b',
      },
      eyebrow: 'Promoção de verão',
      title: ['Até 50% off', 'em toda a loja'],
      subtitle: 'Moda praia, acessórios e muito mais.',
      cta: 'Só até domingo',
      side: sideText('50%', 'OFF'),
    }),
  },
  {
    slug: 'novidades-da-semana',
    name: 'Novidades da semana',
    svg: hero({
      palette: {
        from: '#312e81',
        via: '#4f46e5',
        to: '#7c3aed',
        glowA: '#a78bfa',
        glowB: '#22d3ee',
        ink: '#4338ca',
      },
      eyebrow: 'Acabou de chegar',
      title: ['Novidades', 'da semana'],
      subtitle: 'A nova coleção já está nas araras.',
      cta: 'Confira na loja',
      side: sideText('NEW', 'COLEÇÃO'),
    }),
  },
  {
    slug: 'cardapio-do-dia',
    name: 'Cardápio do dia',
    svg: menu({
      from: '#064e3b',
      via: '#047857',
      to: '#065f46',
      glowA: '#34d399',
      glowB: '#fbbf24',
      ink: '#065f46',
    }),
  },
  {
    slug: 'siga-nos-no-instagram',
    name: 'Siga-nos no Instagram',
    svg: social(
      {
        from: '#7c3aed',
        via: '#db2777',
        to: '#f59e0b',
        glowA: '#f472b6',
        glowB: '#fde68a',
        ink: '#be185d',
      },
      '@sualoja',
    ),
  },
  {
    slug: 'bem-vindo',
    name: 'Bem-vindo',
    svg: hero({
      palette: {
        from: '#0f172a',
        via: '#0e7490',
        to: '#0891b2',
        glowA: '#67e8f9',
        glowB: '#38bdf8',
        ink: '#0e7490',
      },
      eyebrow: 'Recepção',
      title: ['Seja bem-vindo!'],
      subtitle: 'Fique à vontade — já vamos chamar você.',
      cta: 'Wi-Fi: Visitantes',
      side: sideText('Olá', 'BEM-VINDO'),
    }),
  },
];
