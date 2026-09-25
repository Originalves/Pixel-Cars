import React, { useState, useEffect, useRef } from 'react';
import { 
  Flag, 
  Car as CarIcon, 
  Trophy, 
  Sparkles, 
  ShoppingBag, 
  Trash2, 
  Banknote,
  Volume2,
  VolumeX,
  Plus,
  Palette
} from 'lucide-react';
import { 
  Bet, 
  Car, 
  CarPart, 
  CarSkin, 
  CarVisuals, 
  CustomCarAsset,
  LiveRaceState, 
  LiveRacerTelemetry, 
  MapConfig, 
  MapType, 
  PlayerProfile, 
  StarterTier 
} from './types';
import { rollStarterCar, MAPS_CONFIG } from './data/gameData';
import { Header } from './components/Header';
import { StarterModal } from './components/StarterModal';
import { RaceFarmView } from './components/RaceFarmView';
import { BettingArenaView } from './components/BettingArenaView';
import { GarageView } from './components/GarageView';
import { JunkyardGachaView } from './components/JunkyardGachaView';
import { DealershipView } from './components/DealershipView';
import { ChopShopView } from './components/ChopShopView';
import { MonetizationModal } from './components/MonetizationModal';
import { AssetStudioView } from './components/AssetStudioView';

const STORAGE_KEY = 'pixel_idle_racing_save_v1';

