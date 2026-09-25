// =============================================================================
// AUTHENTIC 2.5D ISOMETRIC PIXEL ART AUTOMOTIVE ENGINE
// Directly inspired by Sergio Silvarto's legendary isometric vehicle artwork
// Real pixel-grid alignment, 3-tone lighting, authentic automotive chassis anatomy
// =============================================================================

import { Car, CarBodyType } from '../types';

export function adjustHex(hex: string, percent: number): string {
  let clean = hex.replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return '#94a3b8';
  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
  let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function normalizeChassisType(type?: string): string {
  const t = (type || 'sedan').toLowerCase().replace(/[- ]/g, '_');
  if (t === 'sports' || t === 'esportivo') return 'sports';
  if (t === 'truck' || t === 'trucks' || t === 'caminhao') return 'truck';
  if (t === 'suv' || t === 'suvs') return 'suv';
  if (t === 'off_road' || t === 'offroad' || t === 'crawler') return 'off_road';
  if (t === 'coupe' || t === 'coupes' || t === 'gt') return 'coupe';
  if (t === 'van' || t === 'vans' || t === 'furgon') return 'van';
  if (t === 'pickup' || t === 'picape') return 'pickup';
  if (t === 'muscle') return 'muscle';
  if (t === 'supercar') return 'supercar';
  if (t === 'tuner') return 'tuner';
  if (t === 'rally') return 'rally';
  if (t === 'derby_tank' || t === 'derby') return 'derby_tank';
  if (t === 'classic' || t === 'hotrod') return 'classic';
  return 'sedan';
}

export interface IsometricPalette {
  outline: string;     // Deepest outline (#09090b / #0f172a)
  hi: string;          // Top sunlit surface (hood/roof specular highlight)
  light: string;       // Front-facing surface / lit flank
  base: string;        // Base mid-tone body
  dark: string;        // Shaded side surface
  deep: string;        // Deep crease / underbody shadow
  sec: string;         // Secondary accent color
  secHi: string;       // Secondary highlight
  secDark: string;     // Secondary shadow
  glass: string;       // Window tint base
  glassHi: string;     // Window glare streak
  glassDark: string;   // Window interior depth
  chrome: string;      // Bumpers, grilles, trim
  chromeHi: string;
  tire: string;        // Rubber tread
  tireRim: string;     // Alloy / steel wheel rim
  tireCenter: string;  // Wheel hub center
  glow: string;        // Neon / headlamp glow
}

export function getIsometricPalette(primary: string, secondary: string, neon?: string): IsometricPalette {
  const p = primary || '#3b82f6';
  const s = secondary || '#1e293b';
  return {
    outline: '#090d16',
    hi: adjustHex(p, 42),
    light: adjustHex(p, 18),
    base: p,
    dark: adjustHex(p, -28),
    deep: adjustHex(p, -56),
    sec: s,
    secHi: adjustHex(s, 32),
    secDark: adjustHex(s, -32),
    glass: '#0284c7',
    glassHi: '#7dd3fc',
    glassDark: '#082f49',
    chrome: '#cbd5e1',
    chromeHi: '#f8fafc',
    tire: '#18181b',
    tireRim: '#94a3b8',
    tireCenter: '#e2e8f0',
    glow: neon || '#38bdf8'
  };
}

// Draw a realistic isometric wheel with rubber tread, rim lip, spokes and center hub
function drawIsoWheel(
  ctx: CanvasRenderingContext2D,
  pal: IsometricPalette,
  x: number,
  y: number,
  scale: number,
  radius: number = 5.2,
  isLifted: boolean = false,
  isWhiteWall: boolean = false,
  wheelRot: number = 0
) {
  const s = scale;
  const r = radius * s;

  // Outer tire shadow cutout
  ctx.fillStyle = pal.outline;
  ctx.beginPath();
  ctx.ellipse(x, y, r + 0.8 * s, (r + 0.8 * s) * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rubber tread
  ctx.fillStyle = pal.tire;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  // White-wall ring (for classic/hot-rod)
  if (isWhiteWall) {
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.75, r * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rim outer ring
  ctx.fillStyle = pal.tireRim;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.6, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rim depth shadow
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.45, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();

  // Brake caliper red flash peeking behind spokes
  if (!isWhiteWall) {
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x - 1.2 * s, y - 1.2 * s, 2.2 * s, 1.2 * s);
  }

  // 5. Rotating alloy spokes in isometric perspective
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = Math.max(1, 1.1 * s);
  for (let i = 0; i < 5; i++) {
    const a = wheelRot + (i * Math.PI * 2) / 5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * (r * 0.52), y + Math.sin(a) * (r * 0.52 * 0.7));
    ctx.stroke();
  }

  // Center hub & lug bolts
  ctx.fillStyle = pal.tireCenter;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.22, r * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Center chrome cap
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(x - 0.5 * s, y - 0.5 * s, 1.0 * s, 1.0 * s);

  // Off-road aggressive sidewall lugs
  if (isLifted) {
    ctx.fillStyle = '#27272a';
    ctx.fillRect(x - r * 0.9, y - 0.8 * s, 1.4 * s, 1.6 * s);
    ctx.fillRect(x + r * 0.7, y - 0.8 * s, 1.4 * s, 1.6 * s);
    ctx.fillRect(x - 0.8 * s, y - r * 0.65, 1.6 * s, 1.2 * s);
    ctx.fillRect(x - 0.8 * s, y + r * 0.55, 1.6 * s, 1.2 * s);
  }
}

// Master ground contact shadow
function drawIsoGroundShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  rx: number = 32,
  ry: number = 13
) {
  ctx.save();
  // Deep ambient underbody shadow
  ctx.fillStyle = 'rgba(2, 6, 23, 0.65)';
  ctx.beginPath();
  ctx.ellipse(x, y, rx * s, ry * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outer diffused contact shadow
  ctx.fillStyle = 'rgba(2, 6, 23, 0.28)';
  ctx.beginPath();
  ctx.ellipse(x + 2 * s, y + 2 * s, (rx + 4) * s, (ry + 3) * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Neon underglow
function drawIsoNeonUnderglow(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  s: number,
  rx: number = 30,
  ry: number = 12
) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 14 * s;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.ellipse(x, y, rx * s, ry * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// =============================================================================
// MAIN DRAW FUNCTION FOR ALL 14 CHASSIS ARCHETYPES
// =============================================================================
export function renderIsometricChassis(
  ctx: CanvasRenderingContext2D,
  chassisType: string,
  primaryColor: string,
  secondaryColor: string,
  cx: number,
  cy: number,
  scale: number,
  frame: number = 0,
  animated: boolean = false,
  showNeon: boolean = false,
  neonColor?: string
) {
  const pal = getIsometricPalette(primaryColor, secondaryColor, neonColor);
  const type = normalizeChassisType(chassisType);
  const s = scale;
  const idleY = animated ? Math.sin(frame * 0.18) * 0.5 * s : 0;
  const wheelRot = animated ? (frame * 0.35) % (Math.PI * 2) : 0;
  const by = cy + idleY;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // 1. Ground contact shadow & Neon
  const groundY = cy + 12 * s;
  const shadowWidth = type === 'truck' || type === 'pickup' ? 36 : type === 'supercar' ? 33 : 31;
  drawIsoGroundShadow(ctx, cx, groundY, s, shadowWidth, 12);

  if (showNeon && pal.glow) {
    drawIsoNeonUnderglow(ctx, pal.glow, cx, groundY - 1 * s, s, shadowWidth - 2, 11);
  }

  // 2. Far Wheels (Underbody perspective)
  const farWheelY = by - 2 * s;
  if (type === 'truck') {
    // Commercial truck far wheels
    drawIsoWheel(ctx, pal, cx - 16 * s, farWheelY, s, 6.2, false);
    drawIsoWheel(ctx, pal, cx + 12 * s, farWheelY + 2 * s, s, 6.2, false);
  } else if (type === 'off_road') {
    drawIsoWheel(ctx, pal, cx - 15 * s, farWheelY + 1 * s, s, 6.5, true);
    drawIsoWheel(ctx, pal, cx + 13 * s, farWheelY + 3 * s, s, 6.5, true);
  } else {
    drawIsoWheel(ctx, pal, cx - 14 * s, farWheelY, s, 5.0, false, type === 'classic');
    drawIsoWheel(ctx, pal, cx + 12 * s, farWheelY + 2.5 * s, s, 5.0, false, type === 'classic');
  }

  // 3. Body Rendering by Type
  switch (type) {
    // -------------------------------------------------------------------------
    // 1. SEDAN EXECUTIVO SPORT (3-BOX BALANCED CHASSIS)
    // -------------------------------------------------------------------------
    case 'sedan': {
      // Lower Underbody & Rocker
      ctx.fillStyle = pal.outline;
      ctx.fillRect(cx - 26 * s, by + 4 * s, 50 * s, 4 * s);

      // Main Body Shell (3-Box)
      ctx.fillStyle = pal.base;
      ctx.beginPath();
      ctx.moveTo(cx - 27 * s, by + 2 * s);
      ctx.lineTo(cx - 21 * s, by - 4 * s);  // Trunk lid step
      ctx.lineTo(cx - 14 * s, by - 4.5 * s); // Rear window base
      ctx.lineTo(cx - 10 * s, by - 12 * s); // Rear C-pillar to roof
      ctx.lineTo(cx + 4 * s, by - 12 * s);  // Flat sedan roof
      ctx.lineTo(cx + 12 * s, by - 4.5 * s); // Windshield to hood
      ctx.lineTo(cx + 25 * s, by - 2 * s);  // Long hood to front nose
      ctx.lineTo(cx + 27 * s, by + 4 * s);  // Front bumper
      ctx.lineTo(cx - 25 * s, by + 7 * s);  // Lower door sill
      ctx.closePath();
      ctx.fill();

      // Shaded side door panel
      ctx.fillStyle = pal.dark;
      ctx.beginPath();
      ctx.moveTo(cx - 25 * s, by + 7 * s);
      ctx.lineTo(cx + 27 * s, by + 4 * s);
      ctx.lineTo(cx + 25 * s, by - 0.5 * s);
      ctx.lineTo(cx - 25 * s, by + 2 * s);
      ctx.closePath();
      ctx.fill();

      // Hood & Roof Highlights
      ctx.fillStyle = pal.hi;
      ctx.fillRect(cx + 13 * s, by - 3.5 * s, 12 * s, 2.5 * s); // hood reflection
      ctx.fillRect(cx - 8 * s, by - 12.5 * s, 11 * s, 2 * s);   // roof highlight

      // Cabin Glass Greenhouse (4-Door Sedan)
      ctx.fillStyle = pal.glassDark;
      ctx.beginPath();
      ctx.moveTo(cx - 12 * s, by - 4.2 * s);
      ctx.lineTo(cx - 9 * s, by - 11.2 * s);
      ctx.lineTo(cx + 3 * s, by - 11.2 * s);
      ctx.lineTo(cx + 10 * s, by - 4.2 * s);
      ctx.closePath();
      ctx.fill();

      // Windshield & Side Windows
      ctx.fillStyle = pal.glass;
      ctx.fillRect(cx + 3 * s, by - 10.5 * s, 6 * s, 6 * s); // Windshield
      ctx.fillRect(cx - 3 * s, by - 10.5 * s, 5 * s, 5.5 * s); // Front door glass
      ctx.fillRect(cx - 8.5 * s, by - 10.5 * s, 4.5 * s, 5.5 * s); // Rear door glass

      // B-Pillar divider
      ctx.fillStyle = pal.outline;
      ctx.fillRect(cx - 3.5 * s, by - 11 * s, 1 * s, 6 * s);

      // Glass specular glare streak
      ctx.fillStyle = pal.glassHi;
      ctx.beginPath();
      ctx.moveTo(cx + 7 * s, by - 10.5 * s);
      ctx.lineTo(cx + 8.5 * s, by - 10.5 * s);
      ctx.lineTo(cx + 5 * s, by - 4.5 * s);
      ctx.lineTo(cx + 3.5 * s, by - 4.5 * s);
      ctx.closePath();
      ctx.fill();

      // Chrome Front Grille & Headlights
      ctx.fillStyle = pal.chrome;
      ctx.fillRect(cx + 25 * s, by + 0.5 * s, 2 * s, 3.5 * s);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx + 24.5 * s, by - 0.5 * s, 2.2 * s, 1.8 * s); // Front headlight

      // Rear Taillight
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cx - 27.5 * s, by + 1 * s, 2 * s, 2.5 * s);

      // Chrome door handles & body trim line
      ctx.fillStyle = pal.chrome;
      ctx.fillRect(cx - 1 * s, by + 0.5 * s, 2.2 * s, 0.8 * s);
      ctx.fillRect(cx - 7 * s, by + 1 * s, 2.2 * s, 0.8 * s);
      ctx.fillRect(cx - 23 * s, by + 3 * s, 46 * s, 0.6 * s);
      break;
    }

    // -------------------------------------------------------------------------
    // 2. SPORTS APEX GT (LOW-SLUNG WEDGE & GT WING)
    // -------------------------------------------------------------------------
    case 'sports': {
      // Carbon ground splitter
      ctx.fillStyle = '#09090b';
      ctx.fillRect(cx + 20 * s, by + 4.5 * s, 10 * s, 1.5 * s);
      ctx.fillRect(cx - 28 * s, by + 6 * s, 12 * s, 1.8 * s);

      // Low Wedge Body
      ctx.fillStyle = pal.base;
      ctx.beginPath();
      ctx.moveTo(cx - 28 * s, by + 3 * s);
      ctx.lineTo(cx - 22 * s, by - 4 * s);  // Low rear deck
      ctx.lineTo(cx - 10 * s, by - 9 * s);  // Sleek fastback roof
      ctx.lineTo(cx + 2 * s, by - 9.5 * s); // Low cockpit top
      ctx.lineTo(cx + 12 * s, by - 3 * s);  // Hyper-raked windshield
      ctx.lineTo(cx + 26 * s, by - 1 * s);  // Sharp wedge hood
      ctx.lineTo(cx + 29 * s, by + 3.5 * s); // Low needle nose
      ctx.lineTo(cx - 26 * s, by + 6.5 * s);
      ctx.closePath();
      ctx.fill();

      // Lower aero skirt shadow
      ctx.fillStyle = pal.dark;
      ctx.beginPath();
      ctx.moveTo(cx - 26 * s, by + 6.5 * s);
      ctx.lineTo(cx + 29 * s, by + 3.5 * s);
      ctx.lineTo(cx + 26 * s, by + 0.5 * s);
      ctx.lineTo(cx - 26 * s, by + 2.5 * s);
      ctx.closePath();
      ctx.fill();

      // Wedge Hood highlight
      ctx.fillStyle = pal.hi;
      ctx.fillRect(cx + 13 * s, by - 2.5 * s, 13 * s, 1.8 * s);
      ctx.fillRect(cx - 6 * s, by - 9.8 * s, 7 * s, 1.5 * s);

      // Cockpit Canopy Glass
      ctx.fillStyle = pal.glassDark;
      ctx.beginPath();
      ctx.moveTo(cx - 8 * s, by - 3 * s);
      ctx.lineTo(cx - 6 * s, by - 8.8 * s);
      ctx.lineTo(cx + 1.5 * s, by - 9 * s);
      ctx.lineTo(cx + 10 * s, by - 2.8 * s);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = pal.glass;
      ctx.fillRect(cx + 2 * s, by - 8 * s, 7 * s, 4.8 * s);
      ctx.fillRect(cx - 5 * s, by - 8 * s, 6 * s, 4.5 * s);

      // Glass reflection
      ctx.fillStyle = pal.glassHi;
      ctx.beginPath();
      ctx.moveTo(cx + 7 * s, by - 8 * s);
      ctx.lineTo(cx + 8.5 * s, by - 8 * s);
      ctx.lineTo(cx + 5 * s, by - 3 * s);
      ctx.lineTo(cx + 3.5 * s, by - 3 * s);
      ctx.closePath();
      ctx.fill();

      // Side NACA air scoop
      ctx.fillStyle = pal.outline;
      ctx.beginPath();
      ctx.moveTo(cx - 4 * s, by + 0.5 * s);
      ctx.lineTo(cx + 1 * s, by - 0.5 * s);
      ctx.lineTo(cx + 1 * s, by + 2 * s);
      ctx.closePath();
      ctx.fill();

      // GT Rear Wing & Endplates
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 24 * s, by - 8 * s, 1.5 * s, 5 * s); // Wing upright 1
      ctx.fillRect(cx - 20 * s, by - 8 * s, 1.5 * s, 5 * s); // Wing upright 2
      ctx.fillStyle = pal.sec;
      ctx.fillRect(cx - 27 * s, by - 9.5 * s, 10 * s, 1.8 * s); // Upper aerofoil
      ctx.fillStyle = pal.secHi;
      ctx.fillRect(cx - 27 * s, by - 11 * s, 1.8 * s, 3.5 * s); // Endplate left

      // Razor slim LED headlights
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx + 27 * s, by + 0.5 * s, 2.5 * s, 1.2 * s);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cx - 28.5 * s, by + 0.5 * s, 2 * s, 1.5 * s);
      break;
    }

    // -------------------------------------------------------------------------
    // 3. HEAVY COMMERCIAL TRUCK (BIG RIG / CAB-OVER & EXHAUST PIPES)
    // -------------------------------------------------------------------------
    case 'truck': {
      // Reinforced Heavy Frame
      ctx.fillStyle = pal.outline;
      ctx.fillRect(cx - 28 * s, by + 3 * s, 54 * s, 6 * s);

      // Hauler Rear Deck / Sleeper Box
      ctx.fillStyle = pal.secDark;
      ctx.fillRect(cx - 27 * s, by - 12 * s, 18 * s, 16 * s);
      ctx.fillStyle = pal.sec;
      ctx.fillRect(cx - 27 * s, by - 12 * s, 18 * s, 2.5 * s); // top trim

      // Tall Cab-Over Front Cabin
      ctx.fillStyle = pal.base;
      ctx.beginPath();
      ctx.moveTo(cx - 9 * s, by + 5 * s);
      ctx.lineTo(cx - 9 * s, by - 17 * s);  // Tall cab back
      ctx.lineTo(cx + 17 * s, by - 17 * s); // Flat cab roof
      ctx.lineTo(cx + 24 * s, by - 5 * s);  // Steep vertical windshield
      ctx.lineTo(cx + 25 * s, by + 5 * s);  // Front nose
      ctx.lineTo(cx - 9 * s, by + 8 * s);
      ctx.closePath();
      ctx.fill();

      // Lower cab shadow
      ctx.fillStyle = pal.dark;
      ctx.fillRect(cx - 9 * s, by + 2 * s, 34 * s, 5 * s);

      // Cab Roof Highlight & Amber Clearance Markers
      ctx.fillStyle = pal.hi;
      ctx.fillRect(cx - 8 * s, by - 17.5 * s, 24 * s, 2 * s);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(cx + 13 * s, by - 18 * s, 2 * s, 1.2 * s);
      ctx.fillRect(cx + 17 * s, by - 18 * s, 2 * s, 1.2 * s);
      ctx.fillRect(cx + 21 * s, by - 18 * s, 2 * s, 1.2 * s);

      // Massive Tall Windshield
      ctx.fillStyle = pal.glassDark;
      ctx.fillRect(cx + 9 * s, by - 14 * s, 12 * s, 8 * s);
      ctx.fillStyle = pal.glass;
      ctx.fillRect(cx + 10 * s, by - 13.5 * s, 10 * s, 7 * s);
      ctx.fillStyle = pal.glassHi;
      ctx.fillRect(cx + 15 * s, by - 13.5 * s, 3 * s, 7 * s);

      // Side Cab Window
      ctx.fillStyle = pal.glass;
      ctx.fillRect(cx - 5 * s, by - 14 * s, 11 * s, 7 * s);

      // Front Imposing Chrome Grille
      ctx.fillStyle = pal.chrome;
      ctx.fillRect(cx + 23 * s, by - 2 * s, 3 * s, 8 * s);
      ctx.fillStyle = '#0f172a';
      for (let g = 0; g < 4; g++) {
        ctx.fillRect(cx + 23.5 * s, by - 1 * s + g * 1.8 * s, 2 * s, 0.8 * s);
      }

      // Dual Tall Chrome Smokestacks (Vertical Exhaust)
      ctx.fillStyle = pal.chrome;
      ctx.fillRect(cx - 8 * s, by - 22 * s, 2.5 * s, 18 * s); // Smokestack
      ctx.fillStyle = pal.chromeHi;
      ctx.fillRect(cx - 8 * s, by - 22 * s, 1 * s, 18 * s);
      // Angled exhaust tip
      ctx.beginPath();
      ctx.moveTo(cx - 8 * s, by - 22 * s);
      ctx.lineTo(cx - 5.5 * s, by - 24 * s);
      ctx.lineTo(cx - 5.5 * s, by - 21 * s);
      ctx.closePath();
      ctx.fill();

      // Chrome side steps & cylindrical fuel tank
      ctx.fillStyle = pal.chrome;
      ctx.fillRect(cx + 2 * s, by + 5 * s, 8 * s, 2 * s); // step
      ctx.fillStyle = '#64748b';
      ctx.fillRect(cx - 24 * s, by + 3.5 * s, 12 * s, 4 * s); // fuel tank
      ctx.fillStyle = pal.chrome;
      ctx.fillRect(cx - 22 * s, by + 3.5 * s, 1.5 * s, 4 * s); // tank strap 1
      ctx.fillRect(cx - 15 * s, by + 3.5 * s, 1.5 * s, 4 * s); // tank strap 2

      // Quad Heavy Headlights
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx + 24 * s, by + 2 * s, 2 * s, 1.8 * s);
      ctx.fillRect(cx + 24 * s, by + 4.5 * s, 2 * s, 1.8 * s);
      break;
    }

    // -------------------------------------------------------------------------
    // 4. SUV ADVENTURE 4X4 (2-BOX WAGON & ROOF RACK)
    // -------------------------------------------------------------------------
    case 'suv': {
      // Rugged High Chassis Frame & Skid Plate
      ctx.fillStyle = pal.outline;
      ctx.fillRect(cx - 26 * s, by + 3 * s, 52 * s, 5 * s);

      // Elevated 2-Box Body Shell
      ctx.fillStyle = pal.base;
      ctx.beginPath();
      ctx.moveTo(cx - 26 * s, by + 4 * s);
      ctx.lineTo(cx - 25 * s, by - 12 * s); // Vertical rear hatch
      ctx.lineTo(cx + 4 * s, by - 12.5 * s); // High roof
      ctx.lineTo(cx + 13 * s, by - 4 * s);   // Windshield
      ctx.lineTo(cx + 25 * s, by - 2 * s);   // Sturdy hood
      ctx.lineTo(cx + 27 * s, by + 3.5 * s); // Front bumper
      ctx.lineTo(cx - 25 * s, by + 7 * s);
      ctx.closePath();
      ctx.fill();

      // Lower Protective Body Cladding (Plastic Trim)
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(cx - 25 * s, by + 7 * s);
      ctx.lineTo(cx + 27 * s, by + 3.5 * s);
      ctx.lineTo(cx + 26 * s, by + 1 * s);
      ctx.lineTo(cx - 25 * s, by + 3 * s);
      ctx.closePath();
      ctx.fill();

      // Hood & Roof Highlights
      ctx.fillStyle = pal.hi;
      ctx.fillRect(cx + 14 * s, by - 3 * s, 11 * s, 2 * s);
      ctx.fillRect(cx - 20 * s, by - 13 * s, 22 * s, 2 * s);

      // Large 3-Window Side Greenhouse
      ctx.fillStyle = pal.glassDark;
      ctx.fillRect(cx - 22 * s, by - 10.5 * s, 32 * s, 6.5 * s);
      ctx.fillStyle = pal.glass;
      ctx.fillRect(cx + 4 * s, by - 10 * s, 5 * s, 6 * s);   // Windshield angle
      ctx.fillRect(cx - 4 * s, by - 10 * s, 6.5 * s, 5.5 * s); // Front side window
      ctx.fillRect(cx - 13 * s, by - 10 * s, 7 * s, 5.5 * s); // Rear side window
      ctx.fillRect(cx - 21 * s, by - 10 * s, 6 * s, 5.5 * s); // Cargo 3rd window

      // Pillars
      ctx.fillStyle = pal.base;
      ctx.fillRect(cx - 5 * s, by - 11 * s, 1.5 * s, 6.5 * s);
      ctx.fillRect(cx - 14 * s, by - 11 * s, 1.5 * s, 6.5 * s);

      // Integrated Aluminum Roof Rack Rails & Crossbars
      ctx.fillStyle = pal.chrome;
      ctx.fillRect(cx - 22 * s, by - 14.5 * s, 24 * s, 1.2 * s); // Rail
      ctx.fillRect(cx - 20 * s, by - 14.5 * s, 1.5 * s, 2 * s); // Stanchion 1
      ctx.fillRect(cx - 8 * s, by - 14.5 * s, 1.5 * s, 2 * s);  // Stanchion 2
      ctx.fillRect(cx + 1 * s, by - 14.5 * s, 1.5 * s, 2 * s);  // Stanchion 3

      // Front Headlights & Fog Lights
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx + 25 * s, by - 0.5 * s, 2 * s, 2 * s);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx + 25 * s, by + 2 * s, 1.5 * s, 1.2 * s); // lower fog
      break;
    }

    // -------------------------------------------------------------------------
    // 5. OFF-ROAD ROCK CRAWLER (LIFTED SUSPENSION, BULLBAR & SNORKEL)
    // -------------------------------------------------------------------------
    case 'off_road': {
      // Lift Kit Frame & Red Exposed Coil Springs
      ctx.fillStyle = pal.outline;
      ctx.fillRect(cx - 25 * s, by + 1 * s, 50 * s, 6 * s);
      ctx.fillStyle = '#ef4444'; // Coil spring front
      ctx.fillRect(cx + 13 * s, by + 4 * s, 2 * s, 4 * s);
      ctx.fillRect(cx - 15 * s, by + 4 * s, 2 * s, 4 * s); // Coil spring rear

      // Compact Rugged Off-Road Body
      ctx.fillStyle = pal.base;
      ctx.beginPath();
      ctx.moveTo(cx - 24 * s, by + 3 * s);
      ctx.lineTo(cx - 22 * s, by - 12 * s); // Roll cage rear
      ctx.lineTo(cx + 2 * s, by - 12.5 * s); // Roof
      ctx.lineTo(cx + 10 * s, by - 4 * s);   // Windshield
      ctx.lineTo(cx + 23 * s, by - 2 * s);   // Short hood for high departure
      ctx.lineTo(cx + 24 * s, by + 3 * s);
      ctx.lineTo(cx - 23 * s, by + 5 * s);
      ctx.closePath();
      ctx.fill();

      // Flared Plastic Fender Flares
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx + 9 * s, by + 1 * s, 10 * s, 2.5 * s);
      ctx.fillRect(cx - 19 * s, by + 1 * s, 10 * s, 2.5 * s);

      // Cabin Glass
      ctx.fillStyle = pal.glass;
      ctx.fillRect(cx + 2 * s, by - 10 * s, 6 * s, 5.5 * s);
      ctx.fillRect(cx - 7 * s, by - 10 * s, 7 * s, 5.5 * s);

      // Heavy Front Tubular Bullbar with Electric Winch
      ctx.fillStyle = pal.secDark;
      ctx.fillRect(cx + 24 * s, by - 2 * s, 4 * s, 7 * s); // Bullbar hoop
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cx + 26 * s, by + 0.5 * s, 2 * s, 2.5 * s); // Winch spool drum
      ctx.fillStyle = pal.chrome;
      ctx.fillRect(cx + 27.5 * s, by + 1.2 * s, 1 * s, 1 * s); // Winch hook

      // Snorkel rising along the windshield
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.moveTo(cx + 18 * s, by - 1 * s);
      ctx.lineTo(cx + 9 * s, by - 12 * s);
      ctx.lineTo(cx + 7 * s, by - 13.5 * s);
      ctx.lineTo(cx + 8.5 * s, by - 13.5 * s);
      ctx.lineTo(cx + 19.5 * s, by - 1 * s);
      ctx.closePath();
      ctx.fill();
      // Snorkel mushroom head
      ctx.fillRect(cx + 6 * s, by - 14.5 * s, 3 * s, 2 * s);

      // 4 Yellow Rooftop Floodlights
      ctx.fillStyle = '#09090b';
      ctx.fillRect(cx - 1 * s, by - 15 * s, 12 * s, 2 * s);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(cx + 0 * s, by - 15 * s, 2 * s, 1.8 * s);
      ctx.fillRect(cx + 3 * s, by - 15 * s, 2 * s, 1.8 * s);
      ctx.fillRect(cx + 6 * s, by - 15 * s, 2 * s, 1.8 * s);
      ctx.fillRect(cx + 9 * s, by - 15 * s, 2 * s, 1.8 * s);

      // Full-Size Spare Wheel bolted to Tailgate
      drawIsoWheel(ctx, pal, cx - 25 * s, by - 4 * s, s, 5.5, true);
      break;
    }

    // -------------------------------------------------------------------------
    // 6. COUPÉ GRAN TURISMO (FLUID FASTBACK 2-DOOR & DUCKTAIL)
    // -------------------------------------------------------------------------
    case 'coupe': {
      // Sleek low ground chassis
      ctx.fillStyle = pal.outline;
      ctx.fillRect(cx - 26 * s, by + 4 * s, 52 * s, 3 * s);

      // Long-Hood Fastback Body
      ctx.fillStyle = pal.base;
      ctx.beginPath();
      ctx.moveTo(cx - 27 * s, by + 3 * s);
      ctx.lineTo(cx - 24 * s, by - 4 * s);  // Ducktail rear lip
      ctx.lineTo(cx - 12 * s, by - 10 * s); // Smooth sweeping roofline
      ctx.lineTo(cx + 1 * s, by - 10.5 * s); // Low coupe roof
      ctx.lineTo(cx + 11 * s, by - 3.5 * s); // Slanted windshield
      ctx.lineTo(cx + 26 * s, by - 2 * s);  // Extended long bonnet
      ctx.lineTo(cx + 28 * s, by + 3.5 * s); // Front aero chin
      ctx.lineTo(cx - 25 * s, by + 6.5 * s);
      ctx.closePath();
      ctx.fill();

      // Lower door reflection
      ctx.fillStyle = pal.dark;
      ctx.fillRect(cx - 25 * s, by + 2 * s, 51 * s, 3 * s);

      // Sculpted Hood Bulge & Fastback Glass
      ctx.fillStyle = pal.hi;
      ctx.fillRect(cx + 12 * s, by - 3 * s, 13 * s, 1.8 * s);
      ctx.fillRect(cx - 7 * s, by - 11 * s, 7 * s, 1.5 * s);

      // Frameless Coupe Windows
      ctx.fillStyle = pal.glassDark;
      ctx.beginPath();
      ctx.moveTo(cx - 10 * s, by - 3.5 * s);
      ctx.lineTo(cx - 7 * s, by - 9.5 * s);
      ctx.lineTo(cx + 0 * s, by - 9.5 * s);
      ctx.lineTo(cx + 9 * s, by - 3.5 * s);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = pal.glass;
      ctx.fillRect(cx + 2 * s, by - 9 * s, 6 * s, 5 * s);
      ctx.fillRect(cx - 6 * s, by - 9 * s, 7 * s, 5 * s);

      // Muscular rear haunch contour
      ctx.fillStyle = pal.hi;
      ctx.fillRect(cx - 18 * s, by - 3.5 * s, 8 * s, 1.5 * s);

      // Integrated Ducktail Spoiler
      ctx.fillStyle = pal.base;
      ctx.fillRect(cx - 26 * s, by - 5.5 * s, 4 * s, 2 * s);
      ctx.fillStyle = pal.hi;
      ctx.fillRect(cx - 26 * s, by - 5.5 * s, 4 * s, 0.8 * s);

      // Sleek Taillight bar
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cx - 27.5 * s, by - 1 * s, 2 * s, 1.8 * s);
      break;
    }

    // -------------------------------------------------------------------------
    // 7. VAN EXPRESS MONOSPACE (VW CAMPER / MINIBUS 2-TONE NOSE)
    // Directly reminiscent of the iconic bus in Sergio Silvarto's image!
    // -------------------------------------------------------------------------
    case 'van': {
      // Chassis Frame
      ctx.fillStyle = pal.outline;
      ctx.fillRect(cx - 26 * s, by + 4 * s, 52 * s, 4 * s);

      // Monospace Box Body (Upper Cream/Secondary, Lower Primary)
      // Lower Primary Hull
      ctx.fillStyle = pal.base;
      ctx.beginPath();
      ctx.moveTo(cx - 26 * s, by + 6 * s);
      ctx.lineTo(cx + 25 * s, by + 4 * s);
      ctx.lineTo(cx + 26 * s, by - 1 * s);
      ctx.lineTo(cx - 26 * s, by - 1 * s);
      ctx.closePath();
      ctx.fill();

      // Upper Cream/White Secondary Hull
      ctx.fillStyle = pal.sec;
      ctx.beginPath();
      ctx.moveTo(cx - 26 * s, by - 1 * s);
      ctx.lineTo(cx + 26 * s, by - 1 * s);
      ctx.lineTo(cx + 24 * s, by - 15 * s); // Curved nose front
      ctx.lineTo(cx - 26 * s, by - 15 * s); // Flat tall roofline
      ctx.closePath();
      ctx.fill();

      // Roof High Panel
      ctx.fillStyle = pal.secHi;
      ctx.fillRect(cx - 25 * s, by - 16 * s, 48 * s, 2 * s);

      // Two-Tone Chrome Belt Trim Line
      ctx.fillStyle = pal.chrome;
      ctx.fillRect(cx - 26 * s, by - 1.5 * s, 52 * s, 1 * s);

      // Wrap-Around Front Windshield (Iconic Split or Curved)
      ctx.fillStyle = pal.glass;
      ctx.fillRect(cx + 12 * s, by - 13.5 * s, 11 * s, 9 * s);
      ctx.fillStyle = pal.glassHi;
      ctx.fillRect(cx + 17 * s, by - 13.5 * s, 2.5 * s, 9 * s);

      // Row of Side Windows (Passenger / Camper Van)
      ctx.fillStyle = pal.glass;
      ctx.fillRect(cx + 3 * s, by - 13 * s, 7 * s, 7 * s); // Cab door window
      ctx.fillRect(cx - 7 * s, by - 13 * s, 8 * s, 7 * s); // Sliding door window
      ctx.fillRect(cx - 17 * s, by - 13 * s, 8 * s, 7 * s); // Rear window

      // Sliding door bottom rail groove
      ctx.fillStyle = pal.outline;
      ctx.fillRect(cx - 16 * s, by + 4.5 * s, 18 * s, 0.8 * s);

      // Classic Round Headlights & Horizontal Front Chrome Bumper
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(cx + 24 * s, by + 1 * s, 2 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.chrome;
      ctx.fillRect(cx + 24 * s, by + 3 * s, 3 * s, 2 * s); // Bumper overrider
      break;
    }

    // -------------------------------------------------------------------------
    // 8. PICKUP HEAVY-DUTY 4X4 (DOUBLE CAB & OPEN CARGO BED)
    // -------------------------------------------------------------------------
    case 'pickup': {
      // Heavy Truck Frame & Lifted Clearance
      ctx.fillStyle = pal.outline;
      ctx.fillRect(cx - 28 * s, by + 3 * s, 56 * s, 4.5 * s);

      // 4-Door Cabin Body
      ctx.fillStyle = pal.base;
      ctx.beginPath();
      ctx.moveTo(cx - 8 * s, by + 4 * s);
      ctx.lineTo(cx - 8 * s, by - 13 * s); // Back of cab
      ctx.lineTo(cx + 7 * s, by - 13 * s);  // Cabin roof
      ctx.lineTo(cx + 15 * s, by - 4 * s);  // Windshield
      ctx.lineTo(cx + 27 * s, by - 2 * s);  // High truck hood
      ctx.lineTo(cx + 28 * s, by + 4 * s);  // Chrome grille
      ctx.lineTo(cx - 8 * s, by + 6.5 * s);
      ctx.closePath();
      ctx.fill();

      // Open Cargo Bed (Bed sides & tailgate)
      ctx.fillStyle = pal.base;
      ctx.fillRect(cx - 27 * s, by - 2 * s, 19 * s, 7 * s); // Bed side
      // Inner bed shadow & black drop-in bedliner
      ctx.fillStyle = '#090d16';
      ctx.fillRect(cx - 25 * s, by - 1.5 * s, 15 * s, 2.5 * s);

      // Polished Steel Tubular Roll Bar (Santantônio)
      ctx.fillStyle = pal.chrome;
      ctx.fillRect(cx - 7 * s, by - 12 * s, 2 * s, 11 * s); // Main vertical tube
      ctx.beginPath();
      ctx.moveTo(cx - 7 * s, by - 12 * s);
      ctx.lineTo(cx - 15 * s, by - 1 * s);
      ctx.lineTo(cx - 13 * s, by - 1 * s);
      ctx.lineTo(cx - 5 * s, by - 12 * s);
      ctx.closePath();
      ctx.fill();

      // Cabin Windows
      ctx.fillStyle = pal.glass;
      ctx.fillRect(cx + 6 * s, by - 11.5 * s, 7 * s, 6.5 * s); // Windshield
      ctx.fillRect(cx - 0 * s, by - 11.5 * s, 5.5 * s, 6 * s); // Front door glass
      ctx.fillRect(cx - 6.5 * s, by - 11.5 * s, 5.5 * s, 6 * s); // Rear door glass

      // Chrome side step bars
      ctx.fillStyle = pal.chrome;
      ctx.fillRect(cx - 4 * s, by + 5.5 * s, 14 * s, 1.2 * s);

      // Quad Heavy Front Headlights
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx + 26 * s, by - 0.5 * s, 2.5 * s, 2 * s);
      ctx.fillRect(cx + 26 * s, by + 1.8 * s, 2.5 * s, 2 * s);
      break;
    }

    // -------------------------------------------------------------------------
    // 9. MUSCLE AMERICAN V8 (PROTRUDING BLOWER SUPERCHARGER)
    // -------------------------------------------------------------------------
    case 'muscle': {
      // Lower Sill & Exhaust Side Pipes
      ctx.fillStyle = pal.outline;
      ctx.fillRect(cx - 27 * s, by + 4 * s, 54 * s, 3.5 * s);
      ctx.fillStyle = pal.chrome;
      ctx.fillRect(cx - 10 * s, by + 5 * s, 14 * s, 1.5 * s); // Side exhaust pipe

      // Muscular Fastback Body
      ctx.fillStyle = pal.base;
      ctx.beginPath();
      ctx.moveTo(cx - 28 * s, by + 2 * s);
      ctx.lineTo(cx - 25 * s, by - 4 * s);  // Vertical muscle tail
      ctx.lineTo(cx - 12 * s, by - 10 * s); // Fastback sail panel
      ctx.lineTo(cx + 4 * s, by - 10 * s);  // Muscle roof
      ctx.lineTo(cx + 12 * s, by - 3 * s);  // Raked windshield
      ctx.lineTo(cx + 26 * s, by - 2 * s);  // Long hood
      ctx.lineTo(cx + 28 * s, by + 3.5 * s); // Aggressive forward-canted nose
      ctx.lineTo(cx - 26 * s, by + 6.5 * s);
      ctx.closePath();
      ctx.fill();

      // Lower body shadow & Coke-bottle hip contour
      ctx.fillStyle = pal.dark;
      ctx.fillRect(cx - 26 * s, by + 2 * s, 53 * s, 3 * s);
      ctx.fillStyle = pal.hi;
      ctx.fillRect(cx - 18 * s, by - 3.5 * s, 8 * s, 1.5 * s); // Rear hip flare

      // Cabin Windows
      ctx.fillStyle = pal.glass;
      ctx.fillRect(cx + 3 * s, by - 8.5 * s, 7 * s, 5 * s);
      ctx.fillRect(cx - 5 * s, by - 8.5 * s, 7 * s, 5 * s);

      // PROTRUDING DUAL-CARB SUPERCHARGER BLOWER
      ctx.fillStyle = pal.chrome;
      ctx.fillRect(cx + 14 * s, by - 7.5 * s, 7 * s, 4.5 * s); // Blower body
      ctx.fillStyle = pal.chromeHi;
      ctx.fillRect(cx + 14 * s, by - 7.5 * s, 7 * s, 1 * s);
      // Twin Red Throttle Butterflies
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cx + 19 * s, by - 7 * s, 2 * s, 1.5 * s);
      ctx.fillRect(cx + 19 * s, by - 5 * s, 2 * s, 1.5 * s);
      // Drive belt & pulley
      ctx.fillStyle = '#09090b';
      ctx.fillRect(cx + 13 * s, by - 6 * s, 1.5 * s, 3.5 * s);

      // Recessed Front Dark Grille with Quad Headlights
      ctx.fillStyle = '#09090b';
      ctx.fillRect(cx + 26.5 * s, by - 0.5 * s, 2 * s, 3.5 * s);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(cx + 27 * s, by + 0.2 * s, 1.2 * s, 0, Math.PI * 2);
      ctx.arc(cx + 27 * s, by + 2.2 * s, 1.2 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    // -------------------------------------------------------------------------
    // 10. HYPER SUPERCAR WEDGE (MID-ENGINE COCKPIT & LOUVERS)
    // -------------------------------------------------------------------------
    case 'supercar': {
      // Ground-Hugging Aero Splitters
      ctx.fillStyle = '#09090b';
      ctx.fillRect(cx + 20 * s, by + 4 * s, 10 * s, 1.5 * s);
      ctx.fillRect(cx - 28 * s, by + 4.5 * s, 10 * s, 2 * s);

      // Ultra-Low Hypercar Wedge Body
      ctx.fillStyle = pal.base;
      ctx.beginPath();
      ctx.moveTo(cx - 28 * s, by + 2 * s);
      ctx.lineTo(cx - 20 * s, by - 3 * s);  // Low rear deck
      ctx.lineTo(cx - 10 * s, by - 8 * s);  // Mid-engine canopy
      ctx.lineTo(cx + 2 * s, by - 8.5 * s);
      ctx.lineTo(cx + 12 * s, by - 2.5 * s);
      ctx.lineTo(cx + 27 * s, by - 0.5 * s);
      ctx.lineTo(cx + 29 * s, by + 3 * s);
      ctx.lineTo(cx - 26 * s, by + 5.5 * s);
      ctx.closePath();
      ctx.fill();

      // Slanted Glass Engine Cover & Louvers
      ctx.fillStyle = pal.glassDark;
      ctx.fillRect(cx - 18 * s, by - 5 * s, 9 * s, 4 * s);
      ctx.fillStyle = '#cbd5e1'; // Chrome intake plenum visible
      ctx.fillRect(cx - 15 * s, by - 4 * s, 4 * s, 1.8 * s);

      // Bubble Canopy Cockpit
      ctx.fillStyle = pal.glass;
      ctx.fillRect(cx + 1 * s, by - 7.5 * s, 8 * s, 4.5 * s);
      ctx.fillRect(cx - 6 * s, by - 7.5 * s, 6 * s, 4.5 * s);

      // Side Radiator Air Intakes
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.moveTo(cx - 5 * s, by + 0.5 * s);
      ctx.lineTo(cx + 2 * s, by - 0.5 * s);
      ctx.lineTo(cx + 2 * s, by + 2 * s);
      ctx.closePath();
      ctx.fill();
      break;
    }

    // -------------------------------------------------------------------------
    // 11. TUNER JDM SPEC-R (EXPOSED INTERCOOLER & GT DRIFT WING)
    // -------------------------------------------------------------------------
    case 'tuner': {
      // Lower Aero Ground-Effects Skirt
      ctx.fillStyle = '#09090b';
      ctx.fillRect(cx - 26 * s, by + 5 * s, 52 * s, 2 * s);

      // JDM Sports Coupe Body
      ctx.fillStyle = pal.base;
      ctx.beginPath();
      ctx.moveTo(cx - 27 * s, by + 3 * s);
      ctx.lineTo(cx - 23 * s, by - 3 * s);
      ctx.lineTo(cx - 10 * s, by - 10 * s);
      ctx.lineTo(cx + 2 * s, by - 10 * s);
      ctx.lineTo(cx + 12 * s, by - 3 * s);
      ctx.lineTo(cx + 25 * s, by - 1.5 * s);
      ctx.lineTo(cx + 27 * s, by + 4 * s);
      ctx.lineTo(cx - 25 * s, by + 6 * s);
      ctx.closePath();
      ctx.fill();

      // EXPOSED FRONT SILVER INTERCOOLER
      ctx.fillStyle = '#09090b';
      ctx.fillRect(cx + 22 * s, by + 1 * s, 5 * s, 4 * s); // Mouth opening
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(cx + 22.5 * s, by + 1.5 * s, 4 * s, 3 * s); // Intercooler matrix
      for (let ic = 0; ic < 3; ic++) {
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(cx + 22.5 * s, by + 1.8 * s + ic * 0.9 * s, 4 * s, 0.4 * s);
      }

      // Windows
      ctx.fillStyle = pal.glass;
      ctx.fillRect(cx + 2 * s, by - 8.5 * s, 7 * s, 5 * s);
      ctx.fillRect(cx - 6 * s, by - 8.5 * s, 7 * s, 5 * s);

      // High Tuner Carbon Wing
      ctx.fillStyle = '#09090b';
      ctx.fillRect(cx - 22 * s, by - 8 * s, 1.5 * s, 5 * s);
      ctx.fillRect(cx - 18 * s, by - 8 * s, 1.5 * s, 5 * s);
      ctx.fillRect(cx - 25 * s, by - 9.5 * s, 10 * s, 1.8 * s);
      break;
    }

    // -------------------------------------------------------------------------
    // 12. RALLY CROSS WRC GR.B (4 AUX FOG LAMPS & ROOF AIR SCOOP)
    // -------------------------------------------------------------------------
    case 'rally': {
      // Rally Raised Suspension
      ctx.fillStyle = pal.outline;
      ctx.fillRect(cx - 26 * s, by + 2 * s, 52 * s, 4 * s);

      // Compact Hatchback Body
      ctx.fillStyle = pal.base;
      ctx.beginPath();
      ctx.moveTo(cx - 26 * s, by + 3 * s);
      ctx.lineTo(cx - 24 * s, by - 11 * s); // Steep rally hatch
      ctx.lineTo(cx + 3 * s, by - 11.5 * s); // Roof
      ctx.lineTo(cx + 12 * s, by - 3.5 * s); // Windshield
      ctx.lineTo(cx + 24 * s, by - 1.5 * s); // Compact hood
      ctx.lineTo(cx + 26 * s, by + 3.5 * s);
      ctx.lineTo(cx - 24 * s, by + 6 * s);
      ctx.closePath();
      ctx.fill();

      // Windows
      ctx.fillStyle = pal.glass;
      ctx.fillRect(cx + 2 * s, by - 9.5 * s, 7 * s, 5.5 * s);
      ctx.fillRect(cx - 6 * s, by - 9.5 * s, 7 * s, 5.5 * s);

      // Functional Roof Air Scoop
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(cx - 2 * s, by - 13.5 * s, 5 * s, 2.2 * s);
      ctx.fillStyle = '#09090b';
      ctx.fillRect(cx + 1 * s, by - 13 * s, 2 * s, 1.5 * s); // Air scoop intake hole

      // POD OF 4 ROUND YELLOW RALLY FOG LAMPS
      ctx.fillStyle = '#09090b';
      ctx.fillRect(cx + 24 * s, by - 1.5 * s, 3.5 * s, 5 * s);
      ctx.fillStyle = '#fde047'; // Bright yellow rally lamps
      ctx.beginPath();
      ctx.arc(cx + 25.5 * s, by - 0.5 * s, 1.4 * s, 0, Math.PI * 2);
      ctx.arc(cx + 25.5 * s, by + 1.2 * s, 1.4 * s, 0, Math.PI * 2);
      ctx.arc(cx + 25.5 * s, by + 2.8 * s, 1.4 * s, 0, Math.PI * 2);
      ctx.fill();

      // Red Rubber Rally Mudflaps
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cx - 20 * s, by + 5 * s, 2 * s, 4 * s);
      ctx.fillRect(cx + 8 * s, by + 5 * s, 2 * s, 4 * s);
      break;
    }

    // -------------------------------------------------------------------------
    // 13. DERBY BATTERING TANK (ARMOR PLATES, RIVETS & BATTERING RAM)
    // -------------------------------------------------------------------------
    case 'derby_tank': {
      // Heavy Steel Armor Hull
      ctx.fillStyle = '#44403c';
      ctx.fillRect(cx - 26 * s, by - 3 * s, 50 * s, 9 * s);

      // Welded steel plates & silver rivets
      ctx.fillStyle = '#78716c';
      ctx.fillRect(cx - 18 * s, by - 1 * s, 16 * s, 5 * s);
      ctx.fillRect(cx + 2 * s, by - 1 * s, 16 * s, 5 * s);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(cx - 16 * s, by, 1 * s, 1 * s);
      ctx.fillRect(cx - 4 * s, by, 1 * s, 1 * s);
      ctx.fillRect(cx + 4 * s, by, 1 * s, 1 * s);
      ctx.fillRect(cx + 16 * s, by, 1 * s, 1 * s);

      // Window Metal Grating
      ctx.fillStyle = '#09090b';
      ctx.fillRect(cx - 6 * s, by - 9 * s, 18 * s, 5 * s);
      ctx.fillStyle = '#a8a29e';
      ctx.fillRect(cx - 5 * s, by - 8 * s, 16 * s, 0.8 * s);
      ctx.fillRect(cx - 5 * s, by - 6.5 * s, 16 * s, 0.8 * s);

      // FRONT HEAVY-DUTY BATTERING RAM WITH STEEL SPIKES
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(cx + 24 * s, by - 2 * s, 5 * s, 7 * s);
      ctx.fillStyle = '#cbd5e1';
      for (let sp = -1; sp <= 1; sp++) {
        ctx.beginPath();
        ctx.moveTo(cx + 29 * s, by + 1.5 * s + sp * 2.5 * s);
        ctx.lineTo(cx + 33 * s, by + 2.5 * s + sp * 2.5 * s);
        ctx.lineTo(cx + 29 * s, by + 3.5 * s + sp * 2.5 * s);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    // -------------------------------------------------------------------------
    // 14. CLASSIC HOT-ROD '34 (WATERFALL CHROME GRILLE & ZOOMIE EXHAUSTS)
    // -------------------------------------------------------------------------
    case 'classic': {
      // Vintage Teardrop Running Boards
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 24 * s, by + 4 * s, 48 * s, 2 * s);

      // Chopped 1934 Coupe Cabin
      ctx.fillStyle = pal.base;
      ctx.beginPath();
      ctx.moveTo(cx - 24 * s, by + 2 * s);
      ctx.lineTo(cx - 18 * s, by - 6 * s);  // Curving rear trunk
      ctx.lineTo(cx - 8 * s, by - 12 * s);  // Chopped roof
      ctx.lineTo(cx + 4 * s, by - 12 * s);
      ctx.lineTo(cx + 8 * s, by - 4 * s);   // Upright vintage windshield
      ctx.lineTo(cx + 22 * s, by - 2 * s);  // Tapered engine cowl
      ctx.lineTo(cx + 24 * s, by + 3 * s);
      ctx.lineTo(cx - 22 * s, by + 5 * s);
      ctx.closePath();
      ctx.fill();

      // Windows
      ctx.fillStyle = pal.glass;
      ctx.fillRect(cx - 4 * s, by - 10.5 * s, 9 * s, 5 * s);

      // UPRIGHT 1934 WATERFALL CHROME RADIATOR GRILLE
      ctx.fillStyle = pal.chrome;
      ctx.fillRect(cx + 22 * s, by - 4 * s, 3.5 * s, 8 * s);
      ctx.fillStyle = pal.chromeHi;
      ctx.fillRect(cx + 23 * s, by - 5 * s, 1.5 * s, 1.5 * s); // Vintage radiator cap
      ctx.fillStyle = '#09090b';
      for (let g = 0; g < 4; g++) {
        ctx.fillRect(cx + 22.5 * s, by - 3 * s + g * 1.5 * s, 2.5 * s, 0.6 * s);
      }

      // Exposed V8 Engine & Chrome Zoomie Side Headers
      ctx.fillStyle = pal.chrome;
      ctx.fillRect(cx + 10 * s, by - 1 * s, 1.5 * s, 4 * s);
      ctx.fillRect(cx + 13 * s, by - 1 * s, 1.5 * s, 4 * s);
      ctx.fillRect(cx + 16 * s, by - 1 * s, 1.5 * s, 4 * s);
      ctx.fillRect(cx + 19 * s, by - 1 * s, 1.5 * s, 4 * s);

      // Big Round Chrome Headlamps on Stalks
      ctx.fillStyle = pal.chrome;
      ctx.beginPath();
      ctx.arc(cx + 21 * s, by - 1 * s, 2.5 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(cx + 21.5 * s, by - 1 * s, 1.8 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  // 4. Near Wheels (Front-Left & Rear-Left with full isometric detail)
  const isLifted = type === 'off_road';
  const isWhiteWall = type === 'classic';
  const frontRadius = type === 'truck' ? 6.2 : type === 'off_road' ? 6.5 : 5.2;
  const rearRadius = type === 'truck' ? 6.2 : type === 'off_road' ? 6.5 : 5.2;

  // Rear near wheel
  drawIsoWheel(ctx, pal, cx - 14 * s, by + 6 * s, s, rearRadius, isLifted, isWhiteWall, wheelRot);

  // Tandem dual wheel for truck
  if (type === 'truck') {
    drawIsoWheel(ctx, pal, cx - 22 * s, by + 5 * s, s, 6.2, false, false, wheelRot);
  }

  // Front near wheel
  drawIsoWheel(ctx, pal, cx + 15 * s, by + 4 * s, s, frontRadius, isLifted, isWhiteWall, wheelRot);

  ctx.restore();
}
