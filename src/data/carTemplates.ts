import { CustomCarAccessoryConfig, CustomCarAsset } from '../types';

export interface MultiViewPreset {
  id: string;
  name: string;
  category: 'JDM' | 'Muscle' | 'Supercar' | 'Rally';
  description: string;
  primaryColor: string;
  secondaryColor: string;
  neonColor: string;
  generateRight: () => string[];
  generateLeft: () => string[];
  generateFront: () => string[];
  generateRear: () => string[];
  generateTop: () => string[];
  accessoryConfig: CustomCarAccessoryConfig;
}

export function createEmptyGrid(w: number, h: number): string[] {
  return new Array(w * h).fill('');
}

export function fillRect(
  pixels: string[],
  w: number,
  h: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  color: string
) {
  for (let y = Math.max(0, ry); y < Math.min(h, ry + rh); y++) {
    for (let x = Math.max(0, rx); x < Math.min(w, rx + rw); x++) {
      pixels[y * w + x] = color;
    }
  }
}

export function mirrorGrid(pixels: string[], w: number, h: number): string[] {
  const result = new Array(w * h).fill('');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      result[y * w + (w - 1 - x)] = pixels[y * w + x];
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// 1. NISSAN SKYLINE GT-R R34 (BAYSIDE BLUE)
// ---------------------------------------------------------------------------
export const skyline_r34: MultiViewPreset = {
  id: 'skyline_r34',
  name: 'Nissan Skyline GT-R R34 (Oficial)',
  category: 'JDM',
  description: 'Lenda do JDM em Bayside Blue com grade com emblema GT-R, intercooler FMIC frontal, lanternas duplas redondas e aerofólio alto com pedestais de alumínio.',
  primaryColor: '#1d4ed8',
  secondaryColor: '#0f172a',
  neonColor: '#38bdf8',
  accessoryConfig: {
    wheels: { visible: true, rearX: 10, rearY: 17, frontX: 38, frontY: 17, radius: 3.5, layer: 'in_front', style: 'spokes', spinning: true },
    spoiler: { visible: true, x: 4, y: 7, scale: 1.0, layer: 'in_front', style: 'gt_wing' },
    nitro: { visible: true, x: 1, y: 17, layer: 'behind' },
    headlights: { visible: true, x: 43, y: 14, beamVisible: true, layer: 'in_front' },
    neon: { visible: true, color: '#38bdf8', y: 20 }
  },
  generateRight: () => {
    const w = 48, h = 24, p = createEmptyGrid(w, h);
    const hi = '__PRIMARY_HI__', pri = '__PRIMARY_BASE__', dark = '__PRIMARY_DARK__', deep = '__PRIMARY_DEEP__';
    const sec = '__SECONDARY_BASE__', secDark = '__SECONDARY_DARK__', glass = '#0f172a', sky = '#38bdf8';

    // Carbon splitter & side skirts
    fillRect(p, w, h, 4, 19, 41, 1, sec);
    fillRect(p, w, h, 43, 19, 2, 1, secDark);
    // Lower body shadow
    fillRect(p, w, h, 4, 18, 41, 1, deep);
    fillRect(p, w, h, 5, 17, 39, 1, dark);
    // Main JDM waistline
    fillRect(p, w, h, 4, 15, 41, 2, pri);
    // Upper shoulder line
    fillRect(p, w, h, 5, 14, 39, 1, pri);
    fillRect(p, w, h, 28, 13, 14, 1, hi);
    fillRect(p, w, h, 5, 13, 10, 1, hi);

    // Front Intercooler FMIC & lower intake
    fillRect(p, w, h, 41, 16, 4, 3, '#09090b');
    fillRect(p, w, h, 42, 17, 3, 2, '#cbd5e1');

    // Cabin & Greenhouse
    fillRect(p, w, h, 15, 9, 18, 5, glass);
    fillRect(p, w, h, 17, 8, 12, 1, pri);
    fillRect(p, w, h, 18, 8, 10, 1, hi);
    fillRect(p, w, h, 27, 9, 3, 5, sky);
    fillRect(p, w, h, 24, 9, 1, 5, sec); // B-pillar

    // GT-R Rear Wing
    fillRect(p, w, h, 4, 7, 5, 1, pri);
    fillRect(p, w, h, 4, 6, 5, 1, hi);
    fillRect(p, w, h, 5, 8, 1, 6, '#94a3b8'); // alloy pedestal
    fillRect(p, w, h, 8, 8, 1, 6, '#94a3b8');

    // Twin Round Taillights (Skyline signature)
    fillRect(p, w, h, 4, 14, 1, 1, '#dc2626');
    fillRect(p, w, h, 4, 15, 1, 1, '#ef4444');
    fillRect(p, w, h, 5, 14, 1, 1, '#f97316');

    // Headlights
    fillRect(p, w, h, 43, 14, 2, 1, '#e0f2fe');
    fillRect(p, w, h, 42, 14, 1, 1, '#fef08a');

    // Clear wheel openings
    fillRect(p, w, h, 7, 17, 7, 3, '');
    fillRect(p, w, h, 35, 17, 7, 3, '');
    fillRect(p, w, h, 8, 16, 5, 1, '#09090b');
    fillRect(p, w, h, 36, 16, 5, 1, '#09090b');

    // Titanium exhaust tip
    fillRect(p, w, h, 3, 19, 2, 1, '#38bdf8');
    return p;
  },
  generateLeft: () => mirrorGrid(skyline_r34.generateRight(), 48, 24),
  generateFront: () => {
    const w = 24, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 2, 19, 20, 1, '__SECONDARY_BASE__');
    fillRect(p, w, h, 3, 15, 18, 4, '__PRIMARY_BASE__');
    // Front grille with GT-R red badge
    fillRect(p, w, h, 6, 15, 12, 4, '#09090b');
    fillRect(p, w, h, 8, 17, 8, 2, '#cbd5e1'); // FMIC
    fillRect(p, w, h, 14, 15, 1, 1, '#ef4444'); // GT-R badge
    // Headlights
    fillRect(p, w, h, 3, 14, 3, 1, '#e0f2fe');
    fillRect(p, w, h, 18, 14, 3, 1, '#e0f2fe');
    // Hood & Windshield
    fillRect(p, w, h, 5, 13, 14, 2, '__PRIMARY_BASE__');
    fillRect(p, w, h, 6, 8, 12, 5, '#0f172a');
    fillRect(p, w, h, 7, 7, 10, 1, '__PRIMARY_BASE__');
    // Tires
    fillRect(p, w, h, 1, 16, 2, 4, '#18181b');
    fillRect(p, w, h, 21, 16, 2, 4, '#18181b');
    return p;
  },
  generateRear: () => {
    const w = 24, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 3, 19, 18, 1, '__SECONDARY_BASE__');
    fillRect(p, w, h, 3, 15, 18, 4, '__PRIMARY_BASE__');
    // Iconic Twin Round Taillights per side
    fillRect(p, w, h, 4, 14, 2, 2, '#dc2626');
    fillRect(p, w, h, 7, 14, 1, 2, '#ef4444');
    fillRect(p, w, h, 16, 14, 1, 2, '#ef4444');
    fillRect(p, w, h, 18, 14, 2, 2, '#dc2626');
    // Wing
    fillRect(p, w, h, 3, 5, 18, 1, '__PRIMARY_BASE__');
    fillRect(p, w, h, 6, 6, 1, 3, '#94a3b8');
    fillRect(p, w, h, 17, 6, 1, 3, '#94a3b8');
    // Exhaust & Window
    fillRect(p, w, h, 4, 19, 2, 1, '#38bdf8');
    fillRect(p, w, h, 6, 8, 12, 5, '#0f172a');
    fillRect(p, w, h, 1, 16, 2, 4, '#18181b');
    fillRect(p, w, h, 21, 16, 2, 4, '#18181b');
    return p;
  },
  generateTop: () => {
    const w = 48, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 4, 4, 40, 16, '__PRIMARY_BASE__');
    fillRect(p, w, h, 17, 6, 14, 12, '#0f172a');
    fillRect(p, w, h, 4, 4, 2, 16, '__PRIMARY_HI__'); // Wing
    fillRect(p, w, h, 8, 2, 5, 2, '#18181b');
    fillRect(p, w, h, 8, 20, 5, 2, '#18181b');
    fillRect(p, w, h, 36, 2, 5, 2, '#18181b');
    fillRect(p, w, h, 36, 20, 5, 2, '#18181b');
    return p;
  }
};