export default function App() {
  // 1. Initialize or load player state
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // ignore
    }

    // New profile with exact 30/30/30/10 starter car distribution
    const { car: initialCar, tier } = rollStarterCar();
    return {
      id: 'player_' + Math.random().toString(36).substring(2, 9),
      nickname: 'Piloto Pixel',
      coins: 1200,
      cash: 25,
      scrapMetal: 80,
      activeCarId: initialCar.id,
      ownedCars: [initialCar],
      inventoryParts: [],
      unlockedSkins: [],
      activeBets: [],
      idleFarmMap: 'corrida',
      idleLastSync: Date.now(),
      starterTierClaimed: tier
    };
  });

  const [showStarterModal, setShowStarterModal] = useState<boolean>(() => {
    return !localStorage.getItem(STORAGE_KEY);
  });
  const [showCashShop, setShowCashShop] = useState(false);
  const [activeTab, setActiveTab] = useState<'race' | 'garage' | 'betting' | 'gacha' | 'dealer' | 'chop' | 'asset_dev'>('race');

  // Idle accumulated rewards
  const [idleRewards, setIdleRewards] = useState<{
    coins: number;
    scrap: number;
    parts: CarPart[];
    skins: CarSkin[];
  }>({ coins: 40, scrap: 15, parts: [], skins: [] });

  // WebSocket connection & live betting state
  const [wsConnected, setWsConnected] = useState(false);
  const [liveRaceState, setLiveRaceState] = useState<LiveRaceState | null>(null);
  const [lastPayout, setLastPayout] = useState<{
    won: boolean;
    amount: number;
    payout: number;
    currency: 'coins' | 'cash';
    racerName: string;
  } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  // Save profile to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      // ignore
    }
  }, [profile]);

  // Establish real-time WebSocket connection to server on port 3000
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    let socket: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    function connect() {
      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setWsConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'init_state' || data.type === 'phase_change') {
              if (data.championship) {
                const champ = data.championship;
                setLiveRaceState({
                  raceId: champ.raceId,
                  track: MAPS_CONFIG[champ.trackId as MapType] || MAPS_CONFIG.corrida,
                  status: champ.phase === 'racing' ? 'in_progress' : champ.phase === 'results' ? 'finished' : 'betting',
                  countdown: champ.phaseTimer,
                  elapsedTime: 0,
                  racers: champ.racers.map((r: any, idx: number) => ({
                    id: r.id,
                    name: r.name,
                    car: {
                      id: r.id,
                      name: r.name,
                      condition: 'brand_new',
                      baseStats: { topSpeed: r.topSpeed, acceleration: r.acceleration, torque: r.torque, durability: r.durability },
                      visuals: {
                        bodyType: r.buildType,
                        primaryColor: r.primaryColor,
                        secondaryColor: r.secondaryColor,
                        neonColor: '#00f0ff',
                        hasNeon: false,
                        spoiler: 'small',
                        wheelStyle: 'spokes'
                      },
                      equippedParts: {},
                      totalRaces: 0,
                      wins: 0,
                      acquiredAt: 0,
                      rarity: 'rare'
                    },
                    position: idx + 1,
                    distance: r.distance || 0,
                    currentSpeed: r.speed || 0,
                    progressPercent: r.progressPercent || 0,
                    odds: r.odds || 2.0,
                    health: r.health || 100,
                    nitroActive: r.isNitroOn || false,
                    status: r.finished ? 'finished' : 'racing',
                    finishTime: r.finishTime
                  }))
                });
              }
            } else if (data.type === 'betting_countdown') {
              setLiveRaceState((prev) => prev ? { ...prev, countdown: data.timer } : null);
            } else if (data.type === 'race_tick') {
              setLiveRaceState((prev) => {
                if (!prev) return null;
                const updatedRacers = prev.racers.map((r) => {
                  const tick = data.racers.find((t: any) => t.id === r.id);
                  if (!tick) return r;
                  return {
                    ...r,
                    position: tick.rank,
                    distance: tick.dist,
                    progressPercent: tick.pct,
                    currentSpeed: tick.speed,
                    nitroActive: tick.nitro,
                    health: tick.hp,
                    status: tick.done ? 'finished' : 'racing'
                  };
                });
                return {
                  ...prev,
                  status: 'in_progress',
                  elapsedTime: data.elapsedTime,
                  racers: updatedRacers
                };
              });
            } else if (data.type === 'bet_resolved') {
              setLastPayout(data);
              if (data.won && data.payout > 0) {
                setProfile((prev) => ({
                  ...prev,
                  coins: data.currency === 'coins' ? prev.coins + data.payout : prev.coins,
                  cash: data.currency === 'cash' ? prev.cash + data.payout : prev.cash
                }));
              }
            }
          } catch (e) {
            // ignore
          }
        };

        socket.onclose = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connect, 3000);
        };

        socket.onerror = () => {
          socket.close();
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      if (socket) socket.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  // Headless idle farming tick loop (accumulates rewards while player is playing or idling)
  useEffect(() => {
    const idleTimer = setInterval(() => {
      const mapConfig = MAPS_CONFIG[profile.idleFarmMap];
      const coinGain = Math.round(mapConfig.baseRewardCoins * 0.1);
      const scrapGain = 2;

      setIdleRewards((prev) => ({
        ...prev,
        coins: prev.coins + coinGain,
        scrap: prev.scrap + scrapGain
      }));
    }, 4000); // every 4 seconds background tick

    return () => clearInterval(idleTimer);
  }, [profile.idleFarmMap]);

  // Active Car
  const activeCar = profile.ownedCars.find((c) => c.id === profile.activeCarId) || profile.ownedCars[0];

  // Faucet / Test Recharge
  const handleAddFunds = () => {
    setProfile((prev) => ({
      ...prev,
      coins: prev.coins + 2500,
      cash: prev.cash + 100,
      scrapMetal: prev.scrapMetal + 150
    }));
  };

  // Re-roll Starter Car (Tests 30% / 30% / 30% / 10% distribution)
  const handleRerollStarter = () => {
    const { car, tier } = rollStarterCar();
    setProfile((prev) => ({
      ...prev,
      activeCarId: car.id,
      ownedCars: [car, ...prev.ownedCars],
      starterTierClaimed: tier
    }));
    setShowStarterModal(true);
  };

  // Harvest Idle rewards
  const handleHarvestIdle = () => {
    if (idleRewards.coins === 0 && idleRewards.scrap === 0) return;

    setProfile((prev) => ({
      ...prev,
      coins: prev.coins + idleRewards.coins,
      scrapMetal: prev.scrapMetal + idleRewards.scrap,
      inventoryParts: [...prev.inventoryParts, ...idleRewards.parts],
      unlockedSkins: [...prev.unlockedSkins, ...idleRewards.skins]
    }));

    setIdleRewards({ coins: 0, scrap: 0, parts: [], skins: [] });
  };

  // Race Finish handler (active race mode)
  const handleRaceFinish = (
    map: MapConfig,
    place: number,
    rewardCoins: number,
    rewardParts: CarPart[],
    rewardSkins: CarSkin[]
  ) => {
    setProfile((prev) => ({
      ...prev,
      coins: prev.coins + rewardCoins,
      inventoryParts: [...prev.inventoryParts, ...rewardParts],
      unlockedSkins: [...prev.unlockedSkins, ...rewardSkins],
      ownedCars: prev.ownedCars.map((c) => {
        if (c.id === prev.activeCarId) {
          return {
            ...c,
            totalRaces: c.totalRaces + 1,
            wins: place === 1 ? c.wins + 1 : c.wins
          };
        }
        return c;
      })
    }));
  };

  // Place Bet
  const handlePlaceBet = (racerId: string, amount: number, currency: 'coins' | 'cash') => {
    if (currency === 'coins' && profile.coins < amount) return;
    if (currency === 'cash' && profile.cash < amount) return;

    // Deduct bet amount
    setProfile((prev) => ({
      ...prev,
      coins: currency === 'coins' ? prev.coins - amount : prev.coins,
      cash: currency === 'cash' ? prev.cash - amount : prev.cash
    }));

    // Send to WebSocket server
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'place_bet',
        racerId,
        amount,
        currency
      }));
    }
  };

  // Car Management Handlers
  const handleSelectActiveCar = (id: string) => {
    setProfile((prev) => ({ ...prev, activeCarId: id }));
  };

  const handleEquipPart = (carId: string, part: CarPart) => {
    setProfile((prev) => {
      const car = prev.ownedCars.find((c) => c.id === carId);
      if (!car) return prev;

      // Swap previous equipped part back to inventory if existing
      const slot = part.category as keyof Car['equippedParts'];
      const prevPart = car.equippedParts[slot];
      const newInventory = prev.inventoryParts.filter((p) => p.id !== part.id);
      if (prevPart) {
        newInventory.push(prevPart);
      }

      return {
        ...prev,
        inventoryParts: newInventory,
        ownedCars: prev.ownedCars.map((c) => {
          if (c.id === carId) {
            return {
              ...c,
              equippedParts: {
                ...c.equippedParts,
                [slot]: part
              }
            };
          }
          return c;
        })
      };
    });
  };

  const handleUnequipPart = (carId: string, category: keyof Car['equippedParts']) => {
    setProfile((prev) => {
      const car = prev.ownedCars.find((c) => c.id === carId);
      if (!car) return prev;

      const part = car.equippedParts[category];
      if (!part) return prev;

      const newEquipped = { ...car.equippedParts };
      delete newEquipped[category];

      return {
        ...prev,
        inventoryParts: [...prev.inventoryParts, part],
        ownedCars: prev.ownedCars.map((c) => {
          if (c.id === carId) {
            return { ...c, equippedParts: newEquipped };
          }
          return c;
        })
      };
    });
  };

  const handleUpgradePart = (partId: string) => {
    // Costs scrap metal
    setProfile((prev) => {
      const car = prev.ownedCars.find((c) => c.id === prev.activeCarId);
      if (!car) return prev;

      let foundSlot: keyof Car['equippedParts'] | null = null;
      for (const key of Object.keys(car.equippedParts) as (keyof Car['equippedParts'])[]) {
        if (car.equippedParts[key]?.id === partId) {
          foundSlot = key;
          break;
        }
      }

      if (!foundSlot) return prev;
      const part = car.equippedParts[foundSlot]!;
      const upgradeCost = part.level * 25;

      if (prev.scrapMetal < upgradeCost) return prev;

      const upgradedPart: CarPart = {
        ...part,
        level: part.level + 1,
        bonusStats: {
          topSpeed: part.bonusStats.topSpeed ? part.bonusStats.topSpeed + 2 : undefined,
          acceleration: part.bonusStats.acceleration ? part.bonusStats.acceleration + 2 : undefined,
          torque: part.bonusStats.torque ? part.bonusStats.torque + 2 : undefined,
          durability: part.bonusStats.durability ? part.bonusStats.durability + 10 : undefined
        }
      };

      return {
        ...prev,
        scrapMetal: prev.scrapMetal - upgradeCost,
        ownedCars: prev.ownedCars.map((c) => {
          if (c.id === car.id) {
            return {
              ...c,
              equippedParts: {
                ...c.equippedParts,
                [foundSlot!]: upgradedPart
              }
            };
          }
          return c;
        })
      };
    });
  };

  const handleUpdateVisuals = (carId: string, visuals: CarVisuals) => {
    setProfile((prev) => ({
      ...prev,
      ownedCars: prev.ownedCars.map((c) => (c.id === carId ? { ...c, visuals } : c))
    }));
  };

  const handleCarAcquired = (car: Car, costType: 'coins' | 'cash', costAmount: number) => {
    setProfile((prev) => ({
      ...prev,
      coins: costType === 'coins' ? prev.coins - costAmount : prev.coins,
      cash: costType === 'cash' ? prev.cash - costAmount : prev.cash,
      ownedCars: [car, ...prev.ownedCars]
    }));
  };

  const handleDismantleCar = (carId: string, scrapGained: number, bonusPart: CarPart | null) => {
    setProfile((prev) => ({
      ...prev,
      scrapMetal: prev.scrapMetal + scrapGained,
      inventoryParts: bonusPart ? [...prev.inventoryParts, bonusPart] : prev.inventoryParts,
      ownedCars: prev.ownedCars.filter((c) => c.id !== carId)
    }));
  };

  const handleDismantlePart = (
    part: CarPart,
    fromCarId?: string,
    slotKey?: keyof Car['equippedParts']
  ) => {
    const scrapVal = (part.scrapValue || 25) + ((part.level || 1) - 1) * 15;

    setProfile((prev) => {
      let updatedOwnedCars = prev.ownedCars;
      if (fromCarId && slotKey) {
        updatedOwnedCars = prev.ownedCars.map((c) => {
          if (c.id === fromCarId) {
            const newEquipped = { ...c.equippedParts };
            delete newEquipped[slotKey];
            return { ...c, equippedParts: newEquipped };
          }
          return c;
        });
      }

      const updatedInventory = prev.inventoryParts.filter((p) => p.id !== part.id);

      return {
        ...prev,
        scrapMetal: prev.scrapMetal + scrapVal,
        inventoryParts: updatedInventory,
        ownedCars: updatedOwnedCars
      };
    });
  };

  const handleDismantleAllInventoryParts = () => {
    setProfile((prev) => {
      if (prev.inventoryParts.length === 0) return prev;
      const totalScrapGained = prev.inventoryParts.reduce(
        (acc, p) => acc + (p.scrapValue || 25) + ((p.level || 1) - 1) * 15,
        0
      );

      return {
        ...prev,
        scrapMetal: prev.scrapMetal + totalScrapGained,
        inventoryParts: []
      };
    });
  };

  const handleSaveCustomAsset = (asset: CustomCarAsset) => {
    setProfile((prev) => {
      const existing = prev.customAssets || [];
      const index = existing.findIndex((a) => a.id === asset.id);
      let updatedAssets: CustomCarAsset[];
      if (index >= 0) {
        updatedAssets = [...existing];
        updatedAssets[index] = asset;
      } else {
        updatedAssets = [asset, ...existing];
      }
      return {
        ...prev,
        customAssets: updatedAssets
      };
    });
  };

  const handleEquipCustomAsset = (carId: string, asset: CustomCarAsset) => {
    setProfile((prev) => {
      const updatedOwnedCars = prev.ownedCars.map((car) => {
        if (car.id === carId) {
          return {
            ...car,
            visuals: {
              ...car.visuals,
              customAssetId: asset.id,
              customAssetName: asset.name,
              customPixelData: JSON.stringify(asset)
            }
          };
        }
        return car;
      });

      const existing = prev.customAssets || [];
      const index = existing.findIndex((a) => a.id === asset.id);
      const updatedAssets = index >= 0 ? existing : [asset, ...existing];

      return {
        ...prev,
        ownedCars: updatedOwnedCars,
        customAssets: updatedAssets
      };
    });
  };

  const handleDeleteCustomAsset = (assetId: string) => {
    setProfile((prev) => ({
      ...prev,
      customAssets: (prev.customAssets || []).filter((a) => a.id !== assetId)
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Header with Currencies & WebSocket Status */}
      <Header
        coins={profile.coins}
        cash={profile.cash}
        scrapMetal={profile.scrapMetal}
        activeCar={activeCar}
        wsConnected={wsConnected}
        onAddFunds={handleAddFunds}
        onRerollStarter={handleRerollStarter}
        starterTier={profile.starterTierClaimed}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-6">
        {/* Playable Navigation Bar */}
        <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/80">
          <button
            onClick={() => setActiveTab('race')}
            className={`py-2 px-3 sm:px-4 rounded-xl font-mono text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'race'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>Pistas & Farm (5 Mapas)</span>
          </button>

          <button
            onClick={() => setActiveTab('garage')}
            className={`py-2 px-3 sm:px-4 rounded-xl font-mono text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'garage'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <CarIcon className="w-4 h-4" />
            <span>Garagem & Tuning</span>
          </button>

          <button
            onClick={() => setActiveTab('betting')}
            className={`py-2 px-3 sm:px-4 rounded-xl font-mono text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'betting'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Apostas Ao Vivo</span>
          </button>

          <button
            onClick={() => setActiveTab('gacha')}
            className={`py-2 px-3 sm:px-4 rounded-xl font-mono text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'gacha'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Ferro Velho (Gacha)</span>
          </button>

          <button
            onClick={() => setActiveTab('dealer')}
            className={`py-2 px-3 sm:px-4 rounded-xl font-mono text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'dealer'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Concessionária 0KM</span>
          </button>

          <button
            onClick={() => setActiveTab('chop')}
            className={`py-2 px-3 sm:px-4 rounded-xl font-mono text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'chop'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Desmanche & Peças</span>
            {profile.inventoryParts.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'chop' ? 'bg-slate-950 text-amber-400' : 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
              }`}>
                {profile.inventoryParts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('asset_dev')}
            className={`py-2 px-3 sm:px-4 rounded-xl font-mono text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'asset_dev'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Asset Development</span>
            {profile.customAssets && profile.customAssets.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'asset_dev' ? 'bg-slate-950 text-amber-400' : 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
              }`}>
                {profile.customAssets.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowCashShop(true)}
            className="py-2 px-3 sm:px-4 rounded-xl font-mono text-xs font-black flex items-center gap-2 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 transition-all cursor-pointer whitespace-nowrap ml-auto"
          >
            <Banknote className="w-4 h-4 text-emerald-400" />
            <span>Loja de Cash</span>
          </button>
        </nav>

        {/* Tab Content */}
        {activeTab === 'race' && (
          <RaceFarmView
            car={activeCar}
            idleMap={profile.idleFarmMap}
            onSetIdleMap={(map) => setProfile((p) => ({ ...p, idleFarmMap: map }))}
            onRaceFinish={handleRaceFinish}
            onHarvestIdle={handleHarvestIdle}
            idleRewards={idleRewards}
            onReturnToLobby={() => setActiveTab('garage')}
          />
        )}

        {activeTab === 'garage' && (
          <GarageView
            ownedCars={profile.ownedCars}
            activeCarId={profile.activeCarId}
            inventoryParts={profile.inventoryParts}
            scrapMetal={profile.scrapMetal}
            coins={profile.coins}
            customAssets={profile.customAssets || []}
            onSelectActiveCar={handleSelectActiveCar}
            onEquipPart={handleEquipPart}
            onUnequipPart={handleUnequipPart}
            onUpgradePart={handleUpgradePart}
            onUpdateVisuals={handleUpdateVisuals}
            onDismantlePart={handleDismantlePart}
            onDismantleAllParts={handleDismantleAllInventoryParts}
            onOpenStudio={() => setActiveTab('asset_dev')}
          />
        )}

        {activeTab === 'betting' && (
          <BettingArenaView
            playerCoins={profile.coins}
            playerCash={profile.cash}
            liveRaceState={liveRaceState}
            activeBets={profile.activeBets}
            onPlaceBet={handlePlaceBet}
            lastPayoutNotification={lastPayout}
          />
        )}

        {activeTab === 'gacha' && (
          <JunkyardGachaView
            playerCoins={profile.coins}
            playerCash={profile.cash}
            onCarAcquired={handleCarAcquired}
          />
        )}

        {activeTab === 'dealer' && (
          <DealershipView
            playerCoins={profile.coins}
            playerCash={profile.cash}
            onBuyCar={(car, curr, price) => handleCarAcquired(car, curr, price)}
          />
        )}

        {activeTab === 'chop' && (
          <ChopShopView
            ownedCars={profile.ownedCars}
            activeCarId={profile.activeCarId}
            inventoryParts={profile.inventoryParts}
            onDismantleCar={handleDismantleCar}
            onDismantlePart={handleDismantlePart}
            onDismantleAllParts={handleDismantleAllInventoryParts}
          />
        )}

        {activeTab === 'asset_dev' && (
          <AssetStudioView
            activeCar={activeCar}
            playerProfile={profile}
            customAssets={profile.customAssets || []}
            onSaveAsset={handleSaveCustomAsset}
            onEquipAssetToCar={handleEquipCustomAsset}
            onDeleteAsset={handleDeleteCustomAsset}
          />
        )}
      </main>

      {/* Starter Modal (30/30/30/10 probability reveal) */}
      {showStarterModal && (
        <StarterModal
          car={activeCar}
          tier={profile.starterTierClaimed}
          onClose={() => setShowStarterModal(false)}
          onReroll={handleRerollStarter}
        />
      )}

      {/* Monetization / Cash Shop Modal */}
      {showCashShop && (
        <MonetizationModal
          onClose={() => setShowCashShop(false)}
          onCreditCash={(amt) => setProfile((p) => ({ ...p, cash: p.cash + amt }))}
        />
      )}
    </div>
  );
}
