// High-Fidelity Modern Automotive Pixel Art Engine
// Modeled directly on authentic, real-world legendary cars:
// 1. Muscle: 1967 Shelby GT500 Eleanor / 1968 Mustang Fastback Bullitt / 1970 Dodge Charger
// 2. Tuner: Toyota Supra MK4 / Nissan Skyline GT-R R34
// 3. Supercar: Porsche 911 GT3 RS / Lamborghini Huracan / DeLorean DMC-12
// 4. Classic: 1963 VW Beetle Herbie / 1964 Aston Martin DB5 / 1932 Hot Rod Coupe
// 5. Rally: Lancia Delta Integrale Evoluzione / WRC / Safari Explorer
// 6. Derby Tank: Mad Max Interceptor / War Rig / Demolition Monster
//
// Real Automotive Proportions:
// - Long, low-slung stance (Wheelbase ~56% of total length, Length/Height ratio ~3.8)
// - Accurate greenhouse (A/B/C pillars, raked windshield, fastback sail panels, tinted glass with interior & glare)
// - Real wheels (15"-19" scale, dark wheel wells, rubber tires with treads, rim lips, spokes, brake rotors & red calipers)
// - Authentic panels (shark-bite nose, intercoolers, louvers, ducktails, swan-neck wings, diffuser, dual exhausts)
// - Iconic movie car liveries (Eleanor Le Mans stripes, Supra tribal decals, Herbie #53, Bumblebee, Police 911, etc.)

import { Car, CustomCarAsset } from '../types';
import { normalizeChassisType, renderIsometricChassis } from './pixelCarIsometric';

export function mirrorGridHorizontally(pixels: string[], w: number, h: number): string[] {
  const result = new Array(w * h).fill('');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      result[y * w + (w - 1 - x)] = pixels[y * w + x];
    }
  }
  return result;
}