// ---------------------------------------------------------------------------
// 2. BMW M3 GTR E46 (MOST WANTED TITANIUM SILVER & BLUE)
// ---------------------------------------------------------------------------
export const bmw_m3_gtr: MultiViewPreset = {
  id: 'bmw_m3_gtr',
  name: 'BMW M3 GTR E46 (Oficial)',
  category: 'Supercar',
  description: 'O lendário bólido de Most Wanted com pintura Titanium Silver, grafismos azuis de competição em corte diagonal, teto em fibra de carbono, capô ventilado e aerofólio ALMS.',
  primaryColor: '#cbd5e1',
  secondaryColor: '#1e40af',
  neonColor: '#60a5fa',
  accessoryConfig: {
    wheels: { visible: true, rearX: 10, rearY: 17, frontX: 38, frontY: 17, radius: 3.5, layer: 'in_front', style: 'mesh', spinning: true },
    spoiler: { visible: true, x: 4, y: 6, scale: 1.1, layer: 'in_front', style: 'gt_wing' },
    nitro: { visible: true, x: 1, y: 17, layer: 'behind' },
    headlights: { visible: true, x: 43, y: 14, beamVisible: true, layer: 'in_front' },
    neon: { visible: true, color: '#60a5fa', y: 20 }
  },
  generateRight: () => {
    const w = 48, h = 24, p = createEmptyGrid(w, h);
    const hi = '__PRIMARY_HI__', pri = '__PRIMARY_BASE__', dark = '__PRIMARY_DARK__', deep = '__PRIMARY_DEEP__';
    const vinyl = '__SECONDARY_BASE__', vinylLight = '#3b82f6', carbon = '#1e293b';

    // Carbon splitter & skirts
    fillRect(p, w, h, 4, 19, 41, 1, carbon);
    // Lower body crease
    fillRect(p, w, h, 4, 18, 41, 1, deep);
    fillRect(p, w, h, 5, 17, 39, 1, dark);
    // Silver main body
    fillRect(p, w, h, 4, 15, 41, 2, pri);
    fillRect(p, w, h, 5, 14, 39, 1, pri);
    fillRect(p, w, h, 28, 13, 14, 1, hi);

    // Most Wanted Iconic Blue Vinyl Diagonal Stripes
    fillRect(p, w, h, 7, 14, 6, 2, vinyl);
    fillRect(p, w, h, 14, 14, 5, 2, vinyl);
    fillRect(p, w, h, 20, 15, 6, 2, vinyl);
    fillRect(p, w, h, 27, 14, 4, 2, vinyl);
    fillRect(p, w, h, 21, 15, 5, 1, vinylLight);
    fillRect(p, w, h, 8, 14, 4, 1, vinylLight);

    // Dual hood heat extraction louvers
    fillRect(p, w, h, 33, 13, 2, 1, carbon);
    fillRect(p, w, h, 37, 13, 2, 1, carbon);

    // Carbon Fiber Roof Panel
    fillRect(p, w, h, 18, 8, 10, 1, carbon);
    fillRect(p, w, h, 15, 9, 17, 5, '#0f172a');
    fillRect(p, w, h, 26, 9, 3, 5, '#38bdf8'); // windshield sky reflection

    // Side-exit race exhaust (GTR race feature!)
    fillRect(p, w, h, 15, 19, 2, 1, '#f1f5f9');

    // Angel Eye Headlights
    fillRect(p, w, h, 43, 14, 2, 1, '#e0f2fe');
    fillRect(p, w, h, 41, 14, 1, 1, '#fef08a');

    // L-shaped taillights
    fillRect(p, w, h, 4, 14, 1, 2, '#ef4444');

    // ALMS High Carbon GT Wing
    fillRect(p, w, h, 3, 6, 7, 1, carbon);
    fillRect(p, w, h, 5, 7, 1, 6, carbon);
    fillRect(p, w, h, 8, 7, 1, 6, carbon);

    // Wheel arches
    fillRect(p, w, h, 7, 17, 7, 3, '');
    fillRect(p, w, h, 35, 17, 7, 3, '');
    fillRect(p, w, h, 8, 16, 5, 1, '#09090b');
    fillRect(p, w, h, 36, 16, 5, 1, '#09090b');
    return p;
  },
  generateLeft: () => mirrorGrid(bmw_m3_gtr.generateRight(), 48, 24),
  generateFront: () => {
    const w = 24, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 2, 19, 20, 1, '#1e293b');
    fillRect(p, w, h, 3, 15, 18, 4, '__PRIMARY_BASE__');
    // Iconic BMW Twin Kidney Grille
    fillRect(p, w, h, 7, 16, 4, 3, '#09090b');
    fillRect(p, w, h, 13, 16, 4, 3, '#09090b');
    fillRect(p, w, h, 7, 16, 4, 1, '#94a3b8');
    fillRect(p, w, h, 13, 16, 4, 1, '#94a3b8');
    // Angel eyes
    fillRect(p, w, h, 3, 14, 3, 2, '#e0f2fe');
    fillRect(p, w, h, 18, 14, 3, 2, '#e0f2fe');
    // Hood bulge & vents
    fillRect(p, w, h, 6, 12, 12, 2, '__PRIMARY_BASE__');
    fillRect(p, w, h, 8, 13, 2, 1, '#09090b');
    fillRect(p, w, h, 14, 13, 2, 1, '#09090b');
    // Carbon roof
    fillRect(p, w, h, 6, 8, 12, 5, '#0f172a');
    fillRect(p, w, h, 7, 7, 10, 1, '#1e293b');
    fillRect(p, w, h, 1, 16, 2, 4, '#18181b');
    fillRect(p, w, h, 21, 16, 2, 4, '#18181b');
    return p;
  },
  generateRear: () => {
    const w = 24, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 2, 19, 20, 1, '#1e293b');
    fillRect(p, w, h, 3, 15, 18, 4, '__PRIMARY_BASE__');
    // Quad exhaust tips
    fillRect(p, w, h, 8, 19, 2, 1, '#cbd5e1');
    fillRect(p, w, h, 14, 19, 2, 1, '#cbd5e1');
    // L-taillights
    fillRect(p, w, h, 4, 14, 4, 2, '#ef4444');
    fillRect(p, w, h, 16, 14, 4, 2, '#ef4444');
    // Wing
    fillRect(p, w, h, 2, 5, 20, 1, '#1e293b');
    fillRect(p, w, h, 6, 6, 1, 4, '#1e293b');
    fillRect(p, w, h, 17, 6, 1, 4, '#1e293b');
    fillRect(p, w, h, 6, 8, 12, 5, '#0f172a');
    fillRect(p, w, h, 1, 16, 2, 4, '#18181b');
    fillRect(p, w, h, 21, 16, 2, 4, '#18181b');
    return p;
  },
  generateTop: () => {
    const w = 48, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 4, 4, 40, 16, '__PRIMARY_BASE__');
    // Diagonal Blue Vinyl
    fillRect(p, w, h, 12, 4, 8, 6, '__SECONDARY_BASE__');
    fillRect(p, w, h, 24, 14, 12, 6, '__SECONDARY_BASE__');
    // Carbon roof
    fillRect(p, w, h, 17, 6, 13, 12, '#1e293b');
    fillRect(p, w, h, 4, 4, 2, 16, '#1e293b');
    fillRect(p, w, h, 8, 2, 5, 2, '#18181b');
    fillRect(p, w, h, 8, 20, 5, 2, '#18181b');
    fillRect(p, w, h, 36, 2, 5, 2, '#18181b');
    fillRect(p, w, h, 36, 20, 5, 2, '#18181b');
    return p;
  }
};

