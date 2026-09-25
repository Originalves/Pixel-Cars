import React from 'react';
import { CarCanvas } from './CarCanvas';
import { CarBodyType } from '../types';

export type SilhouetteChassisType = CarBodyType | string;

export interface ChassisSilhouetteCanvasProps {
  bodyType: SilhouetteChassisType;
  primaryColor?: string;
  secondaryColor?: string;
  width?: number;
  height?: number;
  selected?: boolean;
  interactive?: boolean;
  showGround?: boolean;
  className?: string;
  badgeLabel?: string;
  onClick?: () => void;
}

export const ChassisSilhouetteCanvas: React.FC<ChassisSilhouetteCanvasProps> = ({
  bodyType,
  primaryColor = '#3b82f6',
  secondaryColor = '#0f172a',
  width = 160,
  height = 68,
  selected = false,
  interactive = true,
  showGround = true,
  className = '',
  badgeLabel,
  onClick
}) => {
  return (
    <div className="relative inline-flex flex-col items-center">
      <CarCanvas
        bodyType={bodyType}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        width={width}
        height={height}
        selected={selected}
        interactive={interactive}
        showShadow={showGround}
        showWheels={true}
        showDetails={true}
        className={className}
        onClick={onClick}
      />
      {badgeLabel && (
        <span className="absolute bottom-1 right-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900/90 text-amber-400 border border-slate-700">
          {badgeLabel}
        </span>
      )}
    </div>
  );
};

export default ChassisSilhouetteCanvas;
