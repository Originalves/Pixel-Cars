import React, { useEffect, useRef, useState } from 'react';
import { CarBodyType, CarVisuals, CustomCarAsset } from '../types';

export interface CarCanvasProps {
  bodyType?: CarBodyType | string;
  primaryColor?: string;
  secondaryColor?: string;
  neonColor?: string;
  accentColor?: string;
  hasNeon?: boolean;
  spoiler?: 'none' | 'small' | 'gt_wing' | 'ducktail';
  wheelStyle?: 'steelies' | 'spokes' | 'mesh' | 'spiked';
  visuals?: Partial<CarVisuals>;
  customAsset?: CustomCarAsset | null;
  customPixelData?: string;
  width?: number;
  height?: number;
  scale?: number;
  animated?: boolean;
  interactive?: boolean;
  showWheels?: boolean;
  showShadow?: boolean;
  showDetails?: boolean;
  selected?: boolean;
  mode?: 'silhouette' | 'isometric' | 'auto';
  className?: string;
  badgeLabel?: string;
  onClick?: () => void;
}

// Utility to parse hex color to rgb
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 59, g: 130, b: 246 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function shadeColor(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 + percent / 100;
  const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
  const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
  const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
  return `rgb(${newR}, ${newG}, ${newB})`;
}

/**
 * Robust HTML5 Canvas component that uses pure Canvas 2D API draw commands
 * (lineTo, bezierCurveTo, quadraticCurveTo, fill, arc, etc.)
 * to render high-fidelity, resolution-independent vehicle silhouettes.
 */
