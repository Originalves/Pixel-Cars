import React, { useState } from 'react';
import { Trash2, Wrench, Sparkles, Check, AlertTriangle, ShieldAlert, Package, Car as CarIcon } from 'lucide-react';
import { Car, CarPart } from '../types';
import { PixelCarCanvas } from './PixelCarCanvas';

interface ChopShopViewProps {
  ownedCars: Car[];
  activeCarId: string;
  inventoryParts: CarPart[];
  onDismantleCar: (carId: string, scrapGained: number, bonusPart: CarPart | null) => void;
  onDismantlePart: (part: CarPart) => void;
  onDismantleAllParts?: () => void;
}

export const ChopShopView: React.FC<ChopShopViewProps> = ({
  ownedCars,
  activeCarId,
  inventoryParts,
  onDismantleCar,
  onDismantlePart,
  onDismantleAllParts
}) => {
  const [activeTab, setActiveTab] = useState<'parts' | 'cars'>('parts');
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [lastDismantleReport, setLastDismantleReport] = useState<{ carName: string; scrap: number; part: CarPart | null } | null>(null);
  const [partDismantleNotification, setPartDismantleNotification] = useState<string | null>(null);

  // Eligible cars to dismantle (cannot dismantle active car or if you only have 1 car)
  const eligibleCars = ownedCars.filter((c) => c.id !== activeCarId);
  const selectedCar = eligibleCars.find((c) => c.id === selectedCarId) || null;

  // Calculate yield for dismantling this car
  const calculateYield = (car: Car) => {
    let scrap = 50 + (car.baseStats.topSpeed + car.baseStats.acceleration + car.baseStats.torque) * 3;
    if (car.rarity === 'legendary') scrap *= 2.5;
    if (car.rarity === 'epic') scrap *= 1.8;
    if (car.rarity === 'rare') scrap *= 1.3;
    return Math.round(scrap);
  };

  // Helper to calculate scrap value from part
  const getPartScrapValue = (part: CarPart) => {
    return (part.scrapValue || 25) + ((part.level || 1) - 1) * 15;
  };

  const totalInventoryScrap = inventoryParts.reduce((acc, p) => acc + getPartScrapValue(p), 0);

  const handleConfirmDismantle = () => {
    if (!selectedCar) return;

    const scrap = calculateYield(selectedCar);

    // Chance to salvage a high-grade tuning part
    let bonusPart: CarPart | null = null;
    if (Math.random() < 0.75) {
      bonusPart = {
        id: 'salvaged_' + Math.random().toString(36).substring(2, 9),
        name: `Componente Sucateado de ${selectedCar.name.split(' ')[0]}`,
        category: Math.random() > 0.5 ? 'engine' : 'transmission',
        tier: selectedCar.rarity === 'legendary' ? 'epic' : 'rare',
        mapOrigin: 'universal',
        level: 1,
        bonusStats: {
          topSpeed: Math.floor(selectedCar.baseStats.topSpeed * 0.3),
          acceleration: Math.floor(selectedCar.baseStats.acceleration * 0.3),
          torque: Math.floor(selectedCar.baseStats.torque * 0.3)
        },
        description: 'Peça de alto desempenho recuperada das entranhas do motor no desmanche.',
        scrapValue: 50,
        iconName: 'Wrench'
      };
    }

    onDismantleCar(selectedCar.id, scrap, bonusPart);
    setLastDismantleReport({ carName: selectedCar.name, scrap, part: bonusPart });
    setSelectedCarId(null);
  };

  const handleDismantleSinglePart = (part: CarPart) => {
    const scrapGained = getPartScrapValue(part);
    onDismantlePart(part);
    setPartDismantleNotification(`✓ Peça "${part.name}" triturada! +${scrapGained} pontos de sucata adicionados.`);
    setTimeout(() => setPartDismantleNotification(null), 3500);
  };

  const handleDismantleAllPartsClick = () => {
    if (!onDismantleAllParts || inventoryParts.length === 0) return;
    const count = inventoryParts.length;
    const scrapTotal = totalInventoryScrap;
    onDismantleAllParts();
    setPartDismantleNotification(`✓ ${count} peças desmanchadas com sucesso! +${scrapTotal} pontos de sucata creditados.`);
    setTimeout(() => setPartDismantleNotification(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="max-w-2xl mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border bg-rose-950/40 text-rose-400 border-rose-500/40">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Desmanche & Reciclagem de Peças</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white font-mono">
            Prensa Hidráulica do Desmanche
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Envie peças sobressalentes ou veículos repetidos para a prensa para triturá-los em <strong>Pontos de Sucata</strong>. Use a sucata obtida para aprimorar os slots do seu carro de corrida.
          </p>
        </div>

        {/* SUB-TABS: PEÇAS VS CARROS */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-5">
          <button
            onClick={() => setActiveTab('parts')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'parts'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Desmanche de Peças ({inventoryParts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cars')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'cars'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <CarIcon className="w-4 h-4" />
            <span>Desmanche de Carros ({eligibleCars.length})</span>
          </button>
        </div>

        {/* TAB 1: PEÇAS */}
        {activeTab === 'parts' && (
          <div className="space-y-4">
            {partDismantleNotification && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-rose-950/90 via-slate-900 to-amber-950/80 border border-rose-500/40 text-amber-200 text-xs font-mono font-bold flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>{partDismantleNotification}</span>
                </div>
                <button
                  onClick={() => setPartDismantleNotification(null)}
                  className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Peças do Inventário Prontas para Desmanche
                </h3>
                <p className="text-[11px] text-slate-400">
                  Farmadas nas corridas. Envie individualmente ou desmanche o estoque todo.
                </p>
              </div>

              {inventoryParts.length > 1 && onDismantleAllParts && (
                <button
                  onClick={handleDismantleAllPartsClick}
                  className="py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-rose-600/20 cursor-pointer transition-transform active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Desmanchar Todas (+{totalInventoryScrap} Sucata)</span>
                </button>
              )}
            </div>

            {inventoryParts.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/50 border border-slate-800 rounded-xl space-y-2">
                <Package className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="text-sm font-black font-mono text-slate-400">Inventário de Peças Vazio</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Você não possui peças sobressalentes no momento. Ganhe peças vencendo corridas nos 5 mapas ou coletando recompensas do Farm Idle!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {inventoryParts.map((part) => {
                  const scrapYield = getPartScrapValue(part);

                  return (
                    <div
                      key={part.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-bold font-mono text-white truncate">{part.name}</span>
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {part.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mb-2">
                          <span className="text-amber-400 font-bold">Nível {part.level}</span>
                          <span>•</span>
                          <span className="capitalize">{part.tier}</span>
                        </div>

                        <div className="text-[10px] text-emerald-400 font-mono space-x-2">
                          {part.bonusStats.topSpeed && <span>+{part.bonusStats.topSpeed} Spd</span>}
                          {part.bonusStats.acceleration && <span>+{part.bonusStats.acceleration} Acc</span>}
                          {part.bonusStats.torque && <span>+{part.bonusStats.torque} Tor</span>}
                          {part.bonusStats.durability && <span>+{part.bonusStats.durability} Blind</span>}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          +{scrapYield} Pontos de Sucata
                        </span>

                        <button
                          onClick={() => handleDismantleSinglePart(part)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Enviar pro Desmanche</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CARROS */}
        {activeTab === 'cars' && (
          <div>
            {lastDismantleReport && (
              <div className="p-4 mb-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>
                    {lastDismantleReport.carName} foi desmanchado com sucesso! Rendimento: +{lastDismantleReport.scrap} Sucata Metal.
                  </span>
                </div>
                {lastDismantleReport.part && (
                  <span className="bg-emerald-900/60 px-2 py-0.5 rounded text-[11px] font-bold">
                    ⭐ Peça Recuperada: {lastDismantleReport.part.name}
                  </span>
                )}
              </div>
            )}

            {eligibleCars.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/50 border border-slate-800 rounded-xl">
                <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <div className="text-sm font-black font-mono text-slate-400">Nenhum carro sobressalente disponível</div>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Você só possui o seu carro principal. Compre novos carros no <strong>Ferro Velho (Gacha)</strong> ou na <strong>Concessionária</strong> para poder desmanchá-los aqui!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CAR SELECTION LIST */}
                <div className="lg:col-span-2 space-y-3">
                  <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                    Carros Disponíveis para Sacrifício ({eligibleCars.length})
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                    {eligibleCars.map((car) => {
                      const isSel = selectedCarId === car.id;
                      const scrapYield = calculateYield(car);

                      return (
                        <div
                          key={car.id}
                          onClick={() => setSelectedCarId(car.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isSel
                              ? 'bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/40 shadow-lg'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black font-mono text-white truncate">{car.name}</span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              {car.rarity}
                            </span>
                          </div>

                          <div className="py-2 flex items-center justify-center">
                            <PixelCarCanvas car={car} width={130} height={55} scale={2} />
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                            <span>Status: {car.condition}</span>
                            <span className="text-amber-400 font-bold">Rende: +{scrapYield} Sucata</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CONFIRMATION WORKBENCH */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-3 pb-2 border-b border-slate-800 flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-rose-400" />
                      <span>Prensa Hidráulica do Desmanche</span>
                    </h3>

                    {selectedCar ? (
                      <div className="space-y-4">
                        <div className="text-center py-2">
                          <div className="text-sm font-black font-mono text-rose-400">{selectedCar.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">Raridade: {selectedCar.rarity}</div>
                        </div>

                        <div className="bg-slate-900 p-3 rounded-xl space-y-2 text-xs font-mono">
                          <div className="flex justify-between text-slate-300">
                            <span>Sucata Estimada:</span>
                            <strong className="text-amber-400 font-bold">+{calculateYield(selectedCar)} Peças</strong>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Chance de Peça Rara:</span>
                            <strong className="text-emerald-400">75%</strong>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-300 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                          <span>
                            Esta ação é irreversível! O veículo será desmontado permanentemente em troca de recursos.
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs font-mono text-slate-500">
                        Selecione um carro ao lado para enviar à prensa do desmanche.
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleConfirmDismantle}
                    disabled={!selectedCar}
                    className={`w-full mt-4 py-3 rounded-xl font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      selectedCar
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 active:scale-95'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Desmanchar Agora</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
