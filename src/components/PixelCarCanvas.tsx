import React, { useEffect, useRef } from 'react';
import { Car } from '../types';
import {
  drawSideViewCar,
  drawFrontViewCar,
  drawRearViewCar,
  drawIsometricCityCar,
  drawTopDownCar,
  drawRotatedCar,
  drawCustomChassisCar,
  ViewAngle
} from '../utils/pixelCarEngine';

interface PixelCarCanvasProps {
  car: Car;
  width?: number;
  height?: number;
  scale?: number;
  showNitro?: boolean;
  animated?: boolean;
  className?: string;
  viewMode?: ViewAngle | 'rotation';
  rotationAngle?: number; // 0 to 360 degrees
}

export const PixelCarCanvas: React.FC<PixelCarCanvasProps> = ({
  car,
  width = 160,
  height = 80,
  scale = 3,
  showNitro = false,
  animated = false,
  className = '',
  viewMode = 'side',
  rotationAngle = 90
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = false;

      // Auto-fit scale to canvas boundaries with safe padding (car width ~86 units, height ~25 units)
      const maxAllowedScale = Math.min(width / 88, height / 26);
      const effectiveScale = Math.max(0.8, Math.min(scale, maxAllowedScale));

      const cx = Math.floor(width / 2);
      const cy = Math.floor(height / 2);

      // If custom player pixel chassis is equipped, use high-fidelity custom chassis engine with wheels & accessories!
      if (car.visuals.customPixelData) {
        drawCustomChassisCar(
          ctx,
          car,
          cx,
          cy,
          effectiveScale,
          viewMode,
          rotationAngle,
          frame,
          showNitro,
          animated
        );

        if (animated) {
          animFrameRef.current = requestAnimationFrame(render);
        }
        return;
      }

      if (viewMode === 'top') {
        drawTopDownCar(ctx, car, cx, cy, effectiveScale, frame, showNitro);
      } else if (viewMode === 'isometric') {
        drawIsometricCityCar(ctx, car, cx, cy, effectiveScale, frame, showNitro, animated);
      } else if (viewMode === 'front') {
        drawFrontViewCar(ctx, car, cx, cy, effectiveScale, frame, animated);
      } else if (viewMode === 'rear') {
        drawRearViewCar(ctx, car, cx, cy, effectiveScale, frame, animated);
      } else if (viewMode === 'rotation') {
        drawRotatedCar(ctx, car, cx, cy, effectiveScale, rotationAngle, frame, showNitro, animated);
      } else if (viewMode === 'left') {
        ctx.save();
        ctx.translate(cx, 0);
        ctx.scale(-1, 1);
        ctx.translate(-cx, 0);
        drawSideViewCar(ctx, car, cx, cy, effectiveScale, frame, showNitro, animated);
        ctx.restore();
      } else {
        // Default: Iconic Side Profile Blueprint (facing right)
        drawSideViewCar(ctx, car, cx, cy, effectiveScale, frame, showNitro, animated);
      }

      if (animated) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [car, width, height, scale, showNitro, animated, viewMode, rotationAngle]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`image-rendering-pixelated ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
};
