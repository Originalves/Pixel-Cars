import React from 'react';
import { CarStats } from '../types';

interface CarTelemetryClusterProps {
  stats: CarStats;
  baseStats: CarStats;
  carName?: string;
  rarity?: string;
  className?: string;
}

export const CarTelemetryCluster: React.FC<CarTelemetryClusterProps> = ({
  stats,
  baseStats,
  className = ''
}) => {
  // Metric configurations
  const metrics = [
    {
      key: 'topSpeed',
      label: 'VELOCIDADE MÁXIMA',
      unit: 'KM/H',
      current: stats.topSpeed,
      base: baseStats.topSpeed,
      max: 45,
      scaleFactor: 6.5, // 45 -> ~292 km/h
      colorClass: 'text-amber-400',
      barFillClass: 'bg-amber-400',
      desc: 'Pico em reta longa'
    },
    {
      key: 'acceleration',
      label: 'ACELERAÇÃO 0-100',
      unit: 'ÍNDICE ACC',
      current: stats.acceleration,
      base: baseStats.acceleration,
      max: 45,
      scaleFactor: 1,
      colorClass: 'text-emerald-400',
      barFillClass: 'bg-emerald-400',
      desc: 'Tempo de arrancada'
    },
    {
      key: 'torque',
      label: 'TORQUE DINAMÔMETRO',
      unit: 'Nm',
      current: stats.torque,
      base: baseStats.torque,
      max: 45,
      scaleFactor: 12,
      colorClass: 'text-rose-400',
      barFillClass: 'bg-rose-400',
      desc: 'Força de retomada e subida'
    },
    {
      key: 'durability',
      label: 'BLINDAGEM ESTRUTURAL',
      unit: 'HP',
      current: stats.durability || 100,
      base: baseStats.durability || 100,
      max: 200,
      scaleFactor: 1,
      colorClass: 'text-sky-400',
      barFillClass: 'bg-sky-400',
      desc: 'Integridade em colisão'
    }
  ];

  return (
    <div className={`bg-slate-950/90 border border-slate-800 rounded-xl p-3 sm:p-4 font-mono select-none ${className}`}>
      {/* Cluster Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80 text-[10px] text-slate-400">
        <span className="font-bold uppercase tracking-wider text-slate-300">
          TELEMETRIA DINAMÔMETRO
        </span>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400/90 font-bold">
          ECU MAP: RACING SPORT
        </span>
      </div>

      {/* Grid of 4 segmented telemetry channels */}
      <div className="space-y-3">
        {metrics.map((m) => {
          const ratio = Math.min(100, Math.max(8, (m.current / m.max) * 100));
          const bonus = m.current - m.base;
          const displayValue = m.key === 'topSpeed'
            ? Math.round(m.current * m.scaleFactor)
            : m.key === 'torque'
            ? Math.round(m.current * m.scaleFactor)
            : m.current;

          return (
            <div key={m.key} className="space-y-1">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-[11px] font-bold text-slate-300 tracking-tight">
                  {m.label}
                </span>

                <div className="flex items-baseline gap-1.5">
                  <span className={`text-sm font-black ${m.colorClass}`}>
                    {displayValue} <span className="text-[10px] font-medium text-slate-400">{m.unit}</span>
                  </span>
                  {bonus > 0 && (
                    <span className="text-[10px] text-emerald-400 font-bold">
                      (+{bonus})
                    </span>
                  )}
                </div>
              </div>

              {/* Segmented LED Bar */}
              <div className="h-2 w-full bg-slate-900 rounded-sm overflow-hidden flex gap-0.5 p-0.5 border border-slate-800/60">
                {Array.from({ length: 24 }).map((_, i) => {
                  const stepPercent = (i + 1) * (100 / 24);
                  const isLit = ratio >= stepPercent;
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-[1px] transition-colors duration-150 ${
                        isLit ? m.barFillClass : 'bg-slate-800/50'
                      }`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-400">
                <span>{m.desc}</span>
                <span>Base: {m.base}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