// ---------------------------------------------------------------------------
// 3. MAZDA RX-7 FD3S (ROTARY YELLOW)
// ---------------------------------------------------------------------------
export const rx7_fd: MultiViewPreset = {
  id: 'rx7_fd',
  name: 'Mazda RX-7 FD3S Rotary (Oficial)',
  category: 'JDM',
  description: 'O ícone rotativo Wankel 13B bi-turbo japonês em Amarelo Competição, silhueta com curvas orgânicas puras, perfil ultra-baixo, faróis escamoteáveis aerodinâmicos e lanterna traseira inteiriça fumê.',
  primaryColor: '#eab308',
  secondaryColor: '#18181b',
  neonColor: '#facc15',
  accessoryConfig: {
    wheels: { visible: true, rearX: 10, rearY: 17, frontX: 38, frontY: 17, radius: 3.5, layer: 'in_front', style: 'spokes', spinning: true },
    spoiler: { visible: true, x: 4, y: 8, scale: 0.9, layer: 'in_front', style: 'gt_wing' },
    nitro: { visible: true, x: 1, y: 17, layer: 'behind' },
    headlights: { visible: true, x: 42, y: 13, beamVisible: true, layer: 'in_front' },
    neon: { visible: true, color: '#facc15', y: 20 }
  },
  generateRight: () => {
    const w = 48, h = 24, p = createEmptyGrid(w, h);
    const hi = '__PRIMARY_HI__', pri = '__PRIMARY_BASE__', dark = '__PRIMARY_DARK__', deep = '__PRIMARY_DEEP__';
    const sec = '__SECONDARY_BASE__', glass = '#0f172a';

    // Carbon diffuser & rocker
    fillRect(p, w, h, 4, 19, 41, 1, sec);
    fillRect(p, w, h, 4, 18, 41, 1, deep);
    fillRect(p, w, h, 5, 17, 39, 1, dark);
    // Smooth coke-bottle curves
    fillRect(p, w, h, 4, 15, 41, 2, pri);
    fillRect(p, w, h, 5, 14, 38, 1, pri);
    fillRect(p, w, h, 28, 13, 13, 1, hi);
    fillRect(p, w, h, 6, 13, 9, 1, hi);

    // Pop-up headlight seams
    fillRect(p, w, h, 38, 13, 3, 1, dark);
    fillRect(p, w, h, 43, 15, 2, 1, '#fef08a');

    // Curved teardrop greenhouse & fastback glass
    fillRect(p, w, h, 15, 9, 17, 5, glass);
    fillRect(p, w, h, 18, 8, 10, 1, pri);
    fillRect(p, w, h, 19, 8, 8, 1, hi);
    fillRect(p, w, h, 26, 9, 3, 5, '#38bdf8');

    // Smoked rear light bar & curved spoiler
    fillRect(p, w, h, 4, 14, 1, 2, '#7f1d1d');
    fillRect(p, w, h, 3, 14, 1, 1, '#dc2626');
    fillRect(p, w, h, 4, 8, 5, 1, pri);
    fillRect(p, w, h, 5, 9, 1, 5, sec);
    fillRect(p, w, h, 8, 9, 1, 5, sec);

    // Wheel arches
    fillRect(p, w, h, 7, 17, 7, 3, '');
    fillRect(p, w, h, 35, 17, 7, 3, '');
    fillRect(p, w, h, 8, 16, 5, 1, '#09090b');
    fillRect(p, w, h, 36, 16, 5, 1, '#09090b');
    return p;
  },
  generateLeft: () => mirrorGrid(rx7_fd.generateRight(), 48, 24),
  generateFront: () => {
    const w = 24, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 2, 19, 20, 1, '__SECONDARY_BASE__');
    fillRect(p, w, h, 3, 15, 18, 4, '__PRIMARY_BASE__');
    fillRect(p, w, h, 7, 17, 10, 2, '#09090b'); // front mouth
    // Pop-up headlights
    fillRect(p, w, h, 4, 13, 3, 1, '__PRIMARY_HI__');
    fillRect(p, w, h, 17, 13, 3, 1, '__PRIMARY_HI__');
    fillRect(p, w, h, 4, 14, 3, 1, '#fef08a');
    fillRect(p, w, h, 17, 14, 3, 1, '#fef08a');
    // Cabin
    fillRect(p, w, h, 6, 8, 12, 5, '#0f172a');
    fillRect(p, w, h, 7, 7, 10, 1, '__PRIMARY_BASE__');
    fillRect(p, w, h, 1, 16, 2, 4, '#18181b');
    fillRect(p, w, h, 21, 16, 2, 4, '#18181b');
    return p;
  },
  generateRear: () => {
    const w = 24, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 3, 19, 18, 1, '__SECONDARY_BASE__');
    fillRect(p, w, h, 3, 15, 18, 4, '__PRIMARY_BASE__');
    // Full-width continuous smoked taillight bar
    fillRect(p, w, h, 4, 14, 16, 2, '#09090b');
    fillRect(p, w, h, 5, 14, 5, 1, '#dc2626');
    fillRect(p, w, h, 14, 14, 5, 1, '#dc2626');
    fillRect(p, w, h, 18, 19, 2, 1, '#cbd5e1'); // exhaust
    fillRect(p, w, h, 6, 8, 12, 5, '#0f172a');
    fillRect(p, w, h, 3, 6, 18, 1, '__PRIMARY_BASE__');
    fillRect(p, w, h, 1, 16, 2, 4, '#18181b');
    fillRect(p, w, h, 21, 16, 2, 4, '#18181b');
    return p;
  },
  generateTop: () => {
    const w = 48, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 4, 4, 40, 16, '__PRIMARY_BASE__');
    fillRect(p, w, h, 17, 6, 14, 12, '#0f172a');
    fillRect(p, w, h, 4, 5, 2, 14, '__PRIMARY_HI__');
    fillRect(p, w, h, 8, 2, 5, 2, '#18181b');
    fillRect(p, w, h, 8, 20, 5, 2, '#18181b');
    fillRect(p, w, h, 36, 2, 5, 2, '#18181b');
    fillRect(p, w, h, 36, 20, 5, 2, '#18181b');
    return p;
  }
};