export function adjustBrightness(hex: string, percent: number): string {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const num = parseInt(hex, 16);
  if (isNaN(num)) return '#ffffff';
  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
  let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export type ViewAngle = 'right' | 'left' | 'side' | 'isometric' | 'top' | 'front' | 'rear';

export interface RenderCarOptions {
  ctx: CanvasRenderingContext2D;
  car: Car;
  cx: number;
  cy: number;
  scale: number;
  frame?: number;
  showNitro?: boolean;
  animated?: boolean;
  viewMode?: ViewAngle | 'rotation';
  rotationAngle?: number; // 0 to 360 degrees
}

interface Palette {
  hi: string;       // Specular sunlit top edge
  light: string;    // Light body tone
  base: string;     // Base body color
  dark: string;     // Lower body / crease shadow
  deep: string;     // Deep panel seam / underbody shadow
  sec: string;      // Secondary color (trim, carbon, accents)
  secHi: string;
}

function getCarPalette(car: Car): Palette {
  const base = car.visuals.primaryColor || '#e11d48';
  const sec = car.visuals.secondaryColor || '#18181b';
  return {
    hi: adjustBrightness(base, 42),
    light: adjustBrightness(base, 18),
    base: base,
    dark: adjustBrightness(base, -25),
    deep: adjustBrightness(base, -55),
    sec: sec,
    secHi: adjustBrightness(sec, 30),
  };
}

// =============================================================================
// 1. MASTER BLUEPRINT SIDE VIEW (REAL-WORLD PROPORTIONS & ANATOMY)
// =============================================================================
export function drawSideViewCar(
  ctx: CanvasRenderingContext2D,
  car: Car,
  cx: number,
  cy: number,
  s: number,
  frame: number = 0,
  showNitro: boolean = false,
  animated: boolean = false
) {
  const pal = getCarPalette(car);
  const bodyType = normalizeChassisType(car.visuals.bodyType);
  const spoiler = car.visuals.spoiler || 'none';
  const wheelStyle = car.visuals.wheelStyle || 'spokes';
  const skinName = (car.visuals.skinName || '').toLowerCase();
  const equippedSkinId = (car.visuals.equippedSkinId || '').toLowerCase();

  const idleY = animated ? Math.sin(frame * 0.22) * 0.4 * s : 0;
  const wheelRot = animated ? (frame * 0.4) % (Math.PI * 2) : 0;

  // Ground level relative to center
  const groundY = cy + 10 * s;
  const isLifted = bodyType === 'rally' || bodyType === 'pickup' || bodyType === 'off_road' || bodyType === 'truck' || bodyType === 'suv';
  const isLowered = bodyType === 'supercar' || bodyType === 'tuner' || bodyType === 'sports' || bodyType === 'coupe';
  const rideHeightOffset = isLifted ? -2.8 * s : isLowered ? 1.0 * s : 0;
  const by = cy + idleY + rideHeightOffset;

  // Wheel positioning: Golden Ratio Wheelbase (56% of total car length)
  const frontWheelX = cx + 24 * s;
  const rearWheelX = cx - 22 * s;
  const wheelRadius = isLifted ? 6.2 * s : 5.6 * s;
  const wheelCenterY = groundY - wheelRadius + 0.4 * s;

  // --- A. Realistic Ground Contact Drop Shadow ---
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.ellipse(cx, groundY + 0.6 * s, 39 * s, 3.8 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dark undercarriage shadow directly between wheels
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.beginPath();
  ctx.ellipse(cx + 1 * s, groundY - 0.2 * s, 32 * s, 2.0 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- B. Neon Underglow ---
  if (car.visuals.hasNeon) {
    const neonCol = car.visuals.neonColor || '#00f0ff';
    ctx.shadowColor = neonCol;
    ctx.shadowBlur = 16 * s;
    ctx.fillStyle = neonCol;
    ctx.beginPath();
    ctx.ellipse(cx, groundY - 0.5 * s, 34 * s, 3.2 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx, groundY - 0.5 * s, 22 * s, 1.4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // --- C. Nitro Exhaust Flame ---
  if (showNitro) {
    ctx.save();
    const exhaustX = (bodyType === 'derby_tank') ? cx - 14 * s : cx - 40 * s;
    const exhaustY = (bodyType === 'derby_tank') ? by - 12 * s : groundY - 4.5 * s + idleY + rideHeightOffset;
    const flameLen = (14 + (frame % 4) * 3.5) * s;
    const flameH = (4.5 + (frame % 3) * 1.5) * s;

    // Cyan plasma glow
    ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
    ctx.beginPath();
    ctx.ellipse(exhaustX - flameLen * 0.5, exhaustY, flameLen * 0.6, flameH * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hot jet cone
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.moveTo(exhaustX, exhaustY - flameH * 0.4);
    ctx.lineTo(exhaustX - flameLen * 0.75, exhaustY - flameH * 0.15);
    ctx.lineTo(exhaustX - flameLen, exhaustY);
    ctx.lineTo(exhaustX - flameLen * 0.75, exhaustY + flameH * 0.15);
    ctx.lineTo(exhaustX, exhaustY + flameH * 0.4);
    ctx.closePath();
    ctx.fill();

    // White incandescent core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(exhaustX - flameLen * 0.25, exhaustY, flameLen * 0.25, flameH * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // --- D. Realistic Body Blueprints by Archetype ---
  ctx.save();

  if (bodyType === 'muscle') {
    // =========================================================================
    // 1967 SHELBY GT500 ELEANOR / 1968 MUSTANG BULLITT / 1970 DODGE CHARGER
    // =========================================================================
    // 1. Lower Rocker Panel & Chrome Sills
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx - 38 * s, by + 4.5 * s, 77 * s, 1.5 * s);
    ctx.fillStyle = '#cbd5e1'; // chrome rocker trim
    ctx.fillRect(cx - 37 * s, by + 4.0 * s, 75 * s, 0.8 * s);

    // 2. Muscular Lower Body Shell (Shark nose + Coke-bottle hips)
    ctx.fillStyle = pal.base;
    ctx.beginPath();
    ctx.moveTo(cx - 39 * s, by + 4.5 * s);
    ctx.lineTo(cx - 39 * s, by - 2.5 * s);  // boxy vertical rear tail panel
    ctx.lineTo(cx - 15 * s, by - 3.8 * s);  // muscular Coke-bottle rear hip swell!
    ctx.lineTo(cx + 8 * s, by - 3.2 * s);   // door waistline
    ctx.lineTo(cx + 36 * s, by - 2.5 * s);  // long sculpted muscle hood
    ctx.lineTo(cx + 40 * s, by - 1.0 * s);  // forward-canted shark-bite nose!
    ctx.lineTo(cx + 40 * s, by + 4.5 * s);  // front chin air dam
    ctx.closePath();
    ctx.fill();

    // Body shading layers
    ctx.fillStyle = pal.dark;
    ctx.fillRect(cx - 38 * s, by + 2.2 * s, 76 * s, 2.0 * s);
    ctx.fillStyle = pal.light;
    ctx.fillRect(cx - 38 * s, by - 2.8 * s, 75 * s, 1.2 * s);

    // Muscular Rear Haunch Highlight (Coke-bottle hip reflection)
    ctx.fillStyle = pal.hi;
    ctx.fillRect(cx - 27 * s, by - 4.2 * s, 16 * s, 1.6 * s);

    // Cowl Induction Power Bulge on Hood
    ctx.fillStyle = pal.hi;
    ctx.fillRect(cx + 14 * s, by - 3.8 * s, 18 * s, 1.2 * s);
    ctx.fillStyle = pal.deep;
    ctx.fillRect(cx + 14 * s, by - 2.6 * s, 18 * s, 0.6 * s); // shadow crease

    // Side Functional Quarter Air Scoop (Eleanor style)
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx - 13 * s, by - 1.5 * s, 3.5 * s, 3.2 * s);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx - 13 * s, by - 1.5 * s, 0.8 * s, 3.2 * s);

    // 3. Sweeping Fastback Cabin & Louvered Quarter Windows
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(cx - 24 * s, by - 2.5 * s);
    ctx.lineTo(cx - 13 * s, by - 9.8 * s);  // fastback sweep
    ctx.lineTo(cx + 9 * s, by - 9.8 * s);   // flat roof
    ctx.lineTo(cx + 17 * s, by - 2.8 * s);  // raked front windshield
    ctx.closePath();
    ctx.fill();

    // Muscle Roof Panel
    ctx.fillStyle = pal.base;
    ctx.fillRect(cx - 13 * s, by - 10.6 * s, 23 * s, 1.6 * s);
    ctx.fillStyle = pal.hi;
    ctx.fillRect(cx - 12 * s, by - 10.6 * s, 21 * s, 0.7 * s);

    // Side Tinted Windows with Driver Silhouette & Glare
    ctx.fillStyle = '#0f172a'; // interior cabin dark
    ctx.beginPath();
    ctx.moveTo(cx - 8 * s, by - 3.2 * s);
    ctx.lineTo(cx - 6 * s, by - 8.8 * s);
    ctx.lineTo(cx + 7 * s, by - 8.8 * s);
    ctx.lineTo(cx + 14 * s, by - 3.2 * s);
    ctx.closePath();
    ctx.fill();

    // Driver & Steering Wheel Silhouette
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cx - 1 * s, by - 6.2 * s, 1.8 * s, 0, Math.PI * 2); // driver head
    ctx.fill();
    ctx.fillRect(cx + 4 * s, by - 6.5 * s, 1.0 * s, 3.5 * s); // steering wheel rim

    // Window Glass Sky Specular Reflection Bars
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx + 0 * s, by - 8.8 * s, 6 * s, 5.2 * s);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(cx + 3 * s, by - 8.4 * s, 1.6 * s, 4.5 * s);

    // Chrome A-pillar and Window Surround Trim
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx + 14 * s, by - 3.5 * s, 1.2 * s, 1.0 * s);
    ctx.fillRect(cx + 7 * s, by - 9.2 * s, 1.2 * s, 6.0 * s); // B-pillar separator

    // Rear Sail Panel Louvers (Mustang Fastback / Bullitt / Eleanor)
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx - 20 * s, by - 8.0 * s, 8 * s, 5.0 * s);
    ctx.fillStyle = '#334155';
    ctx.fillRect(cx - 19 * s, by - 7.0 * s, 6.5 * s, 0.8 * s);
    ctx.fillRect(cx - 18 * s, by - 5.5 * s, 6.5 * s, 0.8 * s);
    ctx.fillRect(cx - 17 * s, by - 4.0 * s, 6.5 * s, 0.8 * s);

    // 4. Front Shark-Nose Grille & Round Quad Headlights
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx + 36.5 * s, by - 1.2 * s, 3.5 * s, 5.5 * s);
    ctx.fillStyle = '#f8fafc'; // chrome headlight bezel
    ctx.fillRect(cx + 37 * s, by - 0.5 * s, 2.5 * s, 2.2 * s);
    ctx.fillRect(cx + 37 * s, by + 2.0 * s, 2.5 * s, 2.2 * s);
    ctx.fillStyle = '#fef08a'; // glowing halogen round lamps
    ctx.beginPath();
    ctx.arc(cx + 38.2 * s, by + 0.6 * s, 1.0 * s, 0, Math.PI * 2);
    ctx.arc(cx + 38.2 * s, by + 3.1 * s, 1.0 * s, 0, Math.PI * 2);
    ctx.fill();

    // Chrome Front Bumperette & Rear Chrome Bumper
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cx + 38.5 * s, by + 3.2 * s, 2.5 * s, 2.2 * s);
    ctx.fillRect(cx - 40 * s, by + 3.0 * s, 2.5 * s, 2.5 * s);

    // Rear Taillight Panel (Triple vertical Shelby / wide horizontal Charger)
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx - 39.5 * s, by - 1.5 * s, 2.0 * s, 4.0 * s);
    ctx.fillStyle = '#ef4444'; // triple red tail bars
    ctx.fillRect(cx - 39.5 * s, by - 1.0 * s, 1.2 * s, 1.0 * s);
    ctx.fillRect(cx - 39.5 * s, by + 0.2 * s, 1.2 * s, 1.0 * s);
    ctx.fillRect(cx - 39.5 * s, by + 1.4 * s, 1.2 * s, 1.0 * s);

    // Dual Side-Exit Oval Chrome Exhaust Tips (under door rocker)
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(cx - 8 * s, by + 5.0 * s, 5.5 * s, 1.6 * s);
    ctx.fillStyle = '#09090b'; // dark exhaust pipe hollows
    ctx.fillRect(cx - 7 * s, by + 5.3 * s, 1.8 * s, 1.0 * s);
    ctx.fillRect(cx - 4.5 * s, by + 5.3 * s, 1.8 * s, 1.0 * s);

  } else if (bodyType === 'tuner') {
    // =========================================================================
    // TOYOTA SUPRA MK4 / NISSAN SKYLINE GT-R R34
    // =========================================================================
    // 1. Carbon Fiber Front Splitter & Side Skirts
    ctx.fillStyle = pal.sec;
    ctx.fillRect(cx - 37 * s, by + 4.6 * s, 75 * s, 1.6 * s);
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx + 32 * s, by + 5.5 * s, 9 * s, 1.2 * s); // front lip
    ctx.fillRect(cx - 39 * s, by + 5.5 * s, 8 * s, 1.2 * s); // rear diffuser

    // 2. Aerodynamic Streamlined Body (Low curved bullet nose + rounded rear)
    ctx.fillStyle = pal.base;
    ctx.beginPath();
    ctx.moveTo(cx - 38 * s, by + 4.5 * s);
    ctx.lineTo(cx - 38 * s, by - 1.5 * s);  // rounded rear bumper
    ctx.lineTo(cx - 20 * s, by - 3.5 * s);  // rear decklid
    ctx.lineTo(cx + 9 * s, by - 3.5 * s);   // door beltline
    ctx.lineTo(cx + 34 * s, by - 1.8 * s);  // low curving aerodynamic hood
    ctx.lineTo(cx + 39 * s, by + 0.5 * s);  // rounded bullet nose
    ctx.lineTo(cx + 40 * s, by + 4.8 * s);  // front bumper mouth
    ctx.closePath();
    ctx.fill();

    // Body shading
    ctx.fillStyle = pal.dark;
    ctx.fillRect(cx - 37 * s, by + 2.2 * s, 75 * s, 2.2 * s);
    ctx.fillStyle = pal.light;
    ctx.fillRect(cx - 37 * s, by - 2.8 * s, 74 * s, 1.2 * s);
    ctx.fillStyle = pal.hi;
    ctx.fillRect(cx + 12 * s, by - 3.0 * s, 22 * s, 1.2 * s);

    // Front Bumper Huge Intercooler Mouth & Aluminum Cooling Core (FMIC)
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx + 32 * s, by + 1.2 * s, 8.5 * s, 4.0 * s);
    ctx.fillStyle = '#94a3b8'; // silver intercooler tubes
    ctx.fillRect(cx + 33 * s, by + 1.8 * s, 6.5 * s, 1.0 * s);
    ctx.fillRect(cx + 33 * s, by + 3.2 * s, 6.5 * s, 1.0 * s);

    // Hood Twin Heat Extraction Vents
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx + 18 * s, by - 2.5 * s, 4 * s, 1.0 * s);
    ctx.fillRect(cx + 25 * s, by - 2.5 * s, 4 * s, 1.0 * s);

    // 3. Iconic Bubble Greenhouse & Flush Glass
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(cx - 22 * s, by - 3.0 * s);
    ctx.lineTo(cx - 12 * s, by - 9.8 * s);
    ctx.lineTo(cx + 8 * s, by - 9.8 * s);
    ctx.lineTo(cx + 18 * s, by - 2.8 * s);
    ctx.closePath();
    ctx.fill();

    // Roof skin
    ctx.fillStyle = pal.base;
    ctx.fillRect(cx - 12 * s, by - 10.6 * s, 21 * s, 1.6 * s);
    ctx.fillStyle = pal.hi;
    ctx.fillRect(cx - 11 * s, by - 10.6 * s, 19 * s, 0.7 * s);

    // Tinted Glass with Interior & Reflections
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(cx - 9 * s, by - 3.5 * s);
    ctx.lineTo(cx - 7 * s, by - 8.8 * s);
    ctx.lineTo(cx + 7 * s, by - 8.8 * s);
    ctx.lineTo(cx + 15 * s, by - 3.5 * s);
    ctx.closePath();
    ctx.fill();

    // Driver & Steering Wheel
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cx - 1 * s, by - 6.2 * s, 1.8 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx + 4 * s, by - 6.5 * s, 1.0 * s, 3.5 * s);

    // Sky reflection blade
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx + 0 * s, by - 8.8 * s, 7 * s, 5.0 * s);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(cx + 3 * s, by - 8.4 * s, 1.6 * s, 4.2 * s);

    // Triangular Rear Quarter Glass
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx - 16 * s, by - 7.5 * s, 5.5 * s, 4.2 * s);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx - 15 * s, by - 6.8 * s, 3.8 * s, 3.0 * s);

    // Aero Side Mirror & Door Handle
    ctx.fillStyle = pal.sec;
    ctx.fillRect(cx + 12 * s, by - 4.5 * s, 3.2 * s, 1.8 * s);
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx - 2 * s, by - 1.5 * s, 2.5 * s, 0.8 * s); // flush handle

    // 4. Supra 3-Projector Clear Glass Headlights
    ctx.fillStyle = '#1e293b'; // black housing
    ctx.fillRect(cx + 34 * s, by - 1.2 * s, 5.5 * s, 2.5 * s);
    ctx.fillStyle = '#38bdf8'; // projector lens 1
    ctx.fillRect(cx + 35 * s, by - 0.8 * s, 1.2 * s, 1.6 * s);
    ctx.fillStyle = '#ffffff'; // projector lens 2
    ctx.fillRect(cx + 36.8 * s, by - 0.8 * s, 1.2 * s, 1.6 * s);
    ctx.fillStyle = '#f59e0b'; // amber turn signal
    ctx.fillRect(cx + 38.4 * s, by - 0.8 * s, 0.8 * s, 1.6 * s);

    // 4-Round Supra / Skyline Taillight Cluster
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx - 39 * s, by - 1.5 * s, 3.0 * s, 3.5 * s);
    ctx.fillStyle = '#ef4444'; // round red lenses
    ctx.fillRect(cx - 38.5 * s, by - 1.0 * s, 1.2 * s, 1.2 * s);
    ctx.fillRect(cx - 38.5 * s, by + 0.6 * s, 1.2 * s, 1.2 * s);

    // Large 4-inch Angled Stainless Steel Cannon Exhaust with Burnt Titanium Tip
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(cx - 41 * s, by + 4.2 * s, 4.5 * s, 2.2 * s);
    ctx.fillStyle = '#38bdf8'; // burnt blue rainbow tip!
    ctx.fillRect(cx - 41.5 * s, by + 4.4 * s, 1.5 * s, 1.8 * s);
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx - 41.5 * s, by + 4.7 * s, 0.6 * s, 1.2 * s);

  } else if (bodyType === 'supercar') {
    // =========================================================================
    // PORSCHE 911 GT3 RS / LAMBORGHINI HURACAN / DELOREAN DMC-12
    // =========================================================================
    // 1. Carbon Splitter & Rear Aero Diffuser Strakes
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx + 28 * s, by + 5.0 * s, 12 * s, 1.6 * s);
    ctx.fillRect(cx - 40 * s, by + 4.0 * s, 10 * s, 2.4 * s);
    // Diffuser vertical fins
    ctx.fillStyle = '#27272a';
    ctx.fillRect(cx - 38 * s, by + 4.8 * s, 1.2 * s, 1.6 * s);
    ctx.fillRect(cx - 35 * s, by + 4.8 * s, 1.2 * s, 1.6 * s);

    // 2. Ultra-Low Wedge Silhouette
    ctx.fillStyle = pal.base;
    ctx.beginPath();
    ctx.moveTo(cx - 39 * s, by + 4.0 * s);
    ctx.lineTo(cx - 39 * s, by - 1.0 * s);
    ctx.lineTo(cx - 24 * s, by - 3.8 * s);  // low engine decklid
    ctx.lineTo(cx + 6 * s, by - 3.8 * s);   // low waistline
    ctx.lineTo(cx + 36 * s, by + 0.5 * s);  // razor-sharp sloping nose
    ctx.lineTo(cx + 40 * s, by + 5.0 * s);  // front splitter tip
    ctx.closePath();
    ctx.fill();

    // Body Shading
    ctx.fillStyle = pal.dark;
    ctx.fillRect(cx - 38 * s, by + 2.0 * s, 76 * s, 2.2 * s);
    ctx.fillStyle = pal.light;
    ctx.fillRect(cx - 38 * s, by - 3.0 * s, 75 * s, 1.2 * s);

    // Front Fender Wheel-Arch Pressure Relief Louvers (GT3 RS style)
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx + 24 * s, by - 2.0 * s, 1.2 * s, 2.5 * s);
    ctx.fillRect(cx + 26.5 * s, by - 1.6 * s, 1.2 * s, 2.5 * s);
    ctx.fillRect(cx + 29 * s, by - 1.2 * s, 1.2 * s, 2.5 * s);

    // Side Aero NACA Duct & Radiator Scoop
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(cx - 9 * s, by + 1.2 * s);
    ctx.lineTo(cx - 2 * s, by - 1.8 * s);
    ctx.lineTo(cx - 2 * s, by + 2.8 * s);
    ctx.closePath();
    ctx.fill();

    // 3. Extreme Raked Teardrop Canopy & Carbon Roof
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(cx - 22 * s, by - 3.2 * s);
    ctx.lineTo(cx - 10 * s, by - 9.2 * s);
    ctx.lineTo(cx + 5 * s, by - 9.2 * s);
    ctx.lineTo(cx + 20 * s, by - 2.0 * s);
    ctx.closePath();
    ctx.fill();

    // Carbon Roof
    ctx.fillStyle = '#18181b';
    ctx.fillRect(cx - 10 * s, by - 10.0 * s, 16 * s, 1.5 * s);
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(cx - 9 * s, by - 10.0 * s, 14 * s, 0.6 * s);

    // Windshield Glass & Reflection
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(cx - 7 * s, by - 3.6 * s);
    ctx.lineTo(cx - 5 * s, by - 8.4 * s);
    ctx.lineTo(cx + 4 * s, by - 8.4 * s);
    ctx.lineTo(cx + 17 * s, by - 2.5 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx - 1 * s, by - 8.4 * s, 7 * s, 4.5 * s);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(cx + 3 * s, by - 8.0 * s, 1.6 * s, 3.8 * s);

    // Mid-Rear Engine Cover Glass with visible red manifold
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(cx - 21 * s, by - 5.8 * s, 11 * s, 3.8 * s);
    ctx.fillStyle = '#dc2626'; // red engine intake plenum
    ctx.fillRect(cx - 19 * s, by - 4.8 * s, 7 * s, 1.4 * s);
    ctx.fillStyle = '#cbd5e1'; // silver strut brace
    ctx.fillRect(cx - 18 * s, by - 5.4 * s, 5 * s, 0.6 * s);

    // 4. LED Blade Headlights & Rear Light Bar
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx + 34 * s, by - 0.2 * s, 4.5 * s, 1.5 * s);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx + 35.5 * s, by + 0.2 * s, 2.5 * s, 0.9 * s);

    // Full-Width Red LED Taillight Bar
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(cx - 39.5 * s, by - 0.8 * s, 2.5 * s, 1.8 * s);

    // Center Dual Titanium Exhausts
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(cx - 40 * s, by + 3.0 * s, 2.5 * s, 1.8 * s);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx - 40.5 * s, by + 3.2 * s, 1.0 * s, 1.4 * s);

  } else if (bodyType === 'classic') {
    // =========================================================================
    // 1963 HERBIE VW BEETLE / 1964 ASTON MARTIN DB5 / 1932 COUPE
    // =========================================================================
    // 1. Sweeping Curved Pontoon Fenders (Front & Rear)
    ctx.fillStyle = pal.dark;
    // Front pontoon fender
    ctx.beginPath();
    ctx.arc(frontWheelX, by + 3.5 * s, wheelRadius + 2.2 * s, Math.PI, 0, false);
    ctx.lineTo(cx + 38 * s, by + 7.5 * s);
    ctx.lineTo(cx + 12 * s, by + 7.5 * s);
    ctx.closePath();
    ctx.fill();

    // Rear pontoon fender
    ctx.beginPath();
    ctx.arc(rearWheelX, by + 3.5 * s, wheelRadius + 2.2 * s, Math.PI, 0, false);
    ctx.lineTo(cx - 10 * s, by + 7.5 * s);
    ctx.lineTo(cx - 36 * s, by + 7.5 * s);
    ctx.closePath();
    ctx.fill();

    // Polished Chrome Running Board Step linking fenders
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx - 10 * s, by + 6.8 * s, 22 * s, 1.6 * s);

    // 2. Rounded Vintage Body & Upright Radiator Grille
    ctx.fillStyle = pal.base;
    ctx.beginPath();
    ctx.moveTo(cx - 35 * s, by + 3.5 * s);
    ctx.lineTo(cx - 32 * s, by - 3.5 * s);  // teardrop rear curve
    ctx.lineTo(cx - 18 * s, by - 10.5 * s); // high rounded roof
    ctx.lineTo(cx + 6 * s, by - 10.5 * s);
    ctx.lineTo(cx + 12 * s, by - 4.5 * s);  // split upright windshield
    ctx.lineTo(cx + 32 * s, by - 3.8 * s);  // curved classic hood
    ctx.lineTo(cx + 35 * s, by + 4.5 * s);  // upright front
    ctx.closePath();
    ctx.fill();

    // Roof Highlight
    ctx.fillStyle = pal.hi;
    ctx.fillRect(cx - 17 * s, by - 11.2 * s, 22 * s, 1.5 * s);

    // 3. Chrome Waterfall Grille & Bullet Headlights
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx + 32 * s, by - 4.0 * s, 4.5 * s, 8.5 * s);
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx + 33 * s, by - 3.5 * s, 2.5 * s, 7.5 * s);
    ctx.fillStyle = '#cbd5e1'; // vertical slats
    ctx.fillRect(cx + 33.8 * s, by - 3.0 * s, 0.8 * s, 6.5 * s);

    // Round Bug-Eye Chrome Headlight
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cx + 33 * s, by - 1.0 * s, 4.5 * s, 4.2 * s);
    ctx.fillStyle = '#fef08a'; // yellow warm vintage lens
    ctx.beginPath();
    ctx.arc(cx + 35.5 * s, by + 1.1 * s, 1.5 * s, 0, Math.PI * 2);
    ctx.fill();

    // Curved Blade Chrome Bumpers with Overriders
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cx + 35 * s, by + 4.0 * s, 3.5 * s, 2.5 * s);
    ctx.fillRect(cx - 37 * s, by + 4.0 * s, 3.5 * s, 2.5 * s);

    // Chrome Window Frames & Split Windshield
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx - 4 * s, by - 9.0 * s, 6.0 * s, 4.5 * s);
    ctx.fillRect(cx + 4 * s, by - 9.0 * s, 5.0 * s, 4.5 * s);
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx + 2.5 * s, by - 9.5 * s, 1.2 * s, 5.5 * s); // split pillar

    // Chrome Peashooter Dual Exhausts
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx - 38 * s, by + 4.5 * s, 4.0 * s, 1.4 * s);

  } else if (bodyType === 'rally') {
    // =========================================================================
    // LANCIA DELTA INTEGRALE WRC GR.B / SAFARI EXPLORER
    // =========================================================================
    // 1. Heavy Aluminum Skid Plate & Red Rubber Mudflaps
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx + 26 * s, by + 5.5 * s, 12 * s, 2.5 * s); // skid plate
    // Red Mudflaps behind wheels
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(frontWheelX - 8.5 * s, by + 4.5 * s, 2.5 * s, 6.5 * s);
    ctx.fillRect(rearWheelX - 8.5 * s, by + 4.5 * s, 2.5 * s, 6.5 * s);

    // 2. Boxy Rally Hatchback with Blister-Flared Arches
    ctx.fillStyle = pal.base;
    ctx.beginPath();
    ctx.moveTo(cx - 36 * s, by + 5.0 * s);
    ctx.lineTo(cx - 36 * s, by - 5.5 * s);  // upright rally hatch tailgate
    ctx.lineTo(cx - 24 * s, by - 9.8 * s);  // roofline
    ctx.lineTo(cx + 8 * s, by - 9.8 * s);
    ctx.lineTo(cx + 17 * s, by - 2.8 * s);  // windshield
    ctx.lineTo(cx + 36 * s, by - 1.8 * s);  // boxy rally hood
    ctx.lineTo(cx + 38 * s, by + 5.0 * s);
    ctx.closePath();
    ctx.fill();

    // Boxy Blister Flared Fender Arches
    ctx.fillStyle = pal.hi;
    ctx.fillRect(cx - 29 * s, by - 3.5 * s, 14 * s, 2.0 * s);
    ctx.fillRect(cx + 17 * s, by - 2.5 * s, 14 * s, 2.0 * s);

    // Roof Air Intake Scoop
    ctx.fillStyle = pal.sec;
    ctx.fillRect(cx - 4 * s, by - 12.5 * s, 9 * s, 3.0 * s);
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx + 2 * s, by - 12.0 * s, 2.5 * s, 2.0 * s); // scoop intake opening

    // Hood-Mounted Quad Rally Fog Lamp Pod (4 bright yellow round lamps!)
    ctx.fillStyle = '#18181b';
    ctx.fillRect(cx + 24 * s, by - 5.2 * s, 10 * s, 3.5 * s);
    ctx.fillStyle = '#fef08a'; // yellow rally lamps
    ctx.beginPath();
    ctx.arc(cx + 26 * s, by - 3.5 * s, 1.2 * s, 0, Math.PI * 2);
    ctx.arc(cx + 29 * s, by - 3.5 * s, 1.2 * s, 0, Math.PI * 2);
    ctx.arc(cx + 32 * s, by - 3.5 * s, 1.2 * s, 0, Math.PI * 2);
    ctx.fill();

    // High Adjustable Roofline Rally Wing
    ctx.fillStyle = '#18181b';
    ctx.fillRect(cx - 37 * s, by - 11.5 * s, 10 * s, 2.5 * s);

  } else if (bodyType === 'sedan') {
    // =========================================================================
    // REAL 3-BOX EXECUTIVE SPORT SEDAN (E30 / M3 / AUDI RS / OPALA COMODORO)
    // =========================================================================
    // 1. Lower Rocker Panel & Chrome Sills
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx - 39 * s, by + 4.2 * s, 81 * s, 1.8 * s);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx - 38 * s, by + 3.8 * s, 79 * s, 0.8 * s);

    // 2. 3-Box Body Shell
    ctx.fillStyle = pal.base;
    ctx.beginPath();
    ctx.moveTo(cx - 41 * s, by + 4.0 * s);
    ctx.lineTo(cx - 42 * s, by - 1.5 * s); // Rear deck
    ctx.lineTo(cx - 39 * s, by - 4.2 * s); // Trunk lid (Box 3)
    ctx.lineTo(cx - 20 * s, by - 4.5 * s); // C-Pillar base
    ctx.lineTo(cx - 10 * s, by - 13.8 * s); // Roofline (Box 2)
    ctx.lineTo(cx + 8 * s, by - 13.8 * s);
    ctx.lineTo(cx + 18 * s, by - 4.5 * s); // Windshield
    ctx.lineTo(cx + 40 * s, by - 3.2 * s); // Hood (Box 1)
    ctx.lineTo(cx + 42 * s, by + 1.2 * s); // Front bumper
    ctx.lineTo(cx + 41 * s, by + 4.0 * s);
    ctx.closePath();
    ctx.fill();

    // Directional shading layers
    ctx.fillStyle = pal.dark;
    ctx.fillRect(cx - 40 * s, by + 1.8 * s, 80 * s, 2.0 * s);
    ctx.fillStyle = pal.light;
    ctx.fillRect(cx - 40 * s, by - 2.5 * s, 79 * s, 1.2 * s);

    // Specular roof & hood highlights
    ctx.fillStyle = pal.hi;
    ctx.fillRect(cx - 9 * s, by - 14.5 * s, 16 * s, 1.2 * s); // roof
    ctx.fillRect(cx + 19 * s, by - 4.8 * s, 20 * s, 1.0 * s); // hood
    ctx.fillRect(cx - 39 * s, by - 4.6 * s, 18 * s, 0.9 * s); // trunk

    // 4-Door Glasshouse & B-Pillar
    ctx.fillStyle = '#0a0f1d';
    ctx.beginPath();
    ctx.moveTo(cx + 15 * s, by - 4.0 * s);
    ctx.lineTo(cx + 7 * s, by - 12.8 * s);
    ctx.lineTo(cx - 18 * s, by - 12.8 * s);
    ctx.lineTo(cx - 24 * s, by - 4.0 * s);
    ctx.closePath();
    ctx.fill();

    // Driver & Steering Wheel
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cx - 1 * s, by - 8.5 * s, 2.0 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx + 4 * s, by - 8 * s, 1 * s, 3.5 * s);

    // Glass glare
    ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.beginPath();
    ctx.moveTo(cx + 4 * s, by - 12.8 * s);
    ctx.lineTo(cx + 8 * s, by - 12.8 * s);
    ctx.lineTo(cx + 12 * s, by - 4.0 * s);
    ctx.lineTo(cx + 8 * s, by - 4.0 * s);
    ctx.closePath();
    ctx.fill();

    // B-Pillar
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx - 3 * s, by - 13.2 * s, 2 * s, 9.2 * s);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx - 2.5 * s, by - 13.0 * s, 1 * s, 9.0 * s);

    // Door handles
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cx + 2 * s, by - 1.8 * s, 3.5 * s, 0.8 * s);
    ctx.fillRect(cx - 13 * s, by - 1.8 * s, 3.5 * s, 0.8 * s);

    // Front Projectors & Rear Taillights
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx + 40 * s, by - 2.2 * s, 2.8 * s, 2.0 * s);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx + 41 * s, by - 2.0 * s, 1.5 * s, 1.2 * s);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(cx - 41.5 * s, by - 3.2 * s, 2.5 * s, 2.2 * s);

    // Dual Chrome Exhaust
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx - 42.5 * s, by + 3.2 * s, 2.2 * s, 1.4 * s);

  } else if (bodyType === 'picape') {
    // =========================================================================
    // REAL HEAVY-DUTY PICKUP TRUCK (C10 / F-100 / HILUX 4X4)
    // =========================================================================
    // 1. Tubular Rock Slider / Running Board
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx - 14 * s, by + 4.8 * s, 29 * s, 1.8 * s);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(cx - 13 * s, by + 4.8 * s, 27 * s, 0.9 * s);

    // 2. High Muscular Truck Body
    ctx.fillStyle = pal.base;
    ctx.beginPath();
    ctx.moveTo(cx - 41 * s, by + 4.8 * s);
    ctx.lineTo(cx - 41 * s, by - 1.2 * s); // Tailgate
    ctx.lineTo(cx - 39 * s, by - 4.2 * s); // Open Bed Rail
    ctx.lineTo(cx - 12 * s, by - 4.2 * s); // Back of Cab
    ctx.lineTo(cx - 11 * s, by - 16.0 * s); // High Cab Roof
    ctx.lineTo(cx + 7 * s, by - 16.0 * s);
    ctx.lineTo(cx + 17 * s, by - 6.5 * s); // Windshield
    ctx.lineTo(cx + 42 * s, by - 6.0 * s); // High Flat Hood
    ctx.lineTo(cx + 43 * s, by + 1.0 * s); // Blunt Tall Grille
    ctx.lineTo(cx + 42 * s, by + 5.0 * s);
    ctx.closePath();
    ctx.fill();

    // Directional shading
    ctx.fillStyle = pal.dark;
    ctx.fillRect(cx - 40 * s, by + 1.2 * s, 81 * s, 2.2 * s);
    ctx.fillStyle = pal.light;
    ctx.fillRect(cx - 40 * s, by - 2.8 * s, 80 * s, 1.2 * s);

    // Highlights
    ctx.fillStyle = pal.hi;
    ctx.fillRect(cx - 10 * s, by - 16.8 * s, 16 * s, 1.2 * s); // cab
    ctx.fillRect(cx + 18 * s, by - 7.0 * s, 23 * s, 1.0 * s); // hood
    ctx.fillRect(cx - 39 * s, by - 4.8 * s, 26 * s, 0.9 * s); // bed rail

    // Upright Cab Window
    ctx.fillStyle = '#0a0f1d';
    ctx.beginPath();
    ctx.moveTo(cx + 14 * s, by - 5.5 * s);
    ctx.lineTo(cx + 6 * s, by - 14.8 * s);
    ctx.lineTo(cx - 10 * s, by - 14.8 * s);
    ctx.lineTo(cx - 10 * s, by - 5.5 * s);
    ctx.closePath();
    ctx.fill();

    // Driver in High Truck Seat
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cx - 2 * s, by - 10 * s, 2.4 * s, 0, Math.PI * 2);
    ctx.fill();

    // Glare
    ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.beginPath();
    ctx.moveTo(cx + 3 * s, by - 14.8 * s);
    ctx.lineTo(cx + 7 * s, by - 14.8 * s);
    ctx.lineTo(cx + 11 * s, by - 5.5 * s);
    ctx.lineTo(cx + 7 * s, by - 5.5 * s);
    ctx.closePath();
    ctx.fill();

    // Open Bed Interior (Bedliner texture)
    ctx.fillStyle = '#18181b';
    ctx.fillRect(cx - 37 * s, by - 3.5 * s, 24 * s, 4.2 * s);
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx - 37 * s, by - 3.5 * s, 24 * s, 1.2 * s);

    // Tubular Sport Roll Bar
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(cx - 14 * s, by - 14 * s, 2.2 * s, 11 * s);
    ctx.fillRect(cx - 14 * s, by - 14 * s, 10 * s, 2.0 * s);
    ctx.beginPath();
    ctx.moveTo(cx - 5 * s, by - 12 * s);
    ctx.lineTo(cx - 24 * s, by - 3.5 * s);
    ctx.lineTo(cx - 22 * s, by - 3.5 * s);
    ctx.lineTo(cx - 4 * s, by - 12 * s);
    ctx.closePath();
    ctx.fill();

    // Bold Stacked Headlights & Chrome Grille
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx + 41 * s, by - 5.2 * s, 2.2 * s, 2.2 * s);
    ctx.fillRect(cx + 41 * s, by - 2.4 * s, 2.2 * s, 2.2 * s);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(cx + 41.5 * s, by - 4.8 * s, 1.2 * s, 1.2 * s);

    // Chrome Grille Bars
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cx + 42.5 * s, by - 5.5 * s, 1.2 * s, 1.0 * s);
    ctx.fillRect(cx + 42.5 * s, by - 3.0 * s, 1.2 * s, 1.0 * s);
    ctx.fillRect(cx + 42.5 * s, by - 0.5 * s, 1.2 * s, 1.0 * s);

    // Vertical Taillight
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(cx - 41.0 * s, by - 3.5 * s, 2.2 * s, 4.5 * s);

  } else if (bodyType === 'sports' || bodyType === 'esportivo') {
    // =========================================================================
    // REAL COUPÉ ESPORTIVO APEX (AERODYNAMIC SUPER WEDGE)
    // =========================================================================
    // Carbon Splitter & Diffuser
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx + 34 * s, by + 3.0 * s, 10 * s, 1.5 * s);
    ctx.fillRect(cx - 42 * s, by + 2.5 * s, 8 * s, 2.0 * s);

    // Ultra-Low Wedge Body
    ctx.fillStyle = pal.base;
    ctx.beginPath();
    ctx.moveTo(cx - 41 * s, by + 3.0 * s);
    ctx.lineTo(cx - 41 * s, by - 3.5 * s);
    ctx.lineTo(cx - 32 * s, by - 4.5 * s);
    ctx.lineTo(cx - 12 * s, by - 12.0 * s);
    ctx.lineTo(cx + 4 * s, by - 12.5 * s);
    ctx.lineTo(cx + 17 * s, by - 3.8 * s);
    ctx.lineTo(cx + 38 * s, by - 2.5 * s);
    ctx.lineTo(cx + 44 * s, by + 1.2 * s);
    ctx.lineTo(cx + 43 * s, by + 3.0 * s);
    ctx.closePath();
    ctx.fill();

    // Shading & Highlights
    ctx.fillStyle = pal.dark;
    ctx.fillRect(cx - 40 * s, by + 1.0 * s, 80 * s, 1.8 * s);
    ctx.fillStyle = pal.hi;
    ctx.fillRect(cx - 10 * s, by - 13.0 * s, 14 * s, 1.2 * s); // roof
    ctx.fillRect(cx + 18 * s, by - 4.0 * s, 20 * s, 1.0 * s); // hood
    ctx.fillRect(cx - 41 * s, by - 4.0 * s, 10 * s, 0.9 * s); // rear deck

    // Canopy
    ctx.fillStyle = '#060a14';
    ctx.beginPath();
    ctx.moveTo(cx + 13 * s, by - 3.2 * s);
    ctx.lineTo(cx + 4 * s, by - 11.5 * s);
    ctx.lineTo(cx - 18 * s, by - 11.0 * s);
    ctx.lineTo(cx - 28 * s, by - 3.8 * s);
    ctx.closePath();
    ctx.fill();

    // Glare
    ctx.fillStyle = 'rgba(6, 182, 212, 0.55)';
    ctx.beginPath();
    ctx.moveTo(cx + 2 * s, by - 11.5 * s);
    ctx.lineTo(cx + 7 * s, by - 11.5 * s);
    ctx.lineTo(cx + 11 * s, by - 3.5 * s);
    ctx.lineTo(cx + 7 * s, by - 3.5 * s);
    ctx.closePath();
    ctx.fill();

    // Slim LED Lights
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx + 38 * s, by - 2.0 * s, 3.5 * s, 1.2 * s);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(cx - 42.5 * s, by - 2.8 * s, 2.5 * s, 1.6 * s);

  } else if (bodyType === 'truck') {
    // =========================================================================
    // REAL COMMERCIAL HEAVY TRUCK (SEMI / BIG RIG CAB-OVER)
    // =========================================================================
    // 1. Heavy Lower Frame & Fuel Tank
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx - 42 * s, by + 4.5 * s, 84 * s, 3.0 * s);
    ctx.fillStyle = '#64748b'; // Fuel tank
    ctx.fillRect(cx - 28 * s, by + 1.5 * s, 18 * s, 5.0 * s);
    ctx.fillStyle = '#cbd5e1'; // Chrome tank straps
    ctx.fillRect(cx - 26 * s, by + 1.5 * s, 1.5 * s, 5.0 * s);
    ctx.fillRect(cx - 13 * s, by + 1.5 * s, 1.5 * s, 5.0 * s);

    // 2. Tall Cab & Hauler Body
    ctx.fillStyle = pal.base;
    ctx.beginPath();
    ctx.moveTo(cx - 41 * s, by + 4.5 * s);
    ctx.lineTo(cx - 41 * s, by - 18.0 * s); // Tall rear hauler sleeper
    ctx.lineTo(cx + 25 * s, by - 18.0 * s); // High roof
    ctx.lineTo(cx + 38 * s, by - 6.0 * s);  // Steep windshield
    ctx.lineTo(cx + 42 * s, by - 4.0 * s);  // Front nose
    ctx.lineTo(cx + 43 * s, by + 4.5 * s);  // Heavy bumper
    ctx.closePath();
    ctx.fill();

    // Shading
    ctx.fillStyle = pal.dark;
    ctx.fillRect(cx - 40 * s, by + 0.5 * s, 82 * s, 3.5 * s);
    ctx.fillStyle = pal.hi;
    ctx.fillRect(cx - 40 * s, by - 18.8 * s, 64 * s, 1.5 * s); // Roof highlight

    // 3. Tall Windshield & Cab Window
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(cx + 10 * s, by - 16.0 * s, 26 * s, 9.0 * s);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx + 22 * s, by - 15.5 * s, 12 * s, 8.0 * s); // Windshield
    ctx.fillRect(cx + 12 * s, by - 15.5 * s, 8 * s, 8.0 * s);  // Side door glass

    // 4. Dual Tall Vertical Chrome Smokestacks
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx - 5 * s, by - 25.0 * s, 3.0 * s, 24.0 * s);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cx - 5 * s, by - 25.0 * s, 1.2 * s, 24.0 * s);

    // 5. Massive Front Chrome Grille & Headlights
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cx + 41 * s, by - 3.5 * s, 2.5 * s, 7.0 * s);
    ctx.fillStyle = '#09090b';
    for (let g = 0; g < 4; g++) {
      ctx.fillRect(cx + 41.2 * s, by - 2.5 * s + g * 1.6 * s, 2.0 * s, 0.6 * s);
    }
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(cx + 39 * s, by + 1.0 * s, 2.5 * s, 2.0 * s);

  } else if (bodyType === 'suv') {
    // =========================================================================
    // REAL 4X4 ADVENTURE SUV (2-BOX EXTENDED GREENHOUSE)
    // =========================================================================
    // 1. Lower Protective Rocker Trim
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx - 40 * s, by + 4.0 * s, 81 * s, 2.2 * s);

    // 2. Solid 2-Box SUV Body
    ctx.fillStyle = pal.base;
    ctx.beginPath();
    ctx.moveTo(cx - 40 * s, by + 4.0 * s);
    ctx.lineTo(cx - 40 * s, by - 14.5 * s); // Vertical rear hatch
    ctx.lineTo(cx + 10 * s, by - 15.0 * s); // High straight roof
    ctx.lineTo(cx + 22 * s, by - 4.5 * s);  // Raked windshield
    ctx.lineTo(cx + 41 * s, by - 3.5 * s);  // High solid hood
    ctx.lineTo(cx + 42 * s, by + 4.0 * s);  // Front bumper
    ctx.closePath();
    ctx.fill();

    // Shading
    ctx.fillStyle = pal.dark;
    ctx.fillRect(cx - 39 * s, by + 1.0 * s, 79 * s, 2.2 * s);
    ctx.fillStyle = pal.hi;
    ctx.fillRect(cx - 38 * s, by - 15.8 * s, 46 * s, 1.4 * s); // Roof
    ctx.fillRect(cx + 23 * s, by - 4.5 * s, 18 * s, 1.0 * s);  // Hood

    // 3. 3-Window Side Greenhouse
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(cx - 36 * s, by - 13.5 * s, 54 * s, 8.0 * s);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx + 10 * s, by - 13.0 * s, 7 * s, 7.0 * s);  // Front door
    ctx.fillRect(cx - 4 * s, by - 13.0 * s, 12 * s, 7.0 * s);  // Rear door
    ctx.fillRect(cx - 20 * s, by - 13.0 * s, 14 * s, 7.0 * s); // Cargo 3rd window
    ctx.fillRect(cx - 34 * s, by - 13.0 * s, 12 * s, 7.0 * s); // Rear quarter glass

    // 4. Tubular Aluminum Roof Rack Rails
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx - 36 * s, by - 17.5 * s, 42 * s, 1.5 * s); // Long rail
    ctx.fillRect(cx - 34 * s, by - 17.5 * s, 2.0 * s, 2.5 * s);
    ctx.fillRect(cx - 15 * s, by - 17.5 * s, 2.0 * s, 2.5 * s);
    ctx.fillRect(cx + 3 * s, by - 17.5 * s, 2.0 * s, 2.5 * s);

    // 5. LED Headlights & Taillights
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx + 40 * s, by - 2.5 * s, 2.5 * s, 2.2 * s);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(cx - 41 * s, by - 5.0 * s, 2.0 * s, 4.0 * s);

  } else if (bodyType === 'off_road') {
    // =========================================================================
    // REAL ROCK CRAWLER (LIFTED SUSPENSION, WINCH BULLBAR & SNORKEL)
    // =========================================================================
    // 1. Lifted Skid Plate & Heavy Chassis
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx - 38 * s, by + 3.5 * s, 76 * s, 4.0 * s);

    // 2. Off-Road Body
    ctx.fillStyle = pal.base;
    ctx.beginPath();
    ctx.moveTo(cx - 36 * s, by + 3.5 * s);
    ctx.lineTo(cx - 36 * s, by - 14.0 * s);
    ctx.lineTo(cx + 8 * s, by - 14.5 * s);
    ctx.lineTo(cx + 18 * s, by - 4.0 * s);
    ctx.lineTo(cx + 38 * s, by - 3.0 * s);
    ctx.lineTo(cx + 39 * s, by + 3.5 * s);
    ctx.closePath();
    ctx.fill();

    // 3. Cabin Windows
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(cx - 32 * s, by - 13.0 * s, 46 * s, 7.5 * s);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx + 6 * s, by - 12.5 * s, 9 * s, 6.5 * s);
    ctx.fillRect(cx - 10 * s, by - 12.5 * s, 14 * s, 6.5 * s);
    ctx.fillRect(cx - 28 * s, by - 12.5 * s, 16 * s, 6.5 * s);

    // 4. Heavy Tubular Bullbar with Electric Winch
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx + 38 * s, by - 2.0 * s, 6 * s, 8.0 * s);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(cx + 40 * s, by + 0.5 * s, 3.5 * s, 3.0 * s); // Winch spool

    // 5. A-Pillar Snorkel Tube
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx + 19 * s, by - 14.5 * s, 2.5 * s, 11.0 * s);
    ctx.fillRect(cx + 18 * s, by - 16.5 * s, 4.5 * s, 2.5 * s); // Top intake head

    // 6. 4 Yellow Rooftop Floodlights
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx + 6 * s, by - 18.0 * s, 14 * s, 2.5 * s);
    ctx.fillStyle = '#facc15';
    for (let fl = 0; fl < 4; fl++) {
      ctx.fillRect(cx + 7 * s + fl * 3.2 * s, by - 18.0 * s, 2.2 * s, 2.0 * s);
    }

    // 7. Full-Size Tailgate Spare Tire
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(cx - 40 * s, by - 4.0 * s, 6.5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(cx - 40 * s, by - 4.0 * s, 3.2 * s, 0, Math.PI * 2);
    ctx.fill();

  } else if (bodyType === 'coupe') {
    // =========================================================================
    // REAL FASTBACK GT COUPÉ (SWEEPING ROOFLINE & DUCKTAIL)
    // =========================================================================
    // Ground Sill
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx - 40 * s, by + 4.0 * s, 80 * s, 1.8 * s);

    // Fastback GT Body
    ctx.fillStyle = pal.base;
    ctx.beginPath();
    ctx.moveTo(cx - 41 * s, by + 4.0 * s);
    ctx.lineTo(cx - 41 * s, by - 4.0 * s); // Tail
    ctx.lineTo(cx - 36 * s, by - 5.5 * s); // Ducktail spoiler
    ctx.lineTo(cx - 16 * s, by - 12.0 * s); // Sweeping fastback roofline
    ctx.lineTo(cx + 3 * s, by - 12.0 * s);  // Low roof
    ctx.lineTo(cx + 16 * s, by - 3.8 * s);  // Slanted windshield
    ctx.lineTo(cx + 40 * s, by - 2.2 * s);  // Long hood
    ctx.lineTo(cx + 43 * s, by + 4.0 * s);
    ctx.closePath();
    ctx.fill();

    // Shading
    ctx.fillStyle = pal.dark;
    ctx.fillRect(cx - 40 * s, by + 1.2 * s, 80 * s, 2.0 * s);
    ctx.fillStyle = pal.hi;
    ctx.fillRect(cx - 12 * s, by - 12.8 * s, 14 * s, 1.2 * s); // Roof
    ctx.fillRect(cx + 18 * s, by - 3.2 * s, 22 * s, 1.0 * s);  // Hood

    // Frameless Coupe Windows
    ctx.fillStyle = '#0a0f1d';
    ctx.beginPath();
    ctx.moveTo(cx + 13 * s, by - 3.2 * s);
    ctx.lineTo(cx + 3 * s, by - 11.2 * s);
    ctx.lineTo(cx - 15 * s, by - 11.2 * s);
    ctx.lineTo(cx - 24 * s, by - 3.2 * s);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx - 2 * s, by - 10.5 * s, 12 * s, 6.5 * s);
    ctx.fillRect(cx - 18 * s, by - 10.5 * s, 14 * s, 6.5 * s);

    // Integrated Ducktail
    ctx.fillStyle = pal.hi;
    ctx.fillRect(cx - 40 * s, by - 6.0 * s, 5 * s, 1.5 * s);

  } else if (bodyType === 'van') {
    // =========================================================================
    // REAL MONOSPACE VAN / VW CAMPER BUS (TWO-TONE RETRO CURVED NOSE)
    // =========================================================================
    // Chassis & Step
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx - 39 * s, by + 4.2 * s, 78 * s, 2.2 * s);

    // Lower Primary Hull
    ctx.fillStyle = pal.base;
    ctx.beginPath();
    ctx.moveTo(cx - 39 * s, by + 4.2 * s);
    ctx.lineTo(cx - 39 * s, by - 4.0 * s);
    ctx.lineTo(cx + 39 * s, by - 4.0 * s);
    ctx.lineTo(cx + 39 * s, by + 4.2 * s);
    ctx.closePath();
    ctx.fill();

    // Upper Secondary Hull
    ctx.fillStyle = pal.sec;
    ctx.beginPath();
    ctx.moveTo(cx - 39 * s, by - 4.0 * s);
    ctx.lineTo(cx - 39 * s, by - 16.5 * s); // Flat tall rear
    ctx.lineTo(cx + 28 * s, by - 16.5 * s); // High roof
    ctx.lineTo(cx + 39 * s, by - 4.0 * s);  // Iconic curved nose
    ctx.closePath();
    ctx.fill();

    // Two-Tone Chrome Belt Trim
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx - 39 * s, by - 4.5 * s, 78 * s, 1.2 * s);

    // Row of Windows
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx + 22 * s, by - 15.0 * s, 13 * s, 9.0 * s); // Curved front windshield
    ctx.fillRect(cx + 8 * s, by - 15.0 * s, 11 * s, 9.0 * s);  // Driver cab
    ctx.fillRect(cx - 8 * s, by - 15.0 * s, 13 * s, 9.0 * s);  // Sliding side door
    ctx.fillRect(cx - 24 * s, by - 15.0 * s, 13 * s, 9.0 * s); // Passenger window
    ctx.fillRect(cx - 37 * s, by - 15.0 * s, 10 * s, 9.0 * s); // Rear corner window

    // Sliding Door Track
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx - 22 * s, by + 1.0 * s, 28 * s, 0.8 * s);

    // Classic Round Headlight & Front Chrome Bumper
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx + 37 * s, by + 2.0 * s, 4 * s, 2.5 * s); // Chrome bumper
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(cx + 37 * s, by - 1.0 * s, 2.4 * s, 0, Math.PI * 2);
    ctx.fill();

  } else {
    // =========================================================================
    // MAD MAX INTERCEPTOR / DERBY BATTERING TANK
    // =========================================================================
    // 1. Heavy Steel Rammer & Spikes
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(cx + 32 * s, by - 3.0 * s, 7 * s, 9.5 * s);
    ctx.fillStyle = '#cbd5e1';
    for (let sp = -2; sp <= 2; sp += 2) {
      ctx.beginPath();
      ctx.moveTo(cx + 39 * s, by + sp * s - 1 * s);
      ctx.lineTo(cx + 44 * s, by + sp * s);
      ctx.lineTo(cx + 39 * s, by + sp * s + 1 * s);
      ctx.closePath();
      ctx.fill();
    }

    // 2. Bolted Steel Hull with Rivets
    ctx.fillStyle = pal.base;
    ctx.fillRect(cx - 36 * s, by - 4.5 * s, 68 * s, 10.5 * s);
    ctx.fillStyle = '#78716c'; // steel armor plates
    ctx.fillRect(cx - 24 * s, by - 2.5 * s, 22 * s, 6.5 * s);
    ctx.fillRect(cx + 4 * s, by - 2.5 * s, 22 * s, 6.5 * s);
    // Silver Rivets
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(cx - 22 * s, by - 1.5 * s, 1.2 * s, 1.2 * s);
    ctx.fillRect(cx - 5 * s, by - 1.5 * s, 1.2 * s, 1.2 * s);
    ctx.fillRect(cx + 6 * s, by - 1.5 * s, 1.2 * s, 1.2 * s);
    ctx.fillRect(cx + 23 * s, by - 1.5 * s, 1.2 * s, 1.2 * s);

    // 3. Welded Window Rebar Grating
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx - 18 * s, by - 9.5 * s, 30 * s, 5.0 * s);
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(cx - 16 * s, by - 8.0 * s, 26 * s, 1.0 * s);
    ctx.fillRect(cx - 16 * s, by - 6.5 * s, 26 * s, 1.0 * s);

    // 4. Exposed Giant Twin-Supercharger Blower (Mad Max style)
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx + 16 * s, by - 8.5 * s, 9 * s, 5.5 * s);
    ctx.fillStyle = '#ef4444'; // twin red butterflies
    ctx.fillRect(cx + 22 * s, by - 8.0 * s, 2.5 * s, 4.2 * s);
    ctx.fillStyle = '#09090b'; // drive belt
    ctx.fillRect(cx + 15 * s, by - 7.0 * s, 2.0 * s, 3.5 * s);
  }

  // --- E. REAL SKINS & MOVIE LIVERIES (PIXEL-ACCURATE ON REAL PANELS) ---
  const isStripes = skinName.includes('listras') || skinName.includes('stripes') || equippedSkinId.includes('stripes') || skinName.includes('eleanor') || skinName.includes('bumblebee');
  const isTribal = skinName.includes('cyber') || skinName.includes('drift') || skinName.includes('supra') || skinName.includes('tribal') || equippedSkinId.includes('synth');
  const isHerbie = skinName.includes('53') || skinName.includes('herbie') || skinName.includes('vintage');
  const isGeneral = skinName.includes('01') || skinName.includes('general');
  const isPolice = skinName.includes('police') || skinName.includes('policial') || equippedSkinId.includes('police');
  const isMud = skinName.includes('lama') || skinName.includes('mud') || skinName.includes('safari') || equippedSkinId.includes('mud');
  const isRust = skinName.includes('ferrugem') || skinName.includes('rust') || skinName.includes('wasteland') || equippedSkinId.includes('rust');

  if (isStripes) {
    // -------------------------------------------------------------------------
    // DUAL LE MANS RACING STRIPES (1967 ELEANOR SHELBY GT500 / BUMBLEBEE CAMARO)
    // -------------------------------------------------------------------------
    const stripeCol = skinName.includes('bumblebee') ? '#000000' : '#ffffff';
    // Hood dual stripes
    ctx.fillStyle = stripeCol;
    ctx.fillRect(cx + 12 * s, by - 1.2 * s, 25 * s, 1.4 * s);
    // Roof dual stripes
    ctx.fillRect(cx - 12 * s, by - 10.6 * s, 20 * s, 1.2 * s);
    // Rear fastback/deck stripes
    ctx.fillRect(cx - 38 * s, by - 1.2 * s, 14 * s, 1.4 * s);
    // Lower Rocker Stripe with GT text
    ctx.fillRect(cx - 20 * s, by + 3.0 * s, 42 * s, 1.0 * s);

  } else if (isTribal) {
    // -------------------------------------------------------------------------
    // FAST & FURIOUS SUPRA GLADIATOR TRIBAL GRAPHICS
    // -------------------------------------------------------------------------
    ctx.fillStyle = '#84cc16'; // iconic lime green neon speed spears
    ctx.beginPath();
    ctx.moveTo(cx - 16 * s, by + 2.0 * s);
    ctx.lineTo(cx + 6 * s, by - 1.5 * s);
    ctx.lineTo(cx + 14 * s, by + 1.5 * s);
    ctx.lineTo(cx - 2 * s, by + 2.8 * s);
    ctx.closePath();
    ctx.fill();

    // Silver inner tribal spear
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx - 10 * s, by + 1.2 * s);
    ctx.lineTo(cx + 4 * s, by - 1.0 * s);
    ctx.lineTo(cx + 10 * s, by + 1.0 * s);
    ctx.closePath();
    ctx.fill();

  } else if (isHerbie) {
    // -------------------------------------------------------------------------
    // HERBIE #53 TRI-COLOR STRIPES & GUMBALL DOOR BADGE
    // -------------------------------------------------------------------------
    // Red / White / Blue center stripe
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(cx - 36 * s, by - 0.5 * s, 72 * s, 0.8 * s);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 36 * s, by + 0.3 * s, 72 * s, 0.8 * s);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(cx - 36 * s, by + 1.1 * s, 72 * s, 0.8 * s);

    // Circular #53 Door Gumball
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 2 * s, by + 0.5 * s, 4.2 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.8 * s;
    ctx.stroke();

    ctx.fillStyle = '#09090b';
    ctx.font = `bold ${Math.max(6, Math.floor(4.5 * s))}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('53', cx - 2 * s, by + 2.0 * s);

  } else if (isGeneral) {
    // -------------------------------------------------------------------------
    // DODGE CHARGER "GENERAL 01" DOOR NUMBERS
    // -------------------------------------------------------------------------
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 6 * s, by - 1.8 * s, 10 * s, 5.0 * s);
    ctx.fillStyle = '#09090b';
    ctx.font = `bold ${Math.max(6, Math.floor(4.5 * s))}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('01', cx - 1 * s, by + 2.2 * s);

  } else if (isPolice) {
    // -------------------------------------------------------------------------
    // POLICE INTERCEPTOR TWO-TONE BLACK & WHITE WITH ROOF STROBES
    // -------------------------------------------------------------------------
    ctx.fillStyle = '#ffffff'; // white door panels
    ctx.fillRect(cx - 10 * s, by - 2.5 * s, 18 * s, 6.5 * s);
    ctx.fillStyle = '#09090b';
    ctx.font = `bold ${Math.max(6, Math.floor(3.5 * s))}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('POLICE', cx - 1 * s, by + 1.5 * s);

    // Flashing Red & Blue Emergency Roof Lightbar
    const strobePhase = Math.floor(frame / 8) % 2;
    ctx.fillStyle = strobePhase === 0 ? '#ef4444' : '#3b82f6';
    ctx.fillRect(cx - 3 * s, by - 13.0 * s, 3.0 * s, 2.4 * s);
    ctx.fillStyle = strobePhase === 1 ? '#ef4444' : '#3b82f6';
    ctx.fillRect(cx + 0.5 * s, by - 13.0 * s, 3.0 * s, 2.4 * s);

  } else if (isMud) {
    // -------------------------------------------------------------------------
    // DAKAR SAFARI MUD & GRAVEL SPLATTER
    // -------------------------------------------------------------------------
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cx - 36 * s, by + 3.2 * s, 72 * s, 2.0 * s);
    ctx.fillRect(cx - 18 * s, by + 1.5 * s, 12 * s, 1.8 * s);
    ctx.fillRect(cx + 8 * s, by + 1.0 * s, 14 * s, 2.2 * s);

  } else if (isRust) {
    // -------------------------------------------------------------------------
    // WASTELAND OXIDIZED RUST PATCHES
    // -------------------------------------------------------------------------
    ctx.fillStyle = '#b45309';
    ctx.fillRect(cx - 28 * s, by - 1.5 * s, 8 * s, 3.5 * s);
    ctx.fillRect(cx + 14 * s, by + 0.5 * s, 10 * s, 2.8 * s);
  }

  // --- F. SPOILER & AERO WINGS ---
  const activeSpoiler = car.visuals.spoiler;
  if (activeSpoiler === 'gt_wing') {
    // Swan-Neck Carbon GT Wing
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx - 32 * s, by - 9.0 * s, 1.8 * s, 6.5 * s);
    ctx.fillRect(cx - 28 * s, by - 9.0 * s, 1.8 * s, 6.5 * s);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(cx - 37 * s, by - 11.2 * s, 15 * s, 2.5 * s);
    // Endplates
    ctx.fillStyle = pal.base;
    ctx.fillRect(cx - 37.5 * s, by - 13.0 * s, 2.2 * s, 5.0 * s);
  } else if (activeSpoiler === 'ducktail') {
    // Integrated Muscle Ducktail Spoiler
    ctx.fillStyle = pal.base;
    ctx.beginPath();
    ctx.moveTo(cx - 39 * s, by);
    ctx.lineTo(cx - 36 * s, by - 4.5 * s);
    ctx.lineTo(cx - 32 * s, by - 4.5 * s);
    ctx.lineTo(cx - 34 * s, by);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = pal.hi;
    ctx.fillRect(cx - 36 * s, by - 4.5 * s, 4 * s, 0.8 * s);
  } else if (activeSpoiler === 'small') {
    ctx.fillStyle = pal.sec;
    ctx.fillRect(cx - 36 * s, by - 3.8 * s, 7 * s, 1.8 * s);
  }
  // If activeSpoiler === 'none', no spoiler is drawn

  ctx.restore();

  // --- G. REAL AUTOMOTIVE WHEELS & BRAKE ASSEMBLIES ---
  const drawRealWheel = (wx: number, wy: number) => {
    // 1. Dark Inner Wheel Arch Well
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(wx, wy, wheelRadius + 1.2 * s, 0, Math.PI * 2);
    ctx.fill();

    // 2. Outer Tire Tread Rubber (Charcoal #18181b with 1px top tread reflection)
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(wx, wy, wheelRadius, 0, Math.PI * 2);
    ctx.fill();

    // Tire top tread highlight
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.arc(wx, wy, wheelRadius - 0.5 * s, Math.PI * 1.1, Math.PI * 1.9, false);
    ctx.stroke();

    // Classic Whitewall Tire Ring (for Classic or Steelies)
    if (bodyType === 'classic' || wheelStyle === 'steelies') {
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.6 * s;
      ctx.beginPath();
      ctx.arc(wx, wy, wheelRadius * 0.76, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. Steel Slotted Brake Rotor
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(wx, wy, wheelRadius * 0.68, 0, Math.PI * 2);
    ctx.fill();

    // Bright Red Brembo Racing Brake Caliper
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(wx - wheelRadius * 0.38, wy - wheelRadius * 0.32, wheelRadius * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // 4. Metallic Wheel Rim Barrel & Lip
    const rimCol = wheelStyle === 'mesh' ? '#eab308' : wheelStyle === 'spiked' ? '#ea580c' : '#cbd5e1';
    ctx.fillStyle = rimCol;
    ctx.beginPath();
    ctx.arc(wx, wy, wheelRadius * 0.54, 0, Math.PI * 2);
    ctx.fill();

    // 5. Authentic Rim Face Designs with rotation for ALL styles
    if (wheelStyle === 'spokes') {
      // 5-Spoke American Racing / Torque Thrust Concave Mags
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1.4 * s;
      for (let i = 0; i < 5; i++) {
        const a = wheelRot + (i * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + Math.cos(a) * wheelRadius * 0.52, wy + Math.sin(a) * wheelRadius * 0.52);
        ctx.stroke();
      }
    } else if (wheelStyle === 'mesh') {
      // BBS Cross-Spoke Mesh Pattern (rotating 8 spokes)
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 1.1 * s;
      for (let i = 0; i < 8; i++) {
        const a = wheelRot + (i * Math.PI * 2) / 8;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + Math.cos(a) * wheelRadius * 0.52, wy + Math.sin(a) * wheelRadius * 0.52);
        ctx.stroke();
      }
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(wx, wy, wheelRadius * 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (wheelStyle === 'steelies') {
      // Solid steelie face with rotating perimeter breath holes
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(wx, wy, wheelRadius * 0.48, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#09090b';
      for (let i = 0; i < 5; i++) {
        const a = wheelRot + (i * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.arc(wx + Math.cos(a) * wheelRadius * 0.32, wy + Math.sin(a) * wheelRadius * 0.32, 0.9 * s, 0, Math.PI * 2);
        ctx.fill();
      }
      // Chrome Baby-Moon center dome
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(wx, wy, wheelRadius * 0.22, 0, Math.PI * 2);
      ctx.fill();
    } else if (wheelStyle === 'spiked') {
      // Derby Spiked Cone Nut with 3 rotating sharp wedge spokes
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 1.5 * s;
      for (let i = 0; i < 3; i++) {
        const a = wheelRot + (i * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + Math.cos(a) * wheelRadius * 0.52, wy + Math.sin(a) * wheelRadius * 0.52);
        ctx.stroke();
      }
      // Center conical spike
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(wx - 2.5 * s, wy);
      ctx.lineTo(wx + 3.8 * s, wy);
      ctx.lineTo(wx, wy - 2.5 * s);
      ctx.closePath();
      ctx.fill();
    }

    // Center Chrome Wheel Lug
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(wx - 0.7 * s, wy - 0.7 * s, 1.4 * s, 1.4 * s);
  };

  // Rear Wheel Assembly
  drawRealWheel(rearWheelX, wheelCenterY);
  // Front Wheel Assembly
  drawRealWheel(frontWheelX, wheelCenterY);
}

// =============================================================================
// 2. MASTER FRONT VIEW (0°) - WIDE AGGRESSIVE REAL-CAR STANCE
// =============================================================================
export function drawFrontViewCar(
  ctx: CanvasRenderingContext2D,
  car: Car,
  cx: number,
  cy: number,
  s: number,
  frame: number = 0,
  animated: boolean = false
) {
  const pal = getCarPalette(car);
  const idleY = animated ? Math.sin(frame * 0.22) * 0.4 * s : 0;
  const groundY = cy + 10 * s;
  const by = cy + idleY;

  // Ground contact shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.ellipse(cx, groundY + 0.6 * s, 26 * s, 4.0 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Neon Underglow (Front View)
  if (car.visuals.hasNeon) {
    const neonCol = car.visuals.neonColor || '#38bdf8';
    ctx.save();
    ctx.shadowColor = neonCol;
    ctx.shadowBlur = 18 * s;
    ctx.fillStyle = neonCol;
    ctx.beginPath();
    ctx.ellipse(cx, groundY - 0.2 * s, 26 * s, 3.2 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx, groundY - 0.2 * s, 16 * s, 1.4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 1. Wide Front Tires with Camber
  ctx.fillStyle = '#18181b';
  ctx.fillRect(cx - 22 * s, by + 1.5 * s, 5.5 * s, 8.5 * s);
  ctx.fillRect(cx + 16.5 * s, by + 1.5 * s, 5.5 * s, 8.5 * s);

  // 2. Main Bumper & Hood Hull
  ctx.fillStyle = pal.base;
  ctx.beginPath();
  ctx.moveTo(cx - 21 * s, by + 8.0 * s);
  ctx.lineTo(cx - 21 * s, by + 2.0 * s);
  ctx.lineTo(cx - 17 * s, by - 3.5 * s); // hood edge
  ctx.lineTo(cx + 17 * s, by - 3.5 * s);
  ctx.lineTo(cx + 21 * s, by + 2.0 * s);
  ctx.lineTo(cx + 21 * s, by + 8.0 * s);
  ctx.closePath();
  ctx.fill();

  // Hood surface reflection
  ctx.fillStyle = pal.hi;
  ctx.fillRect(cx - 14 * s, by - 3.5 * s, 28 * s, 4.0 * s);

  // 3. Cabin & Curved Windshield
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.moveTo(cx - 16 * s, by - 3.5 * s);
  ctx.lineTo(cx - 12 * s, by - 11.0 * s);
  ctx.lineTo(cx + 12 * s, by - 11.0 * s);
  ctx.lineTo(cx + 16 * s, by - 3.5 * s);
  ctx.closePath();
  ctx.fill();

  // Windshield Glass
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.moveTo(cx - 14 * s, by - 4.0 * s);
  ctx.lineTo(cx - 10.5 * s, by - 10.2 * s);
  ctx.lineTo(cx + 10.5 * s, by - 10.2 * s);
  ctx.lineTo(cx + 14 * s, by - 4.0 * s);
  ctx.closePath();
  ctx.fill();

  // Glass glare
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(cx - 7 * s, by - 9.8 * s, 5.5 * s, 5.5 * s);

  // 4. Radiator Grille & Headlights
  ctx.fillStyle = '#09090b';
  ctx.fillRect(cx - 15 * s, by + 2.5 * s, 30 * s, 5.0 * s);

  // Headlight clusters
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(cx - 16 * s, by + 1.0 * s, 2.5 * s, 0, Math.PI * 2);
  ctx.arc(cx + 16 * s, by + 1.0 * s, 2.5 * s, 0, Math.PI * 2);
  ctx.fill();

  // High GT wing visible behind cabin from front view
  if (car.visuals.spoiler === 'gt_wing') {
    ctx.fillStyle = '#18181b';
    ctx.fillRect(cx - 19 * s, by - 14 * s, 38 * s, 2.2 * s);
    ctx.fillStyle = pal.base;
    ctx.fillRect(cx - 19.5 * s, by - 16 * s, 1.8 * s, 5.5 * s);
    ctx.fillRect(cx + 17.7 * s, by - 16 * s, 1.8 * s, 5.5 * s);
  }
}

// =============================================================================
// 3. MASTER REAR VIEW (180°) - MUSCULAR WIDEBODY & EXHAUST PIPES
// =============================================================================
export function drawRearViewCar(
  ctx: CanvasRenderingContext2D,
  car: Car,
  cx: number,
  cy: number,
  s: number,
  frame: number = 0,
  animated: boolean = false
) {
  const pal = getCarPalette(car);
  const idleY = animated ? Math.sin(frame * 0.22) * 0.4 * s : 0;
  const groundY = cy + 10 * s;
  const by = cy + idleY;

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.ellipse(cx, groundY + 0.6 * s, 26 * s, 4.0 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Neon Underglow (Rear View)
  if (car.visuals.hasNeon) {
    const neonCol = car.visuals.neonColor || '#38bdf8';
    ctx.save();
    ctx.shadowColor = neonCol;
    ctx.shadowBlur = 18 * s;
    ctx.fillStyle = neonCol;
    ctx.beginPath();
    ctx.ellipse(cx, groundY - 0.2 * s, 26 * s, 3.2 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx, groundY - 0.2 * s, 16 * s, 1.4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Fat Rear Tires
  ctx.fillStyle = '#18181b';
  ctx.fillRect(cx - 23 * s, by + 1.0 * s, 6.5 * s, 9.0 * s);
  ctx.fillRect(cx + 16.5 * s, by + 1.0 * s, 6.5 * s, 9.0 * s);

  // Main Rear Bumper & Hull
  ctx.fillStyle = pal.base;
  ctx.beginPath();
  ctx.moveTo(cx - 21 * s, by + 8.0 * s);
  ctx.lineTo(cx - 21 * s, by + 1.0 * s);
  ctx.lineTo(cx - 17 * s, by - 3.5 * s);
  ctx.lineTo(cx + 17 * s, by - 3.5 * s);
  ctx.lineTo(cx + 21 * s, by + 1.0 * s);
  ctx.lineTo(cx + 21 * s, by + 8.0 * s);
  ctx.closePath();
  ctx.fill();

  // Rear Blackout Panel
  ctx.fillStyle = '#09090b';
  ctx.fillRect(cx - 17 * s, by - 0.5 * s, 34 * s, 4.5 * s);

  // Brilliant Red Taillight Bar
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(cx - 16 * s, by + 0.2 * s, 10 * s, 2.2 * s);
  ctx.fillRect(cx + 6 * s, by + 0.2 * s, 10 * s, 2.2 * s);

  // License Plate
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(cx - 5 * s, by + 4.5 * s, 10 * s, 3.2 * s);

  // Dual Chrome Exhaust Cannons
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(cx - 14 * s, by + 7.5 * s, 3.5 * s, 2.5 * s);
  ctx.fillRect(cx + 10.5 * s, by + 7.5 * s, 3.5 * s, 2.5 * s);

  // Spoiler / Aero Wing on Rear View
  const rearSpoiler = car.visuals.spoiler;
  if (rearSpoiler === 'gt_wing') {
    // Twin uprights
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx - 14 * s, by - 12 * s, 1.8 * s, 9 * s);
    ctx.fillRect(cx + 12.2 * s, by - 12 * s, 1.8 * s, 9 * s);
    // Wide carbon blade
    ctx.fillStyle = '#18181b';
    ctx.fillRect(cx - 20 * s, by - 14 * s, 40 * s, 2.5 * s);
    // Endplates
    ctx.fillStyle = pal.base;
    ctx.fillRect(cx - 20.5 * s, by - 16 * s, 2 * s, 6 * s);
    ctx.fillRect(cx + 18.5 * s, by - 16 * s, 2 * s, 6 * s);
  } else if (rearSpoiler === 'ducktail') {
    ctx.fillStyle = pal.hi;
    ctx.fillRect(cx - 15 * s, by - 4.8 * s, 30 * s, 2.2 * s);
  } else if (rearSpoiler === 'small') {
    ctx.fillStyle = pal.sec;
    ctx.fillRect(cx - 12 * s, by - 4.2 * s, 24 * s, 1.5 * s);
  }
}

// =============================================================================
// 4. MASTER 3/4 ISOMETRIC PERSPECTIVE (REAL-WORLD 3D PROPORTIONS)
// =============================================================================
export function drawIsometricCityCar(
  ctx: CanvasRenderingContext2D,
  car: Car,
  cx: number,
  cy: number,
  s: number,
  frame: number = 0,
  showNitro: boolean = false,
  animated: boolean = false
) {
  renderIsometricChassis(
    ctx,
    car.visuals.bodyType,
    car.visuals.primaryColor,
    car.visuals.secondaryColor,
    cx,
    cy,
    s * 0.95,
    frame,
    animated,
    showNitro || car.visuals.hasNeon,
    car.visuals.neonColor
  );
}

// =============================================================================
// 5. MASTER TOP-DOWN VIEW (USED IN DRAFT & DERBY)
// =============================================================================
export function drawTopDownCar(
  ctx: CanvasRenderingContext2D,
  car: Car,
  cx: number,
  cy: number,
  s: number,
  frame: number = 0,
  showNitro: boolean = false
) {
  const pal = getCarPalette(car);

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 32 * s, 16 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4 Tires
  ctx.fillStyle = '#18181b';
  ctx.fillRect(cx - 24 * s, cy - 15 * s, 8 * s, 4.5 * s);
  ctx.fillRect(cx - 24 * s, cy + 10.5 * s, 8 * s, 4.5 * s);
  ctx.fillRect(cx + 16 * s, cy - 14.5 * s, 7 * s, 4.0 * s);
  ctx.fillRect(cx + 16 * s, cy + 10.5 * s, 7 * s, 4.0 * s);

  // Coke-Bottle Muscular Body
  ctx.fillStyle = pal.base;
  ctx.beginPath();
  ctx.moveTo(cx - 30 * s, cy - 11 * s);
  ctx.lineTo(cx - 16 * s, cy - 13 * s); // rear hip swell
  ctx.lineTo(cx, cy - 10 * s);          // waist
  ctx.lineTo(cx + 18 * s, cy - 12 * s);  // front fender
  ctx.lineTo(cx + 32 * s, cy);          // nose
  ctx.lineTo(cx + 18 * s, cy + 12 * s);
  ctx.lineTo(cx, cy + 10 * s);
  ctx.lineTo(cx - 16 * s, cy + 13 * s);
  ctx.lineTo(cx - 30 * s, cy + 11 * s);
  ctx.closePath();
  ctx.fill();

  // Roof & Windshields
  ctx.fillStyle = pal.hi;
  ctx.fillRect(cx - 28 * s, cy - 3 * s, 56 * s, 6 * s);
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(cx + 2 * s, cy - 8 * s, 10 * s, 16 * s); // windshield
  ctx.fillRect(cx - 16 * s, cy - 8 * s, 8 * s, 16 * s);  // rear window
  ctx.fillStyle = pal.base;
  ctx.fillRect(cx - 8 * s, cy - 9 * s, 10 * s, 18 * s);  // roof
}

// =============================================================================
// 6. MASTER 360-DEGREE TURNTABLE ENGINE (24 ANGLES, NO VERTICAL FLIPPING)
// =============================================================================
export function drawRotatedCar(
  ctx: CanvasRenderingContext2D,
  car: Car,
  cx: number,
  cy: number,
  scale: number,
  angleDeg: number,
  frame: number = 0,
  showNitro: boolean = false,
  animated: boolean = false
) {
  const deg = ((Math.round(angleDeg / 15) * 15) % 360 + 360) % 360;
  const isLeftHemisphere = deg > 180;
  const canonicalDeg = isLeftHemisphere ? 360 - deg : deg;

  ctx.save();
  if (isLeftHemisphere) {
    ctx.translate(cx, 0);
    ctx.scale(-1, 1);
    ctx.translate(-cx, 0);
  }

  if (canonicalDeg === 0) {
    drawFrontViewCar(ctx, car, cx, cy, scale, frame, animated);
  } else if (canonicalDeg <= 30) {
    drawFrontViewCar(ctx, car, cx - 2 * scale, cy, scale, frame, animated);
  } else if (canonicalDeg <= 60) {
    drawIsometricCityCar(ctx, car, cx, cy, scale, frame, showNitro, animated);
  } else if (canonicalDeg <= 105) {
    drawSideViewCar(ctx, car, cx, cy, scale, frame, showNitro, animated);
  } else if (canonicalDeg <= 150) {
    drawIsometricCityCar(ctx, car, cx, cy, scale, frame, showNitro, animated);
  } else if (canonicalDeg < 180) {
    drawRearViewCar(ctx, car, cx + 2 * scale, cy, scale, frame, animated);
  } else {
    drawRearViewCar(ctx, car, cx, cy, scale, frame, animated);
  }

  ctx.restore();
}

// =============================================================================
// 7. COMPREHENSIVE CUSTOM CHASSIS RENDERER (WHEELS, ACCESSORIES, MULTI-ANGLES)
// =============================================================================
export function drawCustomChassisCar(
  ctx: CanvasRenderingContext2D,
  car: Car,
  cx: number,
  cy: number,
  scale: number,
  viewMode: ViewAngle | 'rotation' | string = 'right',
  rotationAngle: number = 90,
  frame: number = 0,
  showNitro: boolean = false,
  animated: boolean = false,
  assetOverride?: CustomCarAsset
) {
  let asset: CustomCarAsset | null = assetOverride || null;
  if (!asset && car.visuals.customPixelData) {
    try {
      asset = JSON.parse(car.visuals.customPixelData);
    } catch {
      asset = null;
    }
  }

  if (!asset || !Array.isArray(asset.pixels) || !asset.width || !asset.height) {
    // Fallback to stock engine
    if (viewMode === 'front') {
      drawFrontViewCar(ctx, car, cx, cy, scale, frame, animated);
    } else if (viewMode === 'rear') {
      drawRearViewCar(ctx, car, cx, cy, scale, frame, animated);
    } else if (viewMode === 'top') {
      drawTopDownCar(ctx, car, cx, cy, scale, frame, showNitro);
    } else if (viewMode === 'rotation') {
      drawRotatedCar(ctx, car, cx, cy, scale, rotationAngle, frame, showNitro, animated);
    } else if (viewMode === 'left') {
      ctx.save();
      ctx.translate(cx, 0);
      ctx.scale(-1, 1);
      ctx.translate(-cx, 0);
      drawSideViewCar(ctx, car, cx, cy, scale, frame, showNitro, animated);
      ctx.restore();
    } else {
      drawSideViewCar(ctx, car, cx, cy, scale, frame, showNitro, animated);
    }
    return;
  }

  // Handle multi-angle routing
  const normAngle = viewMode === 'rotation' ? (((Math.round(rotationAngle / 45) * 45) % 360 + 360) % 360) : null;
  const effectiveAngle = normAngle !== null
    ? normAngle === 0 ? 'front' : normAngle === 90 ? 'right' : normAngle === 180 ? 'rear' : normAngle === 270 ? 'left' : 'right'
    : viewMode;

  if (effectiveAngle === 'front') {
    if (asset.pixelsFront && asset.pixelsFront.length > 0) {
      renderPixelGrid(ctx, asset.pixelsFront, 24, 24, cx, cy, scale, car, asset, false, frame, animated);
      return;
    }
    drawFrontViewCar(ctx, car, cx, cy, scale, frame, animated);
    return;
  }

  if (effectiveAngle === 'rear') {
    if (asset.pixelsRear && asset.pixelsRear.length > 0) {
      renderPixelGrid(ctx, asset.pixelsRear, 24, 24, cx, cy, scale, car, asset, false, frame, animated);
      return;
    }
    drawRearViewCar(ctx, car, cx, cy, scale, frame, animated);
    return;
  }

  if (effectiveAngle === 'top') {
    if (asset.pixelsTop && asset.pixelsTop.length > 0) {
      renderPixelGrid(ctx, asset.pixelsTop, 48, 24, cx, cy, scale, car, asset, false, frame, animated);
      return;
    }
    drawTopDownCar(ctx, car, cx, cy, scale, frame, showNitro);
    return;
  }

  // SIDE PROFILE: RIGHT (pointing right) OR LEFT (pointing left)
  const isLeftProfile = effectiveAngle === 'left';

  ctx.save();
  if (isLeftProfile) {
    ctx.translate(cx, 0);
    ctx.scale(-1, 1);
    ctx.translate(-cx, 0);
  }

  const pW = asset.width || 48;
  const pH = asset.height || 24;
  // Exact 1:1 scale with stock chassis (which are 78 units long)
  const pSize = scale * (78 / pW);
  const idleY = animated ? Math.sin(frame * 0.22) * 1.5 : 0;
  const startX = cx - (pW * pSize) / 2;

  // Extract accessory configuration with intelligent defaults
  const acc = asset.accessoryConfig || {
    wheels: {
      visible: true,
      rearX: 10,
      rearY: 17,
      frontX: 38,
      frontY: 17,
      radius: 3.5,
      layer: 'in_front',
      style: car.visuals.wheelStyle || 'spokes',
      spinning: animated
    },
    spoiler: {
      visible: car.visuals.spoiler !== 'none',
      x: 4,
      y: 8,
      scale: 1,
      layer: 'behind',
      style: car.visuals.spoiler || 'gt_wing'
    },
    nitro: {
      visible: showNitro,
      x: 1,
      y: 17,
      layer: 'behind'
    },
    headlights: {
      visible: true,
      x: 42,
      y: 14,
      beamVisible: false,
      layer: 'in_front'
    },
    neon: {
      visible: car.visuals.hasNeon,
      color: car.visuals.neonColor || '#38bdf8',
      y: 20
    }
  };

  const primaryCol = car.visuals.primaryColor || asset.primaryColor || '#3b82f6';
  const secondaryCol = car.visuals.secondaryColor || asset.secondaryColor || '#0f172a';

  // Wheel sizing matching authentic stock dimensions (5.6 * scale)
  const rawRadius = acc.wheels.radius || 3.5;
  const wheelR = rawRadius <= 4.2
    ? rawRadius * pSize
    : Math.min(5.8 * scale, rawRadius * (pSize / 3) * 2.2);

  // Exact ground alignment with stock cars (ground is cy + 10 * scale)
  const groundY = cy + 10 * scale;
  const targetWheelCenterY = groundY - wheelR + 0.4 * scale;
  const wheelGridY = acc.wheels.rearY !== undefined ? acc.wheels.rearY : 17;
  const startY = targetWheelCenterY - (wheelGridY + 0.5) * pSize + idleY;

  // If left profile, since the canvas context has ctx.scale(-1, 1),
  // asset.pixels (the right side) is automatically and perfectly mirrored horizontally.
  // If asset.pixelsLeft was manually edited and supplied, we un-mirror it so the ctx.scale(-1, 1)
  // displays it exactly in the left-facing direction with wheels and accessories perfectly aligned!
  const pixelsToDraw = (isLeftProfile && asset.pixelsLeft && asset.pixelsLeft.length > 0)
    ? mirrorGridHorizontally(asset.pixelsLeft, pW, pH)
    : asset.pixels;

  // Neon configuration: Player garage visual customization ALWAYS takes precedence!
  const hasNeonActive = car.visuals.hasNeon !== undefined ? car.visuals.hasNeon : (acc.neon?.visible ?? false);
  const neonCol = car.visuals.neonColor || acc.neon?.color || '#38bdf8';

  // 1. Contact Drop Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.ellipse(cx, groundY + 0.6 * scale, 39 * scale, 3.8 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dark undercarriage shadow directly between wheels
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.beginPath();
  ctx.ellipse(cx + 1 * scale, groundY - 0.2 * scale, 32 * scale, 2.0 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Neon Underglow
  if (hasNeonActive) {
    ctx.save();
    const neonY = groundY - 0.5 * scale;
    ctx.shadowColor = neonCol;
    ctx.shadowBlur = 18 * scale;
    ctx.fillStyle = neonCol;
    ctx.beginPath();
    ctx.ellipse(cx, neonY, 34 * scale, 3.2 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hot bright core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx, neonY, 22 * scale, 1.4 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Helper to draw single wheel
  const wheelRot = animated ? (frame * 0.35) % (Math.PI * 2) : 0;
  const drawWheel = (wx: number, wy: number, r: number, style: string) => {
    // 1. Dark Inner Arch Shadow
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(wx, wy, r + 1.2 * (pSize / 3), 0, Math.PI * 2);
    ctx.fill();

    // 2. Outer Rubber Tire
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(wx, wy, r, 0, Math.PI * 2);
    ctx.fill();

    // Tire tread edge
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = Math.max(1, 0.8 * (pSize / 3));
    ctx.beginPath();
    ctx.arc(wx, wy, r - 0.5 * (pSize / 3), Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    // Whitewall ring for steelies
    if (style === 'steelies') {
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = Math.max(1, 1.2 * (pSize / 3));
      ctx.beginPath();
      ctx.arc(wx, wy, r * 0.75, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. Steel Brake Rotor
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(wx, wy, r * 0.68, 0, Math.PI * 2);
    ctx.fill();

    // Red Brembo Brake Caliper
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(wx - r * 0.35, wy - r * 0.3, r * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // 4. Rim Barrel
    const rimCol = style === 'mesh' ? '#eab308' : style === 'spiked' ? '#ea580c' : '#cbd5e1';
    ctx.fillStyle = rimCol;
    ctx.beginPath();
    ctx.arc(wx, wy, r * 0.52, 0, Math.PI * 2);
    ctx.fill();

    // 5. Rim Face / Spokes (All styles animated with rotation)
    if (style === 'spokes') {
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = Math.max(1, 1.3 * (pSize / 3));
      for (let i = 0; i < 5; i++) {
        const a = wheelRot + (i * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + Math.cos(a) * r * 0.52, wy + Math.sin(a) * r * 0.52);
        ctx.stroke();
      }
    } else if (style === 'mesh') {
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = Math.max(1, 1.0 * (pSize / 3));
      for (let i = 0; i < 8; i++) {
        const a = wheelRot + (i * Math.PI * 2) / 8;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + Math.cos(a) * r * 0.52, wy + Math.sin(a) * r * 0.52);
        ctx.stroke();
      }
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(wx, wy, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
    } else if (style === 'steelies') {
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(wx, wy, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#09090b';
      for (let i = 0; i < 5; i++) {
        const a = wheelRot + (i * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.arc(wx + Math.cos(a) * r * 0.28, wy + Math.sin(a) * r * 0.28, Math.max(1, 0.7 * (pSize / 3)), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(wx, wy, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (style === 'spiked') {
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = Math.max(1, 1.3 * (pSize / 3));
      for (let i = 0; i < 3; i++) {
        const a = wheelRot + (i * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + Math.cos(a) * r * 0.52, wy + Math.sin(a) * r * 0.52);
        ctx.stroke();
      }
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(wx - 2 * (pSize / 3), wy);
      ctx.lineTo(wx + 3 * (pSize / 3), wy);
      ctx.lineTo(wx, wy - 2 * (pSize / 3));
      ctx.closePath();
      ctx.fill();
    }

    // Center Lug Nut
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(wx - 0.5 * (pSize / 3), wy - 0.5 * (pSize / 3), 1 * (pSize / 3), 1 * (pSize / 3));
  };

  // Helper to draw spoiler
  const effectiveSpoilerStyle = car.visuals.spoiler !== undefined
    ? car.visuals.spoiler
    : (acc.spoiler?.style || 'gt_wing');
  const isSpoilerVisible = effectiveSpoilerStyle !== 'none' && (acc.spoiler?.visible !== false);
  const effectiveWheelStyle = car.visuals.wheelStyle || acc.wheels?.style || 'spokes';

  const drawSpoiler = () => {
    const spX = startX + (acc.spoiler.x || 5) * pSize;
    const spY = startY + (acc.spoiler.y || 8) * pSize;
    const spScale = acc.spoiler.scale || 1;
    const spStyle = effectiveSpoilerStyle;

    if (spStyle === 'gt_wing') {
      // Carbon GT Wing
      ctx.fillStyle = '#09090b';
      ctx.fillRect(spX + 2 * pSize, spY, 2 * pSize * spScale, 6 * pSize * spScale);
      ctx.fillRect(spX + 6 * pSize, spY, 2 * pSize * spScale, 6 * pSize * spScale);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(spX - 2 * pSize, spY - 2 * pSize, 12 * pSize * spScale, 2.5 * pSize * spScale);
      ctx.fillStyle = primaryCol;
      ctx.fillRect(spX - 3 * pSize, spY - 4 * pSize, 2 * pSize * spScale, 5 * pSize * spScale);
    } else if (spStyle === 'ducktail') {
      ctx.fillStyle = primaryCol;
      ctx.beginPath();
      ctx.moveTo(spX, spY + 4 * pSize);
      ctx.lineTo(spX + 4 * pSize, spY);
      ctx.lineTo(spX + 8 * pSize, spY);
      ctx.lineTo(spX + 6 * pSize, spY + 4 * pSize);
      ctx.closePath();
      ctx.fill();
    } else if (spStyle === 'small') {
      // Small lip
      ctx.fillStyle = secondaryCol;
      ctx.fillRect(spX, spY, 7 * pSize * spScale, 2 * pSize * spScale);
    }
  };

  // Helper to draw animated nitro flame
  const drawNitro = () => {
    const nX = startX + (acc.nitro.x || 1) * pSize;
    const nY = startY + (acc.nitro.y || 17) * pSize;
    const flameLen = (8 + (frame % 4) * 4) * (pSize / 3);

    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(nX - flameLen, nY, flameLen, 2.5 * (pSize / 3));
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(nX - flameLen - 3, nY - 1, flameLen, 4.5 * (pSize / 3));
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(nX - flameLen - 6, nY - 1.5, 4, 5.5 * (pSize / 3));
  };

  // Wheel coordinates
  const rearWx = startX + (acc.wheels.rearX + 0.5) * pSize;
  const rearWy = startY + (acc.wheels.rearY + 0.5) * pSize;
  const frontWx = startX + (acc.wheels.frontX + 0.5) * pSize;
  const frontWy = startY + (acc.wheels.frontY + 0.5) * pSize;

  // --- BEHIND LAYERS ---
  if (acc.wheels.layer === 'behind' && acc.wheels.visible) {
    drawWheel(rearWx, rearWy, wheelR, effectiveWheelStyle);
    drawWheel(frontWx, frontWy, wheelR, effectiveWheelStyle);
  }
  if (acc.spoiler.layer === 'behind' && isSpoilerVisible) {
    drawSpoiler();
  }
  if (acc.nitro.layer === 'behind' && (showNitro || acc.nitro.visible)) {
    drawNitro();
  }

  // --- CHASSIS PIXELS WITH SMOOTH SHADING TOKENS ---
  for (let py = 0; py < pH; py++) {
    for (let px = 0; px < pW; px++) {
      let col = pixelsToDraw[py * pW + px];
      if (col && col !== 'transparent' && col !== '') {
        // Dynamic Cor Base replacement with smoothed highlights & creases!
        if (col === '__PRIMARY_BASE__' || col === asset.basePrimaryColorToken) {
          col = primaryCol;
        } else if (col === '__PRIMARY_HI__') {
          col = adjustBrightness(primaryCol, 38);
        } else if (col === '__PRIMARY_LIGHT__') {
          col = adjustBrightness(primaryCol, 18);
        } else if (col === '__PRIMARY_DARK__') {
          col = adjustBrightness(primaryCol, -22);
        } else if (col === '__PRIMARY_DEEP__') {
          col = adjustBrightness(primaryCol, -45);
        } else if (col === '__SECONDARY_BASE__' || col === asset.baseSecondaryColorToken) {
          col = secondaryCol;
        } else if (col === '__SECONDARY_HI__') {
          col = adjustBrightness(secondaryCol, 30);
        } else if (col === '__SECONDARY_DARK__') {
          col = adjustBrightness(secondaryCol, -25);
        }
        ctx.fillStyle = col;
        ctx.fillRect(startX + px * pSize, startY + py * pSize, pSize, pSize);
      }
    }
  }

  // --- IN FRONT LAYERS ---
  if (acc.wheels.layer === 'in_front' && acc.wheels.visible) {
    drawWheel(rearWx, rearWy, wheelR, effectiveWheelStyle);
    drawWheel(frontWx, frontWy, wheelR, effectiveWheelStyle);
  }
  if (acc.spoiler.layer === 'in_front' && isSpoilerVisible) {
    drawSpoiler();
  }
  if (acc.headlights.visible) {
    const hlX = startX + (acc.headlights.x || 42) * pSize;
    const hlY = startY + (acc.headlights.y || 14) * pSize;
    
    // Lens glow
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(hlX, hlY, 2 * pSize, 2 * pSize);

    // Luminous beam projection when lights are ON (acesos)
    if (acc.headlights.beamVisible) {
      ctx.save();
      const beamW = 55 * pSize;
      const beamGrad = ctx.createLinearGradient(hlX, hlY, hlX + beamW, hlY);
      beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
      beamGrad.addColorStop(0.35, 'rgba(254, 240, 138, 0.25)');
      beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(hlX + 2 * pSize, hlY);
      ctx.lineTo(hlX + beamW, hlY - 14 * pSize);
      ctx.lineTo(hlX + beamW, hlY + 16 * pSize);
      ctx.lineTo(hlX + 2 * pSize, hlY + 2 * pSize);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
  if (acc.nitro.layer === 'in_front' && (showNitro || acc.nitro.visible)) {
    drawNitro();
  }

  ctx.restore();
}

function renderPixelGrid(
  ctx: CanvasRenderingContext2D,
  grid: string[],
  gW: number,
  gH: number,
  cx: number,
  cy: number,
  scale: number,
  car: Car,
  asset: CustomCarAsset,
  showWheels: boolean,
  frame: number,
  animated: boolean
) {
  // Proportional sizing: front/rear (24w) scales to 60px base to account for internal pixel art margins, top (48w) matches 56px
  const multiplier = (gW === 24) ? (60 / 24) : (gW === 48) ? (56 / 48) : (74 / 48);
  const pSize = scale * multiplier;
  const idleY = animated ? Math.sin(frame * 0.22) * 1.5 : 0;
  const startX = cx - (gW * pSize) / 2;
  const startY = cy - (gH * pSize) / 2 + idleY;

  const primaryCol = car.visuals.primaryColor || asset.primaryColor || '#3b82f6';
  const secondaryCol = car.visuals.secondaryColor || asset.secondaryColor || '#0f172a';

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.ellipse(cx, startY + gH * pSize - 1, (gW * pSize) * 0.45, 4 * (pSize / 3), 0, 0, Math.PI * 2);
  ctx.fill();

  // Neon Underglow
  const hasNeonActive = car.visuals.hasNeon !== undefined ? car.visuals.hasNeon : (asset.accessoryConfig?.neon?.visible ?? false);
  const neonCol = car.visuals.neonColor || asset.accessoryConfig?.neon?.color || '#38bdf8';
  if (hasNeonActive) {
    ctx.save();
    const neonY = startY + gH * pSize - 1;
    ctx.shadowColor = neonCol;
    ctx.shadowBlur = 18 * (pSize / 3);
    ctx.fillStyle = neonCol;
    ctx.beginPath();
    ctx.ellipse(cx, neonY, (gW * pSize) * 0.45, 5 * (pSize / 3), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx, neonY, (gW * pSize) * 0.3, 1.8 * (pSize / 3), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (let py = 0; py < gH; py++) {
    for (let px = 0; px < gW; px++) {
      let col = grid[py * gW + px];
      if (col && col !== 'transparent' && col !== '') {
        if (col === '__PRIMARY_BASE__' || col === asset.basePrimaryColorToken) {
          col = primaryCol;
        } else if (col === '__PRIMARY_HI__') {
          col = adjustBrightness(primaryCol, 38);
        } else if (col === '__PRIMARY_LIGHT__') {
          col = adjustBrightness(primaryCol, 18);
        } else if (col === '__PRIMARY_DARK__') {
          col = adjustBrightness(primaryCol, -22);
        } else if (col === '__PRIMARY_DEEP__') {
          col = adjustBrightness(primaryCol, -45);
        } else if (col === '__SECONDARY_BASE__' || col === asset.baseSecondaryColorToken) {
          col = secondaryCol;
        } else if (col === '__SECONDARY_HI__') {
          col = adjustBrightness(secondaryCol, 30);
        } else if (col === '__SECONDARY_DARK__') {
          col = adjustBrightness(secondaryCol, -25);
        }
        ctx.fillStyle = col;
        ctx.fillRect(startX + px * pSize, startY + py * pSize, pSize, pSize);
      }
    }
  }
}
