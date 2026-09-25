import React, { useState, useEffect, useRef } from 'react';
import { 
  Flag, 
  Flame, 
  Wind, 
  ShieldAlert, 
  Compass, 
  Gauge, 
  Zap, 
  Clock, 
  Award, 
  Play, 
  CheckCircle2, 
  Layers, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  BatteryCharging,
  Shield,
  Gift,
  Home
} from 'lucide-react';
import { Car, CarPart, CarSkin, MapConfig, MapType } from '../types';
import { MAPS_CONFIG, calculateEffectiveStats } from '../data/gameData';
import { RaceCanvas, RacerCanvasData } from './RaceCanvas';
import { PixelCarCanvas } from './PixelCarCanvas';

interface RaceFarmViewProps {
  car: Car;
  idleMap: MapType;
  onSetIdleMap: (map: MapType) => void;
  onRaceFinish: (map: MapConfig, place: number, rewardCoins: number, rewardParts: CarPart[], rewardSkins: CarSkin[]) => void;
  onHarvestIdle: () => void;
  idleRewards: { coins: number; scrap: number; parts: CarPart[]; skins: CarSkin[] };
  onReturnToLobby?: () => void;
}

export const RaceFarmView: React.FC<RaceFarmViewProps> = ({
  car,
  idleMap,
  onSetIdleMap,
  onRaceFinish,
  onHarvestIdle,
  idleRewards,
  onReturnToLobby
}) => {
  const [selectedMapId, setSelectedMapId] = useState<MapType>(idleMap || 'corrida');
  const [raceActive, setRaceActive] = useState(false);
  const [raceResults, setRaceResults] = useState<{ place: number; time: number; coins: number; droppedParts: CarPart[]; droppedSkins: CarSkin[] } | null>(null);
  const [interactiveBoost, setInteractiveBoost] = useState(false);
  const [interactiveDrift, setInteractiveDrift] = useState(false);
  const [showLootModal, setShowLootModal] = useState(false);

  // Active Interactive Race State
  const [racersData, setRacersData] = useState<RacerCanvasData[]>([]);
  const effectiveStats = calculateEffectiveStats(car);
  const activeMapConfig = MAPS_CONFIG[selectedMapId];

  // Ref tracking race timer and whether loot has been processed
  const raceTimerRef = useRef<number>(0);
  const raceFinishedProcessedRef = useRef<boolean>(false);

  // =========================================================================
  // NITRO SYSTEM BASED ON EQUIPPED PART RARITY
  // "o nitro deve ter 50 unidades de acordo com a raridade da peça de nitro equipada,
  // (comun, incomun, rara, épica e lendária) e cada unidade equivale a um milésimo de segundo,
  // sendo 50 equivalente a 5 segundos, e a recarga deve ser de 2 segundos pra cada unidade.
  // sendo 50 unidades demorando 50 segundos pra usar novamente."
  // =========================================================================
  const equippedNitro = car.equippedParts.nitro;
  const nitroTier = equippedNitro?.tier || 'common';

  const getMaxNitroUnits = (tier: string) => {
    switch (tier) {
      case 'legendary': return 100; // 10.0s
      case 'epic': return 85;       // 8.5s
      case 'rare': return 70;       // 7.0s
      case 'uncommon': return 60;   // 6.0s
      case 'common':
      default:
        return 50;                  // 50 unidades = 5.0 segundos base
    }
  };

  const maxNitroUnits = getMaxNitroUnits(nitroTier);
  const [nitroUnits, setNitroUnits] = useState<number>(maxNitroUnits);
  const nitroUnitsRef = useRef<number>(maxNitroUnits);

  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const finishCountdownRef = useRef<number | null>(null);
  const finishedOrderRef = useRef<string[]>([]);

  // Synchronize ref
  useEffect(() => {
    nitroUnitsRef.current = nitroUnits;
  }, [nitroUnits]);

  // Reset nitro units if car piece changes
  useEffect(() => {
    setNitroUnits(maxNitroUnits);
    nitroUnitsRef.current = maxNitroUnits;
  }, [maxNitroUnits]);

  const racersRef = useRef<RacerCanvasData[]>([]);
  const stateRef = useRef({
    interactiveBoost,
    interactiveDrift,
    activeMapConfig,
    effectiveStats,
    onRaceFinish,
    maxNitroUnits
  });

  // Keep stateRef updated with the latest inputs without restarting the race loop
  useEffect(() => {
    stateRef.current = {
      interactiveBoost,
      interactiveDrift,
      activeMapConfig,
      effectiveStats,
      onRaceFinish,
      maxNitroUnits
    };
  }, [interactiveBoost, interactiveDrift, activeMapConfig, effectiveStats, onRaceFinish, maxNitroUnits]);

  // Map icon helper
  const getMapIcon = (type: MapType) => {
    switch (type) {
      case 'corrida': return <Flag className="w-4 h-4 text-rose-400" />;
      case 'drift': return <Flame className="w-4 h-4 text-purple-400" />;
      case 'draft': return <Wind className="w-4 h-4 text-sky-400" />;
      case 'rally': return <Compass className="w-4 h-4 text-amber-400" />;
      case 'derby': return <ShieldAlert className="w-4 h-4 text-orange-400" />;
    }
  };

  // Start an active race on this map
  const startLiveRace = () => {
    setRaceResults(null);
    setIsFinishing(false);
    setShowLootModal(false);
    raceFinishedProcessedRef.current = false;
    raceTimerRef.current = 0;
    finishCountdownRef.current = null;
    finishedOrderRef.current = [];
    setNitroUnits(maxNitroUnits);
    nitroUnitsRef.current = maxNitroUnits;
    setInteractiveBoost(false);
    setInteractiveDrift(false);

    // Initial HP based on durability / armor
    const playerBaseHp = 100 + (effectiveStats.durability || 15) * 2 + (car.equippedParts.armor ? (car.equippedParts.armor.bonusStats.durability || 25) : 0);

    const rival1: RacerCanvasData = {
      id: 'rival_1',
      name: 'Shadow R',
      progressPercent: 0,
      speed: 146,
      nitro: false,
      hp: 115,
      maxHp: 115,
      wrecked: false,
      rank: 2,
      primaryColor: '#64748b',
      secondaryColor: '#0f172a',
      bodyType: 'supercar',
      tokenLetter: 'S',
      isPlayer: false
    };

    const rival2: RacerCanvasData = {
      id: 'rival_2',
      name: 'Viper GT',
      progressPercent: 0,
      speed: 137,
      nitro: false,
      hp: 90,
      maxHp: 90,
      wrecked: false,
      rank: 3,
      primaryColor: '#e11d48',
      secondaryColor: '#18181b',
      bodyType: 'muscle',
      tokenLetter: 'V',
      isPlayer: false
    };

    // Lowest HP rival - in derby "quem tem menos HP dura menos"!
    const rival3: RacerCanvasData = {
      id: 'rival_3',
      name: 'Blaze Drift',
      progressPercent: 0,
      speed: 126,
      nitro: false,
      hp: 65,
      maxHp: 65,
      wrecked: false,
      rank: 4,
      primaryColor: '#06b6d4',
      secondaryColor: '#1e293b',
      bodyType: 'tuner',
      tokenLetter: 'B',
      isPlayer: false
    };

    const playerRacer: RacerCanvasData = {
      id: 'player_active',
      name: car.name,
      progressPercent: 0,
      speed: 135,
      nitro: false,
      hp: playerBaseHp,
      maxHp: playerBaseHp,
      wrecked: false,
      rank: 1,
      primaryColor: car.visuals.primaryColor,
      secondaryColor: car.visuals.secondaryColor,
      bodyType: car.visuals.bodyType,
      customPixelData: car.visuals.customPixelData,
      wheelStyle: car.visuals.wheelStyle,
      spoiler: car.visuals.spoiler,
      tokenLetter: 'P',
      isPlayer: true
    };

    const initialRacers = [playerRacer, rival1, rival2, rival3];
    racersRef.current = initialRacers;
    setRacersData(initialRacers);
    setRaceActive(true);
  };

  // Immediate loot collection and return to lobby handler
  // "ao clicar no botão, de resgate do loot, pode aparecer 2 opção, aguardar o termino ou voltar ao lobby"
  const handleCollectLootEarly = () => {
    if (raceFinishedProcessedRef.current) return;
    raceFinishedProcessedRef.current = true;

    const currentRacers = racersRef.current;
    const player = currentRacers.find((r) => r.isPlayer);
    const finalPlace = player?.rank || 1;
    const coinsEarned = Math.round(
      activeMapConfig.baseRewardCoins * (finalPlace === 1 ? 2.0 : finalPlace === 2 ? 1.4 : 1.0)
    );

    const droppedParts: CarPart[] = [];
    const droppedSkins: CarSkin[] = [];

    if (Math.random() < 0.75 && activeMapConfig.possibleDrops.parts.length > 0) {
      const partTemplate = activeMapConfig.possibleDrops.parts[
        Math.floor(Math.random() * activeMapConfig.possibleDrops.parts.length)
      ];
      droppedParts.push({
        ...partTemplate,
        id: 'part_' + Math.random().toString(36).substring(2, 9)
      });
    }

    if (Math.random() < 0.35 && activeMapConfig.possibleDrops.skins.length > 0) {
      droppedSkins.push(activeMapConfig.possibleDrops.skins[0]);
    }

    const calculatedTime = Math.round((raceTimerRef.current || 18.5) * 10) / 10;
    setRaceActive(false);
    setIsFinishing(false);
    setShowLootModal(false);

    setRaceResults({
      place: finalPlace,
      time: calculatedTime,
      coins: coinsEarned,
      droppedParts,
      droppedSkins
    });

    onRaceFinish(activeMapConfig, finalPlace, coinsEarned, droppedParts, droppedSkins);

    if (onReturnToLobby) {
      onReturnToLobby();
    }
  };

  const handleWaitFinish = () => {
    setShowLootModal(false);
  };

  // Interactive race tick loop (Client visual race)
  useEffect(() => {
    if (!raceActive) return;

    let timer = 0;
    const interval = setInterval(() => {
      timer += 0.1;
      raceTimerRef.current = timer;
      const currentRacers = racersRef.current;
      if (!currentRacers || currentRacers.length === 0) return;

      const {
        interactiveBoost: boost,
        interactiveDrift: drift,
        activeMapConfig: mapCfg,
        effectiveStats: stats,
        onRaceFinish: finishCb,
        maxNitroUnits: maxUnits
      } = stateRef.current;

      // =====================================================================
      // NITRO TICK CONSUMPTION & RECHARGE:
      // "cada unidade equivale a um milésimo de segundo, sendo 50 equivalente a 5 segundos,
      // e a recarga deve ser de 2 segundos pra cada unidade. sendo 50 unidades demorando 50 segundos"
      // =====================================================================
      let curNitro = nitroUnitsRef.current;
      let effectiveBoost = boost;

      if (boost && curNitro > 0) {
        // Burn 1 unit per 100ms tick (10 units per second -> 50 units = 5.0 seconds continuous)
        curNitro = Math.max(0, curNitro - 1);
        if (curNitro <= 0) {
          effectiveBoost = false;
          setInteractiveBoost(false);
        }
      } else if (!boost && curNitro < maxUnits) {
        // Recharge: 50 units takes 50 seconds to recharge full = +1 unit every 1.0s = +0.1 unit per 100ms
        curNitro = Math.min(maxUnits, curNitro + 0.1);
      }

      nitroUnitsRef.current = curNitro;
      setNitroUnits(curNitro);

      // =====================================================================
      // RACER PROGRESSION & SIMULATION
      // =====================================================================
      const isDerby = mapCfg.id === 'derby';

      // Accelerate participants 6x (between 4x and 8x) after there is a winner!
      // "acelerar os participantes umas 4 ou 8x, depois que houver um vencedor"
      const hasWinner = finishedOrderRef.current.length > 0 || currentRacers.some((r) => r.progressPercent >= 100);
      const postWinnerMultiplier = hasWinner ? 6.0 : 1.0;

      const updated = currentRacers.map((racer) => {
        let currentHp = racer.hp !== undefined ? racer.hp : 100;
        let isWrecked = racer.wrecked || false;

        // DERBY ARENA COMBAT SIMULATION:
        // "onde quem tem menos HP dura menos"
        if (isDerby && !isWrecked) {
          // Continuous collision damage
          if (racer.isPlayer) {
            // Player deals damage to rivals, takes small damage
            if (effectiveBoost) {
              // Nitro ramming! Deals heavy damage to rivals and shields player
              currentHp = Math.max(0, currentHp - 0.2);
            } else {
              currentHp = Math.max(0, currentHp - 0.7);
            }
          } else {
            // Rivals fight each other and player
            // Rival with less HP (Blaze Drift: 65 HP) takes steady damage and dies first!
            let damageRate = 1.2;
            if (racer.id === 'rival_3') damageRate = 2.0; // 65 HP dies earliest
            if (racer.id === 'rival_2') damageRate = 1.4; // 90 HP dies next
            if (racer.id === 'rival_1') damageRate = 1.0; // 115 HP survives longest

            if (effectiveBoost) damageRate += 1.5; // player ramming hits them harder
            currentHp = Math.max(0, currentHp - damageRate);
          }

          if (currentHp <= 0) {
            isWrecked = true;
            currentHp = 0;
          }
        }

        if (racer.isPlayer) {
          if (isWrecked) {
            return {
              ...racer,
              hp: 0,
              wrecked: true,
              speed: 0,
              nitro: false
            };
          }

          // Player performance based on car stats & track compatibility
          let statAdvantage = 0;
          if (mapCfg.primaryStatNeeded === 'topSpeed') statAdvantage = (stats.topSpeed - 15) * 2.5;
          if (mapCfg.primaryStatNeeded === 'acceleration') statAdvantage = (stats.acceleration - 15) * 2.5;
          if (mapCfg.primaryStatNeeded === 'torque') statAdvantage = (stats.torque - 15) * 2.5;

          // Check if drafting behind any rival car in proximity (slipstream vacuum boost)
          const carAhead = currentRacers.find(
            (other) => other.id !== racer.id && other.progressPercent > racer.progressPercent && other.progressPercent <= racer.progressPercent + 9
          );
          const isDrafting = !!carAhead;

          let currentSpeed = 135 + statAdvantage;
          if (effectiveBoost) currentSpeed += 45;
          if (drift && mapCfg.id === 'drift') currentSpeed += 30;
          if (isDrafting && mapCfg.id === 'draft') currentSpeed += 22;

          // In Derby, progress is survival percentage
          const increment = (isDerby 
            ? 0.45 
            : (currentSpeed / (mapCfg.distance * 0.15)) * 0.18) * postWinnerMultiplier;
          const newPct = Math.min(100, racer.progressPercent + increment);

          return {
            ...racer,
            progressPercent: newPct,
            speed: Math.round(currentSpeed),
            nitro: effectiveBoost,
            drifting: drift && mapCfg.id === 'drift',
            hp: currentHp,
            wrecked: isWrecked
          };
        } else {
          // Rivals
          if (isWrecked) {
            return {
              ...racer,
              hp: 0,
              wrecked: true,
              speed: 0,
              nitro: false,
              drifting: false
            };
          }

          // Check if rival is drafting behind another car
          const rivalCarAhead = currentRacers.find(
            (other) => other.id !== racer.id && other.progressPercent > racer.progressPercent && other.progressPercent <= racer.progressPercent + 9
          );
          const rivalDrafting = !!rivalCarAhead;
          const rivalNitro = Math.sin(timer * 1.8 + (racer.name.charCodeAt(0) % 7)) > 0.65;

          // Distinct rival speeds to ensure realistic racing hierarchy and staggered convoy!
          // "os outros competidores ficam lado a lado, não dá sensação de corrida quando um deles não fica ligeiramente na frente"
          let rivalBasePace = 130;
          if (racer.id === 'rival_1') rivalBasePace = 146; // Apex Leader (Supercar)
          else if (racer.id === 'rival_2') rivalBasePace = 137; // Mid Chaser (Muscle)
          else if (racer.id === 'rival_3') rivalBasePace = 126; // Rear Runner (Tuner)

          const seed = (racer.id.charCodeAt(6) || 1) * 3;
          const speedWave = Math.sin(timer * 1.6 + seed) * 7;
          let baseRivalSpeed = rivalBasePace + speedWave;
          if (rivalNitro) baseRivalSpeed += 24;
          if (rivalDrafting && mapCfg.id === 'draft') baseRivalSpeed += 18;

          const rivalInc = (isDerby
            ? 0.42
            : (baseRivalSpeed / (mapCfg.distance * 0.15)) * 0.18) * postWinnerMultiplier;
          const rivalPct = Math.min(100, racer.progressPercent + rivalInc);

          return {
            ...racer,
            progressPercent: rivalPct,
            speed: Math.round(baseRivalSpeed),
            nitro: rivalNitro,
            drifting: Math.sin(timer * 1.5 + racer.rank) > 0.2 && mapCfg.id === 'drift',
            hp: currentHp,
            wrecked: isWrecked
          };
        }
      });

      // Record any racer crossing the finish line in real-time order:
      updated.forEach((r) => {
        if (r.progressPercent >= 100 && !finishedOrderRef.current.includes(r.id)) {
          finishedOrderRef.current.push(r.id);
        }
      });

      // =====================================================================
      // COMPUTE RANKINGS:
      // "depois de cruzar a linha de chegada, eles devem manter a mesma posição de quando a linha de chegada foi cruzada"
      // 1. Cars that crossed the finish line lock in their crossing rank forever!
      // 2. Cars still racing compete amongst themselves for remaining places.
      // =====================================================================
      const finishedIds = finishedOrderRef.current;
      const unfinished = updated.filter((r) => !finishedIds.includes(r.id));
      unfinished.sort((a, b) => {
        if (isDerby) {
          if (a.wrecked && !b.wrecked) return 1;
          if (!a.wrecked && b.wrecked) return -1;
          if (!a.wrecked && !b.wrecked) return (b.hp || 0) - (a.hp || 0);
          return b.progressPercent - a.progressPercent;
        }
        return b.progressPercent - a.progressPercent;
      });

      const ranked = updated.map((r) => {
        const finishIdx = finishedIds.indexOf(r.id);
        if (finishIdx !== -1) {
          // Locked finish position: rank never changes after crossing
          return {
            ...r,
            rank: finishIdx + 1,
            progressPercent: 100,
            speed: 0,
            nitro: false
          };
        } else {
          // Active ranking among racers still advancing to the line
          const unfinIdx = unfinished.findIndex((u) => u.id === r.id);
          const dynamicRank = finishedIds.length + 1 + (unfinIdx !== -1 ? unfinIdx : 0);
          return { ...r, rank: dynamicRank };
        }
      });

      racersRef.current = ranked;
      setRacersData(ranked);

      // =====================================================================
      // FINISH LINE TRIGGER & 5-SECOND CELEBRATION COUNTDOWN:
      // "caso o primeiro colocado tenha ido mais rápido que os demais,
      //  o jogo deve aguardar todos cruzarem a linha de chegada e esperar
      //  mais uns 5 segundos até voltar para o lobby"
      // =====================================================================
      const player = ranked.find((r) => r.isPlayer);
      const allRivalsWrecked = isDerby && ranked.filter((r) => !r.isPlayer && !r.wrecked).length === 0;
      const allRacersCrossed = ranked.every((r) => r.progressPercent >= 100);
      const allFinishedCondition = isDerby ? (player?.wrecked || allRivalsWrecked) : allRacersCrossed;

      if (allFinishedCondition && finishCountdownRef.current === null) {
        // All racers have crossed! Wait 5 seconds (50 ticks of 100ms) before returning to lobby
        finishCountdownRef.current = 50;
        setIsFinishing(true);
      }

      if (finishCountdownRef.current !== null) {
        finishCountdownRef.current -= 1;

        if (finishCountdownRef.current <= 0) {
          clearInterval(interval);
          if (raceFinishedProcessedRef.current) return;
          raceFinishedProcessedRef.current = true;

          setRaceActive(false);
          setIsFinishing(false);
          finishCountdownRef.current = null;

          // Finish calculations & loot drop
          const finalPlace = isDerby && allRivalsWrecked && !player?.wrecked ? 1 : (player?.rank || 4);
          const coinsEarned = Math.round(
            mapCfg.baseRewardCoins * (finalPlace === 1 ? 2.0 : finalPlace === 2 ? 1.4 : 1.0)
          );

          // Roll map drops!
          const droppedParts: CarPart[] = [];
          const droppedSkins: CarSkin[] = [];

          if (Math.random() < 0.65 && mapCfg.possibleDrops.parts.length > 0) {
            const partTemplate = mapCfg.possibleDrops.parts[
              Math.floor(Math.random() * mapCfg.possibleDrops.parts.length)
            ];
            droppedParts.push({
              ...partTemplate,
              id: 'part_' + Math.random().toString(36).substring(2, 9)
            });
          }

          if (Math.random() < 0.25 && mapCfg.possibleDrops.skins.length > 0) {
            droppedSkins.push(mapCfg.possibleDrops.skins[0]);
          }

          const calculatedTime = Math.round(timer * 10) / 10;
          setRaceResults({
            place: finalPlace,
            time: calculatedTime,
            coins: coinsEarned,
            droppedParts,
            droppedSkins
          });

          // Safe asynchronous invocation to prevent React setState during render warning
          setTimeout(() => {
            finishCb(mapCfg, finalPlace, coinsEarned, droppedParts, droppedSkins);
          }, 0);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [raceActive]);

  return (
    <div className="space-y-6">
      {/* 5 MAP SELECTOR TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {(Object.keys(MAPS_CONFIG) as MapType[]).map((mapId) => {
          const m = MAPS_CONFIG[mapId];
          const isSelected = selectedMapId === mapId;
          const isIdle = idleMap === mapId;

          return (
            <button
              key={mapId}
              onClick={() => setSelectedMapId(mapId)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-800/90 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
              }`}
            >
              {isIdle && (
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>FARMANDO</span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-1">
                {getMapIcon(mapId)}
                <span className="text-xs font-bold font-mono text-white capitalize">{m.id}</span>
                {mapId === 'draft' && <span className="text-[9px] px-1 py-0.2 rounded bg-sky-950 border border-sky-500/40 text-sky-400 font-bold">Vertical</span>}
                {mapId === 'drift' && <span className="text-[9px] px-1 py-0.2 rounded bg-purple-950 border border-purple-500/40 text-purple-400 font-bold">Curvas</span>}
                {mapId === 'derby' && <span className="text-[9px] px-1 py-0.2 rounded bg-orange-950 border border-orange-500/40 text-orange-400 font-bold">Arena HP</span>}
              </div>
              <div className="text-[11px] font-medium text-slate-300 truncate">{m.name}</div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                <span className="text-amber-400">{m.distance}m</span> • <span className="text-sky-400">{m.baseRewardCoins} Moedas</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* SELECTED MAP HERO & CONTROLS */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Background ambient accent */}
        <div 
          className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: activeMapConfig.palette.border }}
        />

        <div className="flex flex-col lg:flex-row gap-6 items-start justify-between relative z-10">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-300">
                Pista de Farm Selecionada
              </span>
              <span className="text-xs font-mono text-amber-400 font-bold">
                Requer: {activeMapConfig.primaryStatNeeded === 'topSpeed' ? 'Top Speed' : activeMapConfig.primaryStatNeeded === 'acceleration' ? 'Aceleração' : 'Torque'}
              </span>
              {activeMapConfig.id === 'draft' && (
                <span className="text-[10px] font-mono text-sky-400 font-bold bg-sky-950/60 border border-sky-500/40 px-2 py-0.5 rounded">
                  Pista Vertical (Wangan)
                </span>
              )}
              {activeMapConfig.id === 'drift' && (
                <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-950/60 border border-purple-500/40 px-2 py-0.5 rounded">
                  Circuito com Curvas & Bolinhas
                </span>
              )}
              {activeMapConfig.id === 'derby' && (
                <span className="text-[10px] font-mono text-orange-400 font-bold bg-orange-950/60 border border-orange-500/40 px-2 py-0.5 rounded">
                  Arena de Demolição (Menos HP dura menos)
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white font-mono flex items-center gap-2">
              {getMapIcon(activeMapConfig.id)}
              <span>{activeMapConfig.name}</span>
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              {activeMapConfig.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-2">
              <div className="bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <Gauge className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-slate-400">Distância:</span>
                <span className="text-white font-bold">{activeMapConfig.distance}m ({activeMapConfig.laps} voltas)</span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400">Recompensa Base:</span>
                <span className="text-amber-400 font-bold">{activeMapConfig.baseRewardCoins} Moedas</span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-slate-400">Mecânica:</span>
                <span className="text-rose-300 text-[11px]">{activeMapConfig.hazardOrMechanic}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Play Live Race & Activate Idle Farm */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-2.5">
            {!raceActive ? (
              <button
                onClick={startLiveRace}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-black font-mono text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-transform active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Correr Agora (Modo Ativo)</span>
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                {/* NITRO GAUGE HUD */}
                <div className="p-3 bg-slate-950/90 border border-sky-500/40 rounded-xl space-y-1.5 min-w-[240px]">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="flex items-center gap-1.5 text-sky-400 font-bold">
                      <Zap className="w-3.5 h-3.5" />
                      <span>NITRO (NOS)</span>
                    </span>
                    <span className="text-slate-300 font-bold">
                      {Math.round(nitroUnits)} / {maxNitroUnits} un ({(nitroUnits * 0.1).toFixed(1)}s)
                    </span>
                  </div>

                  {/* Nitro Progress Bar */}
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className={`h-full transition-all duration-75 ${
                        interactiveBoost 
                          ? 'bg-gradient-to-r from-amber-400 via-sky-400 to-cyan-300 animate-pulse' 
                          : 'bg-sky-400'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, (nitroUnits / maxNitroUnits) * 100))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                    <span className="text-amber-400 font-bold uppercase">
                      {nitroTier} ({maxNitroUnits} un)
                    </span>
                    <span>
                      {interactiveBoost 
                        ? '🔥 QUEIMANDO (-1 un/0.1s)' 
                        : nitroUnits < maxNitroUnits 
                          ? '⚡ RECARREGANDO (+1 un/s)' 
                          : '✓ CARGA TOTAL'}
                    </span>
                  </div>
                </div>

                {isFinishing ? (
                  <div className="flex-1 flex flex-col sm:flex-row items-center gap-2">
                    <div className="flex-1 px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold bg-amber-500/20 border border-amber-500/60 text-amber-300 flex items-center justify-center gap-2 animate-pulse shadow-lg shadow-amber-500/20">
                      <Flag className="w-4 h-4 text-amber-400" />
                      <span>🏁 FINALIZANDO EM {Math.max(1, Math.ceil((finishCountdownRef.current ?? 50) / 10))}s...</span>
                    </div>
                    <button
                      onClick={() => setShowLootModal(true)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-mono text-xs font-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                    >
                      <Gift className="w-4 h-4 text-slate-950" />
                      <span>RESGATAR LOOT</span>
                    </button>
                  </div>
                ) : racersData.find((r) => r.isPlayer)?.progressPercent && (racersData.find((r) => r.isPlayer)?.progressPercent || 0) >= 100 ? (
                  <div className="flex-1 flex flex-col sm:flex-row items-center gap-2">
                    <div className="flex-1 px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold bg-sky-500/20 border border-sky-500/60 text-sky-300 flex items-center justify-center gap-2 animate-pulse shadow-lg shadow-sky-500/20">
                      <Flag className="w-4 h-4 text-sky-400" />
                      <span>🏁 LINHA CRUZADA ({racersData.find((r) => r.isPlayer)?.rank}º LUGAR)!</span>
                    </div>
                    <button
                      onClick={() => setShowLootModal(true)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-mono text-xs font-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 animate-bounce"
                    >
                      <Gift className="w-4 h-4 text-slate-950" />
                      <span>RESGATAR LOOT</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      disabled={nitroUnits <= 0}
                      onMouseDown={() => {
                        if (nitroUnits > 0) setInteractiveBoost(true);
                      }}
                      onMouseUp={() => setInteractiveBoost(false)}
                      onTouchStart={() => {
                        if (nitroUnits > 0) setInteractiveBoost(true);
                      }}
                      onTouchEnd={() => setInteractiveBoost(false)}
                      className={`flex-1 px-4 py-3 rounded-xl font-mono text-xs font-bold transition-all select-none cursor-pointer flex items-center justify-center gap-2 ${
                        interactiveBoost
                          ? 'bg-sky-400 text-slate-950 scale-105 shadow-lg shadow-sky-400/40'
                          : nitroUnits > 0
                            ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 hover:bg-sky-500/30'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      <span>{nitroUnits > 0 ? 'Segurar NITRO (NOS)' : 'Nitro Esgotado'}</span>
                    </button>

                    {activeMapConfig.id === 'drift' && (
                      <button
                        onMouseDown={() => setInteractiveDrift(true)}
                        onMouseUp={() => setInteractiveDrift(false)}
                        onTouchStart={() => setInteractiveDrift(true)}
                        onTouchEnd={() => setInteractiveDrift(false)}
                        className={`px-4 py-3 rounded-xl font-mono text-xs font-bold transition-all select-none cursor-pointer flex items-center gap-2 ${
                          interactiveDrift
                            ? 'bg-purple-400 text-slate-950 scale-105 shadow-lg shadow-purple-400/40'
                            : 'bg-purple-500/20 text-purple-400 border border-purple-500/40 hover:bg-purple-500/30'
                        }`}
                      >
                        <Flame className="w-4 h-4" />
                        <span>Freio de Mão</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => onSetIdleMap(activeMapConfig.id)}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border font-mono text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                idleMap === activeMapConfig.id
                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>{idleMap === activeMapConfig.id ? '✓ Farmando em Segundo Plano' : 'Definir para Farm Idle'}</span>
            </button>
          </div>
        </div>

        {/* FINISH LINE BANNER WITH RESGATAR LOOT BUTTON */}
        {raceActive && racersData.find((r) => r.isPlayer)?.progressPercent && (racersData.find((r) => r.isPlayer)?.progressPercent || 0) >= 100 && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-amber-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-amber-500/10">
            <div className="flex items-center gap-3 text-amber-300 font-mono text-xs font-bold">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black">
                {racersData.find((r) => r.isPlayer)?.rank === 1 ? '🥇' : '🏁'}
              </div>
              <div>
                <span className="text-white text-sm font-black block">
                  VOCÊ CRUZOU A LINHA ({racersData.find((r) => r.isPlayer)?.rank}º LUGAR)!
                </span>
                <span className="text-amber-300/80 text-[11px] flex items-center gap-1.5 flex-wrap">
                  <span>Os competidores restantes foram acelerados em 6x para a chegada.</span>
                  <span className="bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded font-bold">⚡ Fast-Forward 6x Ativo</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowLootModal(true)}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-mono font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <Gift className="w-4 h-4 text-slate-950" />
                <span>Resgatar Loot</span>
              </button>
              {onReturnToLobby && (
                <button
                  onClick={handleCollectLootEarly}
                  className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Home className="w-4 h-4 text-slate-400" />
                  <span>Voltar ao Lobby</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2-OPTION MODAL ON LOOT RESCUE ("ao clicar no botão, de resgate do loot, pode aparecer 2 opção, aguardar o termino ou voltar ao lobby") */}
        {showLootModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-amber-500/20 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Gift className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-mono">
                    Resgatar Loot da Corrida
                  </h3>
                  <p className="text-xs text-slate-400">
                    Você terminou na {racersData.find((r) => r.isPlayer)?.rank || 1}ª colocação!
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Recompensa:</span>
                  <span className="text-amber-400 font-bold">
                    +{Math.round(activeMapConfig.baseRewardCoins * ((racersData.find((r) => r.isPlayer)?.rank || 1) === 1 ? 2.0 : (racersData.find((r) => r.isPlayer)?.rank || 1) === 2 ? 1.4 : 1.0))} Moedas
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Drops Disponíveis:</span>
                  <span className="text-emerald-400 font-bold">Peças & Skins da Pista</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleCollectLootEarly}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black font-mono text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 cursor-pointer transition-transform active:scale-95"
                >
                  <Home className="w-4 h-4 text-slate-950" />
                  <span>Resgatar Loot e Voltar ao Lobby</span>
                </button>

                <button
                  onClick={handleWaitFinish}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Aguardar o Término da Corrida</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LIVE RACE CANVAS (Shown when race is running) */}
        {raceActive && (
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>
                  {activeMapConfig.id === 'draft' 
                    ? 'PISTA VERTICAL WANGAN (1º no topo • 4º na base)' 
                    : activeMapConfig.id === 'drift'
                      ? 'CIRCUITO COM CURVAS (Bolinhas com letras • Carros no paddock)'
                      : activeMapConfig.id === 'derby'
                        ? 'ARENA DE DEMOLIÇÃO (Carros com menos HP duram menos!)'
                        : 'CORRIDA AO VIVO (1º na linha de cima • 4º na linha de baixo)'}
                </span>
              </span>
              <span>1º colocado sempre no topo da ordem de chegada!</span>
            </div>
            <RaceCanvas track={activeMapConfig} racers={racersData} interactiveDrift={interactiveDrift} />
          </div>
        )}

        {/* RACE RESULTS BANNER */}
        {raceResults && (
          <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black font-mono text-xl">
                {raceResults.place === 1 ? '🥇' : raceResults.place === 2 ? '🥈' : '🥉'}
              </div>
              <div>
                <div className="text-sm font-black text-white font-mono">
                  {raceResults.place === 1 ? 'VITÓRIA! 1º LUGAR!' : `${raceResults.place}º Lugar na Pista!`}
                </div>
                <div className="text-xs text-slate-400">
                  Tempo: {raceResults.time}s • Recompensa: <span className="text-amber-400 font-bold font-mono">+{raceResults.coins} Moedas</span>
                </div>
              </div>
            </div>

            {/* Farm Drops Display */}
            <div className="flex items-center flex-wrap gap-2">
              {raceResults.droppedParts.map((p) => (
                <div key={p.id} className="bg-emerald-950/60 border border-emerald-500/60 px-2.5 py-1 rounded-lg text-xs font-mono text-emerald-300 flex items-center gap-1.5 animate-bounce">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Drop: {p.name}</span>
                </div>
              ))}
              {raceResults.droppedSkins.map((s) => (
                <div key={s.id} className="bg-purple-950/60 border border-purple-500/60 px-2.5 py-1 rounded-lg text-xs font-mono text-purple-300 flex items-center gap-1.5 animate-bounce">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Skin: {s.name}</span>
                </div>
              ))}
              {onReturnToLobby && (
                <button
                  onClick={onReturnToLobby}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Voltar ao Lobby</span>
                </button>
              )}
              <button
                onClick={() => setRaceResults(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* MAP DROP TABLE INSPECTION (Specific to each map) */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                Tabela de Drops Exclusivos Desta Pista (Farm)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Chance de drop a cada volta e idle tick</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activeMapConfig.possibleDrops.parts.map((part, idx) => (
              <div key={idx} className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
                <div className={`p-2 rounded-lg border ${
                  part.tier === 'epic' ? 'bg-purple-950/50 border-purple-500/40 text-purple-400' :
                  part.tier === 'rare' ? 'bg-sky-950/50 border-sky-500/40 text-sky-400' :
                  'bg-slate-800/50 border-slate-700 text-slate-300'
                }`}>
                  <Zap className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold font-mono text-slate-200 truncate">{part.name}</span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {part.tier}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{part.description}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-emerald-400">
                    {part.bonusStats.topSpeed && <span>+{part.bonusStats.topSpeed} Speed</span>}
                    {part.bonusStats.acceleration && <span>+{part.bonusStats.acceleration} Accel</span>}
                    {part.bonusStats.torque && <span>+{part.bonusStats.torque} Torque</span>}
                    {part.bonusStats.durability && <span>+{part.bonusStats.durability} Blindagem</span>}
                  </div>
                </div>
              </div>
            ))}

            {activeMapConfig.possibleDrops.skins.map((skin) => (
              <div key={skin.id} className="bg-slate-950/50 border border-purple-900/40 rounded-xl p-3 flex items-start gap-3">
                <div className="p-2 rounded-lg border bg-purple-950/50 border-purple-500/40 text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold font-mono text-purple-200 truncate">{skin.name}</span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-purple-900/40 text-purple-300">
                      Skin
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Pintura e aerografia visual temática desta pista.</p>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-mono text-purple-400">
                    <span>Aparência Exclusiva</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* IDLE HARVEST NOTIFICATION BANNER */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold font-mono text-white flex items-center gap-2">
              <span>Farm Idle em Segundo Plano:</span>
              <span className="text-emerald-400 uppercase font-black">{MAPS_CONFIG[idleMap].name}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              O servidor processa os ticks numericamente. Coleta acumulada: <span className="text-amber-400 font-bold font-mono">+{idleRewards.coins} Moedas</span>, <span className="text-slate-300 font-bold font-mono">+{idleRewards.scrap} Sucatas</span>
            </div>
          </div>
        </div>

        <button
          onClick={onHarvestIdle}
          disabled={idleRewards.coins === 0 && idleRewards.scrap === 0}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            idleRewards.coins > 0 || idleRewards.scrap > 0
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          Coletar Farm Idle ({idleRewards.coins + idleRewards.scrap > 0 ? `+${idleRewards.coins}M / +${idleRewards.scrap}S` : 'Vazio'})
        </button>
      </div>
    </div>
  );
};