// ---------------------------------------------------------------------------
// 4. SUBARU IMPREZA WRX STI (WR BLUE & GOLD)
// ---------------------------------------------------------------------------
export const wrx_sti: MultiViewPreset = {
  id: 'wrx_sti',
  name: 'Subaru WRX STI Rally (Oficial)',
  category: 'Rally',
  description: 'Campeão lendário dos circuitos WRC em azul World Rally Blue com rodas douradas, entrada de ar gigantesca no capô e imponente asa traseira de rali de dois andares.',
  primaryColor: '#2563eb',
  secondaryColor: '#0f172a',
  neonColor: '#06b6d4',
  accessoryConfig: {
    wheels: { visible: true, rearX: 10, rearY: 17, frontX: 38, frontY: 17, radius: 3.5, layer: 'in_front', style: 'mesh', spinning: true },
    spoiler: { visible: true, x: 3, y: 5, scale: 1.2, layer: 'in_front', style: 'gt_wing' },
    nitro: { visible: true, x: 1, y: 17, layer: 'behind' },
    headlights: { visible: true, x: 43, y: 14, beamVisible: true, layer: 'in_front' },
    neon: { visible: true, color: '#06b6d4', y: 20 }
  },
  generateRight: () => {
    const w = 48, h = 24, p = createEmptyGrid(w, h);
    const hi = '__PRIMARY_HI__', pri = '__PRIMARY_BASE__', dark = '__PRIMARY_DARK__', deep = '__PRIMARY_DEEP__';
    const sec = '__SECONDARY_BASE__', glass = '#0f172a';

    fillRect(p, w, h, 4, 19, 41, 1, sec);
    fillRect(p, w, h, 4, 18, 41, 1, deep);
    fillRect(p, w, h, 5, 17, 39, 1, dark);
    fillRect(p, w, h, 4, 15, 41, 2, pri);
    fillRect(p, w, h, 5, 14, 39, 1, pri);
    fillRect(p, w, h, 28, 13, 14, 1, hi);

    // Giant Functional Hood Scoop
    fillRect(p, w, h, 33, 11, 6, 2, pri);
    fillRect(p, w, h, 33, 11, 6, 1, hi);
    fillRect(p, w, h, 38, 12, 2, 1, '#09090b'); // scoop intake hole

    // 4-door Rally Greenhouse
    fillRect(p, w, h, 14, 9, 18, 5, glass);
    fillRect(p, w, h, 17, 8, 12, 1, pri);
    fillRect(p, w, h, 18, 8, 10, 1, hi);
    fillRect(p, w, h, 23, 9, 1, 5, sec); // B-pillar
    fillRect(p, w, h, 27, 9, 3, 5, '#38bdf8');

    // Massive High-Rise STI Rally Wing
    fillRect(p, w, h, 3, 5, 6, 1, pri);
    fillRect(p, w, h, 3, 4, 6, 1, hi);
    fillRect(p, w, h, 4, 6, 1, 8, pri);
    fillRect(p, w, h, 7, 6, 1, 8, pri);

    // Headlight & fog pod
    fillRect(p, w, h, 43, 14, 2, 1, '#e0f2fe');
    fillRect(p, w, h, 42, 17, 2, 2, '#fef08a'); // large yellow rally fog lamp

    // Taillight
    fillRect(p, w, h, 4, 14, 1, 2, '#ef4444');

    // Wheel arches
    fillRect(p, w, h, 7, 17, 7, 3, '');
    fillRect(p, w, h, 35, 17, 7, 3, '');
    fillRect(p, w, h, 8, 16, 5, 1, '#09090b');
    fillRect(p, w, h, 36, 16, 5, 1, '#09090b');
    return p;
  },
  generateLeft: () => mirrorGrid(wrx_sti.generateRight(), 48, 24),
  generateFront: () => {
    const w = 24, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 2, 19, 20, 1, '__SECONDARY_BASE__');
    fillRect(p, w, h, 3, 15, 18, 4, '__PRIMARY_BASE__');
    // Massive center hood scoop
    fillRect(p, w, h, 8, 11, 8, 3, '__PRIMARY_BASE__');
    fillRect(p, w, h, 8, 11, 8, 1, '__PRIMARY_HI__');
    fillRect(p, w, h, 9, 12, 6, 2, '#09090b');
    // Grille & fog lights
    fillRect(p, w, h, 7, 16, 10, 2, '#09090b');
    fillRect(p, w, h, 3, 17, 3, 2, '#fef08a');
    fillRect(p, w, h, 18, 17, 3, 2, '#fef08a');
    fillRect(p, w, h, 3, 14, 3, 1, '#e0f2fe');
    fillRect(p, w, h, 18, 14, 3, 1, '#e0f2fe');
    // Windshield
    fillRect(p, w, h, 6, 8, 12, 5, '#0f172a');
    fillRect(p, w, h, 7, 7, 10, 1, '__PRIMARY_BASE__');
    fillRect(p, w, h, 1, 16, 2, 4, '#18181b');
    fillRect(p, w, h, 21, 16, 2, 4, '#18181b');
    return p;
  },
  generateRear: () => {
    const w = 24, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 3, 19, 18, 1, '__SECONDARY_BASE__');
    fillRect(p, w, h, 3, 15, 18, 4, '__PRIMARY_BASE__');
    // Large single rally exhaust
    fillRect(p, w, h, 4, 19, 2, 1, '#cbd5e1');
    fillRect(p, w, h, 4, 14, 4, 2, '#ef4444');
    fillRect(p, w, h, 16, 14, 4, 2, '#ef4444');
    // Massive STI Wing
    fillRect(p, w, h, 2, 4, 20, 1, '__PRIMARY_BASE__');
    fillRect(p, w, h, 5, 5, 1, 5, '__PRIMARY_BASE__');
    fillRect(p, w, h, 18, 5, 1, 5, '__PRIMARY_BASE__');
    fillRect(p, w, h, 6, 8, 12, 5, '#0f172a');
    fillRect(p, w, h, 1, 16, 2, 4, '#18181b');
    fillRect(p, w, h, 21, 16, 2, 4, '#18181b');
    return p;
  },
  generateTop: () => {
    const w = 48, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 4, 4, 40, 16, '__PRIMARY_BASE__');
    fillRect(p, w, h, 33, 9, 6, 6, '__PRIMARY_HI__');
    fillRect(p, w, h, 17, 6, 13, 12, '#0f172a');
    fillRect(p, w, h, 3, 4, 2, 16, '__PRIMARY_HI__');
    fillRect(p, w, h, 8, 2, 5, 2, '#18181b');
    fillRect(p, w, h, 8, 20, 5, 2, '#18181b');
    fillRect(p, w, h, 36, 2, 5, 2, '#18181b');
    fillRect(p, w, h, 36, 20, 5, 2, '#18181b');
    return p;
  }
};

