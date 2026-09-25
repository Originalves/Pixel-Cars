import React, { useEffect, useRef } from 'react';
import { PartCategory } from '../types';

interface PixelPartCanvasProps {
  category: PartCategory;
  tier?: 'common' | 'rare' | 'epic' | 'legendary';
  width?: number;
  height?: number;
  className?: string;
}

export const PixelPartCanvas: React.FC<PixelPartCanvasProps> = ({
  category,
  tier = 'common',
  width = 48,
  height = 48,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);

    const s = Math.min(width / 32, height / 32);
    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);

    // Tier glow/accent
    const tierAccent =
      tier === 'legendary' ? '#f59e0b' :
      tier === 'epic' ? '#a855f7' :
      tier === 'rare' ? '#38bdf8' : '#94a3b8';

    // Subtle dark backdrop vignette
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fillRect(s, s, width - 2 * s, height - 2 * s);

    // Render individual pixel mechanical part based on category
    switch (category) {
      case 'engine': {
        // V8 Engine Block with Intake Manifold & Belt
        // Block
        ctx.fillStyle = '#334155';
        ctx.fillRect(cx - 10 * s, cy - 4 * s, 20 * s, 11 * s);
        // Cylinder head covers (Red anodized or chrome)
        ctx.fillStyle = tier === 'legendary' ? '#ef4444' : '#64748b';
        ctx.fillRect(cx - 11 * s, cy - 7 * s, 9 * s, 3 * s);
        ctx.fillRect(cx + 2 * s, cy - 7 * s, 9 * s, 3 * s);
        // Intake runner manifold
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(cx - 4 * s, cy - 10 * s, 8 * s, 5 * s);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx - 3 * s, cy - 11 * s, 6 * s, 2 * s);
        // Crank pulley & belt
        ctx.fillStyle = '#09090b';
        ctx.fillRect(cx - 8 * s, cy + 2 * s, 16 * s, 4 * s);
        ctx.fillStyle = tierAccent;
        ctx.fillRect(cx - 2 * s, cy + 1 * s, 4 * s, 4 * s);
        // Exhaust header runners
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(cx - 12 * s, cy - 2 * s, 2 * s, 6 * s);
        ctx.fillRect(cx + 10 * s, cy - 2 * s, 2 * s, 6 * s);
        break;
      }

      case 'turbo': {
        // Turbocharger Snail Housing & Wastegate
        // Compressor snail housing (outer silver curl)
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(cx - 2 * s, cy, 8 * s, 0, Math.PI * 2);
        ctx.fill();
        // Compressor inlet (dark center hole)
        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        ctx.arc(cx - 2 * s, cy, 5 * s, 0, Math.PI * 2);
        ctx.fill();
        // Turbine impeller blades
        ctx.fillStyle = tierAccent;
        ctx.fillRect(cx - 6 * s, cy - 1 * s, 8 * s, 2 * s);
        ctx.fillRect(cx - 3 * s, cy - 4 * s, 2 * s, 8 * s);
        // Compressor outlet pipe (tangent top)
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(cx - 2 * s, cy - 10 * s, 9 * s, 4 * s);
        // Exhaust turbine side (cast iron rust/orange)
        ctx.fillStyle = '#b45309';
        ctx.fillRect(cx + 5 * s, cy - 2 * s, 6 * s, 8 * s);
        // Gold/bronze wastegate actuator
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(cx + 4 * s, cy - 8 * s, 4 * s, 4 * s);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(cx + 2 * s, cy - 6 * s, 3 * s, 1.5 * s);
        break;
      }

      case 'transmission': {
        // Heavy Duty 6-Speed Gearbox & Flywheel
        // Bell housing
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(cx - 10 * s, cy - 8 * s);
        ctx.lineTo(cx - 2 * s, cy - 5 * s);
        ctx.lineTo(cx - 2 * s, cy + 6 * s);
        ctx.lineTo(cx - 10 * s, cy + 9 * s);
        ctx.closePath();
        ctx.fill();
        // Flywheel teeth
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(cx - 12 * s, cy - 7 * s, 2 * s, 15 * s);
        // Transmission casing
        ctx.fillStyle = '#475569';
        ctx.fillRect(cx - 2 * s, cy - 5 * s, 10 * s, 11 * s);
        // Tailhousing & output spline
        ctx.fillStyle = '#334155';
        ctx.fillRect(cx + 8 * s, cy - 3 * s, 5 * s, 7 * s);
        ctx.fillStyle = tierAccent;
        ctx.fillRect(cx + 13 * s, cy - 1.5 * s, 2 * s, 4 * s);
        // Shift linkage top
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(cx + 2 * s, cy - 9 * s, 3 * s, 4 * s);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(cx + 1.5 * s, cy - 11 * s, 4 * s, 2 * s);
        break;
      }

      case 'tires': {
        // High Grip Racing Semi-Slick Tire with Alloy Wheel
        // Tire outer rubber
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(cx, cy, 10 * s, 0, Math.PI * 2);
        ctx.fill();
        // Tread grooves
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.2 * s;
        ctx.beginPath();
        ctx.arc(cx, cy, 9 * s, 0, Math.PI * 2);
        ctx.stroke();
        // Rim lip
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(cx, cy, 6.5 * s, 0, Math.PI * 2);
        ctx.fill();
        // Brake disc (slotted metal)
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(cx, cy, 5 * s, 0, Math.PI * 2);
        ctx.fill();
        // Red / Gold racing brake caliper
        ctx.fillStyle = tier === 'legendary' ? '#eab308' : '#ef4444';
        ctx.fillRect(cx + 3 * s, cy - 3 * s, 2.5 * s, 6 * s);
        // 5-Spoke center star
        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        ctx.arc(cx, cy, 2 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = tierAccent;
        ctx.fillRect(cx - 1 * s, cy - 1 * s, 2 * s, 2 * s);
        break;
      }

      case 'suspension': {
        // Threaded Coilover Shock Damper
        // Damper shaft (chrome piston)
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(cx - 1.5 * s, cy - 8 * s, 3 * s, 16 * s);
        // Top mounting hat
        ctx.fillStyle = '#09090b';
        ctx.fillRect(cx - 6 * s, cy - 10 * s, 12 * s, 3 * s);
        ctx.fillStyle = tierAccent;
        ctx.fillRect(cx - 4 * s, cy - 11 * s, 8 * s, 1.5 * s);
        // Lower threaded body
        ctx.fillStyle = '#475569';
        ctx.fillRect(cx - 3.5 * s, cy + 2 * s, 7 * s, 7 * s);
        // Red / Yellow coiled spring wrapped around
        ctx.fillStyle = tier === 'legendary' ? '#f59e0b' : '#ef4444';
        ctx.fillRect(cx - 6 * s, cy - 7 * s, 12 * s, 2 * s);
        ctx.fillRect(cx - 6 * s, cy - 4 * s, 12 * s, 2 * s);
        ctx.fillRect(cx - 6 * s, cy - 1 * s, 12 * s, 2 * s);
        ctx.fillRect(cx - 6 * s, cy + 2 * s, 12 * s, 2 * s);
        // Lower eyelet bushing
        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        ctx.arc(cx, cy + 10 * s, 3 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(cx, cy + 10 * s, 1.2 * s, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'nitro': {
        // Nitrous Oxide (NOS) Aluminum Pressure Bottle
        // Bottle neck and valve assembly
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(cx - 2 * s, cy - 10 * s, 4 * s, 4 * s);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(cx - 4 * s, cy - 12 * s, 8 * s, 2.5 * s); // Turn wheel valve
        // Brass pressure gauge
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(cx + 4 * s, cy - 9 * s, 2.2 * s, 0, Math.PI * 2);
        ctx.fill();
        // Blue anodized main cylinder
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(cx, cy - 5 * s, 6 * s, Math.PI, 0);
        ctx.lineTo(cx + 6 * s, cy + 8 * s);
        ctx.arc(cx, cy + 8 * s, 6 * s, 0, Math.PI);
        ctx.closePath();
        ctx.fill();
        // Cyan specular highlight line
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(cx - 4 * s, cy - 5 * s, 2 * s, 14 * s);
        // White NOS branding banner label
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(cx - 5 * s, cy - 1 * s, 10 * s, 5 * s);
        ctx.fillStyle = '#09090b';
        ctx.fillRect(cx - 3 * s, cy + 0.5 * s, 6 * s, 2 * s);
        break;
      }

      case 'armor': {
        // Reinforced Strut Brace & Heavy Skid Plate
        // Heavy steel skid plate
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.moveTo(cx - 10 * s, cy - 6 * s);
        ctx.lineTo(cx + 10 * s, cy - 6 * s);
        ctx.lineTo(cx + 7 * s, cy + 9 * s);
        ctx.lineTo(cx - 7 * s, cy + 9 * s);
        ctx.closePath();
        ctx.fill();
        // Honeycomb ventilation holes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx - 5 * s, cy - 3 * s, 3 * s, 2 * s);
        ctx.fillRect(cx + 2 * s, cy - 3 * s, 3 * s, 2 * s);
        ctx.fillRect(cx - 4 * s, cy + 2 * s, 3 * s, 2 * s);
        ctx.fillRect(cx + 1 * s, cy + 2 * s, 3 * s, 2 * s);
        // High-tension strut brace bar
        ctx.fillStyle = tierAccent;
        ctx.fillRect(cx - 11 * s, cy - 9 * s, 22 * s, 2.5 * s);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(cx - 12 * s, cy - 10 * s, 3 * s, 4 * s);
        ctx.fillRect(cx + 9 * s, cy - 10 * s, 3 * s, 4 * s);
        break;
      }

      case 'aero': {
        // Carbon Fiber GT Wing with Aluminum Endplates
        // Dual mounting upright struts
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(cx - 6 * s, cy - 1 * s, 2.5 * s, 10 * s);
        ctx.fillRect(cx + 3.5 * s, cy - 1 * s, 2.5 * s, 10 * s);
        // Base deck mounts
        ctx.fillStyle = '#09090b';
        ctx.fillRect(cx - 8 * s, cy + 8 * s, 5 * s, 2 * s);
        ctx.fillRect(cx + 3 * s, cy + 8 * s, 5 * s, 2 * s);
        // Carbon aerofoil main blade
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cx - 12 * s, cy - 5 * s, 24 * s, 4 * s);
        // Top aerodynamic curve highlight
        ctx.fillStyle = tierAccent;
        ctx.fillRect(cx - 11 * s, cy - 6 * s, 22 * s, 1.2 * s);
        // Gurney flap lip
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(cx - 12 * s, cy - 7 * s, 24 * s, 1 * s);
        // Side endplates
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx - 13.5 * s, cy - 8 * s, 2 * s, 9 * s);
        ctx.fillRect(cx + 11.5 * s, cy - 8 * s, 2 * s, 9 * s);
        break;
      }

      case 'skin':
      default: {
        // Automotive Paint Spray Gun & Swatch
        ctx.fillStyle = '#64748b';
        ctx.fillRect(cx - 3 * s, cy - 8 * s, 10 * s, 3 * s);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(cx + 6 * s, cy - 7 * s, 3 * s, 2 * s);
        // Paint cup top
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(cx - 2 * s, cy - 12 * s, 5 * s, 4 * s);
        // Handle
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cx - 4 * s, cy - 5 * s, 4 * s, 12 * s);
        // Racing stripes swatch
        ctx.fillStyle = tierAccent;
        ctx.fillRect(cx + 2 * s, cy + 1 * s, 9 * s, 6 * s);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx + 4 * s, cy + 1 * s, 2 * s, 6 * s);
        break;
      }
    }

    // Outer border matching tier
    ctx.strokeStyle = tierAccent;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
  }, [category, tier, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`rounded-lg flex-shrink-0 image-render-pixel ${className}`}
    />
  );
};
