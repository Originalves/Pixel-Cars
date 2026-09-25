import React, { useState } from 'react';
import { ShoppingBag, Coins, Banknote, ShieldCheck, Gauge, Zap, Flame, Check, AlertCircle, Eye } from 'lucide-react';
import { Car } from '../types';
import { DEALERSHIP_CARS, CHASSIS_DEFINITIONS } from '../data/gameData';
import { PixelCarCanvas } from './PixelCarCanvas';
import { CarCanvas } from './CarCanvas';

interface DealershipViewProps {
  playerCoins: number;
  playerCash: number;
  onBuyCar: (car: Car, currency: 'coins' | 'cash', price: number) => void;
}

export const DealershipView: React.FC<DealershipViewProps> = ({
  playerCoins,
  playerCash,
  onBuyCar
}) => {
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeViewModes, setActiveViewModes] = useState<Record<number, 'pixel' | 'silhouette'>>({});

  const toggleViewMode = (idx: number) => {
    setActiveViewModes(prev => ({
      ...prev,
      [idx]: prev[idx] === 'silhouette' ? 'pixel' : 'silhouette'
    }));
  };

  const handlePurchase = (
    template: typeof DEALERSHIP_CARS[0],
    currency: 'coins' | 'cash',
    price: number
  ) => {
    setErrorMessage(null);
    setPurchaseSuccess(null);

    if (currency === 'coins' && playerCoins < price) {
      setErrorMessage(`Moedas insuficientes para comprar o ${template.name}!`);
      return;
    }
    if (currency === 'cash' && playerCash < price) {
      setErrorMessage(`Cash insuficiente para comprar o ${template.name}!`);
      return;
    }

    const newCar: Car = {
      ...template,
      id: 'dealer_' + Math.random().toString(36).substring(2, 9),
      equippedParts: {},
      totalRaces: 0,
      wins: 0,
      acquiredAt: Date.now()
    };

    onBuyCar(newCar, currency, price);
    setPurchaseSuccess(`Parabéns! ${template.name} adquirido e enviado para sua Garagem!`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="max-w-2xl mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border bg-sky-950/40 text-sky-400 border-sky-500/40">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Concessionária Oficial 0KM</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white font-mono">
            Loja Oficial de Fábrica (Preço Cheio)
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Diferente do Ferro Velho aleatório, aqui você adquire veículos topo de linha com especificações garantidas, pinturas exclusivas e desempenho máximo. Preços mais altos, disponíveis tanto em Moedas quanto em Cash.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 mb-4 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {purchaseSuccess && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{purchaseSuccess}</span>
          </div>
        )}

        {/* SHOWROOM CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEALERSHIP_CARS.map((carTpl, idx) => {
            // Price formula based on rarity and stats
            const coinPrice = 2800 + idx * 1800;
            const cashPrice = 45 + idx * 35;

            // Mock car object for canvas rendering
            const mockCar: Car = {
              ...carTpl,
              id: 'preview_' + idx,
              equippedParts: {},
              totalRaces: 0,
              wins: 0,
              acquiredAt: 0
            };

            return (
              <div
                key={idx}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-black font-mono text-white">{carTpl.name}</span>
                    <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${
                      carTpl.rarity === 'legendary' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' :
                      carTpl.rarity === 'epic' ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' :
                      'bg-sky-500/20 text-sky-300 border-sky-500/50'
                    }`}>
                      {carTpl.rarity}
                    </span>
                  </div>

                  <div className="relative py-3 px-2 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center my-2 min-h-[96px]">
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        type="button"
                        onClick={() => toggleViewMode(idx)}
                        className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700 flex items-center gap-1 transition-colors"
                        title="Alternar entre vista isométrica Sergio Silvarto e perfil lateral"
                      >
                        <Eye className="w-2.5 h-2.5" />
                        {activeViewModes[idx] === 'silhouette' ? 'Lateral' : 'Isométrico'}
                      </button>
                    </div>

                    {activeViewModes[idx] === 'silhouette' ? (
                      <CarCanvas
                        bodyType={carTpl.visuals.bodyType}
                        primaryColor={carTpl.visuals.primaryColor}
                        secondaryColor={carTpl.visuals.secondaryColor}
                        width={200}
                        height={76}
                        animated
                        showWheels
                        showShadow
                        showDetails
                      />
                    ) : (
                      <PixelCarCanvas car={mockCar} width={180} height={75} scale={3} animated showNitro />
                    )}
                  </div>

                  {/* Chassis & Bodywork Spec */}
                  {(() => {
                    const chDef = CHASSIS_DEFINITIONS.find(c => c.id === carTpl.visuals.bodyType);
                    return (
                      <div className="flex items-center justify-between text-[10px] font-mono bg-slate-900/90 px-2 py-1.5 rounded-lg border border-slate-800/80 my-2">
                        <span className="flex items-center gap-1.5 text-slate-200 font-bold">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: chDef?.iconAccent || '#f59e0b' }}
                          />
                          Chassi: {chDef?.name || carTpl.visuals.bodyType}
                        </span>
                        <span className="text-amber-400/90 text-[9px] font-semibold">{chDef?.category || 'Sport'}</span>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-300 my-3">
                    <div className="bg-slate-900/90 p-1.5 rounded flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-sky-400" />
                      <span>Spd: {carTpl.baseStats.topSpeed}</span>
                    </div>
                    <div className="bg-slate-900/90 p-1.5 rounded flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      <span>Acc: {carTpl.baseStats.acceleration}</span>
                    </div>
                    <div className="bg-slate-900/90 p-1.5 rounded flex items-center gap-1">
                      <Flame className="w-3 h-3 text-rose-400" />
                      <span>Tor: {carTpl.baseStats.torque}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handlePurchase(carTpl, 'coins', coinPrice)}
                    className="py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>{coinPrice.toLocaleString()} Moedas</span>
                  </button>

                  <button
                    onClick={() => handlePurchase(carTpl, 'cash', cashPrice)}
                    className="py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{cashPrice} Cash</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