// ---------------------------------------------------------------------------
// 5. MITSUBISHI LANCER EVOLUTION IX MR (APEX RED)
// ---------------------------------------------------------------------------
export const lancer_evo: MultiViewPreset = {
  id: 'lancer_evo',
  name: 'Lancer Evolution IX MR (Oficial)',
  category: 'Rally',
  description: 'Sedan de rali 4G63 turbo em Vermelho Apex com nariz de tubarão, intercooler FMIC aparente, capô com extratores de calor, geradores de vórtice no teto e aerofólio de carbono.',
  primaryColor: '#dc2626',
  secondaryColor: '#0f172a',
  neonColor: '#ef4444',
  accessoryConfig: {
    wheels: { visible: true, rearX: 10, rearY: 17, frontX: 38, frontY: 17, radius: 3.5, layer: 'in_front', style: 'spokes', spinning: true },
    spoiler: { visible: true, x: 4, y: 6, scale: 1.1, layer: 'in_front', style: 'gt_wing' },
    nitro: { visible: true, x: 1, y: 17, layer: 'behind' },
    headlights: { visible: true, x: 43, y: 14, beamVisible: true, layer: 'in_front' },
    neon: { visible: true, color: '#ef4444', y: 20 }
  },
  generateRight: () => {
    const w = 48, h = 24, p = createEmptyGrid(w, h);
    const hi = '__PRIMARY_HI__', pri = '__PRIMARY_BASE__', dark = '__PRIMARY_DARK__', deep = '__PRIMARY_DEEP__';
    const sec = '__SECONDARY_BASE__', glass = '#0f172a';

    fillRect(p, w, h, 4, 19, 41, 1, sec);
    fillRect(p, w, h, 4, 18, 41, 1, deep);
    fillRect(p, w, h, 5, 17, 39, 1, dark);
    fillRect(p, w, h, 4, 15, 41, 2, pri);
    fillRect(p, w, h, 5, 14, 39, 1, pri);
    fillRect(p, w, h, 28, 13, 14, 1, hi);

    // FMIC Front Intercooler & shark nose
    fillRect(p, w, h, 41, 16, 4, 3, '#09090b');
    fillRect(p, w, h, 42, 17, 3, 2, '#e2e8f0');

    // Hood heat extractors
    fillRect(p, w, h, 34, 13, 4, 1, '#09090b');

    // 4-door cabin & Roof Vortex Generator teeth
    fillRect(p, w, h, 14, 9, 18, 5, glass);
    fillRect(p, w, h, 17, 8, 12, 1, pri);
    fillRect(p, w, h, 17, 7, 2, 1, sec); // vortex fin
    fillRect(p, w, h, 23, 9, 1, 5, sec); // B-pillar
    fillRect(p, w, h, 27, 9, 3, 5, '#38bdf8');

    // Tall carbon rally wing
    fillRect(p, w, h, 4, 6, 5, 1, sec);
    fillRect(p, w, h, 4, 7, 1, 7, pri); // red endplate
    fillRect(p, w, h, 7, 7, 1, 7, sec);

    // Headlight & Taillight
    fillRect(p, w, h, 43, 14, 2, 1, '#e0f2fe');
    fillRect(p, w, h, 4, 14, 1, 2, '#cbd5e1'); // clear Euro taillight
    fillRect(p, w, h, 4, 14, 1, 1, '#ef4444');

    // Wheel arches
    fillRect(p, w, h, 7, 17, 7, 3, '');
    fillRect(p, w, h, 35, 17, 7, 3, '');
    fillRect(p, w, h, 8, 16, 5, 1, '#09090b');
    fillRect(p, w, h, 36, 16, 5, 1, '#09090b');
    return p;
  },
  generateLeft: () => mirrorGrid(lancer_evo.generateRight(), 48, 24),
  generateFront: () => {
    const w = 24, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 2, 19, 20, 1, '__SECONDARY_BASE__');
    fillRect(p, w, h, 3, 15, 18, 4, '__PRIMARY_BASE__');
    // Shark nose & huge center FMIC
    fillRect(p, w, h, 6, 15, 12, 4, '#09090b');
    fillRect(p, w, h, 7, 16, 10, 3, '#cbd5e1');
    fillRect(p, w, h, 3, 14, 3, 1, '#e0f2fe');
    fillRect(p, w, h, 18, 14, 3, 1, '#e0f2fe');
    fillRect(p, w, h, 6, 8, 12, 5, '#0f172a');
    fillRect(p, w, h, 7, 7, 10, 1, '__PRIMARY_BASE__');
    fillRect(p, w, h, 1, 16, 2, 4, '#18181b');
    fillRect(p, w, h, 21, 16, 2, 4, '#18181b');
    return p;
  },
  generateRear: () => {
    const w = 24, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 3, 19, 18, 1, '__SECONDARY_BASE__');
    fillRect(p, w, h, 3, 15, 18, 4, '__PRIMARY_BASE__');
    fillRect(p, w, h, 4, 19, 2, 1, '#cbd5e1'); // exhaust
    fillRect(p, w, h, 4, 14, 4, 2, '#cbd5e1');
    fillRect(p, w, h, 5, 14, 2, 1, '#ef4444');
    fillRect(p, w, h, 16, 14, 4, 2, '#cbd5e1');
    fillRect(p, w, h, 17, 14, 2, 1, '#ef4444');
    fillRect(p, w, h, 3, 5, 18, 1, '__SECONDARY_BASE__');
    fillRect(p, w, h, 6, 6, 1, 4, '__SECONDARY_BASE__');
    fillRect(p, w, h, 17, 6, 1, 4, '__SECONDARY_BASE__');
    fillRect(p, w, h, 6, 8, 12, 5, '#0f172a');
    fillRect(p, w, h, 1, 16, 2, 4, '#18181b');
    fillRect(p, w, h, 21, 16, 2, 4, '#18181b');
    return p;
  },
  generateTop: () => {
    const w = 48, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 4, 4, 40, 16, '__PRIMARY_BASE__');
    fillRect(p, w, h, 32, 8, 8, 8, '#09090b'); // hood vent
    fillRect(p, w, h, 17, 6, 13, 12, '#0f172a');
    fillRect(p, w, h, 4, 4, 2, 16, '__SECONDARY_BASE__');
    fillRect(p, w, h, 8, 2, 5, 2, '#18181b');
    fillRect(p, w, h, 8, 20, 5, 2, '#18181b');
    fillRect(p, w, h, 36, 2, 5, 2, '#18181b');
    fillRect(p, w, h, 36, 20, 5, 2, '#18181b');
    return p;
  }
};

