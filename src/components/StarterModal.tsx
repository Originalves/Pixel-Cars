import React from 'react';
import { Sparkles, Trophy, Flame, Gauge, Zap, Shield, CheckCircle2 } from 'lucide-react';
import { Car, StarterTier } from '../types';
import { PixelCarCanvas } from './PixelCarCanvas';

interface StarterModalProps {
  car: Car;
  tier: StarterTier;
  onClose: () => void;
  onReroll: () => void;
}

export const StarterModal: React.FC<StarterModalProps> = ({
  car,
  tier,
  onClose,
  onReroll
}) => {
  const isLegendary = tier === 'legendary_balanced';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 rounded-2xl p-6 shadow-2xl overflow-hidden text-center border-slate-700">
        {/* Glow Header */}
        <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
          isLegendary ? 'bg-amber-500/30' : 'bg-blue-500/20'
        }`} />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border bg-slate-800/80 text-amber-400 border-amber-500/40">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Distribuição de Conta Nova</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
            {isLegendary ? '⭐ SORTE MÁXIMA (10%)! ⭐' : 'SEU CARRO INICIAL!'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Ao criar a conta, os atributos básicos são sorteados com probabilidades reais fixas:
          </p>

          {/* Probability Matrix Indicator */}
          <div className="grid grid-cols-4 gap-1.5 my-4 text-[10px] text-left">
            <div className={`p-2 rounded-lg border ${tier === 'torque_focus' ? 'bg-rose-950/60 border-rose-500 text-rose-300 ring-1 ring-rose-500' : 'bg-slate-950/40 border-slate-800 text-slate-400'}`}>
              <div className="font-bold">30% Muscle</div>
              <div className="font-mono text-[9px]">10/10/20</div>
            </div>
            <div className={`p-2 rounded-lg border ${tier === 'speed_focus' ? 'bg-sky-950/60 border-sky-500 text-sky-300 ring-1 ring-sky-500' : 'bg-slate-950/40 border-slate-800 text-slate-400'}`}>
              <div className="font-bold">30% Speed</div>
              <div className="font-mono text-[9px]">20/10/10</div>
            </div>
            <div className={`p-2 rounded-lg border ${tier === 'accel_focus' ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500' : 'bg-slate-950/40 border-slate-800 text-slate-400'}`}>
              <div className="font-bold">30% Accel</div>
              <div className="font-mono text-[9px]">10/20/10</div>
            </div>
            <div className={`p-2 rounded-lg border ${tier === 'legendary_balanced' ? 'bg-amber-950/70 border-amber-500 text-amber-300 ring-1 ring-amber-500' : 'bg-slate-950/40 border-slate-800 text-slate-400'}`}>
              <div className="font-bold text-amber-400">10% Apex</div>
              <div className="font-mono text-[9px]">15/15/15</div>
            </div>
          </div>

          {/* Rolled Car Preview */}
          <div className="my-3 py-4 px-2 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
            <PixelCarCanvas car={car} width={240} height={100} scale={4} animated showNitro={isLegendary} />
            <div className="mt-2 text-base font-black text-white font-mono">{car.name}</div>
            <div className="text-xs text-amber-400 font-medium">
              {tier === 'torque_focus' && 'Build Torque Máximo (10 Top Speed / 10 Accel / 20 Torque)'}
              {tier === 'speed_focus' && 'Build Velocidade Final (20 Top Speed / 10 Accel / 10 Torque)'}
              {tier === 'accel_focus' && 'Build Arrancada & Drift (10 Top Speed / 20 Accel / 10 Torque)'}
              {tier === 'legendary_balanced' && '⭐ Protótipo Raro (15 Top Speed / 15 Accel / 15 Torque) ⭐'}
            </div>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-3 gap-2 my-4">
            <div className="bg-slate-800/60 border border-slate-700/60 p-2 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mb-0.5">
                <Gauge className="w-3.5 h-3.5 text-sky-400" />
                <span>Top Speed</span>
              </div>
              <div className="text-lg font-black font-mono text-sky-400">{car.baseStats.topSpeed}</div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-2 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mb-0.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Aceleração</span>
              </div>
              <div className="text-lg font-black font-mono text-emerald-400">{car.baseStats.acceleration}</div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-2 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mb-0.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>Torque</span>
              </div>
              <div className="text-lg font-black font-mono text-rose-400">{car.baseStats.torque}</div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
            <button
              onClick={onReroll}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Testar Outro Sorteio (Reroll)
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 text-xs font-black transition-transform active:scale-95 cursor-pointer shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Acelerar com Este Carro!</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
