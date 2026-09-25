import React, { useState } from 'react';
import { Sparkles, Coins, Banknote, HelpCircle, Flame, Check, AlertCircle } from 'lucide-react';
import { Car } from '../types';
import { rollJunkyardCar } from '../data/gameData';
import { PixelCarCanvas } from './PixelCarCanvas';

interface JunkyardGachaViewProps {
  playerCoins: number;
  playerCash: number;
  onCarAcquired: (car: Car, costType: 'coins' | 'cash', costAmount: number) => void;
}

const COIN_COST = 250;
const CASH_COST = 5;

export const JunkyardGachaView: React.FC<JunkyardGachaViewProps> = ({
  playerCoins,
  playerCash,
  onCarAcquired
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pulledCar, setPulledCar] = useState<Car | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePull = (currency: 'coins' | 'cash') => {
    setErrorMessage(null);
    if (currency === 'coins' && playerCoins < COIN_COST) {
      setErrorMessage(`Moedas insuficientes! Você precisa de ${COIN_COST} moedas.`);
      return;
    }
    if (currency === 'cash' && playerCash < CASH_COST) {
      setErrorMessage(`Cash insuficiente! Você precisa de ${CASH_COST} cash.`);
      return;
    }

    setIsPulling(true);
    setPulledCar(null);

    // Gacha rolling delay for dramatic suspense
    setTimeout(() => {
      const newCar = rollJunkyardCar();
      setPulledCar(newCar);
      setIsPulling(false);
      onCarAcquired(newCar, currency, currency === 'coins' ? COIN_COST : CASH_COST);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Ambient Rust Glow */}
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border bg-amber-950/40 text-amber-400 border-amber-500/40">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gacha Misterioso de Baixo Custo</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white font-mono">
            Ferro-Velho & Celeiro Abandonado (Gacha)
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Puxe carros misteriosos por um valor simbólico de Moedas ou Cash. Os carros vêm aleatórios com atributos únicos sorteados, desde relíquias enferrujadas até verdadeiras joias raras tunadas escondidas na sucata!
          </p>
        </div>

        {/* PULL STAGE */}
        <div className="my-6 p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center min-h-[220px] relative text-center">
          {isPulling ? (
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mx-auto" />
              <div className="text-sm font-black font-mono text-amber-400 animate-pulse">
                Vasculhando Galpões & Sucata...
              </div>
              <p className="text-[11px] text-slate-500 font-mono">Sorteando lataria, motor e ano de fabricação...</p>
            </div>
          ) : pulledCar ? (
            <div className="space-y-3 animate-fade-in">
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
                pulledCar.rarity === 'epic' ? 'bg-purple-950 text-purple-300 border-purple-500' :
                pulledCar.rarity === 'rare' ? 'bg-sky-950 text-sky-300 border-sky-500' :
                'bg-amber-950 text-amber-300 border-amber-500'
              }`}>
                {pulledCar.condition === 'barn_find' ? '📦 Relíquia de Celeiro' :
                 pulledCar.condition === 'derby_beaten' ? '🔨 Sucata de Batida' : '⭐ Joia Tunada!'}
              </span>

              <PixelCarCanvas car={pulledCar} width={220} height={90} scale={3.5} animated showNitro={pulledCar.rarity === 'epic'} />

              <div>
                <h3 className="text-lg font-black font-mono text-white">{pulledCar.name}</h3>
                <div className="flex items-center justify-center gap-3 text-xs font-mono text-slate-300 mt-1">
                  <span>Vel: <strong className="text-sky-400">{pulledCar.baseStats.topSpeed}</strong></span>
                  <span>Ace: <strong className="text-emerald-400">{pulledCar.baseStats.acceleration}</strong></span>
                  <span>Tor: <strong className="text-rose-400">{pulledCar.baseStats.torque}</strong></span>
                </div>
              </div>

              <div className="text-[11px] text-emerald-400 font-mono flex items-center justify-center gap-1">
                <Check className="w-4 h-4" />
                <span>Carro adicionado à sua Garagem!</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-amber-400">
                <HelpCircle className="w-8 h-8" />
              </div>
              <div className="text-sm font-black font-mono text-slate-300">
                Pronto para o Próximo Achado de Celeiro?
              </div>
              <p className="text-xs text-slate-500 max-w-sm">
                Carros repetidos podem ser sacrificados no <strong>Desmanche</strong> para gerar peças e sucata!
              </p>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="p-3 mb-4 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PULL BUTTONS (COINS VS CASH) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => handlePull('coins')}
            disabled={isPulling}
            className="p-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border border-amber-500/50 text-slate-950 font-black font-mono transition-all active:scale-98 cursor-pointer shadow-lg shadow-amber-600/20 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-left">
              <Coins className="w-6 h-6 text-slate-950" />
              <div>
                <div className="text-xs uppercase tracking-wider text-amber-950 font-bold">Puxar com Moedas do Jogo</div>
                <div className="text-sm">Gacha Normal</div>
              </div>
            </div>
            <div className="text-base font-black text-slate-950">{COIN_COST} Moedas</div>
          </button>

          <button
            onClick={() => handlePull('cash')}
            disabled={isPulling}
            className="p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 border border-emerald-500/50 text-white font-black font-mono transition-all active:scale-98 cursor-pointer shadow-lg shadow-emerald-600/20 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-left">
              <Banknote className="w-6 h-6 text-emerald-200" />
              <div>
                <div className="text-xs uppercase tracking-wider text-emerald-200 font-bold">Puxar com Cash (RMT)</div>
                <div className="text-sm">Gacha Premium</div>
              </div>
            </div>
            <div className="text-base font-black text-emerald-200">{CASH_COST} Cash</div>
          </button>
        </div>
      </div>
    </div>
  );
};