// ---------------------------------------------------------------------------
// 6. CHEVROLET CORVETTE C6 / C6.R (VELOCITY YELLOW)
// ---------------------------------------------------------------------------
export const corvette_c6: MultiViewPreset = {
  id: 'corvette_c6',
  name: 'Corvette C6.R Racing (Oficial)',
  category: 'Muscle',
  description: 'O ícone americano das pistas de Le Mans em Velocity Yellow com capô longo em fibra, faróis de projetor transparentes expostos, teto targa baixo e escapamento central quádruplo.',
  primaryColor: '#facc15',
  secondaryColor: '#18181b',
  neonColor: '#fde047',
  accessoryConfig: {
    wheels: { visible: true, rearX: 10, rearY: 17, frontX: 38, frontY: 17, radius: 3.5, layer: 'in_front', style: 'mesh', spinning: true },
    spoiler: { visible: true, x: 4, y: 11, scale: 1.0, layer: 'in_front', style: 'ducktail' },
    nitro: { visible: true, x: 1, y: 17, layer: 'behind' },
    headlights: { visible: true, x: 43, y: 14, beamVisible: true, layer: 'in_front' },
    neon: { visible: true, color: '#fde047', y: 20 }
  },
  generateRight: () => {
    const w = 48, h = 24, p = createEmptyGrid(w, h);
    const hi = '__PRIMARY_HI__', pri = '__PRIMARY_BASE__', dark = '__PRIMARY_DARK__', deep = '__PRIMARY_DEEP__';
    const sec = '__SECONDARY_BASE__', glass = '#0f172a';

    fillRect(p, w, h, 4, 19, 41, 1, sec);
    fillRect(p, w, h, 4, 18, 41, 1, deep);
    fillRect(p, w, h, 5, 17, 39, 1, dark);
    fillRect(p, w, h, 4, 15, 41, 2, pri);
    // Long sculpted hood line
    fillRect(p, w, h, 5, 14, 39, 1, pri);
    fillRect(p, w, h, 27, 13, 15, 1, hi);
    fillRect(p, w, h, 6, 13, 10, 1, hi);

    // Front fender side heat extraction cove
    fillRect(p, w, h, 33, 15, 2, 2, '#09090b');
    fillRect(p, w, h, 33, 15, 2, 1, '#94a3b8');

    // Low raked greenhouse
    fillRect(p, w, h, 15, 9, 15, 5, glass);
    fillRect(p, w, h, 18, 8, 8, 1, pri);
    fillRect(p, w, h, 19, 8, 6, 1, hi);
    fillRect(p, w, h, 25, 9, 3, 5, '#38bdf8');

    // Exposed projector headlights in body-color pods
    fillRect(p, w, h, 42, 14, 3, 1, '#fef08a');
    fillRect(p, w, h, 43, 15, 2, 1, '#cbd5e1');

    // 4 Classic Round Corvette Taillights
    fillRect(p, w, h, 4, 14, 1, 1, '#dc2626');
    fillRect(p, w, h, 4, 15, 1, 1, '#ef4444');
    fillRect(p, w, h, 5, 14, 1, 1, '#dc2626');

    // Wheel arches
    fillRect(p, w, h, 7, 17, 7, 3, '');
    fillRect(p, w, h, 35, 17, 7, 3, '');
    fillRect(p, w, h, 8, 16, 5, 1, '#09090b');
    fillRect(p, w, h, 36, 16, 5, 1, '#09090b');
    return p;
  },
  generateLeft: () => mirrorGrid(corvette_c6.generateRight(), 48, 24),
  generateFront: () => {
    const w = 24, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 2, 19, 20, 1, '__SECONDARY_BASE__');
    fillRect(p, w, h, 3, 15, 18, 4, '__PRIMARY_BASE__');
    fillRect(p, w, h, 7, 17, 10, 2, '#09090b');
    fillRect(p, w, h, 3, 13, 3, 2, '#fef08a');
    fillRect(p, w, h, 18, 13, 3, 2, '#fef08a');
    fillRect(p, w, h, 6, 8, 12, 5, '#0f172a');
    fillRect(p, w, h, 7, 7, 10, 1, '__PRIMARY_BASE__');
    fillRect(p, w, h, 1, 16, 2, 4, '#18181b');
    fillRect(p, w, h, 21, 16, 2, 4, '#18181b');
    return p;
  },
  generateRear: () => {
    const w = 24, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 3, 19, 18, 1, '__SECONDARY_BASE__');
    fillRect(p, w, h, 3, 14, 18, 5, '__PRIMARY_BASE__');
    // Iconic Quad Centered Exhaust Tips
    fillRect(p, w, h, 10, 19, 4, 1, '#cbd5e1');
    // 4 Round Taillights
    fillRect(p, w, h, 5, 14, 2, 2, '#dc2626');
    fillRect(p, w, h, 8, 14, 2, 2, '#dc2626');
    fillRect(p, w, h, 14, 14, 2, 2, '#dc2626');
    fillRect(p, w, h, 17, 14, 2, 2, '#dc2626');
    fillRect(p, w, h, 6, 8, 12, 5, '#0f172a');
    fillRect(p, w, h, 1, 16, 2, 4, '#18181b');
    fillRect(p, w, h, 21, 16, 2, 4, '#18181b');
    return p;
  },
  generateTop: () => {
    const w = 48, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 4, 4, 40, 16, '__PRIMARY_BASE__');
    fillRect(p, w, h, 16, 6, 12, 12, '#0f172a');
    fillRect(p, w, h, 8, 2, 5, 2, '#18181b');
    fillRect(p, w, h, 8, 20, 5, 2, '#18181b');
    fillRect(p, w, h, 36, 2, 5, 2, '#18181b');
    fillRect(p, w, h, 36, 20, 5, 2, '#18181b');
    return p;
  }
};

