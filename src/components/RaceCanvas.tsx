import React, { useEffect, useRef } from 'react';
import { MapConfig } from '../types';
import { drawCustomChassisCar, drawFrontViewCar, drawRearViewCar } from '../utils/pixelCarEngine';

export interface RacerCanvasData {
  id: string;
  name: string;
  progressPercent: number; // 0 to 100
  speed: number;
  nitro: boolean;
  hp?: number;
  maxHp?: number;
  wrecked?: boolean;
  rank: number;
  primaryColor: string;
  secondaryColor: string;
  bodyType: 'muscle' | 'supercar' | 'tuner' | 'rally' | 'derby' | 'derby_tank' | 'classic';
  isPlayer?: boolean;
  tokenLetter?: string;
  arenaX?: number;
  arenaY?: number;
  arenaAngle?: number;
  customPixelData?: string;
  wheelStyle?: string;
  spoiler?: string;
  drifting?: boolean;
}

interface RaceCanvasProps {
  track: MapConfig;
  racers: RacerCanvasData[];
  cameraProgress?: number; // 0 to 100
  interactive?: boolean;
  interactiveDrift?: boolean;
  className?: string;
}

export const RaceCanvas: React.FC<RaceCanvasProps> = ({
  track,
  racers,
  cameraProgress = 0,
  interactiveDrift = false,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const stateRef = useRef({ racers, track, cameraProgress, interactiveDrift });

  // Update state ref
  useEffect(() => {
    stateRef.current = { racers, track, cameraProgress, interactiveDrift };
  }, [racers, track, cameraProgress, interactiveDrift]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let scrollOffset = 0;

    // Persistent visual positions for smooth interpolation between lanes/positions
    const carPosMap: {
      [id: string]: {
        x: number;
        y: number;
        angle: number;
        arenaVx: number;
        arenaVy: number;
        hp: number;
        maxHp: number;
        wrecked: boolean;
      };
    } = {};

    // Particle system for smoke, sparks, and fire
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      life: number;
      maxLife: number;
      isSmoke?: boolean;
    }[] = [];

    // Persistent tire skid marks on Touge asphalt curves
    const driftSkidMarks: {
      x: number;
      y: number;
      life: number;
      maxLife: number;
      width: number;
    }[] = [];

    // Spline helper for the winding Drift Touge track (normalized to canvas width)
    const driftPathNorm = [
      { x: 0.04, y: 220 }, // Start straight
      { x: 0.16, y: 100 }, // Uphill Hairpin 1 Apex
      { x: 0.28, y: 85 },  // Sweeping Turn
      { x: 0.42, y: 235 }, // Downhill Hairpin 2 Apex
      { x: 0.54, y: 245 }, // S-Curve Switchback Transition
      { x: 0.68, y: 100 }, // Mountain Hairpin 3 Apex
      { x: 0.80, y: 90 },  // Outer High-Speed Sweeper
      { x: 0.96, y: 220 }  // Finish Line Straight
    ];

    const getSplinePoint = (t: number) => {
      const curW = canvas.width || 720;
      const clampedT = Math.max(0, Math.min(0.999, t));
      const totalSegments = driftPathNorm.length - 1;
      const seg = Math.floor(clampedT * totalSegments);
      const localT = (clampedT * totalSegments) - seg;
      const p0 = driftPathNorm[seg];
      const p1 = driftPathNorm[seg + 1] || p0;

      // Catmull-Rom like smooth cubic interpolation
      const prev = driftPathNorm[Math.max(0, seg - 1)];
      const next = driftPathNorm[Math.min(driftPathNorm.length - 1, seg + 2)];

      const t2 = localT * localT;
      const t3 = t2 * localT;

      const nx = 0.5 * (
        (2 * p0.x) +
        (-prev.x + p1.x) * localT +
        (2 * prev.x - 5 * p0.x + 4 * p1.x - next.x) * t2 +
        (-prev.x + 3 * p0.x - 3 * p1.x + next.x) * t3
      );

      const ny = 0.5 * (
        (2 * p0.y) +
        (-prev.y + p1.y) * localT +
        (2 * prev.y - 5 * p0.y + 4 * p1.y - next.y) * t2 +
        (-prev.y + 3 * p0.y - 3 * p1.y + next.y) * t3
      );

      return { x: nx * curW, y: ny };
    };

    const getSplineTangent = (t: number) => {
      const dt = 0.008;
      const pA = getSplinePoint(Math.max(0, t - dt));
      const pB = getSplinePoint(Math.min(0.999, t + dt));
      return Math.atan2(pB.y - pA.y, pB.x - pA.x);
    };

    const getSplineCurvature = (t: number) => {
      const dt = 0.018;
      const t1 = getSplineTangent(Math.max(0, t - dt));
      const t2 = getSplineTangent(Math.min(0.999, t + dt));
      let diff = t2 - t1;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      return diff / (dt * 2);
    };

    // Helper to adjust color brightness for volumetric shading
    const adjustColor = (hex: string, percent: number): string => {
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
    };

    // Draw Detailed Side-View Car for Horizontal Track and Drift
    const drawSideCar = (
      context: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      racer: RacerCanvasData,
      isDrift: boolean = false,
      driftAngle: number = 0,
      viewMode: 'right' | 'left' = 'right'
    ) => {
      const pColor = racer.primaryColor || '#ef4444';
      const sColor = racer.secondaryColor || '#18181b';
      const bType = racer.bodyType || 'tuner';

      const cH = adjustColor(pColor, 35);
      const cL = adjustColor(pColor, 16);
      const cB = pColor;
      const cD = adjustColor(pColor, -22);
      const secB = sColor;

      context.save();
      context.translate(cx, cy);
      if (isDrift) {
        context.rotate(driftAngle);
      }

      // If racer has custom chassis equipped, render custom pixel chassis with animated wheels & accessories!
      if (racer.customPixelData) {
        try {
          const parsed = JSON.parse(racer.customPixelData);
          if (parsed && Array.isArray(parsed.pixels)) {
            const mockCar: any = {
              visuals: {
                primaryColor: racer.primaryColor,
                secondaryColor: racer.secondaryColor,
                customPixelData: racer.customPixelData,
                wheelStyle: racer.wheelStyle || 'spokes',
                spoiler: racer.spoiler || 'gt_wing',
                hasNeon: false,
              }
            };
            // Exact scale 44 / 74 ensures the custom car length is 44px, exactly matching the procedural car!
            drawCustomChassisCar(context, mockCar, 0, 0, 44 / 74, viewMode, viewMode === 'left' ? 270 : 90, frame, racer.nitro, true, parsed);
            context.restore();
            return;
          }
        } catch {
          // Fall through to stock body render
        }
      }

      // For procedural stock car: if viewMode is left, flip horizontally so it faces left!
      if (viewMode === 'left') {
        context.scale(-1, 1);
      }

      // Shadow
      context.fillStyle = 'rgba(0, 0, 0, 0.45)';
      context.fillRect(-22, 6, 44, 4);

      // Nitro exhaust flame
      if (racer.nitro) {
        const flameLen = 8 + (frame % 4) * 4;
        const exhaustY = (bType === 'derby' || bType === 'derby_tank') ? -8 : 1;
        const exhaustX = (bType === 'derby' || bType === 'derby_tank') ? -10 : -22;

        context.fillStyle = '#e0f2fe';
        context.fillRect(exhaustX - flameLen, exhaustY, flameLen, 2.5);
        context.fillStyle = '#0284c7';
        context.fillRect(exhaustX - flameLen - 3, exhaustY - 1, flameLen, 4.5);
        context.fillStyle = '#f59e0b';
        context.fillRect(exhaustX - flameLen - 6, exhaustY - 1.5, 4, 5.5);
      }

      // Chassis Body Rendering
      if (bType === 'muscle') {
        // Lower sill
        context.fillStyle = secB;
        context.fillRect(-20, 2, 40, 2);
        // Muscle Body
        context.fillStyle = cB;
        context.fillRect(-21, -3, 42, 6);
        context.fillStyle = cD;
        context.fillRect(-20, 1, 40, 2);
        context.fillStyle = cL;
        context.fillRect(-20, -3, 40, 1);
        // Wide haunch
        context.fillStyle = cH;
        context.fillRect(-18, -3.5, 9, 1.5);
        // Chrome Supercharger Blower
        context.fillStyle = '#cbd5e1';
        context.fillRect(8, -6, 6, 3.5);
        context.fillStyle = '#ef4444';
        context.fillRect(13, -5.5, 2, 2.5);
        context.fillStyle = '#09090b';
        context.fillRect(7.5, -5, 1.5, 2.5);
        // Cabin & Louvers
        context.fillStyle = '#09090b';
        context.fillRect(-10, -8, 20, 5.5);
        context.fillStyle = cB;
        context.fillRect(-8, -9, 16, 2);
        context.fillStyle = '#1e293b';
        context.fillRect(-4, -7, 12, 4);
        context.fillStyle = '#38bdf8';
        context.fillRect(-2, -7, 6, 3);
        // Louvers
        context.fillStyle = '#09090b';
        context.fillRect(-9, -7.5, 4, 4);
        context.fillStyle = '#334155';
        context.fillRect(-8.5, -6.5, 3, 0.8);
        context.fillRect(-8.5, -5, 3, 0.8);
        // Sunken Quad Headlights
        context.fillStyle = '#09090b';
        context.fillRect(19, -2, 2.5, 3.5);
        context.fillStyle = '#fef08a';
        context.fillRect(19.5, -1.5, 1.5, 1.2);
        context.fillRect(19.5, 0.2, 1.5, 1.2);
        // Taillights
        context.fillStyle = '#ef4444';
        context.fillRect(-21.5, -1.5, 1.5, 3);
      } else if (bType === 'supercar') {
        // Carbon Splitter & Diffuser
        context.fillStyle = '#09090b';
        context.fillRect(17, 2.5, 6, 1.5);
        context.fillRect(-23, 2.5, 5, 1.5);
        // Wedge Body
        context.fillStyle = cB;
        context.fillRect(-22, -1.5, 44, 4.5);
        context.fillStyle = cD;
        context.fillRect(-21, 1, 42, 1.5);
        context.fillStyle = cL;
        context.fillRect(-21, -1.5, 42, 1);
        context.fillStyle = cH;
        context.fillRect(8, -1.8, 12, 1);
        // Bubble Canopy
        context.fillStyle = '#09090b';
        context.fillRect(-9, -6, 19, 5);
        context.fillStyle = cB;
        context.fillRect(-7, -7, 13, 1.8);
        context.fillStyle = '#0284c7';
        context.fillRect(-1, -5.5, 6, 2.5);
        // Glass Rear Engine Hatch with Red Manifold
        context.fillStyle = 'rgba(15, 23, 42, 0.85)';
        context.fillRect(-14, -4.5, 7, 3.5);
        context.fillStyle = '#dc2626';
        context.fillRect(-13, -3.5, 5, 1);
        // Blade Headlights
        context.fillStyle = '#38bdf8';
        context.fillRect(19, -1, 3, 1.2);
        context.fillStyle = '#ffffff';
        context.fillRect(19.5, -0.8, 2, 0.8);
        context.fillStyle = '#ef4444';
        context.fillRect(-22.5, -1, 2, 1.2);
      } else if (bType === 'rally') {
        // Front Aluminum Skid Plate
        context.fillStyle = '#cbd5e1';
        context.fillRect(14, 3, 7, 2);
        // Mud Flaps
        context.fillStyle = '#dc2626';
        context.fillRect(-16, 2.5, 2, 4);
        context.fillRect(8, 2.5, 2, 4);
        // Body (lifted)
        context.fillStyle = cB;
        context.fillRect(-20, -4, 40, 6);
        context.fillStyle = cD;
        context.fillRect(-19, 0, 38, 1.5);
        context.fillStyle = cL;
        context.fillRect(-19, -4, 38, 1);
        // Blister Arches
        context.fillStyle = cH;
        context.fillRect(-15, -4.5, 7, 1);
        context.fillRect(9, -4.5, 7, 1);
        // 4 Round Yellow Rally Pod Lamps on Hood!
        context.fillStyle = '#0f172a';
        context.fillRect(12, -6.5, 7, 3);
        context.fillStyle = '#facc15';
        context.fillRect(13, -6, 2.2, 2.2);
        context.fillRect(16, -6, 2.2, 2.2);
        // Cabin & Roof Scoop
        context.fillStyle = '#09090b';
        context.fillRect(-13, -9, 24, 5.5);
        context.fillStyle = cB;
        context.fillRect(-12, -10, 22, 2);
        context.fillStyle = secB;
        context.fillRect(1, -12, 4, 2);
        context.fillStyle = '#38bdf8';
        context.fillRect(-8, -8, 10, 3);
        // Lights
        context.fillStyle = '#fef08a';
        context.fillRect(19, -2.5, 2, 2.5);
        context.fillStyle = '#ef4444';
        context.fillRect(-20.5, -2.5, 1.5, 2.5);
      } else if (bType === 'derby' || bType === 'derby_tank') {
        // Jagged Front Battering Ram with Teeth
        context.fillStyle = '#ea580c';
        context.fillRect(17, -3, 5, 7);
        context.fillStyle = '#cbd5e1';
        context.fillRect(22, -2, 2, 1.5);
        context.fillRect(22, 1, 2, 1.5);
        // Heavy Armored Hull
        context.fillStyle = cB;
        context.fillRect(-19, -4, 38, 7.5);
        context.fillStyle = '#78716c';
        context.fillRect(-14, -2, 12, 4);
        context.fillRect(2, -2, 12, 4);
        context.fillStyle = '#e2e8f0';
        context.fillRect(-13, -1.5, 1, 1);
        context.fillRect(3, -1.5, 1, 1);
        // Welded Roll Cage Bars
        context.fillStyle = '#ea580c';
        context.fillRect(-12, -8.5, 22, 1.8);
        context.fillRect(-12, -8.5, 1.8, 5);
        context.fillRect(8, -8.5, 1.8, 5);
        // Window Iron Bars
        context.fillStyle = '#09090b';
        context.fillRect(-10, -7, 18, 4);
        context.fillStyle = '#78716c';
        context.fillRect(-8, -6, 14, 0.8);
        context.fillRect(-8, -4.5, 14, 0.8);
        // Vertical Smokestack
        context.fillStyle = '#44403c';
        context.fillRect(-8, -12, 2.5, 6);
        context.fillStyle = 'rgba(28, 25, 23, 0.7)';
        context.fillRect(-11, -14, 4, 3);
      } else if (bType === 'classic') {
        // Waterfall Chrome Radiator Grille
        context.fillStyle = '#cbd5e1';
        context.fillRect(15, -4, 4, 7);
        context.fillStyle = '#e2e8f0';
        context.fillRect(16.5, -3.5, 1, 6);
        // Round Bullet Headlights
        context.fillStyle = '#cbd5e1';
        context.fillRect(17, -1, 3, 3);
        context.fillStyle = '#fef08a';
        context.fillRect(18.5, -0.5, 1.5, 2);
        // Chopped Coupe Body
        context.fillStyle = cB;
        context.fillRect(-19, -3, 36, 6);
        context.fillStyle = secB;
        context.fillRect(-18, 2, 34, 2.5);
        // Cabin with Split Windshield
        context.fillStyle = '#09090b';
        context.fillRect(-11, -7, 18, 4.5);
        context.fillStyle = cB;
        context.fillRect(-10, -8, 16, 1.8);
        context.fillStyle = '#38bdf8';
        context.fillRect(-8, -6, 13, 3);
        context.fillStyle = '#09090b';
        context.fillRect(-2, -6, 1.5, 3);
        // Zoomie Side Exhaust Headers
        context.fillStyle = '#e2e8f0';
        context.fillRect(3, -1, 1.5, 3);
        context.fillRect(5, -1, 1.5, 3);
        context.fillRect(7, -1, 1.5, 3);
        context.fillRect(9, -1, 1.5, 3);
        context.fillStyle = '#ef4444';
        context.fillRect(-19.5, -1, 1.5, 2);
      } else {
        // Default Tuner Spec-R
        context.fillStyle = secB;
        context.fillRect(-19, 2, 38, 2);
        context.fillStyle = '#0f172a';
        context.fillRect(15, 3, 6, 1.5);
        context.fillRect(-21, 3, 4, 1.5);
        // Intercooler
        context.fillStyle = '#09090b';
        context.fillRect(16, 0, 5, 3);
        context.fillStyle = '#94a3b8';
        context.fillRect(17, 0, 3, 1);
        context.fillRect(17, 1.5, 3, 1);
        // Body
        context.fillStyle = cB;
        context.fillRect(-20, -2, 40, 5);
        context.fillStyle = cD;
        context.fillRect(-19, 1, 38, 1.5);
        context.fillStyle = cL;
        context.fillRect(-19, -2, 38, 1);
        // Hood vents
        context.fillStyle = '#09090b';
        context.fillRect(9, -1.5, 3, 1);
        context.fillRect(13, -1.5, 2.5, 1);
        // Cabin
        context.fillStyle = '#09090b';
        context.fillRect(-9, -7, 19, 5);
        context.fillStyle = cB;
        context.fillRect(-7, -8, 15, 2);
        context.fillStyle = '#0284c7';
        context.fillRect(-7, -6, 15, 4);
        context.fillStyle = '#38bdf8';
        context.fillRect(-5, -6, 8, 3);
        // Lights
        context.fillStyle = '#fef08a';
        context.fillRect(19, -1, 2, 2);
        context.fillStyle = '#f59e0b';
        context.fillRect(18, -1, 1, 1.5);
        context.fillStyle = '#ef4444';
        context.fillRect(-21, -1, 2, 2);
        // Exhaust
        context.fillStyle = '#94a3b8';
        context.fillRect(-22, 2, 3, 2);
        context.fillStyle = '#38bdf8';
        context.fillRect(-22.5, 2.2, 1, 1.6);
      }

      // Wheels
      const wRadius = (bType === 'rally' || bType === 'derby' || bType === 'derby_tank' ? 5 : 4.5);
      const drawWheelAt = (wx: number, wy: number) => {
        // Tire
        context.fillStyle = '#09090b';
        context.beginPath();
        context.arc(wx, wy, wRadius, 0, Math.PI * 2);
        context.fill();
        // Brake Rotor
        context.fillStyle = '#64748b';
        context.beginPath();
        context.arc(wx, wy, wRadius * 0.7, 0, Math.PI * 2);
        context.fill();
        // Red Brake Caliper
        context.fillStyle = '#ef4444';
        context.beginPath();
        context.arc(wx, wy, wRadius * 0.7, -Math.PI * 0.85, -Math.PI * 0.35);
        context.lineTo(wx, wy);
        context.fill();
        // Rim
        context.fillStyle = '#cbd5e1';
        context.beginPath();
        context.arc(wx, wy, wRadius * 0.55, 0, Math.PI * 2);
        context.fill();
        // Axle dot
        context.fillStyle = '#09090b';
        context.fillRect(wx - 1, wy - 1, 2, 2);
      };

      drawWheelAt(-12, bType === 'rally' ? 4 : 5.5);
      drawWheelAt(12, bType === 'rally' ? 4 : 5.5);

      context.restore();
    };

    // Draw Detailed Top-Down Car for Vertical Draft Track
    const drawTopDownCar = (
      context: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      racer: RacerCanvasData
    ) => {
      const pColor = racer.primaryColor || '#ef4444';
      const sColor = racer.secondaryColor || '#18181b';
      const bType = racer.bodyType || 'tuner';

      const cB = pColor;
      const cD = adjustColor(pColor, -22);

      // Shadow
      context.fillStyle = 'rgba(0, 0, 0, 0.5)';
      context.beginPath();
      context.ellipse(cx, cy + 2, 15, 21, 0, 0, Math.PI * 2);
      context.fill();

      // Nitro backfire
      if (racer.nitro) {
        const fH = 8 + (frame % 4) * 3;
        context.fillStyle = '#00f0ff';
        context.fillRect(cx - 5, cy + 16, 10, fH);
        context.fillStyle = '#ffffff';
        context.fillRect(cx - 2, cy + 16, 4, fH * 0.6);
      }

      // 4 Wheels
      context.fillStyle = '#09090b';
      context.fillRect(cx - 14, cy - 14, 4.5, 8);
      context.fillRect(cx + 9.5, cy - 14, 4.5, 8);
      context.fillRect(cx - 14, cy + 8, 4.5, 8);
      context.fillRect(cx + 9.5, cy + 8, 4.5, 8);

      // Chassis Body
      context.fillStyle = cB;
      context.fillRect(cx - 10, cy - 16, 20, 32);

      // Chassis Specific Top-down details
      if (bType === 'muscle') {
        context.fillStyle = cD;
        context.fillRect(cx - 12, cy + 6, 24, 10);
        context.fillStyle = '#ffffff';
        context.fillRect(cx - 4, cy - 16, 3, 32);
        context.fillRect(cx + 1, cy - 16, 3, 32);
        // Chrome Supercharger Blower
        context.fillStyle = '#cbd5e1';
        context.fillRect(cx - 4, cy - 12, 8, 5);
        context.fillStyle = '#ef4444';
        context.fillRect(cx - 3, cy - 12, 6, 1.5);
      } else if (bType === 'supercar') {
        context.fillStyle = '#09090b';
        context.fillRect(cx - 6, cy - 15, 4, 3);
        context.fillRect(cx + 2, cy - 15, 4, 3);
        // Transparent Rear Engine Deck with V-Engine visible
        context.fillStyle = 'rgba(15, 23, 42, 0.85)';
        context.fillRect(cx - 6, cy + 6, 12, 8);
        context.fillStyle = '#dc2626';
        context.fillRect(cx - 4, cy + 7, 8, 3);
        context.fillStyle = '#f59e0b';
        context.fillRect(cx - 3, cy + 11, 6, 2);
      } else if (bType === 'rally') {
        // 4 Round Rally Lamps Bar on Front Hood
        context.fillStyle = '#0f172a';
        context.fillRect(cx - 8, cy - 17, 16, 3);
        context.fillStyle = '#facc15';
        context.fillRect(cx - 7, cy - 17, 3, 2.5);
        context.fillRect(cx - 3, cy - 17, 3, 2.5);
        context.fillRect(cx + 1, cy - 17, 3, 2.5);
        context.fillRect(cx + 5, cy - 17, 3, 2.5);
        context.fillStyle = '#dc2626';
        context.fillRect(cx - 15, cy + 15, 5, 2);
        context.fillRect(cx + 10, cy + 15, 5, 2);
        context.fillStyle = sColor;
        context.fillRect(cx - 3, cy - 2, 6, 3);
      } else if (bType === 'derby' || bType === 'derby_tank') {
        // Front Battering Ram with Triangular Teeth
        context.fillStyle = '#ea580c';
        context.fillRect(cx - 13, cy - 18, 26, 4);
        context.fillStyle = '#cbd5e1';
        context.fillRect(cx - 10, cy - 20, 3, 2);
        context.fillRect(cx - 1.5, cy - 20, 3, 2);
        context.fillRect(cx + 7, cy - 20, 3, 2);
      } else if (bType === 'classic') {
        context.fillStyle = '#cbd5e1';
        context.fillRect(cx - 6, cy - 18, 12, 4);
        context.fillStyle = '#e2e8f0';
        context.fillRect(cx - 4, cy - 18, 8, 2);
        context.fillStyle = '#cbd5e1';
        context.fillRect(cx - 12, cy - 8, 2, 7);
        context.fillRect(cx + 10, cy - 8, 2, 7);
      } else {
        context.fillStyle = sColor;
        context.fillRect(cx - 6, cy - 14, 12, 6);
        context.fillStyle = '#09090b';
        context.fillRect(cx - 5, cy - 12, 3, 1.5);
        context.fillRect(cx + 2, cy - 12, 3, 1.5);
      }

      // Cabin & Windshield
      context.fillStyle = '#09090b';
      context.fillRect(cx - 8, cy - 4, 16, 12);
      context.fillStyle = '#38bdf8';
      context.fillRect(cx - 6, cy - 3, 12, 5);

      // Roof
      context.fillStyle = cB;
      context.fillRect(cx - 7, cy + 3, 14, 4);

      // Spoiler
      context.fillStyle = sColor;
      context.fillRect(cx - 11, cy + 14, 22, 3);

      // Headlights & Taillights
      context.fillStyle = '#fef08a';
      context.fillRect(cx - 9, cy - 17, 4, 2);
      context.fillRect(cx + 5, cy - 17, 4, 2);
      context.fillStyle = '#ef4444';
      context.fillRect(cx - 9, cy + 16, 4, 2);
      context.fillRect(cx + 5, cy + 16, 4, 2);
    };

    const render = () => {
      frame++;
      const currentTrack = stateRef.current.track;
      const currentRacers = stateRef.current.racers;

      const w = canvas.width;
      const h = canvas.height;
      ctx.imageSmoothingEnabled = false;

      // Compute average speed
      const leader = [...currentRacers].sort((a, b) => b.progressPercent - a.progressPercent)[0];
      const avgSpeed = leader ? Math.max(80, leader.speed) : 120;
      scrollOffset += (avgSpeed / 120) * 4;

      // Ensure persistent car position records
      currentRacers.forEach((racer, idx) => {
        if (!carPosMap[racer.id]) {
          carPosMap[racer.id] = {
            x: 80 + idx * 30,
            y: 70 + (racer.rank - 1) * 45,
            angle: 0,
            arenaVx: (Math.random() - 0.5) * 2,
            arenaVy: (Math.random() - 0.5) * 2,
            hp: racer.hp !== undefined ? racer.hp : 100,
            maxHp: racer.maxHp !== undefined ? racer.maxHp : 100,
            wrecked: racer.wrecked || false
          };
        }
        if (racer.hp !== undefined) carPosMap[racer.id].hp = racer.hp;
        if (racer.maxHp !== undefined) carPosMap[racer.id].maxHp = racer.maxHp;
        if (racer.wrecked !== undefined) carPosMap[racer.id].wrecked = racer.wrecked;
      });

      // =========================================================================
      // MODE 1: DRAFT (VERTICAL TRACK / WANGAN HIGHWAY)
      // "a pista de draft deve ser na vertical ao invés da horizontal"
      // "de forma que o primeiro fique sempre em cima e o quarto fique sempre em baixo"
      // =========================================================================
      if (currentTrack.id === 'draft') {
        // Sky & Ambient Background
        ctx.fillStyle = currentTrack.palette.sky;
        ctx.fillRect(0, 0, w, h);

        const trackWidth = 460;
        const trackLeft = (w - trackWidth) / 2;
        const trackRight = trackLeft + trackWidth;
        const laneW = trackWidth / 4;

        // Draw surrounding city towers with vertical parallax
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, trackLeft, h);
        ctx.fillRect(trackRight, 0, w - trackRight, h);

        const vOffset = (scrollOffset * 4) % 60;
        for (let y = -60; y < h + 60; y += 40) {
          // Left skyline
          ctx.fillStyle = '#0b0f19';
          ctx.fillRect(10, y + vOffset, trackLeft - 20, 32);
          ctx.fillStyle = (frame + y) % 2 === 0 ? '#38bdf8' : '#ec4899';
          ctx.fillRect(20, y + vOffset + 8, 4, 4);
          ctx.fillRect(36, y + vOffset + 18, 4, 4);

          // Right skyline
          ctx.fillStyle = '#0b0f19';
          ctx.fillRect(trackRight + 10, y + vOffset, trackLeft - 20, 32);
          ctx.fillStyle = (frame + y) % 3 === 0 ? '#eab308' : '#38bdf8';
          ctx.fillRect(trackRight + 20, y + vOffset + 10, 4, 4);
          ctx.fillRect(trackRight + 38, y + vOffset + 20, 4, 4);
        }

        // Vertical Asphalt Track
        ctx.fillStyle = currentTrack.palette.track;
        ctx.fillRect(trackLeft, 0, trackWidth, h);

        // Side Curbs (vertical stripes)
        const curbH = 14;
        const vCurbOffset = Math.floor(scrollOffset * 4) % (curbH * 2);
        for (let y = -curbH * 2; y < h + curbH * 2; y += curbH * 2) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(trackLeft - 6, y + vCurbOffset, 6, curbH);
          ctx.fillRect(trackRight, y + vCurbOffset, 6, curbH);

          ctx.fillStyle = currentTrack.palette.border;
          ctx.fillRect(trackLeft - 6, y + vCurbOffset + curbH, 6, curbH);
          ctx.fillRect(trackRight, y + vCurbOffset + curbH, 6, curbH);
        }

        // Vertical Dashed Lane Dividers
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        const dashH = 22;
        const dashGap = 20;
        const vDashOffset = Math.floor(scrollOffset * 5) % (dashH + dashGap);

        for (let lane = 1; lane < 4; lane++) {
          const lx = trackLeft + lane * laneW;
          for (let y = -dashH; y < h + dashH; y += dashH + dashGap) {
            ctx.fillRect(lx - 1.5, y + vDashOffset, 3, dashH);
          }
        }

        // Speed Lines on the asphalt
        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        for (let i = 0; i < 6; i++) {
          const sx = trackLeft + 30 + (i * 70);
          const sy = ((frame * 12 + i * 45) % (h + 100)) - 50;
          ctx.fillRect(sx, sy, 1.5, 35);
        }

        // Check if the 1st place has crossed the finish line
        // Check finish states:
        // "caso o primeiro colocado tenha ido mais rápido que os demais, o jogo deve aguardar todos cruzarem a linha de chegada e esperar mais uns 5 segundos até voltar para o lobby"
        // "depois de cruzar a linha de chegada, eles devem manter a mesma posição de quando a linha de chegada foi cruzada"
        const allRacersFinished = currentRacers.every((r) => r.progressPercent >= 100);
        const someRacersFinished = currentRacers.some((r) => r.progressPercent >= 100);

        // Finish line drawing on vertical track:
        // Before all finish: finish line is near bottom of the track (foreground) where cars are heading
        // After all finish: finish line is at top horizon for the grand rear-view celebration
        const finishY = allRacersFinished ? 55 : (h - 32);
        const checkSize = 10;
        for (let x = trackLeft; x < trackRight; x += checkSize) {
          const isWhite = (Math.floor(x / checkSize) + (allRacersFinished ? Math.floor(frame / 5) : 0)) % 2 === 0;
          ctx.fillStyle = isWhite ? '#ffffff' : '#000000';
          ctx.fillRect(x, finishY, checkSize, 6);
          ctx.fillStyle = !isWhite ? '#ffffff' : '#000000';
          ctx.fillRect(x, finishY + 6, checkSize, 6);
        }

        // Animated waving checkered flags at the side barriers of the finish line
        const drawFinishFlag = (fx: number, fy: number) => {
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(fx, fy - 18, 2, 22); // flag pole
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const flutter = Math.sin(frame * 0.25 + c * 0.6) * 2;
              ctx.fillStyle = (r + c + Math.floor(frame / 6)) % 2 === 0 ? '#ffffff' : '#09090b';
              ctx.fillRect(fx + 2 + c * 4, fy - 18 + r * 4 + flutter, 4, 4);
            }
          }
        };
        drawFinishFlag(trackLeft - 18, finishY);
        drawFinishFlag(trackRight + 4, finishY);

        // Celebratory confetti particles during finish celebration (when all have finished)
        if (allRacersFinished && frame % 2 === 0) {
          const confColors = ['#f59e0b', '#38bdf8', '#ec4899', '#10b981', '#ffffff', '#eab308', '#a855f7'];
          particles.push({
            x: trackLeft + Math.random() * trackWidth,
            y: -10,
            vx: (Math.random() - 0.5) * 2.5,
            vy: 2 + Math.random() * 3,
            color: confColors[Math.floor(Math.random() * confColors.length)],
            size: 3 + Math.random() * 3,
            life: 0,
            maxLife: 90
          });
        }

        // DRAW CARS ON VERTICAL TRACK:
        // Rules requested by user:
        // 1. "lá os carros não precisa mudar os carros de pista, mantém todos na mesma pista porém fica alterando o indicador da posição conforme eles forem avançando"
        // 2. "precisa ajustar o tamanho do sprite de frente que ficou menor no draft"
        // 3. "só que depois de cruzar a linha de chegada, eles devem manter a mesma posição de quando a linha de chegada foi cruzada"
        // 4. "caso o primeiro colocado tenha ido mais rápido que os demais, o jogo deve aguardar todos cruzarem a linha de chegada e esperar mais uns 5 segundos até voltar para o lobby"
        // 5. "mostrando a parte de trás dos carros de acordo com a posição, sendo o primeiro lugar mais longe e o ultimo mais perto da câmera além da posição destacada em cima de cada 1"
        currentRacers.forEach((racer, index) => {
          const pos = carPosMap[racer.id];
          if (!pos) return;

          let targetY: number;
          let zoomFactor: number;

          // Fixed lane: each car stays strictly in its own lane (Lanes 0, 1, 2, 3)! No lane swapping!
          const fixedLaneIdx = index % 4;
          const targetX = trackLeft + fixedLaneIdx * laneW + laneW / 2;
          const rankIdx = Math.max(0, Math.min(3, (racer.rank || 1) - 1));

          if (!allRacersFinished) {
            // PHASE 1: FRONT VIEW (ASSET DE FRENTE)
            if (racer.progressPercent >= 100) {
              // Car has crossed the finish line!
              // "depois de cruzar a linha de chegada, eles devem manter a mesma posição de quando a linha de chegada foi cruzada"
              // Holds steady position past the finish line with no erratic bobbing
              targetY = 228 - rankIdx * 28;
              zoomFactor = 1.45 - rankIdx * 0.20;
            } else {
              // Car is still actively racing towards the finish line
              // Rank-based vertical positioning with road bobbing and draft surge
              const rankBaseY = 205 - rankIdx * 44;
              const roadBob = Math.sin(frame * 0.18 + fixedLaneIdx * 1.5) * 6;
              const draftSurge = Math.cos(frame * 0.24 + index * 1.2) * 4;
              const nitroLunge = racer.nitro ? 22 : 0;

              targetY = rankBaseY + roadBob + draftSurge + nitroLunge;
              zoomFactor = 1.45 - rankIdx * 0.20; // Rank 1: 1.45x, Rank 4: 0.85x
            }
          } else {
            // PHASE 2: ALL FINISHED - GRAND PODIUM CELEBRATION (ASSET DE TRÁS)
            // "mostrando a parte de trás dos carros de acordo com a posição, sendo o primeiro lugar mais longe e o ultimo mais perto da câmera além da posição destacada em cima de cada 1"
            // Rank 1 (1st place) is furthest away near horizon: targetY ~ 72, zoom 0.75x (zoomed out)
            // Rank 4 (last place) is closest to camera in foreground: targetY ~ 222, zoom 1.56x (zoomed in)
            targetY = 72 + rankIdx * 50 + Math.sin(frame * 0.15 + index) * 2;
            zoomFactor = 0.75 + rankIdx * 0.27;
          }

          // Smooth interpolation for fluid movement
          pos.y += (targetY - pos.y) * 0.10;
          pos.x += (targetX - pos.x) * 0.10;

          const cx = pos.x;
          const cy = pos.y;

          // Spawn vertical exhaust / nitro particles
          if (racer.nitro || allRacersFinished) {
            const pDirY = allRacersFinished ? 4 : -4;
            particles.push({
              x: cx - 6 + (Math.random() - 0.5) * 4,
              y: cy + (allRacersFinished ? 14 : -14),
              vx: (Math.random() - 0.5) * 2,
              vy: pDirY + Math.random() * 2,
              color: racer.nitro ? (Math.random() > 0.4 ? '#38bdf8' : '#f59e0b') : '#ef4444',
              size: (3 + Math.random() * 2) * zoomFactor,
              life: 0,
              maxLife: 14
            });
          }

          // Render Car (Front view while racing; Rear view on finish podium celebration)
          const mockCar: any = {
            visuals: {
              primaryColor: racer.primaryColor,
              secondaryColor: racer.secondaryColor,
              customPixelData: racer.customPixelData,
              wheelStyle: racer.wheelStyle || 'spokes',
              spoiler: racer.spoiler || 'gt_wing',
              hasNeon: false,
            }
          };

          const viewAngle = allRacersFinished ? 'rear' : 'front';
          // Muscular prominence inside the 115px lane
          const carScale = zoomFactor * 1.55;

          if (racer.customPixelData) {
            try {
              const parsed = JSON.parse(racer.customPixelData);
              if (parsed) {
                drawCustomChassisCar(
                  ctx,
                  mockCar,
                  cx,
                  cy,
                  carScale,
                  viewAngle,
                  allRacersFinished ? 180 : 0,
                  frame,
                  racer.nitro,
                  true,
                  parsed
                );
              } else {
                if (allRacersFinished) {
                  drawRearViewCar(ctx, mockCar, cx, cy, carScale, frame, true);
                } else {
                  drawFrontViewCar(ctx, mockCar, cx, cy, carScale, frame, true);
                }
              }
            } catch {
              if (allRacersFinished) {
                drawRearViewCar(ctx, mockCar, cx, cy, carScale, frame, true);
              } else {
                drawFrontViewCar(ctx, mockCar, cx, cy, carScale, frame, true);
              }
            }
          } else {
            if (allRacersFinished) {
              drawRearViewCar(ctx, mockCar, cx, cy, carScale, frame, true);
            } else {
              drawFrontViewCar(ctx, mockCar, cx, cy, carScale, frame, true);
            }
          }

          // Headlights beam effect in front view
          if (!allRacersFinished) {
            ctx.save();
            ctx.fillStyle = 'rgba(254, 240, 138, 0.14)';
            ctx.beginPath();
            ctx.moveTo(cx - 14 * zoomFactor, cy + 8 * zoomFactor);
            ctx.lineTo(cx - 28 * zoomFactor, cy + 42 * zoomFactor);
            ctx.lineTo(cx + 28 * zoomFactor, cy + 42 * zoomFactor);
            ctx.lineTo(cx + 14 * zoomFactor, cy + 8 * zoomFactor);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }

          // PROMINENT POSITION INDICATOR:
          // "além da posição destacada em cima de cada 1"
          // "porém fica alterando o indicador da posição conforme eles forem avançando"
          if (allRacersFinished) {
            // CELEBRATION FINISH PODIUM PLAQUE HIGHLIGHTED ABOVE EACH CAR
            const isWinner = racer.rank === 1;
            const plaqueW = isWinner ? 88 : 78;
            const plaqueH = 16;
            const plaqueY = cy - 34 * zoomFactor - plaqueH;

            ctx.save();
            if (isWinner) {
              ctx.shadowColor = '#eab308';
              ctx.shadowBlur = 12;
            }

            // Plaque background
            ctx.fillStyle = isWinner ? '#451a03' : racer.rank === 2 ? '#1e293b' : racer.rank === 3 ? '#3b1c06' : '#0f172a';
            ctx.fillRect(cx - plaqueW / 2, plaqueY, plaqueW, plaqueH);

            // Plaque border
            ctx.strokeStyle = isWinner ? '#eab308' : racer.rank === 2 ? '#94a3b8' : racer.rank === 3 ? '#d97706' : '#475569';
            ctx.lineWidth = isWinner ? 2 : 1.5;
            ctx.strokeRect(cx - plaqueW / 2, plaqueY, plaqueW, plaqueH);

            // Rank icon & label
            const medal = isWinner ? '🏆 1º' : racer.rank === 2 ? '🥈 2º' : racer.rank === 3 ? '🥉 3º' : '4º';
            ctx.fillStyle = isWinner ? '#fde047' : racer.rank === 2 ? '#f1f5f9' : racer.rank === 3 ? '#fed7aa' : '#cbd5e1';
            ctx.font = `bold ${isWinner ? 9 : 8}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${medal} ${racer.name.substring(0, 6)}`, cx, plaqueY + plaqueH / 2);
            ctx.restore();
          } else if (racer.progressPercent >= 100) {
            // FINISHED RACER HOLDING POSITION WHILE OTHERS FINISH
            const isWinner = racer.rank === 1;
            const tagW = Math.max(74, 86 * Math.min(1.2, zoomFactor));
            const tagH = 15;
            const tagY = cy - 34 * zoomFactor - tagH;

            ctx.fillStyle = isWinner ? '#451a03' : '#0f172a';
            ctx.fillRect(cx - tagW / 2, tagY, tagW, tagH);

            ctx.strokeStyle = isWinner ? '#eab308' : racer.rank === 2 ? '#94a3b8' : racer.rank === 3 ? '#d97706' : '#64748b';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(cx - tagW / 2, tagY, tagW, tagH);

            const medal = isWinner ? '🏆 1º' : racer.rank === 2 ? '🥈 2º' : racer.rank === 3 ? '🥉 3º' : '4º';
            ctx.fillStyle = isWinner ? '#fde047' : '#ffffff';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${medal} ${racer.name.substring(0, 5)} • CHEGOU!`, cx, tagY + tagH / 2);
          } else {
            // ACTIVE RACE DYNAMIC POSITION INDICATOR:
            // "fica alterando o indicador da posição conforme eles forem avançando"
            const tagW = Math.max(66, 78 * Math.min(1.2, zoomFactor));
            const tagH = 14;
            const tagY = cy - 34 * zoomFactor - tagH;

            ctx.fillStyle = 'rgba(9, 9, 11, 0.9)';
            ctx.fillRect(cx - tagW / 2, tagY, tagW, tagH);

            const rankCol = racer.rank === 1 ? '#eab308' : racer.rank === 2 ? '#94a3b8' : racer.rank === 3 ? '#b45309' : '#475569';
            ctx.strokeStyle = racer.isPlayer ? '#38bdf8' : rankCol;
            ctx.lineWidth = racer.rank === 1 ? 1.8 : 1;
            ctx.strokeRect(cx - tagW / 2, tagY, tagW, tagH);

            // Left colored rank box
            ctx.fillStyle = rankCol;
            ctx.fillRect(cx - tagW / 2, tagY, 15, tagH);
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${racer.rank}º`, cx - tagW / 2 + 7.5, tagY + tagH / 2);

            // Racer name
            ctx.fillStyle = racer.isPlayer ? '#38bdf8' : '#ffffff';
            ctx.font = 'bold 7.5px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(racer.name.substring(0, 7), cx - tagW / 2 + 18, tagY + tagH / 2);
          }
        });

        // Top Status Banner:
        if (allRacersFinished) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
          ctx.fillRect(trackLeft, 8, trackWidth, 24);
          ctx.strokeStyle = (frame % 30 < 15) ? '#eab308' : '#38bdf8';
          ctx.lineWidth = 2;
          ctx.strokeRect(trackLeft, 8, trackWidth, 24);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9.5px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🏆 TODOS CRUZARAM A LINHA • PÓDIO FINAL (5s) 🏆', w / 2, 20);
        } else if (someRacersFinished) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
          ctx.fillRect(trackLeft, 8, trackWidth, 24);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(trackLeft, 8, trackWidth, 24);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🏁 1º COLOCADO CRUZOU! AGUARDANDO DEMAIS CARROS... 🏁', w / 2, 20);
        }

      // =========================================================================
      // MODE 2: DRIFT (WINDING TRACK WITH CURVES, BALLS WITH LETTERS, CARS BELOW)
      // "a pista de drift tem que ter curvas(nessa pista os carros aparecem em baixo,
      // e uma bolinha com uma letra aparece representando o carro na pista com várias curvas)
      // e a ordem dos carros é representada por uma lista que deixa o primeiro sempre em cima"
      // =========================================================================
      } else if (currentTrack.id === 'drift') {
        // Full-Canvas Grand Touge Drift Track (Spacious 4-lane course)
        ctx.fillStyle = '#060913';
        ctx.fillRect(0, 0, w, h);

        // Distant starry night sky
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        for (let i = 0; i < 35; i++) {
          const sx = (i * 29 + (frame * 0.15)) % w;
          const sy = 6 + ((i * 17) % 52);
          ctx.fillRect(sx, sy, 1.5, 1.5);
        }

        // Mountain Silhouettes in the background
        ctx.fillStyle = '#0b0f19';
        for (let x = 0; x < w; x += 60) {
          ctx.beginPath();
          ctx.moveTo(x, 70);
          ctx.lineTo(x + 30, 18);
          ctx.lineTo(x + 60, 70);
          ctx.fill();
        }
        ctx.fillStyle = '#111827';
        for (let x = 15; x < w; x += 75) {
          ctx.beginPath();
          ctx.moveTo(x, 75);
          ctx.lineTo(x + 37, 30);
          ctx.lineTo(x + 75, 75);
          ctx.fill();
        }

        // Touge Mountain Streetlights with warm ambient light pools
        const lightTs = [0.08, 0.22, 0.38, 0.54, 0.70, 0.86];
        lightTs.forEach((lt) => {
          const lp = getSplinePoint(lt);
          const tang = getSplineTangent(lt);
          // Position lamp slightly off the outer curb
          const lampX = lp.x - Math.sin(tang) * 44;
          const lampY = lp.y + Math.cos(tang) * 44;

          // Radial light cone
          const grad = ctx.createRadialGradient(lampX, lampY, 2, lampX, lampY, 38);
          grad.addColorStop(0, 'rgba(254, 240, 138, 0.22)');
          grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(lampX, lampY, 38, 0, Math.PI * 2);
          ctx.fill();

          // Lamp post
          ctx.fillStyle = '#475569';
          ctx.fillRect(lampX - 1, lampY - 14, 2, 14);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(lampX - 3, lampY - 16, 6, 4);
        });

        // =====================================================================
        // 1. GRAND 4-LANE TOUGE ROAD RENDERING (84px Wide Surface)
        // =====================================================================
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // A. Touge Mountain Guardrails / Protective Barriers
        ctx.strokeStyle = '#3b0764';
        ctx.lineWidth = 88;
        ctx.beginPath();
        for (let t = 0; t <= 1; t += 0.015) {
          const pt = getSplinePoint(t);
          if (t === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();

        ctx.strokeStyle = '#6b21a8';
        ctx.lineWidth = 84;
        ctx.stroke();

        // B. Red & White Curb Rumble Strips (Zebras on both outer edges)
        ctx.lineWidth = 78;
        for (let t = 0; t <= 1; t += 0.012) {
          const isRed = Math.floor(t * 80) % 2 === 0;
          ctx.strokeStyle = isRed ? '#ef4444' : '#f8fafc';
          const p1 = getSplinePoint(Math.max(0, t - 0.007));
          const p2 = getSplinePoint(Math.min(1, t + 0.007));
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }

        // C. Dark Asphalt Track Surface
        ctx.strokeStyle = '#141416';
        ctx.lineWidth = 70;
        ctx.beginPath();
        for (let t = 0; t <= 1; t += 0.015) {
          const pt = getSplinePoint(t);
          if (t === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();

        ctx.strokeStyle = '#1f2026';
        ctx.lineWidth = 66;
        ctx.stroke();

        // D. Persistent Rubber Skid Marks on the Asphalt
        for (let i = driftSkidMarks.length - 1; i >= 0; i--) {
          const sm = driftSkidMarks[i];
          sm.life++;
          const smAlpha = Math.max(0, (1 - sm.life / sm.maxLife) * 0.45);
          ctx.fillStyle = '#09090b';
          ctx.globalAlpha = smAlpha;
          ctx.beginPath();
          ctx.arc(sm.x, sm.y, sm.width, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
          if (sm.life >= sm.maxLife) {
            driftSkidMarks.splice(i, 1);
          }
        }

        // E. 4 DISTINCT LANES (Separated by 3 continuous guide lines along the spline)
        const drawSplineOffsetLine = (offset: number, strokeStyle: string, dash: number[], lineWidth: number) => {
          ctx.strokeStyle = strokeStyle;
          ctx.lineWidth = lineWidth;
          ctx.setLineDash(dash);
          ctx.beginPath();
          for (let t = 0; t <= 1; t += 0.015) {
            const pt = getSplinePoint(t);
            const tang = getSplineTangent(t);
            const nx = -Math.sin(tang);
            const ny = Math.cos(tang);
            const lx = pt.x + nx * offset;
            const ly = pt.y + ny * offset;
            if (t === 0) ctx.moveTo(lx, ly);
            else ctx.lineTo(lx, ly);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        };

        // Center Yellow Dashed Line (Divides Lane 1-2 from Lane 3-4)
        drawSplineOffsetLine(0, 'rgba(234, 179, 8, 0.75)', [10, 8], 2.2);

        // Outer Lane Dividers (White Dashed Lines)
        drawSplineOffsetLine(-17, 'rgba(255, 255, 255, 0.35)', [6, 8], 1.2);
        drawSplineOffsetLine(17, 'rgba(255, 255, 255, 0.35)', [6, 8], 1.2);

        // Start Line (Cyan Checkered Banner across all 4 lanes)
        const startPt = getSplinePoint(0.02);
        const startTang = getSplineTangent(0.02);
        const sNormX = -Math.sin(startTang);
        const sNormY = Math.cos(startTang);
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(startPt.x - sNormX * 33, startPt.y - sNormY * 33);
        ctx.lineTo(startPt.x + sNormX * 33, startPt.y + sNormY * 33);
        ctx.stroke();

        // Finish Line (Golden Checkered Banner across all 4 lanes)
        const finishPt = getSplinePoint(0.98);
        const finishTang = getSplineTangent(0.98);
        const fNormX = -Math.sin(finishTang);
        const fNormY = Math.cos(finishTang);
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(finishPt.x - fNormX * 33, finishPt.y - fNormY * 33);
        ctx.lineTo(finishPt.x + fNormX * 33, finishPt.y + fNormY * 33);
        ctx.stroke();

        // =====================================================================
        // 2. CLIPPING POINTS (ZONAS DE TANGÊNCIA / DRIFT SCORING APEXES)
        // =====================================================================
        const clippingZones = [
          { t: 0.18, name: 'CLIP 1', desc: 'HAIRPIN APEX', color: '#ec4899', side: -1 },
          { t: 0.48, name: 'CLIP 2', desc: 'OUTER S-BEND', color: '#38bdf8', side: 1 },
          { t: 0.74, name: 'CLIP 3', desc: 'FINAL HAIRPIN', color: '#eab308', side: -1 }
        ];

        clippingZones.forEach((clip) => {
          const cpPt = getSplinePoint(clip.t);
          const cpTang = getSplineTangent(clip.t);
          const normX = -Math.sin(cpTang) * (34 * clip.side);
          const normY = Math.cos(cpTang) * (34 * clip.side);
          const coneX = cpPt.x + normX;
          const coneY = cpPt.y + normY;

          // Pulsing halo
          const pulseR = 9 + Math.sin(frame * 0.18 + clip.t * 12) * 3;
          ctx.beginPath();
          ctx.arc(coneX, coneY, pulseR, 0, Math.PI * 2);
          ctx.fillStyle = clip.color + '33';
          ctx.fill();

          // Beacon cone
          ctx.beginPath();
          ctx.arc(coneX, coneY, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = clip.color;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Label
          ctx.fillStyle = clip.color;
          ctx.font = 'bold 7.5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(clip.name, coneX, coneY - 8);

          // Check if any racer is currently clipping through this zone
          currentRacers.forEach((r) => {
            const rt = Math.max(0, Math.min(1, r.progressPercent / 100));
            if (Math.abs(rt - clip.t) < 0.025) {
              if (frame % 2 === 0) {
                particles.push({
                  x: coneX + (Math.random() - 0.5) * 6,
                  y: coneY + (Math.random() - 0.5) * 6,
                  vx: (Math.random() - 0.5) * 3,
                  vy: -Math.random() * 3,
                  color: clip.color,
                  size: 2.5,
                  life: 0,
                  maxLife: 15
                });
              }
              ctx.fillStyle = '#fef08a';
              ctx.font = 'bold 8px monospace';
              ctx.fillText('⭐ PERFECT CLIP!', coneX, coneY - 18);
            }
          });
        });

        // 7. DRAW CARS ON THE CURVED TRACK (TOP-DOWN DRIFT WITH 4 SEPARATE LANES):
        // "coloque uma pista grande o suficiente para caber os 4 e sentir o drift"
        const laneOffsets = [-24, -8, 8, 24];

        currentRacers.forEach((racer, idx) => {
          const t = Math.max(0, Math.min(0.999, racer.progressPercent / 100));
          const pt = getSplinePoint(t);
          const tangent = getSplineTangent(t);
          const curv = getSplineCurvature(t);

          // Dedicated lane offset for this racer (completely avoids stacking)
          const assignedLane = laneOffsets[idx % 4];

          // ===================================================================
          // REAL DRIFT PHYSICS & ORIENTATION
          // "os carros fazem drift o tempo todo e deveria ser feito apenas nas curvas"
          // "a traseira do carro deve ficar direcionada pra abertura da curva e não para o fechamento da mesma"
          // ===================================================================
          const curvAbs = Math.abs(curv);
          // On straightaways, curvAbs is small (< 0.45). On real hairpins/curves, curvAbs is high (> 0.45).
          const isCorner = curvAbs > 0.45;
          const isPlayerDrift = racer.isPlayer && (stateRef.current.interactiveDrift || racer.drifting);
          const isDrifting = isCorner || isPlayerDrift;

          // When turning clockwise (curv >= 0), turnDir is +1.
          // Rotating carHeading by +angle points the NOSE towards the apex (fechamento da curva),
          // which swings the REAR (tail) OUTWARDS towards the wide edge (abertura da curva)!
          const turnDir = curv >= 0 ? 1 : -1;

          let totalSlip = 0;
          let dynamicSlide = 0;

          if (isDrifting) {
            const cornerStrength = isCorner ? Math.min(1.0, (curvAbs - 0.35) * 0.4) : 0.6;
            const driftAngle = turnDir * (0.30 + cornerStrength * 0.38);
            totalSlip = isPlayerDrift ? (turnDir * 0.72) : driftAngle;
            // Car slides outward toward the outer edge (abertura da curva)
            dynamicSlide = turnDir * (isPlayerDrift ? 5 : 3);
          }

          const carHeading = tangent + totalSlip;
          const driftDegrees = Math.round(Math.abs(totalSlip) * (180 / Math.PI));

          // Normal direction vector
          const normX = -Math.sin(tangent);
          const normY = Math.cos(tangent);

          const totalLateralOffset = assignedLane + dynamicSlide;
          const carX = pt.x + normX * totalLateralOffset;
          const carY = pt.y + normY * totalLateralOffset;

          // Calculate rear wheel positions for tire smoke and skid marks
          const rearOffset = 11;
          const halfWidth = 6;
          const lrX = carX - Math.cos(carHeading) * rearOffset + Math.sin(carHeading) * halfWidth;
          const lrY = carY - Math.sin(carHeading) * rearOffset - Math.cos(carHeading) * halfWidth;
          const rrX = carX - Math.cos(carHeading) * rearOffset - Math.sin(carHeading) * halfWidth;
          const rrY = carY - Math.sin(carHeading) * rearOffset + Math.cos(carHeading) * halfWidth;

          // Skid marks ONLY laid down when actively drifting in curves or handbrake
          if (isDrifting && frame % 2 === 0 && racer.speed > 80) {
            driftSkidMarks.push({ x: lrX, y: lrY, life: 0, maxLife: 60, width: 2.8 });
            driftSkidMarks.push({ x: rrX, y: rrY, life: 0, maxLife: 60, width: 2.8 });
          }

          // Tire smoke spawns ONLY when actively drifting in curves or handbrake
          if (isDrifting && racer.speed > 70) {
            const smokeVolume = isPlayerDrift ? 3 : 2;
            for (let s = 0; s < smokeVolume; s++) {
              const useLeft = s % 2 === 0;
              const sx = useLeft ? lrX : rrX;
              const sy = useLeft ? lrY : rrY;
              particles.push({
                x: sx + (Math.random() - 0.5) * 3,
                y: sy + (Math.random() - 0.5) * 3,
                vx: -Math.cos(tangent) * (1.2 + Math.random()) + (Math.random() - 0.5) * 1.5,
                vy: -Math.sin(tangent) * (1.2 + Math.random()) + (Math.random() - 0.5) * 1.5,
                color: Math.random() > 0.35 ? '#f8fafc' : '#cbd5e1',
                size: 3.5 + Math.random() * 2.5,
                life: 0,
                maxLife: 28,
                isSmoke: true
              });
            }
          }

          // Orange friction sparks when handbrake is engaged or extreme slide
          if (isPlayerDrift && frame % 2 === 0) {
            particles.push({
              x: carX - Math.cos(carHeading) * 11,
              y: carY - Math.sin(carHeading) * 11,
              vx: -Math.cos(carHeading) * 2 + (Math.random() - 0.5) * 2,
              vy: -Math.sin(carHeading) * 2 + (Math.random() - 0.5) * 2,
              color: Math.random() > 0.5 ? '#f59e0b' : '#ea580c',
              size: 2,
              life: 0,
              maxLife: 14
            });
          }

          // Top-Down Mini-Car sprite rotated along carHeading
          ctx.save();
          ctx.translate(carX, carY);
          ctx.rotate(carHeading);

          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
          ctx.fillRect(-11, -6, 22, 12);

          // Rear Wheels (fixed)
          ctx.fillStyle = '#09090b';
          ctx.fillRect(-9, -7, 4.5, 3);
          ctx.fillRect(-9, 4, 4.5, 3);

          // Front Wheels with visible COUNTER-STEER!
          // In drift, front wheels steer opposite to the slide angle:
          const steerAngle = -totalSlip * 0.75;
          // Left Front Wheel
          ctx.save();
          ctx.translate(7, -5.5);
          ctx.rotate(steerAngle);
          ctx.fillStyle = '#09090b';
          ctx.fillRect(-2, -1.5, 4.5, 3);
          ctx.restore();
          // Right Front Wheel
          ctx.save();
          ctx.translate(7, 5.5);
          ctx.rotate(steerAngle);
          ctx.fillStyle = '#09090b';
          ctx.fillRect(-2, -1.5, 4.5, 3);
          ctx.restore();

          // Chassis Body
          ctx.fillStyle = racer.primaryColor || '#ec4899';
          ctx.fillRect(-10, -5, 20, 10);
          ctx.fillStyle = racer.secondaryColor || '#09090b';
          ctx.fillRect(-6, -5, 12, 1);
          ctx.fillRect(-6, 4, 12, 1);

          // Cabin & Windshield
          ctx.fillStyle = '#09090b';
          ctx.fillRect(-4, -4, 9, 8);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-1, -3.5, 4, 7);

          // Spoiler
          ctx.fillStyle = racer.secondaryColor || '#18181b';
          ctx.fillRect(-11.5, -6, 2.5, 12);

          // Headlights
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(9, -4.5, 2, 2);
          ctx.fillRect(9, 2.5, 2, 2);

          // Taillights
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-10.5, -4, 1.5, 2);
          ctx.fillRect(-10.5, 2, 1.5, 2);

          // Pop & bangs backfire flames
          if ((isPlayerDrift || (frame + racer.rank * 5) % 8 === 0) && racer.speed > 130) {
            ctx.fillStyle = '#00f0ff';
            ctx.fillRect(-14, 2, 3.5, 2);
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(-13, 2, 2, 2);
          }

          ctx.restore();

          // 8. IDENTIFICATION BADGE + LETTER + DRIFT ANGLE PILL ABOVE CAR
          // Letter token badge (e.g. 'P' for player, or first letter of name)
          const letter = racer.tokenLetter || (racer.isPlayer ? 'P' : racer.name[0].toUpperCase());
          const badgeY = carY - 18;

          // Outer circular glow
          ctx.beginPath();
          ctx.arc(carX, badgeY, 9.5, 0, Math.PI * 2);
          ctx.fillStyle = racer.isPlayer ? 'rgba(56, 189, 248, 0.45)' : 'rgba(168, 85, 247, 0.35)';
          ctx.fill();

          // Token Ball Body
          ctx.beginPath();
          ctx.arc(carX, badgeY, 8.5, 0, Math.PI * 2);
          ctx.fillStyle = racer.primaryColor || '#ec4899';
          ctx.fill();
          ctx.strokeStyle = racer.isPlayer ? '#ffffff' : '#09090b';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Letter inside badge
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(letter, carX, badgeY + 0.5);

          // Rank Badge
          ctx.fillStyle = racer.rank === 1 ? '#eab308' : racer.rank === 2 ? '#94a3b8' : '#b45309';
          ctx.beginPath();
          ctx.arc(carX + 8.5, badgeY - 6, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 6.5px sans-serif';
          ctx.fillText(String(racer.rank), carX + 8.5, badgeY - 5.5);

          // Drift Angle Pill Tag
          ctx.fillStyle = isPlayerDrift ? '#ec4899' : '#0f172a';
          ctx.fillRect(carX - 16, badgeY + 10, 32, 9);
          ctx.strokeStyle = isPlayerDrift ? '#f43f5e' : '#334155';
          ctx.lineWidth = 1;
          ctx.strokeRect(carX - 16, badgeY + 10, 32, 9);

          ctx.fillStyle = isPlayerDrift ? '#ffffff' : '#38bdf8';
          ctx.font = 'bold 7px monospace';
          ctx.fillText(`∠${driftDegrees}°`, carX, badgeY + 14.5);
        });

        // 9. TOUGE LIVE LEADERBOARD (1º COLOCADO SEMPRE NO TOPO)
        // "e a ordem dos carros é representada por uma lista que deixa o primeiro sempre em cima"
        const sortedRacers = [...currentRacers].sort((a, b) => {
          if (a.progressPercent >= 100 && b.progressPercent >= 100) {
            return a.rank - b.rank;
          }
          return b.progressPercent - a.progressPercent;
        });

        const hudW = 162;
        const hudH = 88;
        const hudX = w - hudW - 12;
        const hudY = 10;

        ctx.fillStyle = 'rgba(11, 15, 25, 0.88)';
        ctx.fillRect(hudX, hudY, hudW, hudH);
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(hudX, hudY, hudW, hudH);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 7.5px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('TOUGE STANDINGS', hudX + 8, hudY + 13);
        ctx.fillStyle = '#64748b';
        ctx.font = '7px monospace';
        ctx.fillText('1º NO TOPO', hudX + hudW - 58, hudY + 13);

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hudX + 6, hudY + 17);
        ctx.lineTo(hudX + hudW - 6, hudY + 17);
        ctx.stroke();

        sortedRacers.forEach((r, rIdx) => {
          const rowY = hudY + 28 + rIdx * 15;
          const isP = r.isPlayer;

          if (rIdx === 0) {
            ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
            ctx.fillRect(hudX + 4, rowY - 7, hudW - 8, 14);
          } else if (isP) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
            ctx.fillRect(hudX + 4, rowY - 7, hudW - 8, 14);
          }

          ctx.fillStyle = rIdx === 0 ? '#eab308' : rIdx === 1 ? '#cbd5e1' : rIdx === 2 ? '#d97706' : '#64748b';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`${rIdx + 1}º`, hudX + 8, rowY + 3);

          ctx.beginPath();
          ctx.arc(hudX + 26, rowY, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = r.primaryColor || '#ec4899';
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 6px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(r.tokenLetter || (isP ? 'P' : r.name[0]), hudX + 26, rowY);

          ctx.textBaseline = 'alphabetic';
          ctx.textAlign = 'left';
          ctx.fillStyle = isP ? '#38bdf8' : '#f8fafc';
          ctx.font = isP ? 'bold 7px monospace' : '7px monospace';
          const truncatedName = r.name.length > 8 ? r.name.substring(0, 7) + '…' : r.name;
          ctx.fillText(truncatedName, hudX + 34, rowY + 3);

          ctx.textAlign = 'right';
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 7px monospace';
          ctx.fillText(`${r.speed}k`, hudX + hudW - 26, rowY + 3);

          ctx.fillStyle = r.progressPercent >= 100 ? '#eab308' : '#94a3b8';
          ctx.font = '7px monospace';
          ctx.fillText(r.progressPercent >= 100 ? '🏁' : `${Math.round(r.progressPercent)}%`, hudX + hudW - 6, rowY + 3);
        });

        // 10. VICTORY NOTIFICATION BANNER ON TRACK (WHEN PLAYER FINISHES)
        const playerRacer = currentRacers.find((r) => r.isPlayer);
        if (playerRacer && playerRacer.progressPercent >= 100) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.fillRect(w / 2 - 190, h - 34, 380, 26);
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(w / 2 - 190, h - 34, 380, 26);

          ctx.fillStyle = '#fde047';
          ctx.font = 'bold 8.5px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🏆 VOCÊ COMPLETOU! CLIQUE NO BOTÃO ABAIXO PARA RESGATAR O LOOT 🏆', w / 2, h - 21);
        }

      // =========================================================================
      // MODE 3: DERBY (ARENA DE DEMOLIÇÃO, VISTOS DE CIMA, QUEM TEM MENOS HP DURA MENOS)
      // "o derby são os carros tentando destruir um ao outro em formato de arena,
      // vistos de cima, onde quem tem menos HP dura menos"
      // =========================================================================
      } else if (currentTrack.id === 'derby') {
        // Enclosed Scrap Dirt Arena
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(0, 0, w, h);

        const arenaCenterX = w / 2;
        const arenaCenterY = h / 2;
        const arenaRadiusX = w * 0.42;
        const arenaRadiusY = h * 0.42;

        // Tire Barrier & Guardrail Perimeter
        ctx.beginPath();
        ctx.ellipse(arenaCenterX, arenaCenterY, arenaRadiusX + 16, arenaRadiusY + 16, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#292524';
        ctx.fill();
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Dirt Arena Floor
        ctx.beginPath();
        ctx.ellipse(arenaCenterX, arenaCenterY, arenaRadiusX, arenaRadiusY, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#44403c';
        ctx.fill();

        // Skid ruts & Mud patches
        ctx.strokeStyle = 'rgba(28, 25, 23, 0.4)';
        ctx.lineWidth = 6;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(arenaCenterX + (i - 2) * 50, arenaCenterY + (i % 2 === 0 ? 30 : -30), 40, 0, Math.PI);
          ctx.stroke();
        }

        // Flashing Warning Beacons around the arena perimeter
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          const bx = arenaCenterX + Math.cos(a) * (arenaRadiusX + 14);
          const by = arenaCenterY + Math.sin(a) * (arenaRadiusY + 14);
          ctx.fillStyle = (frame + Math.floor(a * 10)) % 20 < 10 ? '#f97316' : '#7c2d12';
          ctx.beginPath();
          ctx.arc(bx, by, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Simulate Arena Car Movement & Collisions
        currentRacers.forEach((racer, idx) => {
          const pos = carPosMap[racer.id];
          if (!pos) return;

          // If car is not wrecked, steer and move around
          if (!pos.wrecked && pos.hp > 0) {
            // Roam / Chase mechanics
            pos.x += pos.arenaVx;
            pos.y += pos.arenaVy;

            // Arena boundary bounce
            const dx = pos.x - arenaCenterX;
            const dy = pos.y - arenaCenterY;
            const distSq = (dx * dx) / (arenaRadiusX * arenaRadiusX) + (dy * dy) / (arenaRadiusY * arenaRadiusY);

            if (distSq > 0.85) {
              // Steer back towards center
              pos.arenaVx = -dx * 0.03 + (Math.random() - 0.5) * 1.5;
              pos.arenaVy = -dy * 0.03 + (Math.random() - 0.5) * 1.5;
            }

            // Ram other cars
            currentRacers.forEach((otherRacer, otherIdx) => {
              if (idx !== otherIdx) {
                const otherPos = carPosMap[otherRacer.id];
                if (otherPos && !otherPos.wrecked && otherPos.hp > 0) {
                  const cdx = otherPos.x - pos.x;
                  const cdy = otherPos.y - pos.y;
                  const distance = Math.sqrt(cdx * cdx + cdy * cdy);

                  if (distance < 28) {
                    // COLLISION IMPACT!
                    const speed = Math.sqrt(pos.arenaVx * pos.arenaVx + pos.arenaVy * pos.arenaVy);
                    const damage = 2 + Math.floor(speed * 3) + (racer.nitro ? 6 : 0);

                    // Rebound velocity
                    pos.arenaVx = -cdx * 0.15;
                    pos.arenaVy = -cdy * 0.15;
                    otherPos.arenaVx = cdx * 0.15;
                    otherPos.arenaVy = cdy * 0.15;

                    // Spark Particles at collision point
                    for (let s = 0; s < 5; s++) {
                      particles.push({
                        x: (pos.x + otherPos.x) / 2,
                        y: (pos.y + otherPos.y) / 2,
                        vx: (Math.random() - 0.5) * 6,
                        vy: (Math.random() - 0.5) * 6,
                        color: Math.random() > 0.5 ? '#f59e0b' : '#ef4444',
                        size: 3 + Math.random() * 3,
                        life: 0,
                        maxLife: 14
                      });
                    }
                  }
                }
              }
            });

            pos.angle = Math.atan2(pos.arenaVy, pos.arenaVx) + Math.PI / 2;
          } else {
            // Wrecked / Destroyed car stops moving and catches fire!
            pos.wrecked = true;
            if (frame % 3 === 0) {
              particles.push({
                x: pos.x + (Math.random() - 0.5) * 8,
                y: pos.y + (Math.random() - 0.5) * 8,
                vx: (Math.random() - 0.5) * 0.8,
                vy: -(1.5 + Math.random() * 2),
                color: Math.random() > 0.4 ? '#ef4444' : '#f97316',
                size: 4 + Math.random() * 3,
                life: 0,
                maxLife: 20
              });
            }
          }

          // Render Top-Down Car in Arena
          ctx.save();
          ctx.translate(pos.x, pos.y);
          ctx.rotate(pos.angle);

          // If racer has custom chassis equipped and not wrecked, render Top Asset ('top')
          let renderedCustom = false;
          if (racer.customPixelData && !pos.wrecked) {
            try {
              const parsed = JSON.parse(racer.customPixelData);
              if (parsed) {
                const mockCar: any = {
                  visuals: {
                    primaryColor: racer.primaryColor,
                    secondaryColor: racer.secondaryColor,
                    customPixelData: racer.customPixelData,
                    wheelStyle: racer.wheelStyle || 'spokes',
                    spoiler: racer.spoiler || 'gt_wing',
                    hasNeon: false,
                  }
                };
                // Ground shadow matching derby presence
                ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
                ctx.fillRect(-14, -18, 28, 36);

                // Heavy Derby Wheels on both sides
                ctx.fillStyle = '#000000';
                ctx.fillRect(-15, -13, 4, 7);
                ctx.fillRect(11, -13, 4, 7);
                ctx.fillRect(-15, 6, 4, 7);
                ctx.fillRect(11, 6, 4, 7);

                // Top asset length is horizontal (+X). Derby heading is along -Y.
                // Rotate by -Math.PI / 2 aligns the top asset's hood with forward movement!
                ctx.rotate(-Math.PI / 2);
                // Scale 0.75 makes custom top asset 48 * (0.75 * 64/48) = 48px long and 24px wide, matching procedural derby cars!
                drawCustomChassisCar(ctx, mockCar, 0, 0, 0.75, 'top', 0, frame, racer.nitro, false, parsed);
                ctx.restore();
                renderedCustom = true;
              }
            } catch {
              renderedCustom = false;
            }
          }

          if (!renderedCustom) {
            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.fillRect(-12, -16, 24, 32);

            const pCol = pos.wrecked ? '#262626' : (racer.primaryColor || '#ef4444');
            const sCol = pos.wrecked ? '#171717' : (racer.secondaryColor || '#000000');

            // Wheels
            ctx.fillStyle = '#000000';
            ctx.fillRect(-14, -13, 4, 7);
            ctx.fillRect(10, -13, 4, 7);
            ctx.fillRect(-14, 6, 4, 7);
            ctx.fillRect(10, 6, 4, 7);

            // Reinforced Derby Armor Bars & Battering Ram with Teeth
            ctx.fillStyle = pos.wrecked ? '#27272a' : '#ea580c';
            ctx.fillRect(-13, -18, 26, 4); // front steel rammer
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(-10, -20, 3, 2); // tooth 1
            ctx.fillRect(-1.5, -20, 3, 2); // tooth 2
            ctx.fillRect(7, -20, 3, 2);  // tooth 3
            ctx.fillStyle = '#3f3f46';
            ctx.fillRect(-12, 13, 24, 3);  // rear bumper

            // Body
            ctx.fillStyle = pCol;
            ctx.fillRect(-10, -14, 20, 28);

            // Armored Plates with rivets
            ctx.fillStyle = '#52525b';
            ctx.fillRect(-8, -13, 16, 6);
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(-7, -12, 1, 1);
            ctx.fillRect(6, -12, 1, 1);

            // Hood & Windshield
            ctx.fillStyle = pos.wrecked ? '#1c1917' : '#09090b';
            ctx.fillRect(-7, -4, 14, 6);
            ctx.fillStyle = pos.wrecked ? '#404040' : '#38bdf8';
            ctx.fillRect(-6, -3, 12, 4);

            // Roof with welded roll cage cross
            ctx.fillStyle = pCol;
            ctx.fillRect(-6, 3, 12, 7);
            ctx.strokeStyle = pos.wrecked ? '#52525b' : '#ea580c';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(-5, 4);
            ctx.lineTo(5, 9);
            ctx.moveTo(5, 4);
            ctx.lineTo(-5, 9);
            ctx.stroke();

            ctx.restore();
          }

          // HP BAR DISPLAY ABOVE CAR:
          // "onde quem tem menos HP dura menos"
          const barW = 44;
          const barH = 5;
          const hpPct = Math.max(0, Math.min(1, pos.hp / pos.maxHp));

          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(pos.x - barW / 2 - 1, pos.y - 28, barW + 2, barH + 2);

          ctx.fillStyle = hpPct > 0.5 ? '#10b981' : hpPct > 0.25 ? '#f59e0b' : '#ef4444';
          ctx.fillRect(pos.x - barW / 2, pos.y - 27, barW * hpPct, barH);

          // Label: HP and status
          ctx.fillStyle = pos.wrecked ? '#ef4444' : '#ffffff';
          ctx.font = 'bold 7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(
            pos.wrecked ? 'DESTRUÍDO' : `${Math.round(pos.hp)}/${pos.maxHp} HP`,
            pos.x,
            pos.y - 31
          );
        });

      // =========================================================================
      // MODE 4: STANDARD HORIZONTAL TRACK (CORRIDA / RALLY)
      // "ao invés de trocar a posição dos números no carro entre primeiro e quarto colocados,
      // deveria mover os carros para as linhas de cima até a linha de baixo,
      // de forma que o primeiro fique sempre em cima e o quarto fique sempre em baixo."
      // =========================================================================
      } else {
        // Horizon / Parallax Scenery
        const horizonY = Math.floor(h * 0.42);
        ctx.fillStyle = currentTrack.palette.sky;
        ctx.fillRect(0, 0, w, horizonY);
        ctx.fillStyle = currentTrack.palette.ground;
        ctx.fillRect(0, horizonY, w, h - horizonY);

        // Distant scenery backdrop
        const bgOffset = (scrollOffset * 0.2) % 60;
        for (let x = -60; x < w + 60; x += 30) {
          const heightVar = Math.sin((x + scrollOffset * 0.05) * 0.03) * 20 + 25;
          if (currentTrack.id === 'rally') {
            ctx.beginPath();
            ctx.arc(x - bgOffset + 20, horizonY + 10, 35, Math.PI, 0);
            ctx.fillStyle = '#92400e';
            ctx.fill();
          } else {
            ctx.fillStyle = '#090d16';
            ctx.fillRect(x - bgOffset, horizonY - heightVar, 24, heightVar);
            ctx.fillStyle = (frame + x) % 2 === 0 ? '#38bdf8' : '#eab308';
            ctx.fillRect(x - bgOffset + 4, horizonY - heightVar + 4, 3, 3);
          }
        }

        // Racetrack Lanes (4 horizontal lanes)
        const isRally = currentTrack.id === 'rally';
        const trackTop = horizonY + 16;
        const trackHeight = h - trackTop - 14;
        const laneHeight = trackHeight / 4;

        ctx.fillStyle = currentTrack.palette.track;
        ctx.fillRect(0, trackTop, w, trackHeight);

        // Curbs - scroll direction based on race mode
        const curbSize = 14;
        const curbScrollMult = isRally ? -1 : 1;
        const curbOffset = ((Math.floor(scrollOffset * 2 * curbScrollMult) % (curbSize * 2)) + (curbSize * 2)) % (curbSize * 2);
        for (let x = -curbSize * 2; x < w + curbSize * 2; x += curbSize * 2) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x - curbOffset, trackTop - 6, curbSize, 6);
          ctx.fillRect(x - curbOffset, trackTop + trackHeight, curbSize, 6);

          ctx.fillStyle = currentTrack.palette.border;
          ctx.fillRect(x - curbOffset + curbSize, trackTop - 6, curbSize, 6);
          ctx.fillRect(x - curbOffset + curbSize, trackTop + trackHeight, curbSize, 6);
        }

        // Dashed horizontal lane dividers
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        const dashW = 20;
        const dashGap = 20;
        const dashOffset = ((Math.floor(scrollOffset * 3 * curbScrollMult) % (dashW + dashGap)) + (dashW + dashGap)) % (dashW + dashGap);

        for (let lane = 1; lane < 4; lane++) {
          const ly = trackTop + lane * laneHeight;
          for (let x = -dashW; x < w + dashW; x += dashW + dashGap) {
            ctx.fillRect(x - dashOffset, ly - 1, dashW, 3);
          }
        }

        // REORDERING LANES FROM TOP TO BOTTOM:
        // "ao invés de trocar a posição dos números no carro entre primeiro e quarto colocados,
        // deveria mover os carros para as linhas de cima até a linha de baixo,
        // de forma que o primeiro fique sempre em cima e o quarto fique sempre em baixo."
        currentRacers.forEach((racer) => {
          const pos = carPosMap[racer.id];
          if (!pos) return;

          // Target lane based strictly on rank:
          // Rank 1 -> lane 0 (top line)
          // Rank 2 -> lane 1
          // Rank 3 -> lane 2
          // Rank 4 -> lane 3 (bottom line)
          const targetLaneIndex = Math.max(0, Math.min(3, racer.rank - 1));
          const targetY = trackTop + targetLaneIndex * laneHeight + laneHeight / 2;

          // Horizontal progress X:
          // In Corrida (standard): left to right (start ~70px, finish ~w - 110px)
          // In Rally: REVERSED direction! (start ~w - 70px, finish ~110px on the left)
          const baseMinX = 70;
          const baseMaxX = w - 110;
          const targetX = isRally
            ? (w - 70) - (racer.progressPercent / 100) * (w - 180)
            : baseMinX + (racer.progressPercent / 100) * (baseMaxX - baseMinX);

          // Smooth interpolation so cars steer between lanes when rank changes!
          pos.y += (targetY - pos.y) * 0.08;
          pos.x += (targetX - pos.x) * 0.12;

          const carX = Math.max(50, Math.min(w - 70, pos.x));
          const carY = pos.y + Math.sin(frame * 0.2 + racer.rank) * 1.5;

          // Spawn exhaust / dirt particles
          if (frame % 2 === 0) {
            if (racer.nitro) {
              particles.push({
                x: isRally ? carX + 25 : carX - 25,
                y: carY + 2,
                vx: isRally ? (3 + Math.random() * 3) : -(3 + Math.random() * 3),
                vy: (Math.random() - 0.5) * 2,
                color: Math.random() > 0.4 ? '#38bdf8' : '#f59e0b',
                size: 3 + Math.random() * 2,
                life: 0,
                maxLife: 14
              });
            } else if (isRally) {
              // Rally mud and dirt shooting backwards (to the right)
              particles.push({
                x: carX + 22,
                y: carY + 5,
                vx: 1 + Math.random() * 2.5,
                vy: (Math.random() - 0.5) * 2,
                color: '#b45309',
                size: 2 + Math.random() * 3,
                life: 0,
                maxLife: 16
              });
            }
          }

          // Player Underglow
          if (racer.isPlayer) {
            ctx.save();
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#00f0ff';
            ctx.fillRect(carX - 22, carY + 7, 44, 2);
            ctx.restore();
          }

          // Draw Detailed Side-View Car:
          // In Corrida: use 'right' asset
          // In Rally: use 'left' asset (facing left along reversed course!)
          drawSideCar(ctx, carX, carY, racer, false, 0, isRally ? 'left' : 'right');

          // HUD Tag: 1st place in top line, 4th place in bottom line!
          ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.fillRect(carX - 28, carY - 24, 56, 12);
          ctx.strokeStyle = racer.isPlayer ? '#38bdf8' : '#475569';
          ctx.lineWidth = 1;
          ctx.strokeRect(carX - 28, carY - 24, 56, 12);

          ctx.fillStyle = racer.isPlayer ? '#38bdf8' : '#f8fafc';
          ctx.font = 'bold 7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(racer.name.substring(0, 8), carX - 4, carY - 15);

          // Rank Badge
          ctx.fillStyle = racer.rank === 1 ? '#eab308' : racer.rank === 2 ? '#94a3b8' : '#b45309';
          ctx.fillRect(carX + 16, carY - 23, 11, 10);
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 8px sans-serif';
          ctx.fillText(String(racer.rank), carX + 21, carY - 15);
        });

        // Finish Line
        // In Corrida: finish line is on the right
        // In Rally: finish line is on the left
        const finishX = isRally ? 36 : (w - 40);
        const checkSize = 8;
        for (let y = trackTop; y < trackTop + trackHeight; y += checkSize) {
          ctx.fillStyle = (Math.floor(y / checkSize) % 2 === 0) ? '#ffffff' : '#000000';
          ctx.fillRect(finishX, y, checkSize, checkSize);
          ctx.fillStyle = (Math.floor(y / checkSize) % 2 === 1) ? '#ffffff' : '#000000';
          ctx.fillRect(finishX + checkSize, y, checkSize, checkSize);
        }
      }

      // 4. PARTICLES UPDATE & DRAW (Common across all modes)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        if (p.isSmoke) {
          const currentRadius = p.size * (1 + (p.life / p.maxLife) * 1.8);
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha * 0.72;
          ctx.fill();
        } else {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.globalAlpha = 1.0;

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      // 5. LIVE ARRIVAL LEADERBOARD OVERLAY (TOP-RIGHT CORNER)
      // "a ordem dos carros é representada por uma lista que deixa o primeiro sempre em cima na ordem de chegada"
      const sortedByRank = [...currentRacers].sort((a, b) => a.rank - b.rank);
      const boardW = 160;
      const boardH = 18 + sortedByRank.length * 14;
      const boardX = w - boardW - 10;
      const boardY = 10;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(boardX, boardY, boardW, boardH);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(boardX, boardY, boardW, boardH);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('ORDEM DE CHEGADA', boardX + 6, boardY + 12);

      sortedByRank.forEach((racer, rIdx) => {
        const rowY = boardY + 24 + rIdx * 14;
        const letter = racer.tokenLetter || (racer.isPlayer ? 'P' : racer.name[0].toUpperCase());

        // Rank badge
        ctx.fillStyle = racer.rank === 1 ? '#eab308' : racer.rank === 2 ? '#94a3b8' : '#b45309';
        ctx.fillRect(boardX + 6, rowY - 8, 12, 10);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${racer.rank}º`, boardX + 12, rowY);

        // Letter pill
        ctx.fillStyle = racer.primaryColor || '#ec4899';
        ctx.fillRect(boardX + 22, rowY - 8, 10, 10);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 7px monospace';
        ctx.fillText(letter, boardX + 27, rowY);

        // Name
        ctx.fillStyle = racer.isPlayer ? '#38bdf8' : racer.wrecked ? '#ef4444' : '#ffffff';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(racer.name.substring(0, 9), boardX + 36, rowY);

        // Metric (HP or Speed or %)
        ctx.fillStyle = '#10b981';
        ctx.font = '7px monospace';
        ctx.textAlign = 'right';
        if (currentTrack.id === 'derby') {
          ctx.fillText(racer.wrecked ? 'WRECK' : `${Math.round(racer.hp || 0)}HP`, boardX + boardW - 6, rowY);
        } else {
          ctx.fillText(`${Math.round(racer.progressPercent)}%`, boardX + boardW - 6, rowY);
        }
      });

      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-2xl ${className}`}>
      <canvas
        ref={canvasRef}
        width={760}
        height={290}
        className="w-full h-auto block image-rendering-pixelated"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};
