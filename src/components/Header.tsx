import React from 'react';
import { Coins, Banknote, Wrench, Wifi, WifiOff, PlusCircle, RefreshCw, Trophy, Download } from 'lucide-react';
import { Car, StarterTier } from '../types';

interface HeaderProps {
  coins: number;
  cash: number;
  scrapMetal: number;
  activeCar?: Car;
  wsConnected: boolean;
  onAddFunds: () => void;
  onRerollStarter: () => void;
  starterTier?: StarterTier;
}

export const Header: React.FC<HeaderProps> = ({
  coins,
  cash,
  scrapMetal,
  activeCar,
  wsConnected,
  onAddFunds,
  onRerollStarter,
  starterTier
}) => {
  return (
    <header className="w-full bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-40 px-3 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Server Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center font-black text-black text-xs shadow-lg shadow-amber-500/20">
              <Trophy className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-wider text-slate-100 font-mono flex items-center gap-1.5">
                <span>PIXEL SPEED</span>
                <span className="text-amber-400 text-xs px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">IDLE</span>
              </h1>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                {wsConnected ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-emerald-400 font-medium">Headless Server Online (WS 10Hz)</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span className="text-amber-400">Reconectando WebSocket...</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {starterTier && (
            <div className="hidden md:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg px-2.5 py-1 text-[11px]">
              <span className="text-slate-400">Build Inicial:</span>
              <span className="font-bold text-amber-400 uppercase">
                {starterTier === 'legendary_balanced' ? '⭐ 10% Lendário (15/15/15)' :
                 starterTier === 'torque_focus' ? '30% Torque (10/10/20)' :
                 starterTier === 'speed_focus' ? '30% Speed (20/10/10)' : '30% Accel (10/20/10)'}
              </span>
            </div>
          )}
        </div>

        {/* Currency & Quick Actions */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Coins */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 border border-amber-500/30 px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-amber-400 shadow-inner">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{coins.toLocaleString()}</span>
            <span className="text-[10px] text-amber-500/70">MOEDAS</span>
          </div>

          {/* Cash (RMT) */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-emerald-400 shadow-inner">
            <Banknote className="w-4 h-4 text-emerald-400" />
            <span>{cash.toLocaleString()}</span>
            <span className="text-[10px] text-emerald-500/70">CASH</span>
          </div>

          {/* Scrap Metal */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-700 px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-slate-300 shadow-inner">
            <Wrench className="w-4 h-4 text-slate-400" />
            <span>{scrapMetal.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500">SUCATA</span>
          </div>

          {/* Test Faucet */}
          <button
            onClick={onAddFunds}
            title="Recarregar Moedas e Cash de Teste"
            className="flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:text-amber-300 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ Recarregar</span>
          </button>

          {/* Re-roll Starter */}
          <button
            onClick={onRerollStarter}
            title="Sortear Nova Conta (Testar Probabilidades 30/30/30/10)"
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reroll 30/30/30/10</span>
          </button>

          {/* Download Standalone HTML */}
          <a
            href="/standalone_game.html"
            download="pixel_idle_racing.html"
            target="_blank"
            rel="noopener noreferrer"
            title="Baixar Jogo em Arquivo Único HTML (Offline)"
            className="flex items-center gap-1 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-indigo-200 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Baixar HTML</span>
          </a>
        </div>
      </div>
    </header>
  );
};