// ---------------------------------------------------------------------------
// 7. DODGE VIPER SRT-10 GTS (VIPER BLUE & WHITE STRIPES)
// ---------------------------------------------------------------------------
export const viper_srt: MultiViewPreset = {
  id: 'viper_srt',
  name: 'Dodge Viper SRT-10 V10 (Oficial)',
  category: 'Muscle',
  description: 'Puro veneno com motor V10 colossal de 8.4L, pintura Viper Blue com listras brancas duplas Le Mans, capô longo com guelras de arrefecimento, teto double-bubble e escapamento lateral.',
  primaryColor: '#1d4ed8',
  secondaryColor: '#f8fafc',
  neonColor: '#00f0ff',
  accessoryConfig: {
    wheels: { visible: true, rearX: 10, rearY: 17, frontX: 38, frontY: 17, radius: 3.5, layer: 'in_front', style: 'spokes', spinning: true },
    spoiler: { visible: true, x: 4, y: 11, scale: 1.0, layer: 'in_front', style: 'ducktail' },
    nitro: { visible: true, x: 1, y: 17, layer: 'behind' },
    headlights: { visible: true, x: 43, y: 14, beamVisible: true, layer: 'in_front' },
    neon: { visible: true, color: '#00f0ff', y: 20 }
  },
  generateRight: () => {
    const w = 48, h = 24, p = createEmptyGrid(w, h);
    const hi = '__PRIMARY_HI__', pri = '__PRIMARY_BASE__', dark = '__PRIMARY_DARK__', deep = '__PRIMARY_DEEP__';
    const stripe = '__SECONDARY_BASE__', chrome = '#e2e8f0', glass = '#0f172a';

    fillRect(p, w, h, 4, 19, 41, 1, '#09090b');
    // Side Exhaust Tip between wheels
    fillRect(p, w, h, 21, 19, 4, 1, chrome);

    fillRect(p, w, h, 4, 18, 41, 1, deep);
    fillRect(p, w, h, 5, 17, 39, 1, dark);
    fillRect(p, w, h, 4, 15, 41, 2, pri);
    fillRect(p, w, h, 5, 14, 39, 1, pri);

    // Twin Le Mans Stripes across upper surface
    fillRect(p, w, h, 28, 14, 14, 1, stripe);
    fillRect(p, w, h, 4, 14, 7, 1, stripe);

    // V10 Louver Vents
    fillRect(p, w, h, 33, 13, 2, 1, '#09090b');
    fillRect(p, w, h, 36, 13, 2, 1, '#09090b');

    // Double Bubble Roof & Cockpit
    fillRect(p, w, h, 15, 9, 15, 5, glass);
    fillRect(p, w, h, 17, 8, 9, 1, pri);
    fillRect(p, w, h, 18, 8, 7, 1, stripe); // stripe over roof
    fillRect(p, w, h, 25, 9, 3, 5, '#38bdf8');

    // Headlight & Viper Taillight
    fillRect(p, w, h, 43, 14, 2, 1, '#e0f2fe');
    fillRect(p, w, h, 4, 14, 1, 2, '#ef4444');

    // Wheel arches
    fillRect(p, w, h, 7, 17, 7, 3, '');
    fillRect(p, w, h, 35, 17, 7, 3, '');
    fillRect(p, w, h, 8, 16, 5, 1, '#09090b');
    fillRect(p, w, h, 36, 16, 5, 1, '#09090b');
    return p;
  },
  generateLeft: () => mirrorGrid(viper_srt.generateRight(), 48, 24),
  generateFront: () => {
    const w = 24, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 2, 19, 20, 1, '#09090b');
    fillRect(p, w, h, 3, 15, 18, 4, '__PRIMARY_BASE__');
    // Twin Center Racing Stripes
    fillRect(p, w, h, 10, 10, 2, 8, '__SECONDARY_BASE__');
    fillRect(p, w, h, 13, 10, 2, 8, '__SECONDARY_BASE__');
    fillRect(p, w, h, 7, 16, 10, 3, '#09090b');
    fillRect(p, w, h, 3, 14, 3, 1, '#e0f2fe');
    fillRect(p, w, h, 18, 14, 3, 1, '#e0f2fe');
    fillRect(p, w, h, 6, 8, 12, 5, '#0f172a');
    fillRect(p, w, h, 7, 7, 10, 1, '__PRIMARY_BASE__');
    fillRect(p, w, h, 1, 16, 2, 4, '#18181b');
    fillRect(p, w, h, 21, 16, 2, 4, '#18181b');
    return p;
  },
  generateRear: () => {
    const w = 24, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 3, 19, 18, 1, '#09090b');
    fillRect(p, w, h, 3, 14, 18, 5, '__PRIMARY_BASE__');
    fillRect(p, w, h, 10, 12, 2, 6, '__SECONDARY_BASE__');
    fillRect(p, w, h, 13, 12, 2, 6, '__SECONDARY_BASE__');
    fillRect(p, w, h, 4, 14, 4, 2, '#ef4444');
    fillRect(p, w, h, 16, 14, 4, 2, '#ef4444');
    fillRect(p, w, h, 6, 8, 12, 5, '#0f172a');
    fillRect(p, w, h, 1, 16, 2, 4, '#18181b');
    fillRect(p, w, h, 21, 16, 2, 4, '#18181b');
    return p;
  },
  generateTop: () => {
    const w = 48, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 4, 4, 40, 16, '__PRIMARY_BASE__');
    // Twin Le Mans White Stripes down full length
    fillRect(p, w, h, 4, 10, 40, 2, '__SECONDARY_BASE__');
    fillRect(p, w, h, 4, 13, 40, 2, '__SECONDARY_BASE__');
    fillRect(p, w, h, 16, 6, 12, 12, '#0f172a');
    fillRect(p, w, h, 8, 2, 5, 2, '#18181b');
    fillRect(p, w, h, 8, 20, 5, 2, '#18181b');
    fillRect(p, w, h, 36, 2, 5, 2, '#18181b');
    fillRect(p, w, h, 36, 20, 5, 2, '#18181b');
    return p;
  }
};