export const CarCanvas: React.FC<CarCanvasProps> = ({
  bodyType: rawBodyType,
  primaryColor: propPrimary,
  secondaryColor: propSecondary,
  neonColor: propNeon,
  accentColor: propAccent,
  hasNeon: propHasNeon,
  spoiler: propSpoiler,
  wheelStyle: propWheelStyle,
  visuals,
  customAsset,
  customPixelData: propPixelData,
  width = 240,
  height = 96,
  scale: customScale,
  animated = false,
  interactive = false,
  showWheels = true,
  showShadow = true,
  showDetails = true,
  selected = false,
  mode = 'silhouette',
  className = '',
  badgeLabel,
  onClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Merge direct props with visuals object
  const bodyType = (visuals?.bodyType || rawBodyType || 'sedan').toLowerCase();
  const primaryColor = visuals?.primaryColor || propPrimary || '#3b82f6';
  const secondaryColor = visuals?.secondaryColor || propSecondary || '#0f172a';
  const neonColor = visuals?.neonColor || propNeon || propAccent || '#06b6d4';
  const hasNeon = visuals?.hasNeon ?? propHasNeon ?? false;
  const spoiler = visuals?.spoiler || propSpoiler || 'none';
  const wheelStyle = visuals?.wheelStyle || propWheelStyle || 'spokes';
  const customData = customAsset ? JSON.stringify(customAsset) : (visuals?.customPixelData || propPixelData);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let isRunning = true;

    const render = () => {
      const now = Date.now();
      const elapsed = (now - startTimeRef.current) / 1000;
      const animActive = animated || (interactive && isHovered);
      const wheelAngle = animActive ? elapsed * 8 : 0;
      const idleSuspension = animActive ? Math.sin(elapsed * 4) * 0.8 : 0;

      ctx.clearRect(0, 0, width, height);

      // If custom player pixel or vector silhouette asset is equipped, render custom asset
      if (customData) {
        try {
          const parsed = typeof customData === 'string' ? JSON.parse(customData) : customData;
          if (parsed) {
            if (parsed.vectorPath && mode === 'silhouette') {
              renderCustomVectorSilhouette(
                ctx,
                parsed,
                width,
                height,
                customScale || 1,
                idleSuspension,
                wheelAngle,
                hasNeon,
                neonColor,
                wheelStyle
              );
              if (animActive && isRunning) {
                animFrameRef.current = requestAnimationFrame(render);
              }
              return;
            } else if (Array.isArray(parsed.pixels) && parsed.width && parsed.height) {
              renderCustomPixelSprite(
                ctx,
                parsed,
                width,
                height,
                customScale || 1,
                idleSuspension,
                primaryColor,
                secondaryColor,
                wheelStyle,
                wheelAngle,
                hasNeon,
                neonColor
              );
              if (animActive && isRunning) {
                animFrameRef.current = requestAnimationFrame(render);
              }
              return;
            } else if (parsed.vectorPath) {
              renderCustomVectorSilhouette(
                ctx,
                parsed,
                width,
                height,
                customScale || 1,
                idleSuspension,
                wheelAngle,
                hasNeon,
                neonColor,
                wheelStyle
              );
              if (animActive && isRunning) {
                animFrameRef.current = requestAnimationFrame(render);
              }
              return;
            }
          }
        } catch {
          // Fallback to vector silhouette
        }
      }

      // Base coordinate setup: normalized vector car coordinates
      // Bounding box: X from -95 to +95, Y from -38 to +16 (ground line at Y = 16)
      const baseScale = Math.min(width / 220, height / 85);
      const s = (customScale || 1) * baseScale;
      const cx = width / 2;
      const cy = height * 0.52 + idleSuspension;

      // 1. NEON UNDERGLOW (if enabled or selected)
      if ((hasNeon || selected) && showShadow) {
        ctx.save();
        ctx.translate(cx, cy);
        const glowRadius = 78 * s;
        const glowGrad = ctx.createRadialGradient(0, 15 * s, 10 * s, 0, 15 * s, glowRadius);
        const neonRgb = hexToRgb(neonColor);
        const intensity = animActive ? 0.65 + Math.sin(elapsed * 6) * 0.2 : 0.6;
        glowGrad.addColorStop(0, `rgba(${neonRgb.r}, ${neonRgb.g}, ${neonRgb.b}, ${intensity})`);
        glowGrad.addColorStop(0.5, `rgba(${neonRgb.r}, ${neonRgb.g}, ${neonRgb.b}, ${intensity * 0.4})`);
        glowGrad.addColorStop(1, `rgba(${neonRgb.r}, ${neonRgb.g}, ${neonRgb.b}, 0)`);

        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.ellipse(0, 15 * s, 85 * s, 14 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 2. CONTACT SHADOW
      if (showShadow) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.beginPath();
        ctx.ellipse(0, 14.5 * s, 76 * s, 7.5 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. MAIN VEHICLE SILHOUETTE
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(s, s);

      // Render specific silhouette using Canvas Path API
      drawChassisBody(ctx, bodyType, primaryColor, secondaryColor, neonColor, showDetails);

      // Render Aerodynamic Spoiler
      if (spoiler && spoiler !== 'none') {
        drawSpoiler(ctx, spoiler, secondaryColor, primaryColor);
      }

      // Render Wheels (Front & Rear)
      if (showWheels) {
        const wheelPositions = getWheelOffsets(bodyType);
        // Rear wheel
        drawWheel(ctx, wheelPositions.rearX, wheelPositions.y, wheelPositions.radius, wheelStyle, wheelAngle, neonColor, hasNeon);
        // Front wheel
        drawWheel(ctx, wheelPositions.frontX, wheelPositions.y, wheelPositions.radius, wheelStyle, wheelAngle, neonColor, hasNeon);
      }

      ctx.restore();

      if (animActive && isRunning) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [
    bodyType,
    primaryColor,
    secondaryColor,
    neonColor,
    hasNeon,
    spoiler,
    wheelStyle,
    customData,
    width,
    height,
    customScale,
    animated,
    interactive,
    isHovered,
    showWheels,
    showShadow,
    showDetails,
    selected,
    mode
  ]);

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}
      onClick={onClick}
    >
      <canvas
        ref={canvasRef}
        style={{ width, height }}
        className={`block ${interactive ? 'cursor-pointer' : ''}`}
        onMouseEnter={() => interactive && setIsHovered(true)}
        onMouseLeave={() => interactive && setIsHovered(false)}
      />
      {badgeLabel && (
        <span className="absolute bottom-1 right-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900/90 text-amber-400 border border-slate-700 pointer-events-none">
          {badgeLabel}
        </span>
      )}
    </div>
  );
};

// =============================================================================
// HIGH-FIDELITY VECTOR PATH ENGINES (HTML5 Canvas draw commands)
// Uses lineTo, bezierCurveTo, quadraticCurveTo, arc, fill, and stroke
// =============================================================================

function getWheelOffsets(bodyType: string): { rearX: number; frontX: number; y: number; radius: number } {
  switch (bodyType) {
    case 'truck':
      return { rearX: -48, frontX: 52, y: 11, radius: 11.5 };
    case 'off_road':
    case 'offroad':
      return { rearX: -46, frontX: 46, y: 11, radius: 13 };
    case 'suv':
    case 'suvs':
      return { rearX: -48, frontX: 48, y: 11.5, radius: 10.5 };
    case 'van':
    case 'vans':
      return { rearX: -46, frontX: 46, y: 12, radius: 9.5 };
    case 'pickup':
    case 'picape':
      return { rearX: -50, frontX: 48, y: 11, radius: 10.5 };
    case 'sports':
    case 'esportivo':
    case 'supercar':
      return { rearX: -48, frontX: 50, y: 12, radius: 9 };
    default:
      return { rearX: -46, frontX: 48, y: 12, radius: 9.5 };
  }
}

function drawChassisBody(
  ctx: CanvasRenderingContext2D,
  bodyType: string,
  primaryColor: string,
  secondaryColor: string,
  neonColor: string,
  showDetails: boolean
) {
  // Gradients for rich automotive depth
  const bodyGrad = ctx.createLinearGradient(0, -35, 0, 16);
  bodyGrad.addColorStop(0, shadeColor(primaryColor, 28));
  bodyGrad.addColorStop(0.35, primaryColor);
  bodyGrad.addColorStop(0.85, shadeColor(primaryColor, -25));
  bodyGrad.addColorStop(1, shadeColor(primaryColor, -45));

  const darkTrim = shadeColor(secondaryColor, -15);
  const hiTrim = shadeColor(secondaryColor, 30);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (bodyType) {
    // -------------------------------------------------------------------------
    // 1. SPORTS CAR / APEX GT (Aero wedge, cab-rearward, aggressive front splitter)
    // -------------------------------------------------------------------------
    case 'sports':
    case 'esportivo': {
      // Main Body Shell with bezier curves
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.moveTo(-82, 9); // Rear diffuser bottom
      ctx.lineTo(-84, 0); // Rear bumper lower
      ctx.bezierCurveTo(-86, -6, -83, -12, -74, -14); // Rear deck curve
      ctx.bezierCurveTo(-52, -15, -42, -17, -26, -26); // Rear window slope up
      ctx.bezierCurveTo(-14, -30, 8, -30, 20, -26); // Sleek roof curve
      ctx.bezierCurveTo(34, -20, 48, -11, 62, -8); // Windshield slope to hood
      ctx.bezierCurveTo(72, -6, 80, -3, 86, 2); // Hood nose tip
      ctx.lineTo(84, 9); // Front splitter tip
      ctx.lineTo(60, 9.5); // Front chin

      // Front wheel cutout
      ctx.bezierCurveTo(58, 2, 38, 2, 36, 9.5);
      ctx.lineTo(-34, 9.5); // Rocker side skirt

      // Rear wheel cutout
      ctx.bezierCurveTo(-36, 2, -56, 2, -58, 9.5);
      ctx.closePath();
      ctx.fill();

      // Lower Aero Splitter & Side Skirt (Secondary Color)
      ctx.fillStyle = darkTrim;
      ctx.beginPath();
      ctx.moveTo(-85, 9);
      ctx.lineTo(86, 9);
      ctx.lineTo(84, 12);
      ctx.lineTo(-83, 12);
      ctx.closePath();
      ctx.fill();

      if (showDetails) {
        // Cockpit Glass / Greenhouse
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.beginPath();
        ctx.moveTo(-22, -24);
        ctx.bezierCurveTo(-10, -28, 8, -28, 18, -24);
        ctx.bezierCurveTo(30, -18, 42, -10, 52, -8);
        ctx.lineTo(-12, -8);
        ctx.closePath();
        ctx.fill();

        // Glass reflection streak
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -26);
        ctx.lineTo(26, -11);
        ctx.stroke();

        // Sleek projector LED Headlight
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(82, 0);
        ctx.lineTo(72, -4);
        ctx.lineTo(76, 1);
        ctx.closePath();
        ctx.fill();

        // Thin Cyber Taillight
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-85, -6, 3, 5);
      }
      break;
    }

    // -------------------------------------------------------------------------
    // 2. MUSCLE V8 (Protruding supercharger, Coke-bottle rear hips, aggressive brow)
    // -------------------------------------------------------------------------
    case 'muscle': {
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.moveTo(-82, 9);
      ctx.lineTo(-84, -2);
      ctx.lineTo(-82, -12); // Tall rear spoiler lip
      ctx.bezierCurveTo(-65, -14, -50, -17, -35, -28); // Fastback slope
      ctx.lineTo(6, -28); // Roof
      ctx.bezierCurveTo(18, -28, 28, -20, 36, -11); // Windshield
      ctx.lineTo(78, -11); // Long muscle hood
      ctx.lineTo(82, -3); // Forward leaning shark nose
      ctx.lineTo(80, 9); // Front valance
      ctx.lineTo(60, 9.5);

      // Front wheel cutout
      ctx.bezierCurveTo(58, 2, 38, 2, 36, 9.5);
      ctx.lineTo(-34, 9.5);

      // Rear wheel cutout
      ctx.bezierCurveTo(-36, 1, -58, 1, -60, 9.5);
      ctx.closePath();
      ctx.fill();

      // Supercharger Blower protruding from hood
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(46, -18, 14, 7);
      // Dual Red Intake Butterflies
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(58, -14.5, 2.2, 0, Math.PI * 2);
      ctx.arc(53, -14.5, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Racing Stripes (Secondary Color)
      ctx.fillStyle = secondaryColor;
      ctx.beginPath();
      ctx.moveTo(37, -11);
      ctx.lineTo(78, -11);
      ctx.lineTo(80, -7);
      ctx.lineTo(37, -7);
      ctx.closePath();
      ctx.fill();

      if (showDetails) {
        // Dark Muscle Cabin Glass
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.beginPath();
        ctx.moveTo(-30, -25);
        ctx.lineTo(4, -25);
        ctx.bezierCurveTo(14, -25, 24, -18, 30, -11);
        ctx.lineTo(-12, -11);
        ctx.closePath();
        ctx.fill();

        // Round Quad Headlights
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(80, -2, 2.4, 0, Math.PI * 2);
        ctx.fill();

        // Tail lights
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-84, -6, 2.5, 6);
      }
      break;
    }

    // -------------------------------------------------------------------------
    // 3. HEAVY COMMERCIAL TRUCK (Cab-over semi, vertical chrome stacks, towering cab)
    // -------------------------------------------------------------------------
    case 'truck': {
      // Main cab & rear chassis frame
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.moveTo(-74, 10);
      ctx.lineTo(-74, -4); // Rear sleeper deck
      ctx.lineTo(-20, -4);
      ctx.lineTo(-20, -34); // Tall rear cab wall
      ctx.lineTo(36, -34); // Flat roof
      ctx.bezierCurveTo(44, -34, 48, -30, 50, -24); // Cab front visor
      ctx.lineTo(54, -4); // Vertical front grille
      ctx.lineTo(56, 8); // Heavy bumper
      ctx.lineTo(64, 8);
      ctx.lineTo(64, 11);
      ctx.lineTo(40, 11);

      // Front wheel cutout
      ctx.bezierCurveTo(38, 0, 16, 0, 14, 11);
      ctx.lineTo(-36, 11);

      // Rear heavy wheel cutout
      ctx.bezierCurveTo(-38, 0, -60, 0, -62, 11);
      ctx.closePath();
      ctx.fill();

      // Huge Chrome Front Grille
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(46, -10, 8, 16);
      ctx.fillStyle = '#475569';
      for (let y = -8; y <= 4; y += 3) {
        ctx.fillRect(47, y, 6, 1.2);
      }

      // Dual Chrome Vertical Exhaust Smokestacks
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-18, -42, 4, 38);
      ctx.fillRect(-13, -42, 4, 38);
      // Curved tips
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(-18, -42);
      ctx.lineTo(-24, -46);
      ctx.lineTo(-20, -46);
      ctx.lineTo(-14, -42);
      ctx.closePath();
      ctx.fill();

      if (showDetails) {
        // High Panoramic Windshield
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.moveTo(12, -31);
        ctx.lineTo(46, -31);
        ctx.lineTo(49, -15);
        ctx.lineTo(12, -15);
        ctx.closePath();
        ctx.fill();

        // Amber Cab Roof Marker Lights
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(20, -36, 3, 2);
        ctx.fillRect(28, -36, 3, 2);
        ctx.fillRect(36, -36, 3, 2);
        ctx.fillRect(44, -36, 3, 2);
      }
      break;
    }

    // -------------------------------------------------------------------------
    // 4. OFF-ROAD CRAWLER (Ultra-lifted, exposed suspension, bullbar, roof rack, snorkel)
    // -------------------------------------------------------------------------
    case 'off_road':
    case 'offroad': {
      // Rugged lifted body
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.moveTo(-65, 4);
      ctx.lineTo(-65, -16);
      ctx.lineTo(-18, -16);
      ctx.lineTo(-6, -30); // Upright windshield
      ctx.lineTo(28, -30); // Flat safari roof
      ctx.lineTo(34, -14); // Raked hood
      ctx.lineTo(60, -12); // Front blunt nose
      ctx.lineTo(62, 4); // High front rocker
      ctx.lineTo(46, 4);

      // Front suspension cutout
      ctx.bezierCurveTo(44, -4, 24, -4, 22, 4);
      ctx.lineTo(-30, 4);

      // Rear suspension cutout
      ctx.bezierCurveTo(-32, -4, -52, -4, -54, 4);
      ctx.closePath();
      ctx.fill();

      // Heavy Duty Front Tubular Bullbar & Winch
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(60, 8);
      ctx.lineTo(72, 4);
      ctx.lineTo(72, -8);
      ctx.stroke();

      // Winch spool in secondary color
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(63, 0, 7, 5);

      // Safari Roof Rack with 4 Fog Lights
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(-4, -34, 34, 3);
      // 4 High-power circular flood lamps
      ctx.fillStyle = '#fef08a';
      for (let x = 0; x <= 24; x += 8) {
        ctx.beginPath();
        ctx.arc(x, -33, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Snorkel along windshield
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(33, -12);
      ctx.lineTo(32, -31);
      ctx.lineTo(36, -33);
      ctx.stroke();

      // Spare wheel mounted on tailgate
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(-67, -6, 9, 0, Math.PI * 2);
      ctx.fill();

      if (showDetails) {
        // Cab windows
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.moveTo(-12, -27);
        ctx.lineTo(24, -27);
        ctx.lineTo(28, -14);
        ctx.lineTo(-12, -14);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    // -------------------------------------------------------------------------
    // 5. SUPERCAR (Hypercar Le Mans LMP/Cockpit bubble, aerodynamic active wing)
    // -------------------------------------------------------------------------
    case 'supercar': {
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.moveTo(-84, 8);
      ctx.lineTo(-86, 0);
      ctx.bezierCurveTo(-86, -8, -78, -14, -62, -14); // Low rear deck
      ctx.bezierCurveTo(-46, -14, -34, -22, -14, -28); // Sloping glass dome
      ctx.bezierCurveTo(4, -30, 22, -30, 34, -24);
      ctx.bezierCurveTo(46, -18, 62, -9, 78, -6); // Sloping hood
      ctx.lineTo(88, 2); // Ground-hugging nose
      ctx.lineTo(85, 9);
      ctx.lineTo(62, 9.5);

      // Front wheel cutout
      ctx.bezierCurveTo(60, 2, 40, 2, 38, 9.5);
      ctx.lineTo(-36, 9.5);

      // Rear wheel cutout
      ctx.bezierCurveTo(-38, 2, -58, 2, -60, 9.5);
      ctx.closePath();
      ctx.fill();

      // Carbon Fiber Side Air Intake
      ctx.fillStyle = darkTrim;
      ctx.beginPath();
      ctx.moveTo(-16, -6);
      ctx.lineTo(-30, -3);
      ctx.lineTo(-18, 4);
      ctx.closePath();
      ctx.fill();

      if (showDetails) {
        // Jet-Fighter Canopy Glass
        ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
        ctx.beginPath();
        ctx.moveTo(-12, -25);
        ctx.bezierCurveTo(4, -28, 20, -28, 30, -22);
        ctx.bezierCurveTo(40, -16, 52, -9, 60, -7);
        ctx.lineTo(-8, -7);
        ctx.closePath();
        ctx.fill();

        // Glass highlight arc
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(6, -26);
        ctx.bezierCurveTo(20, -26, 32, -20, 42, -12);
        ctx.stroke();

        // Slanted Xenon Laser Headlights
        ctx.fillStyle = '#67e8f9';
        ctx.beginPath();
        ctx.moveTo(84, 0);
        ctx.lineTo(74, -3);
        ctx.lineTo(76, 2);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    // -------------------------------------------------------------------------
    // 6. VAN / CAMPER (Iconic split-screen bus, rounded nose, 2-tone divide)
    // -------------------------------------------------------------------------
    case 'van':
    case 'vans': {
      // Lower Half
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.moveTo(-74, 9);
      ctx.lineTo(-76, -8);
      ctx.bezierCurveTo(-76, -14, -72, -18, -64, -20);
      ctx.lineTo(44, -20);
      ctx.bezierCurveTo(58, -18, 64, -12, 65, 0); // Iconic rounded nose
      ctx.lineTo(64, 9);
      ctx.lineTo(56, 9.5);

      // Front wheel cutout
      ctx.bezierCurveTo(54, 2, 34, 2, 32, 9.5);
      ctx.lineTo(-34, 9.5);

      // Rear wheel cutout
      ctx.bezierCurveTo(-36, 2, -56, 2, -58, 9.5);
      ctx.closePath();
      ctx.fill();

      // Upper Half / Two-Tone Roof (Secondary Color)
      ctx.fillStyle = secondaryColor;
      ctx.beginPath();
      ctx.moveTo(-68, -20);
      ctx.lineTo(-68, -32);
      ctx.lineTo(48, -32);
      ctx.bezierCurveTo(58, -30, 62, -26, 63, -20);
      ctx.lineTo(-68, -20);
      ctx.closePath();
      ctx.fill();

      // Chrome dividing beltline
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-76, -19);
      ctx.lineTo(64, -19);
      ctx.stroke();

      if (showDetails) {
        // Row of camper windows
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        // Windshield
        ctx.fillRect(40, -30, 20, 10);
        // Middle window
        ctx.fillRect(8, -30, 26, 10);
        // Rear window
        ctx.fillRect(-24, -30, 26, 10);
        // Quarter window
        ctx.fillRect(-56, -30, 26, 10);

        // Big round retro headlight
        ctx.fillStyle = '#fef9c3';
        ctx.beginPath();
        ctx.arc(62, -4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      break;
    }

    // -------------------------------------------------------------------------
    // 7. PICKUP TRUCK (Crew cab, open bed with rugged black liner, tubular roll bar)
    // -------------------------------------------------------------------------
    case 'pickup':
    case 'picape': {
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.moveTo(-78, 9);
      ctx.lineTo(-80, -8); // Tailgate
      ctx.lineTo(-16, -8); // Open bed rail
      ctx.lineTo(-16, -28); // Cab back
      ctx.lineTo(24, -28); // Cab roof
      ctx.bezierCurveTo(34, -28, 42, -20, 48, -10); // Windshield
      ctx.lineTo(76, -10); // Hood
      ctx.lineTo(78, -2);
      ctx.lineTo(76, 9);
      ctx.lineTo(58, 9.5);

      // Front wheel cutout
      ctx.bezierCurveTo(56, 1, 36, 1, 34, 9.5);
      ctx.lineTo(-38, 9.5);

      // Rear wheel cutout
      ctx.bezierCurveTo(-40, 1, -60, 1, -62, 9.5);
      ctx.closePath();
      ctx.fill();

      // Open Bed Liner (Matte Dark)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-76, -7, 58, 4);

      // Chrome Tubular Roll Bar (Santantônio)
      ctx.strokeStyle = hiTrim;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-14, -8);
      ctx.lineTo(-14, -31);
      ctx.lineTo(-4, -31);
      ctx.lineTo(8, -8);
      ctx.stroke();

      if (showDetails) {
        // Cab side glass
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.moveTo(-12, -25);
        ctx.lineTo(20, -25);
        ctx.bezierCurveTo(28, -25, 36, -18, 42, -10);
        ctx.lineTo(-12, -10);
        ctx.closePath();
        ctx.fill();

        // Front Headlamp
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(74, -7, 4, 6);
      }
      break;
    }

    // -------------------------------------------------------------------------
    // 8. SUV (2-box rugged wagon, raised clearance, roof rack, rear spoiler)
    // -------------------------------------------------------------------------
    case 'suv':
    case 'suvs': {
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.moveTo(-74, 9);
      ctx.lineTo(-76, -12);
      ctx.lineTo(-72, -27); // Tailgate
      ctx.lineTo(24, -27); // High flat roof
      ctx.bezierCurveTo(34, -27, 44, -18, 50, -10); // Windshield
      ctx.lineTo(76, -10); // Hood
      ctx.lineTo(78, -2);
      ctx.lineTo(76, 9);
      ctx.lineTo(58, 9.5);

      // Front wheel cutout
      ctx.bezierCurveTo(56, 1, 36, 1, 34, 9.5);
      ctx.lineTo(-36, 9.5);

      // Rear wheel cutout
      ctx.bezierCurveTo(-38, 1, -58, 1, -60, 9.5);
      ctx.closePath();
      ctx.fill();

      // Aluminum Tubular Roof Rack
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.strokeRect(-62, -31, 78, 3);
      // Crossbars
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-42, -31);
      ctx.lineTo(-42, -28);
      ctx.moveTo(-16, -31);
      ctx.lineTo(-16, -28);
      ctx.moveTo(10, -31);
      ctx.lineTo(10, -28);
      ctx.stroke();

      if (showDetails) {
        // Triple side windows
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(-64, -24, 22, 11);
        ctx.fillRect(-38, -24, 24, 11);
        ctx.beginPath();
        ctx.moveTo(-10, -24);
        ctx.lineTo(20, -24);
        ctx.bezierCurveTo(28, -24, 36, -17, 44, -10);
        ctx.lineTo(-10, -10);
        ctx.closePath();
        ctx.fill();

        // Front Headlights
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(74, -8, 4, 6);
      }
      break;
    }

    // -------------------------------------------------------------------------
    // 9. TUNER / JDM SPEC (Front intercooler exposed, carbon hood, aggressive aero)
    // -------------------------------------------------------------------------
    case 'tuner': {
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.moveTo(-80, 8);
      ctx.lineTo(-82, -2);
      ctx.lineTo(-78, -12); // Ducktail kick
      ctx.bezierCurveTo(-54, -14, -40, -18, -24, -27); // Fastback
      ctx.lineTo(16, -27); // Roof
      ctx.bezierCurveTo(28, -22, 42, -14, 54, -9); // Windshield
      ctx.lineTo(82, -8); // Carbon hood
      ctx.lineTo(84, 0); // Front bumper
      ctx.lineTo(82, 9);
      ctx.lineTo(60, 9.5);

      // Front wheel cutout
      ctx.bezierCurveTo(58, 2, 38, 2, 36, 9.5);
      ctx.lineTo(-34, 9.5);

      // Rear wheel cutout
      ctx.bezierCurveTo(-36, 2, -56, 2, -58, 9.5);
      ctx.closePath();
      ctx.fill();

      // Exposed Silver Intercooler Grille
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(72, 1, 10, 6);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 0.8;
      for (let x = 74; x < 81; x += 2) {
        ctx.beginPath();
        ctx.moveTo(x, 1);
        ctx.lineTo(x, 7);
        ctx.stroke();
      }

      // Carbon Fiber Hood & Splitter (Secondary Color)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(54, -9);
      ctx.lineTo(82, -8);
      ctx.lineTo(83, -4);
      ctx.lineTo(54, -5);
      ctx.closePath();
      ctx.fill();

      if (showDetails) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.beginPath();
        ctx.moveTo(-20, -24);
        ctx.lineTo(12, -24);
        ctx.bezierCurveTo(24, -20, 36, -13, 48, -9);
        ctx.lineTo(-12, -9);
        ctx.closePath();
        ctx.fill();

        // JDM Angular Headlight
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(82, -5);
        ctx.lineTo(74, -7);
        ctx.lineTo(76, -1);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    // -------------------------------------------------------------------------
    // 10. RALLY GR.B (Roof scoop, 4 front auxiliary yellow fog lights, mud flaps)
    // -------------------------------------------------------------------------
    case 'rally': {
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.moveTo(-74, 9);
      ctx.lineTo(-76, -10);
      ctx.lineTo(-68, -26); // Compact hot hatch back
      ctx.lineTo(18, -26); // Roof
      ctx.bezierCurveTo(28, -26, 38, -18, 46, -9); // Windshield
      ctx.lineTo(74, -9); // Short rally hood
      ctx.lineTo(76, 0);
      ctx.lineTo(74, 9);
      ctx.lineTo(58, 9.5);

      // Front wheel cutout
      ctx.bezierCurveTo(56, 1, 36, 1, 34, 9.5);
      ctx.lineTo(-36, 9.5);

      // Rear wheel cutout
      ctx.bezierCurveTo(-38, 1, -58, 1, -60, 9.5);
      ctx.closePath();
      ctx.fill();

      // Roof Air Scoop
      ctx.fillStyle = secondaryColor;
      ctx.beginPath();
      ctx.moveTo(2, -26);
      ctx.lineTo(14, -30);
      ctx.lineTo(18, -26);
      ctx.closePath();
      ctx.fill();

      // 4 Front Auxiliary Round Fog Lamps (Yellow Rally Pod)
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let y = -7; y <= 5; y += 4) {
        ctx.beginPath();
        ctx.arc(77, y, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Red Polyurethane Mud Flaps
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-62, 7, 3.5, 9);
      ctx.fillRect(32, 7, 3.5, 9);

      if (showDetails) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.moveTo(-48, -23);
        ctx.lineTo(14, -23);
        ctx.bezierCurveTo(24, -23, 32, -16, 40, -9);
        ctx.lineTo(-48, -9);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    // -------------------------------------------------------------------------
    // 11. DERBY TANK (Welded steel armor plates, window iron bars, ramming bumper)
    // -------------------------------------------------------------------------
    case 'derby_tank': {
      // Rugged angular scrap body
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(-76, 8);
      ctx.lineTo(-78, -12);
      ctx.lineTo(-24, -26);
      ctx.lineTo(20, -26);
      ctx.lineTo(44, -10);
      ctx.lineTo(76, -8);
      ctx.lineTo(78, 8);
      ctx.lineTo(58, 9);

      // Wheel arches
      ctx.bezierCurveTo(56, 2, 36, 2, 34, 9);
      ctx.lineTo(-36, 9);
      ctx.bezierCurveTo(-38, 2, -58, 2, -60, 9);
      ctx.closePath();
      ctx.fill();

      // Riveted secondary armor plating
      ctx.fillStyle = primaryColor;
      ctx.fillRect(-20, -8, 48, 12);
      // Silver Rivets
      ctx.fillStyle = '#cbd5e1';
      for (let x = -18; x <= 26; x += 8) {
        ctx.beginPath();
        ctx.arc(x, -6, 1.2, 0, Math.PI * 2);
        ctx.arc(x, 2, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Heavy Spiked Battering Ram
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(76, 2, 10, 8);
      ctx.beginPath();
      ctx.moveTo(86, 2);
      ctx.lineTo(94, 6);
      ctx.lineTo(86, 10);
      ctx.closePath();
      ctx.fill();

      // Window Protective Iron Grating
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.2;
      for (let x = -10; x <= 18; x += 6) {
        ctx.beginPath();
        ctx.moveTo(x, -23);
        ctx.lineTo(x + 12, -11);
        ctx.stroke();
      }
      break;
    }

    // -------------------------------------------------------------------------
    // 12. CLASSIC '34 HOT ROD (Waterfall chrome grille, exposed V8 engine, running boards)
    // -------------------------------------------------------------------------
    case 'classic': {
      ctx.fillStyle = bodyGrad;
      // Vintage chopped coupe cab
      ctx.beginPath();
      ctx.moveTo(-68, 9);
      ctx.lineTo(-72, -4);
      ctx.bezierCurveTo(-72, -14, -64, -22, -48, -26);
      ctx.lineTo(-10, -26);
      ctx.bezierCurveTo(-2, -26, 4, -20, 8, -12); // Upright chopped windshield
      ctx.lineTo(32, -10); // Engine bay cowl
      ctx.lineTo(34, 8);
      ctx.lineTo(-34, 8);

      // Rear teardrop fender
      ctx.bezierCurveTo(-36, 1, -56, 1, -58, 9);
      ctx.closePath();
      ctx.fill();

      // Waterfall Chrome Vertical Radiator Grille
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(70, -14);
      ctx.bezierCurveTo(74, -14, 76, -10, 76, -4);
      ctx.lineTo(76, 8);
      ctx.lineTo(66, 8);
      ctx.lineTo(66, -14);
      ctx.closePath();
      ctx.fill();

      // Exposed V8 Engine Block with Chrome Zoomie Exhausts
      ctx.fillStyle = '#475569';
      ctx.fillRect(36, -6, 24, 12);
      // Zoomies angled up
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2.2;
      for (let x = 40; x <= 56; x += 5) {
        ctx.beginPath();
        ctx.moveTo(x, 2);
        ctx.lineTo(x + 4, -8);
        ctx.stroke();
      }

      // Vintage Round Headlamp on stalk
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(68, -4, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (showDetails) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(-38, -22, 36, 9);
      }
      break;
    }

    // -------------------------------------------------------------------------
    // 13. COUPE / GRAN TURISMO (Long sweeping hood, low raked fastback roof)
    // -------------------------------------------------------------------------
    case 'coupe':
    case 'coupes': {
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.moveTo(-80, 8);
      ctx.lineTo(-82, -2);
      ctx.lineTo(-78, -12); // Ducktail sweep
      ctx.bezierCurveTo(-52, -14, -38, -22, -18, -26); // Fastback
      ctx.lineTo(14, -26); // Roof
      ctx.bezierCurveTo(28, -22, 42, -14, 52, -9); // Windshield
      ctx.lineTo(80, -9); // Long GT hood
      ctx.lineTo(84, 0);
      ctx.lineTo(82, 9);
      ctx.lineTo(60, 9.5);

      // Front wheel cutout
      ctx.bezierCurveTo(58, 2, 38, 2, 36, 9.5);
      ctx.lineTo(-34, 9.5);

      // Rear wheel cutout
      ctx.bezierCurveTo(-36, 2, -56, 2, -58, 9.5);
      ctx.closePath();
      ctx.fill();

      // Contrasting Roof Arch (Secondary Color)
      ctx.fillStyle = secondaryColor;
      ctx.beginPath();
      ctx.moveTo(-20, -26);
      ctx.lineTo(14, -26);
      ctx.bezierCurveTo(26, -23, 36, -17, 44, -12);
      ctx.lineTo(38, -12);
      ctx.bezierCurveTo(32, -16, 22, -22, 10, -23);
      ctx.lineTo(-16, -23);
      ctx.closePath();
      ctx.fill();

      if (showDetails) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.beginPath();
        ctx.moveTo(-16, -23);
        ctx.lineTo(10, -23);
        ctx.bezierCurveTo(22, -20, 32, -14, 42, -9);
        ctx.lineTo(-8, -9);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(80, -3);
        ctx.lineTo(72, -6);
        ctx.lineTo(74, 0);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    // -------------------------------------------------------------------------
    // 14. SEDAN (Executive 3-box proportion, smooth C-pillar, balanced stance)
    // -------------------------------------------------------------------------
    case 'sedan':
    default: {
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.moveTo(-78, 8);
      ctx.lineTo(-80, -2);
      ctx.lineTo(-76, -11); // Trunk deck
      ctx.bezierCurveTo(-60, -11, -48, -16, -34, -26); // C-pillar slope
      ctx.lineTo(14, -26); // Roof
      ctx.bezierCurveTo(26, -26, 36, -18, 44, -10); // A-pillar / Windshield
      ctx.lineTo(76, -10); // Hood
      ctx.lineTo(80, -1);
      ctx.lineTo(78, 8);
      ctx.lineTo(58, 9.5);

      // Front wheel cutout
      ctx.bezierCurveTo(56, 1, 36, 1, 34, 9.5);
      ctx.lineTo(-34, 9.5);

      // Rear wheel cutout
      ctx.bezierCurveTo(-36, 1, -56, 1, -58, 9.5);
      ctx.closePath();
      ctx.fill();

      // Lower trim strip (Secondary Color)
      ctx.fillStyle = darkTrim;
      ctx.fillRect(-34, 7.5, 68, 2);

      if (showDetails) {
        // Front & Rear Passenger Windows
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        // Front window
        ctx.beginPath();
        ctx.moveTo(-6, -23);
        ctx.lineTo(10, -23);
        ctx.bezierCurveTo(20, -23, 28, -16, 36, -10);
        ctx.lineTo(-6, -10);
        ctx.closePath();
        ctx.fill();

        // Rear window
        ctx.beginPath();
        ctx.moveTo(-30, -23);
        ctx.lineTo(-10, -23);
        ctx.lineTo(-10, -10);
        ctx.bezierCurveTo(-20, -10, -26, -16, -30, -23);
        ctx.closePath();
        ctx.fill();

        // Glass highlight reflection
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-4, -23);
        ctx.lineTo(16, -10);
        ctx.stroke();

        // Front Headlights
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(75, -8, 4, 6);

        // Rear Taillights
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-80, -8, 3, 6);
      }
      break;
    }
  }
}

// -----------------------------------------------------------------------------
// AERODYNAMIC SPOILERS (lineTo & bezierCurveTo)
// -----------------------------------------------------------------------------
function drawSpoiler(
  ctx: CanvasRenderingContext2D,
  spoiler: 'small' | 'gt_wing' | 'ducktail' | string,
  secondaryColor: string,
  primaryColor: string
) {
  ctx.save();
  switch (spoiler) {
    case 'ducktail': {
      // Integrated aerodynamic kick
      ctx.fillStyle = secondaryColor;
      ctx.beginPath();
      ctx.moveTo(-72, -14);
      ctx.bezierCurveTo(-78, -16, -82, -22, -84, -24);
      ctx.lineTo(-81, -24);
      ctx.bezierCurveTo(-78, -20, -74, -16, -68, -13);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'gt_wing': {
      // Carbon fiber tall GT wing on dual pylons
      ctx.fillStyle = '#0f172a';
      // Vertical aluminum pylons
      ctx.fillRect(-76, -26, 2.5, 14);
      ctx.fillRect(-62, -26, 2.5, 14);

      // Aerofoil blade with endplates
      ctx.fillStyle = secondaryColor;
      ctx.beginPath();
      ctx.moveTo(-84, -27);
      ctx.bezierCurveTo(-70, -29, -54, -29, -46, -27);
      ctx.lineTo(-46, -25);
      ctx.bezierCurveTo(-54, -27, -70, -27, -84, -25);
      ctx.closePath();
      ctx.fill();

      // Wing endplate
      ctx.fillStyle = primaryColor;
      ctx.fillRect(-85, -30, 2.5, 7);
      break;
    }
    case 'small':
    default: {
      // Sleek low-profile lip spoiler
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(-78, -18, 14, 3);
      ctx.fillRect(-76, -15, 2, 3);
      ctx.fillRect(-66, -15, 2, 3);
      break;
    }
  }
  ctx.restore();
}

// -----------------------------------------------------------------------------
// WHEEL ENGINE (Rubber tire, alloy rim, rotating spokes, glowing brake caliper)
// -----------------------------------------------------------------------------
function drawWheel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  wheelStyle: string,
  rotationAngle: number,
  neonColor: string,
  hasNeon: boolean
) {
  ctx.save();
  ctx.translate(x, y);

  // 1. Black Rubber Tire with Tread Depth
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 2. Inner Wheel Well Gap
  const rimRadius = radius * 0.68;
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(0, 0, rimRadius, 0, Math.PI * 2);
  ctx.fill();

  // 3. Brake Disc (Steel)
  const discRadius = rimRadius * 0.78;
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.arc(0, 0, discRadius, 0, Math.PI * 2);
  ctx.fill();

  // 4. Glowing Red or Neon Brake Caliper
  ctx.fillStyle = hasNeon ? neonColor : '#dc2626';
  ctx.beginPath();
  ctx.arc(0, 0, discRadius, -Math.PI * 0.4, -Math.PI * 0.05);
  ctx.lineTo(discRadius * 0.6 * Math.cos(-Math.PI * 0.05), discRadius * 0.6 * Math.sin(-Math.PI * 0.05));
  ctx.arc(0, 0, discRadius * 0.6, -Math.PI * 0.05, -Math.PI * 0.4, true);
  ctx.closePath();
  ctx.fill();

  // 5. Alloy Rim Face & Spokes (Rotates when animated)
  ctx.save();
  ctx.rotate(rotationAngle);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.6;

  switch (wheelStyle) {
    case 'spiked': {
      // 3 aggressive wedge spokes
      for (let i = 0; i < 3; i++) {
        const ang = (i * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * (rimRadius - 0.5), Math.sin(ang) * (rimRadius - 0.5));
        ctx.stroke();
      }
      break;
    }
    case 'mesh': {
      // BBS style cross-mesh
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI * 2) / 8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * (rimRadius - 0.5), Math.sin(ang) * (rimRadius - 0.5));
        ctx.stroke();
      }
      break;
    }
    case 'steelies': {
      // Solid steelies with outer circle holes
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(0, 0, rimRadius - 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      for (let i = 0; i < 5; i++) {
        const ang = (i * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * (rimRadius * 0.55), Math.sin(ang) * (rimRadius * 0.55), 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'spokes':
    default: {
      // 5-spoke racing star
      for (let i = 0; i < 5; i++) {
        const ang = (i * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * (rimRadius - 0.5), Math.sin(ang) * (rimRadius - 0.5));
        ctx.stroke();
      }
      break;
    }
  }

  // Center Wheel Hub Lug Nut
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

// -----------------------------------------------------------------------------
// PLAYER CUSTOM PIXEL SPRITE RENDERER
// -----------------------------------------------------------------------------
function renderCustomPixelSprite(
  ctx: CanvasRenderingContext2D,
  asset: { width: number; height: number; pixels: string[]; accessoryConfig?: any; basePrimaryColorToken?: string; baseSecondaryColorToken?: string },
  width: number,
  height: number,
  scale: number,
  idleY: number,
  primaryColor?: string,
  secondaryColor?: string,
  wheelStyle?: string,
  wheelAngle: number = 0,
  hasNeon: boolean = false,
  neonColor: string = '#38bdf8'
) {
  const { width: pW, height: pH, pixels } = asset;
  const pixelSize = Math.max(2, Math.floor(Math.min((width * 0.85) / pW, (height * 0.75) / pH) * scale));
  const startX = Math.floor((width - pW * pixelSize) / 2);
  const startY = Math.floor((height - pH * pixelSize) / 2 + idleY);

  const pri = primaryColor || '#3b82f6';
  const sec = secondaryColor || '#0f172a';
  const acc = asset.accessoryConfig;

  // Contact shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(width / 2, startY + pH * pixelSize + 4, (pW * pixelSize) / 2.2, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Neon Underglow
  if (hasNeon || acc?.neon?.visible) {
    ctx.save();
    const nY = startY + (acc?.neon?.y || 20) * pixelSize;
    const grad = ctx.createRadialGradient(width / 2, nY, 2, width / 2, nY, (pW * pixelSize) * 0.48);
    const nCol = acc?.neon?.color || neonColor;
    grad.addColorStop(0, nCol);
    grad.addColorStop(0.5, nCol + '66');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(width / 2, nY, (pW * pixelSize) * 0.46, 6 * (pixelSize / 2), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Draw Wheels Helper
  const drawCarWheel = (wx: number, wy: number, r: number) => {
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(wx, wy, r + 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(wx, wy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(wx, wy, r * 0.68, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(wx - r * 0.35, wy - r * 0.3, r * 0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(wx, wy, r * 0.52, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = Math.max(1, pixelSize * 0.4);
    for (let i = 0; i < 5; i++) {
      const a = wheelAngle + (i * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + Math.cos(a) * r * 0.52, wy + Math.sin(a) * r * 0.52);
      ctx.stroke();
    }
  };

  const rearWx = startX + ((acc?.wheels?.rearX ?? 13) + 0.5) * pixelSize;
  const rearWy = startY + ((acc?.wheels?.rearY ?? 17) + 0.5) * pixelSize;
  const frontWx = startX + ((acc?.wheels?.frontX ?? 33) + 0.5) * pixelSize;
  const frontWy = startY + ((acc?.wheels?.frontY ?? 17) + 0.5) * pixelSize;
  const wheelR = (acc?.wheels?.radius ?? 5) * pixelSize * 0.55;

  // Behind Wheels
  if (acc?.wheels?.layer === 'behind' && (acc?.wheels?.visible ?? true)) {
    drawCarWheel(rearWx, rearWy, wheelR);
    drawCarWheel(frontWx, frontWy, wheelR);
  }

  // Pixels
  for (let y = 0; y < pH; y++) {
    for (let x = 0; x < pW; x++) {
      let color = pixels[y * pW + x];
      if (color && color !== 'transparent' && color !== '') {
        if (color === '__PRIMARY_BASE__' || color === asset.basePrimaryColorToken) {
          color = pri;
        } else if (color === '__SECONDARY_BASE__' || color === asset.baseSecondaryColorToken) {
          color = sec;
        }
        ctx.fillStyle = color;
        ctx.fillRect(startX + x * pixelSize, startY + y * pixelSize, pixelSize, pixelSize);
      }
    }
  }

  // In-front Wheels
  if ((acc?.wheels?.layer ?? 'in_front') === 'in_front' && (acc?.wheels?.visible ?? true)) {
    drawCarWheel(rearWx, rearWy, wheelR);
    drawCarWheel(frontWx, frontWy, wheelR);
  }
}

// -----------------------------------------------------------------------------
// PLAYER CUSTOM VECTOR SILHOUETTE RENDERER
// -----------------------------------------------------------------------------
function renderCustomVectorSilhouette(
  ctx: CanvasRenderingContext2D,
  asset: {
    width?: number;
    height?: number;
    vectorPath: string;
    primaryColor?: string;
    secondaryColor?: string;
    neonColor?: string;
  },
  width: number,
  height: number,
  scale: number,
  idleY: number,
  wheelAngle: number,
  hasNeon: boolean,
  neonColor: string,
  wheelStyle: string
) {
  const pW = asset.width || 48;
  const pH = asset.height || 24;
  const cx = width / 2;
  const cy = height * 0.52 + idleY;

  // Contact shadow
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(0, 16, width * 0.38, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Neon underglow
  if (hasNeon) {
    ctx.save();
    ctx.translate(cx, cy);
    const glowGrad = ctx.createRadialGradient(0, 14, 5, 0, 14, width * 0.4);
    const neonRgb = hexToRgb(neonColor || asset.neonColor || '#06b6d4');
    glowGrad.addColorStop(0, `rgba(${neonRgb.r}, ${neonRgb.g}, ${neonRgb.b}, 0.8)`);
    glowGrad.addColorStop(0.5, `rgba(${neonRgb.r}, ${neonRgb.g}, ${neonRgb.b}, 0.25)`);
    glowGrad.addColorStop(1, `rgba(${neonRgb.r}, ${neonRgb.g}, ${neonRgb.b}, 0)`);
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.ellipse(0, 14, width * 0.42, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Render Vector Body via Path2D
  if (typeof Path2D !== 'undefined' && asset.vectorPath) {
    try {
      const path = new Path2D(asset.vectorPath);
      ctx.save();
      const fitScale = Math.min((width * 0.82) / pW, (height * 0.72) / pH) * scale;
      const offsetX = cx - (pW * fitScale) / 2;
      const offsetY = cy - (pH * fitScale) / 2 - 2;
      ctx.translate(offsetX, offsetY);
      ctx.scale(fitScale, fitScale);

      // Body Gradient fill
      const grad = ctx.createLinearGradient(0, 0, 0, pH);
      grad.addColorStop(0, shadeColor(asset.primaryColor || '#3b82f6', 25));
      grad.addColorStop(0.4, asset.primaryColor || '#3b82f6');
      grad.addColorStop(1, shadeColor(asset.primaryColor || '#3b82f6', -35));
      ctx.fillStyle = grad;
      ctx.fill(path);

      // Stroke outline
      ctx.strokeStyle = asset.secondaryColor || '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.stroke(path);

      ctx.restore();
    } catch {
      // ignore
    }
  }

  // Draw Wheels at proportional positions
  const rearWheelX = cx - width * 0.23;
  const frontWheelX = cx + width * 0.23;
  const wheelYPos = cy + 12;
  const rimRadius = 11 * scale;
  drawWheel(ctx, rearWheelX, wheelYPos, rimRadius, wheelStyle, wheelAngle, neonColor, hasNeon);
  drawWheel(ctx, frontWheelX, wheelYPos, rimRadius, wheelStyle, wheelAngle, neonColor, hasNeon);
}

export default CarCanvas;
