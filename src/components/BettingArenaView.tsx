import React, { useState } from 'react';
import { 
  Trophy, 
  Flame, 
  Coins, 
  Banknote, 
  Clock, 
  TrendingUp, 
  Sparkles, 
  AlertCircle,
  CheckCircle,
  Eye,
  Radio
} from 'lucide-react';
import { Bet, LiveRaceState, LiveRacerTelemetry, MapConfig, MapType } from '../types';
import { MAPS_CONFIG } from '../data/gameData';
import { RaceCanvas, RacerCanvasData } from './RaceCanvas';

interface BettingArenaViewProps {
  playerCoins: number;
  playerCash: number;
  liveRaceState: LiveRaceState | null;
  activeBets: Bet[];
  onPlaceBet: (racerId: string, amount: number, currency: 'coins' | 'cash') => void;
  lastPayoutNotification: { won: boolean; amount: number; payout: number; currency: 'coins' | 'cash'; racerName: string } | null;
}

export const BettingArenaView: React.FC<BettingArenaViewProps> = ({
  playerCoins,
  playerCash,
  liveRaceState,
  activeBets,
  onPlaceBet,
  lastPayoutNotification
}) => {
  const [selectedRacerId, setSelectedRacerId] = useState<string>('');
  const [betAmount, setBetAmount] = useState<number>(100);
  const [betCurrency, setBetCurrency] = useState<'coins' | 'cash'>('coins');
  const [betError, setBetError] = useState<string | null>(null);

  if (!liveRaceState) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono text-slate-400">Sincronizando Campeonato Numérico via WebSocket...</p>
      </div>
    );
  }

  const currentTrack: MapConfig = MAPS_CONFIG[liveRaceState.track.id as MapType] || MAPS_CONFIG.corrida;

  // Convert telemetry to RacerCanvasData
  const canvasRacers: RacerCanvasData[] = liveRaceState.racers.map((r) => ({
    id: r.id,
    name: r.name,
    progressPercent: r.progressPercent,
    speed: r.currentSpeed,
    nitro: r.nitroActive,
    rank: r.position,
    primaryColor: r.car.visuals.primaryColor,
    secondaryColor: r.car.visuals.secondaryColor,
    bodyType: r.car.visuals.bodyType,
    isPlayer: false
  }));

  const selectedRacer = liveRaceState.racers.find((r) => r.id === selectedRacerId);
  const potentialPayout = selectedRacer ? Math.floor(betAmount * selectedRacer.odds) : 0;

  const handleBetSubmit = () => {
    setBetError(null);
    if (!selectedRacerId) {
      setBetError('Selecione um competidor para apostar!');
      return;
    }
    if (liveRaceState.status !== 'betting') {
      setBetError('As apostas estão fechadas para esta corrida!');
      return;
    }
    if (betCurrency === 'coins' && betAmount > playerCoins) {
      setBetError('Saldo de Moedas insuficiente!');
      return;
    }
    if (betCurrency === 'cash' && betAmount > playerCash) {
      setBetError('Saldo de Cash insuficiente!');
      return;
    }
    if (betAmount <= 0) {
      setBetError('Valor inválido de aposta!');
      return;
    }

    onPlaceBet(selectedRacerId, betAmount, betCurrency);
  };

  return (
    <div className="space-y-6">
      {/* HEADER WITH REALTIME STATUS */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>Transmissão Ao Vivo (Headless Engine)</span>
              </span>
              <span className="text-xs font-mono text-slate-400">ID: {liveRaceState.raceId}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white font-mono flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Apostas em Corridas Alheias</span>
            </h2>
          </div>

          {/* Phase Badge & Countdown */}
          <div className="flex items-center gap-3">
            <div className="text-right font-mono">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Fase Atual</div>
              <div className={`text-sm font-black ${
                liveRaceState.status === 'betting' ? 'text-amber-400' :
                liveRaceState.status === 'in_progress' ? 'text-emerald-400 animate-pulse' :
                'text-sky-400'
              }`}>
                {liveRaceState.status === 'betting' ? 'ABERTO PARA APOSTAS' :
                 liveRaceState.status === 'in_progress' ? 'CORRIDA EM ANDAMENTO' :
                 'RESULTADOS & PAGAMENTOS'}
              </div>
            </div>

            <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-700 flex flex-col items-center justify-center font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
              <span className="text-base font-black text-white">{Math.ceil(liveRaceState.countdown)}s</span>
            </div>
          </div>
        </div>

        {/* TRACK & LIVE CANVAS VISUALIZATION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300">
              Pista: <span className="font-bold text-amber-400">{currentTrack.name}</span> ({currentTrack.distance}m)
            </span>
            <span className="text-slate-400">
              {liveRaceState.status === 'in_progress' ? '📡 Gráficos processados no cliente (0% GPU no servidor)' : 'Aguardando largada...'}
            </span>
          </div>

          <RaceCanvas track={currentTrack} racers={canvasRacers} />
        </div>

        {/* PAYOUT TOAST NOTIFICATION */}
        {lastPayoutNotification && (
          <div className={`mt-4 p-3 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono ${
            lastPayoutNotification.won
              ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 shadow-lg shadow-emerald-500/20'
              : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              {lastPayoutNotification.won ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
              <span>
                {lastPayoutNotification.won
                  ? `PARABÉNS! Seu palpite no ${lastPayoutNotification.racerName} venceu! Payout: +${lastPayoutNotification.payout} ${lastPayoutNotification.currency.toUpperCase()}`
                  : `Que pena! O vencedor foi outro competidor. Mais sorte na próxima corrida!`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* BETTING SLIP & RACERS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RACERS LIST WITH ODDS */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Competidores & Cotações (Odds)</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Clique para selecionar e apostar</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {liveRaceState.racers.map((racer) => {
              const isSelected = selectedRacerId === racer.id;
              const hasActiveBet = activeBets.some((b) => b.racerId === racer.id);

              return (
                <div
                  key={racer.id}
                  onClick={() => liveRaceState.status === 'betting' && setSelectedRacerId(racer.id)}
                  className={`p-3.5 rounded-xl border transition-all relative cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-amber-500 ring-2 ring-amber-500/40 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  } ${liveRaceState.status !== 'betting' ? 'opacity-90' : ''}`}
                >
                  {hasActiveBet && (
                    <div className="absolute top-2 right-2 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                      APOSTA ATIVA
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: racer.car.visuals.primaryColor }} />
                      <span className="text-xs font-black font-mono text-white">{racer.name}</span>
                    </div>

                    {/* ODDS BADGE */}
                    <div className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-400 text-xs font-mono font-black">
                      {racer.odds}x
                    </div>
                  </div>

                  {/* Telemetry / Specs */}
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono text-slate-400 mb-2">
                    <div className="bg-slate-900 px-1.5 py-1 rounded">Vel: {racer.car.baseStats.topSpeed}</div>
                    <div className="bg-slate-900 px-1.5 py-1 rounded">Ace: {racer.car.baseStats.acceleration}</div>
                    <div className="bg-slate-900 px-1.5 py-1 rounded">Tor: {racer.car.baseStats.torque}</div>
                  </div>

                  {/* LIVE PROGRESS BAR IN RACE */}
                  {liveRaceState.status === 'in_progress' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-300">
                        <span>{racer.position}º Lugar</span>
                        <span>{racer.currentSpeed} km/h</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-100"
                          style={{ width: `${racer.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* BETTING CONTROLS / BET SLIP */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider mb-3 pb-2 border-b border-slate-800 flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Boletim de Aposta</span>
            </h3>

            {/* Selected racer */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 mb-3">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Competidor Escolhido:</span>
              <div className="text-sm font-black font-mono text-amber-400">
                {selectedRacer ? `${selectedRacer.name} (${selectedRacer.odds}x)` : 'Selecione um competidor ao lado'}
              </div>
            </div>

            {/* Currency selector: Coins vs Cash */}
            <div className="space-y-1.5 mb-3">
              <label className="text-[10px] text-slate-400 uppercase font-mono">Moeda de Aposta:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBetCurrency('coins')}
                  className={`py-2 px-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    betCurrency === 'coins'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Moedas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBetCurrency('cash')}
                  className={`py-2 px-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    betCurrency === 'cash'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cash</span>
                </button>
              </div>
            </div>

            {/* Amount input & Quick Chips */}
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Valor:</span>
                <span>Saldo: {betCurrency === 'coins' ? `${playerCoins} M` : `${playerCash} C`}</span>
              </div>
              <input
                type="number"
                min={1}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-500"
              />

              {/* Quick Amount Chips */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {(betCurrency === 'coins' ? [50, 100, 250, 500] : [2, 5, 10, 25]).map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setBetAmount(chip)}
                    className="py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-600 text-[10px] font-mono font-bold text-slate-300 cursor-pointer"
                  >
                    +{chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Potential Payout */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 mb-3 flex items-center justify-between font-mono">
              <span className="text-xs text-slate-400">Retorno Estimado:</span>
              <span className="text-sm font-black text-emerald-400">
                {potentialPayout.toLocaleString()} {betCurrency.toUpperCase()}
              </span>
            </div>

            {betError && (
              <div className="text-xs text-rose-400 font-mono mb-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{betError}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleBetSubmit}
            disabled={liveRaceState.status !== 'betting' || !selectedRacerId}
            className={`w-full py-3 rounded-xl font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
              liveRaceState.status === 'betting' && selectedRacerId
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 shadow-amber-500/25 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{liveRaceState.status === 'betting' ? 'Confirmar Aposta' : 'Apostas Fechadas'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