// ---------------------------------------------------------------------------
// 8. LAMBORGHINI MURCIÉLAGO LP670 SV (VERDE ITHACA LIME)
// ---------------------------------------------------------------------------
export const murcielago: MultiViewPreset = {
  id: 'murcielago',
  name: 'Murciélago LP670 SV (Oficial)',
  category: 'Supercar',
  description: 'Hipercarro V12 italiano em Verde Ithaca com perfil em cunha angular furtiva, entradas de ar laterais móveis bat-wings, cobertura do motor em venezianas e aerofólio SuperVeloce.',
  primaryColor: '#22c55e',
  secondaryColor: '#09090b',
  neonColor: '#4ade80',
  accessoryConfig: {
    wheels: { visible: true, rearX: 10, rearY: 17, frontX: 38, frontY: 17, radius: 3.5, layer: 'in_front', style: 'spiked', spinning: true },
    spoiler: { visible: true, x: 4, y: 6, scale: 1.15, layer: 'in_front', style: 'gt_wing' },
    nitro: { visible: true, x: 1, y: 17, layer: 'behind' },
    headlights: { visible: true, x: 43, y: 14, beamVisible: true, layer: 'in_front' },
    neon: { visible: true, color: '#4ade80', y: 20 }
  },
  generateRight: () => {
    const w = 48, h = 24, p = createEmptyGrid(w, h);
    const hi = '__PRIMARY_HI__', pri = '__PRIMARY_BASE__', dark = '__PRIMARY_DARK__', deep = '__PRIMARY_DEEP__';
    const sec = '__SECONDARY_BASE__', glass = '#0f172a';

    fillRect(p, w, h, 3, 19, 43, 1, sec); // carbon splitter & diffuser
    fillRect(p, w, h, 4, 18, 41, 1, deep);
    fillRect(p, w, h, 4, 17, 40, 1, dark);
    fillRect(p, w, h, 4, 15, 41, 2, pri);
    // Extreme wedge rake
    fillRect(p, w, h, 5, 14, 38, 1, pri);
    fillRect(p, w, h, 28, 13, 14, 1, hi);

    // Massive Side Air Induction Bat-Wing
    fillRect(p, w, h, 15, 13, 4, 4, '#09090b');
    fillRect(p, w, h, 16, 13, 2, 3, sec);

    // Cockpit & Louvered Glass Engine Bay
    fillRect(p, w, h, 15, 9, 16, 5, glass);
    fillRect(p, w, h, 20, 8, 7, 1, pri);
    fillRect(p, w, h, 21, 8, 5, 1, hi);
    fillRect(p, w, h, 25, 9, 3, 5, '#6ee7b7');

    // SV High Mount Carbon Racing Wing
    fillRect(p, w, h, 3, 6, 7, 1, sec);
    fillRect(p, w, h, 5, 7, 1, 7, sec);
    fillRect(p, w, h, 8, 7, 1, 7, sec);

    // Laser Headlight & LED Taillight
    fillRect(p, w, h, 43, 14, 2, 1, '#a7f3d0');
    fillRect(p, w, h, 4, 14, 1, 1, '#ef4444');

    // Wheel arches
    fillRect(p, w, h, 7, 17, 7, 3, '');
    fillRect(p, w, h, 35, 17, 7, 3, '');
    fillRect(p, w, h, 8, 16, 5, 1, '#09090b');
    fillRect(p, w, h, 36, 16, 5, 1, '#09090b');
    return p;
  },
  generateLeft: () => mirrorGrid(murcielago.generateRight(), 48, 24),
  generateFront: () => {
    const w = 24, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 1, 19, 22, 1, '__SECONDARY_BASE__');
    fillRect(p, w, h, 3, 15, 18, 4, '__PRIMARY_BASE__');
    // Angular lower hexagonal intakes
    fillRect(p, w, h, 5, 16, 14, 3, '#09090b');
    fillRect(p, w, h, 3, 13, 3, 2, '#a7f3d0');
    fillRect(p, w, h, 18, 13, 3, 2, '#a7f3d0');
    fillRect(p, w, h, 6, 8, 12, 4, '#0f172a');
    fillRect(p, w, h, 7, 7, 10, 1, '__PRIMARY_BASE__');
    fillRect(p, w, h, 1, 16, 2, 4, '#18181b');
    fillRect(p, w, h, 21, 16, 2, 4, '#18181b');
    return p;
  },
  generateRear: () => {
    const w = 24, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 2, 19, 20, 1, '__SECONDARY_BASE__');
    fillRect(p, w, h, 3, 15, 18, 4, '__PRIMARY_BASE__');
    // Big Center Hexagonal Exhaust
    fillRect(p, w, h, 10, 18, 4, 2, '#94a3b8');
    fillRect(p, w, h, 4, 14, 16, 1, '#ef4444');
    fillRect(p, w, h, 2, 5, 20, 1, '__SECONDARY_BASE__');
    fillRect(p, w, h, 6, 6, 1, 4, '__SECONDARY_BASE__');
    fillRect(p, w, h, 17, 6, 1, 4, '__SECONDARY_BASE__');
    fillRect(p, w, h, 6, 8, 12, 5, '#0f172a');
    fillRect(p, w, h, 1, 16, 2, 4, '#18181b');
    fillRect(p, w, h, 21, 16, 2, 4, '#18181b');
    return p;
  },
  generateTop: () => {
    const w = 48, h = 24, p = createEmptyGrid(w, h);
    fillRect(p, w, h, 4, 4, 40, 16, '__PRIMARY_BASE__');
    fillRect(p, w, h, 17, 6, 13, 12, '#0f172a');
    fillRect(p, w, h, 9, 8, 7, 8, '#09090b'); // engine louvers
    fillRect(p, w, h, 4, 3, 2, 18, '__SECONDARY_BASE__');
    fillRect(p, w, h, 8, 2, 5, 2, '#18181b');
    fillRect(p, w, h, 8, 20, 5, 2, '#18181b');
    fillRect(p, w, h, 36, 2, 5, 2, '#18181b');
    fillRect(p, w, h, 36, 20, 5, 2, '#18181b');
    return p;
  }
};

export const SPRITE_CAR_PRESETS: Record<string, MultiViewPreset> = {
  skyline_r34,
  bmw_m3_gtr,
  rx7_fd,
  wrx_sti,
  lancer_evo,
  corvette_c6,
  viper_srt,
  murcielago
};

export function createCustomAssetFromPreset(preset: MultiViewPreset): CustomCarAsset {
  const r = preset.generateRight();
  return {
    id: preset.id,
    name: preset.name,
    createdAt: Date.now(),
    width: 48,
    height: 24,
    pixels: r,
    pixelsLeft: preset.generateLeft(),
    pixelsFront: preset.generateFront(),
    pixelsRear: preset.generateRear(),
    pixelsTop: preset.generateTop(),
    primaryColor: preset.primaryColor,
    secondaryColor: preset.secondaryColor,
    neonColor: preset.neonColor,
    accessoryConfig: preset.accessoryConfig
  };
}
