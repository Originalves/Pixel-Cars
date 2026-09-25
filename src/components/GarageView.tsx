import React, { useState, useEffect, useRef } from 'react';
import { 
  Car as CarIcon, 
  Wrench, 
  Palette, 
  Sparkles, 
  Check, 
  ArrowUpCircle,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { Car, CarPart, CarVisuals, CustomCarAsset, PartCategory } from '../types';
import { calculateEffectiveStats, CHASSIS_DEFINITIONS, AVAILABLE_SKINS } from '../data/gameData';
import { PixelCarCanvas } from './PixelCarCanvas';
import { PixelPartCanvas } from './PixelPartCanvas';
import { CarTelemetryCluster } from './CarTelemetryCluster';

interface GarageViewProps {
  ownedCars: Car[];
  activeCarId: string;
  inventoryParts: CarPart[];
  scrapMetal: number;
  coins: number;
  customAssets?: CustomCarAsset[];
  onSelectActiveCar: (id: string) => void;
  onEquipPart: (carId: string, part: CarPart) => void;
  onUnequipPart: (carId: string, category: keyof Car['equippedParts']) => void;
  onUpgradePart: (partId: string) => void;
  onUpdateVisuals: (carId: string, visuals: CarVisuals) => void;
  onDismantlePart: (part: CarPart, fromCarId?: string, slotKey?: keyof Car['equippedParts']) => void;
  onDismantleAllParts?: () => void;
  onOpenStudio?: () => void;
}

const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#10b981', '#06b6d4', 
  '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#64748b', '#18181b'
];

const NEON_PALETTE = [
  '#00f0ff', '#f43f5e', '#a855f7', '#22c55e', '#eab308', '#ffffff'
];

export const GarageView: React.FC<GarageViewProps> = ({
  ownedCars,
  activeCarId,
  inventoryParts,
  scrapMetal,
  coins,
  customAssets = [],
  onSelectActiveCar,
  onEquipPart,
  onUnequipPart,
  onUpgradePart,
  onUpdateVisuals,
  onDismantlePart,
  onDismantleAllParts,
  onOpenStudio
}) => {
  const [selectedCarId, setSelectedCarId] = useState<string>(activeCarId);
  const [garageTab, setGarageTab] = useState<'chassis' | 'parts' | 'customization'>('chassis');
  const [dismantleNotification, setDismantleNotification] = useState<string | null>(null);
  const [previewViewMode, setPreviewViewMode] = useState<'right' | 'left' | 'front' | 'rear' | 'top' | 'rotation'>('right');
  const [previewAngle, setPreviewAngle] = useState<number>(90);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const dragStartXRef = useRef<number | null>(null);
  const dragStartAngleRef = useRef<number>(90);

  // Auto rotation effect
  useEffect(() => {
    if (!isAutoRotating || previewViewMode !== 'rotation') return;
    const interval = setInterval(() => {
      setPreviewAngle((prev) => (prev + 15) % 360);
    }, 160);
    return () => clearInterval(interval);
  }, [isAutoRotating, previewViewMode]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (previewViewMode !== 'rotation') return;
    dragStartXRef.current = e.clientX;
    dragStartAngleRef.current = previewAngle;
    setIsAutoRotating(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartXRef.current === null || previewViewMode !== 'rotation') return;
    const deltaX = e.clientX - dragStartXRef.current;
    // Each 10px corresponds to 15 degrees
    const stepDelta = Math.round(deltaX / 12) * 15;
    const newAngle = ((dragStartAngleRef.current - stepDelta) % 360 + 360) % 360;
    setPreviewAngle(newAngle);
  };

  const handlePointerUp = () => {
    dragStartXRef.current = null;
  };

  const selectedCar = ownedCars.find((c) => c.id === selectedCarId) || ownedCars[0];
  const effectiveStats = calculateEffectiveStats(selectedCar);

  const isActive = selectedCar.id === activeCarId;

  // Equipment slots keys
  const slots: (keyof Car['equippedParts'])[] = [
    'engine', 'turbo', 'transmission', 'tires', 'suspension', 'nitro', 'armor', 'aero'
  ];

  const slotLabels: Record<keyof Car['equippedParts'], string> = {
    engine: 'Motor V8',
    turbo: 'Turbocompressor',
    transmission: 'Câmbio / Marchas',
    tires: 'Pneus Semi-Slick',
    suspension: 'Suspensão Coilover',
    nitro: 'Garrafa Nitro NOS',
    armor: 'Chassi / Skid Plate',
    aero: 'Aerofólio GT Wing'
  };

  // Helper to calculate scrap points from part
  const getPartScrapValue = (part: CarPart) => {
    return (part.scrapValue || 25) + ((part.level || 1) - 1) * 15;
  };

  const handleDismantlePartWithFeedback = (
    part: CarPart,
    fromCarId?: string,
    slotKey?: keyof Car['equippedParts']
  ) => {
    const scrapVal = getPartScrapValue(part);
    onDismantlePart(part, fromCarId, slotKey);
    setDismantleNotification(
      `✓ Peça "${part.name}" enviada ao desmanche! +${scrapVal} pontos de sucata adicionados.`
    );
    setTimeout(() => {
      setDismantleNotification((prev) => (prev?.includes(part.name) ? null : prev));
    }, 4000);
  };

  const totalInventoryScrap = inventoryParts.reduce((acc, p) => acc + getPartScrapValue(p), 0);

  const handleDismantleAllWithFeedback = () => {
    if (!onDismantleAllParts || inventoryParts.length === 0) return;
    const count = inventoryParts.length;
    const totalGained = totalInventoryScrap;
    onDismantleAllParts();
    setDismantleNotification(
      `✓ Lote de ${count} peças enviado ao desmanche! +${totalGained} pontos de sucata creditados.`
    );
    setTimeout(() => setDismantleNotification(null), 4500);
  };

  return (
    <div className="space-y-6">
      {/* CAR SELECTION CAROUSEL / FLEET */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CarIcon className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Sua Frota de Veículos ({ownedCars.length})
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Selecione para gerenciar e tunar</span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {ownedCars.map((car) => {
            const isSel = car.id === selectedCarId;
            const isAct = car.id === activeCarId;

            return (
              <div
                key={car.id}
                onClick={() => setSelectedCarId(car.id)}
                className={`flex-shrink-0 w-44 p-3 rounded-xl border transition-all cursor-pointer relative ${
                  isSel
                    ? 'bg-slate-800 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {isAct && (
                  <span className="absolute top-2 right-2 bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded font-mono">
                    ATIVO
                  </span>
                )}

                <div className="flex items-center justify-center py-2">
                  <PixelCarCanvas car={car} width={130} height={55} scale={2} />
                </div>

                <div className="text-xs font-black font-mono text-white truncate">{car.name}</div>
                <div className="text-[10px] text-slate-400 capitalize">{car.rarity} • {car.visuals.bodyType}</div>

                <div className="flex items-center justify-between text-[9px] font-mono text-slate-300 mt-2 pt-1 border-t border-slate-800">
                  <span>SPD {car.baseStats.topSpeed}</span>
                  <span>ACC {car.baseStats.acceleration}</span>
                  <span>TOR {car.baseStats.torque}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SELECTED CAR MAIN WORKSHOP STAGE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CAR PREVIEW & STATS */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold border border-slate-700">
                  {selectedCar.rarity}
                </span>
                <h2 className="text-lg font-black font-mono text-white mt-1">{selectedCar.name}</h2>
                {selectedCar.visuals.customAssetName && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/40">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    Asset Próprio: {selectedCar.visuals.customAssetName}
                  </span>
                )}
              </div>

              {!isActive ? (
                <button
                  onClick={() => onSelectActiveCar(selectedCar.id)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  Tornar Ativo
                </button>
              ) : (
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-mono font-bold">
                  <Check className="w-4 h-4" /> Carro Principal
                </span>
              )}
            </div>

            {/* Huge Stage Canvas with View Angle Controls */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
              {/* View Mode Switcher */}
              {/* 360° Perspective Toolbar (Direita, Esquerda, Frente, Trás, Cima, 360°) */}
              <div className="flex items-center gap-1.5 mb-3 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-[11px] font-mono flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => setPreviewViewMode('right')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    previewViewMode === 'right'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  ➡️ Direita
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewMode('left')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    previewViewMode === 'left'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  ⬅️ Esquerda
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewMode('front')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    previewViewMode === 'front'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  ⬆️ Frente
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewMode('rear')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    previewViewMode === 'rear'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  ⬇️ Trás
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewMode('top')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    previewViewMode === 'top'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  🔝 Cima
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewMode('rotation')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    previewViewMode === 'rotation'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  🔄 360° ({previewAngle}°)
                </button>
              </div>

              {/* Pixel Car Canvas Stage */}
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className={`relative py-3 px-2 flex items-center justify-center select-none ${
                  previewViewMode === 'rotation' ? 'cursor-ew-resize' : ''
                }`}
              >
                <PixelCarCanvas
                  car={selectedCar}
                  width={280}
                  height={120}
                  scale={3.8}
                  animated
                  showNitro={selectedCar.visuals.hasNeon}
                  viewMode={previewViewMode}
                  rotationAngle={previewAngle}
                />
              </div>

              {/* 360 Rotation Dial (matching the 24-angle reference spritesheet) */}
              {previewViewMode === 'rotation' && (
                <div className="w-full mt-2 pt-2 border-t border-slate-800/80 flex flex-col items-center gap-2">
                  <div className="flex items-center justify-between w-full text-[10px] font-mono text-slate-400 px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">Ângulo: {previewAngle}°</span>
                      <span className="text-slate-500">• 24 ângulos (passos de 15°)</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAutoRotating(!isAutoRotating)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                        isAutoRotating
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                      }`}
                    >
                      {isAutoRotating ? '⏸ Pausar 360°' : '▶ Girar 360°'}
                    </button>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="345"
                    step="15"
                    value={previewAngle}
                    onChange={(e) => {
                      setIsAutoRotating(false);
                      setPreviewAngle(parseInt(e.target.value, 10));
                    }}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />

                  {/* 8 Cardinal & Diagonal Perspectives */}
                  <div className="grid grid-cols-4 gap-1 w-full text-[9px] font-mono">
                    {[
                      { ang: 0, label: '0° Frente' },
                      { ang: 45, label: '45° 3/4 Dir' },
                      { ang: 90, label: '90° Perfil' },
                      { ang: 135, label: '135° Tras Dir' },
                      { ang: 180, label: '180° Traseira' },
                      { ang: 225, label: '225° Tras Esq' },
                      { ang: 270, label: '270° Perfil Esq' },
                      { ang: 315, label: '315° 3/4 Esq' }
                    ].map(({ ang, label }) => (
                      <button
                        key={ang}
                        type="button"
                        onClick={() => {
                          setIsAutoRotating(false);
                          setPreviewAngle(ang);
                        }}
                        className={`px-1.5 py-1 rounded text-center border transition-colors ${
                          previewAngle === ang
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <span className="text-[9px] text-slate-500 font-mono">
                    Dica: Arraste o carro com o mouse ou dedo para girar suavemente
                  </span>
                </div>
              )}

              <div className="text-[10px] font-mono text-slate-400 mt-2">
                Skin: <span className="text-slate-200">{selectedCar.visuals.skinName || 'Original'}</span>
              </div>
            </div>

            {/* Authentic Automotive Telemetry Dyno Cluster */}
            <div className="mt-4">
              <CarTelemetryCluster
                stats={effectiveStats}
                baseStats={selectedCar.baseStats}
                carName={selectedCar.name}
                rarity={selectedCar.rarity}
              />
            </div>
          </div>
        </div>

        {/* WORKSHOP TABS: CHASSI, PEÇAS MECÂNICAS, PINTURA & ESTILO */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4 overflow-x-auto">
            <button
              onClick={() => setGarageTab('chassis')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                garageTab === 'chassis'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <CarIcon className="w-4 h-4" />
              <span>Silhuetas de Chassi</span>
            </button>

            <button
              onClick={() => setGarageTab('parts')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                garageTab === 'parts'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Peças & Mecânica</span>
            </button>

            <button
              onClick={() => setGarageTab('customization')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                garageTab === 'customization'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Pintura & Estilo</span>
            </button>
          </div>

          {/* TAB 1: SILHUETAS DE CHASSI */}
          {garageTab === 'chassis' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800/80">
                <div>
                  <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                    <CarIcon className="w-4 h-4 text-amber-400" />
                    <span>Modelos de Chassi em Pixel Art Isométrico ({CHASSIS_DEFINITIONS.length} Modelos)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Escolha entre os modelos originais de fábrica ou equipe um dos seus chassis criados no Estúdio Pixel.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {onOpenStudio && (
                    <button
                      type="button"
                      onClick={onOpenStudio}
                      className="text-[11px] font-mono font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg border border-indigo-400/40 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Palette className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Criar Novo Chassi no Estúdio ↵</span>
                    </button>
                  )}
                  <div className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1.5">
                    <span>Atual:</span>
                    {selectedCar.visuals.customAssetId ? (
                      <span className="font-bold text-indigo-300 uppercase flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        {selectedCar.visuals.customAssetName || 'Chassi Custom'}
                      </span>
                    ) : (
                      <span className="font-bold text-white uppercase">
                        {CHASSIS_DEFINITIONS.find(c => c.id === selectedCar.visuals.bodyType)?.name || selectedCar.visuals.bodyType}
                      </span>
                    )}
                  </div>
                  {selectedCar.visuals.customAssetId && (
                    <button
                      type="button"
                      onClick={() => onUpdateVisuals(selectedCar.id, {
                        ...selectedCar.visuals,
                        customAssetId: undefined,
                        customAssetName: undefined,
                        customPixelData: undefined
                      })}
                      className="text-[10px] font-mono text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-700 cursor-pointer transition-colors"
                      title="Voltar para a silhueta padrão de fábrica"
                    >
                      Restaurar Fábrica ↵
                    </button>
                  )}
                </div>
              </div>

              {/* SEÇÃO 1: CHASSIS CUSTOMIZADOS CRIADOS NO ESTÚDIO */}
              {customAssets.length > 0 && (
                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold text-indigo-300 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>MEUS CHASSIS CUSTOMIZADOS ({customAssets.length})</span>
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500">
                      Disponíveis para equipar em qualquer carro
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {customAssets.map((asset) => {
                      const isEquipped = selectedCar.visuals.customAssetId === asset.id;
                      return (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() =>
                            onUpdateVisuals(selectedCar.id, {
                              ...selectedCar.visuals,
                              customAssetId: asset.id,
                              customAssetName: asset.name,
                              customPixelData: JSON.stringify(asset)
                            })
                          }
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
                            isEquipped
                              ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/40 shadow-lg shadow-indigo-950/30'
                              : 'bg-slate-950/80 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-xs font-black font-mono text-white flex items-center gap-1.5 truncate">
                              <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-sm flex-shrink-0" />
                              <span className="truncate">{asset.name}</span>
                            </span>
                            {isEquipped ? (
                              <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-indigo-600 text-white flex-shrink-0">
                                Equipado
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono text-indigo-400 group-hover:text-indigo-300 transition-colors flex-shrink-0">
                                Equipar ↵
                              </span>
                            )}
                          </div>

                          <div className="w-full h-20 my-2 rounded-lg bg-slate-950 border border-indigo-950/60 flex items-center justify-center overflow-hidden relative group-hover:border-indigo-800/60 transition-colors">
                            <PixelCarCanvas
                              car={{
                                ...selectedCar,
                                visuals: {
                                  ...selectedCar.visuals,
                                  customPixelData: JSON.stringify(asset)
                                }
                              }}
                              width={160}
                              height={64}
                              scale={2.0}
                              animated={isEquipped}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-slate-800/80">
                            <span className="text-indigo-400 font-bold">CUSTOM 360°</span>
                            <span className="text-slate-500">
                              {asset.rarityScore ? `Raridade ${asset.rarityScore}` : 'Arte Própria'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SEÇÃO 2: SILHUETAS DE FÁBRICA */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold text-amber-400 flex items-center gap-2">
                    <CarIcon className="w-3.5 h-3.5 text-amber-500" />
                    <span>SILHUETAS DE FÁBRICA ({CHASSIS_DEFINITIONS.length} MODELOS)</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">
                    Estilos padrão de engenharia com aero e proporções reais
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {CHASSIS_DEFINITIONS.map((chassis) => {
                    const isSelected = !selectedCar.visuals.customAssetId && selectedCar.visuals.bodyType === chassis.id;
                    return (
                      <button
                        key={chassis.id}
                        type="button"
                        onClick={() =>
                          onUpdateVisuals(selectedCar.id, {
                            ...selectedCar.visuals,
                            bodyType: chassis.id,
                            customPixelData: undefined,
                            customAssetId: undefined,
                            customAssetName: undefined
                          })
                        }
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/40 shadow-lg shadow-amber-950/20'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-black font-mono text-white flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full shadow-sm"
                              style={{ backgroundColor: chassis.iconAccent }}
                            />
                            {chassis.name}
                          </span>
                          {isSelected ? (
                            <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                              Equipado
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono text-slate-500 group-hover:text-amber-400 transition-colors">
                              Equipar ↵
                            </span>
                          )}
                        </div>

                        {/* Visual Chassis Silhouette Canvas in Pixel-Art with Directional Shadows */}
                        <div className="w-full h-20 my-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-center overflow-hidden relative group-hover:border-slate-700 transition-colors">
                          <PixelCarCanvas
                            car={{
                              ...selectedCar,
                              visuals: {
                                ...selectedCar.visuals,
                                bodyType: chassis.id as any,
                                primaryColor: isSelected ? selectedCar.visuals.primaryColor : chassis.iconAccent,
                                secondaryColor: selectedCar.visuals.secondaryColor,
                                customPixelData: undefined
                              }
                            }}
                            width={160}
                            height={64}
                            scale={2.4}
                            animated={isSelected}
                          />
                        </div>

                        <p className="text-[11px] text-slate-300 font-sans line-clamp-1 mb-2">
                          {chassis.tagline}
                        </p>
                        <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-slate-800/80">
                          <span className="text-amber-400 font-bold">{chassis.category}</span>
                          <span className="text-slate-400">{chassis.highlightStats}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PEÇAS MECÂNICAS & SLOTS */}
          {garageTab === 'parts' && (
            <div className="space-y-4">
              {/* Dismantle Notification Alert */}
              {dismantleNotification && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-rose-950/90 via-slate-900 to-amber-950/80 border border-rose-500/40 text-amber-200 text-xs font-mono font-bold flex items-center justify-between shadow-lg shadow-rose-950/30">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>{dismantleNotification}</span>
                  </div>
                  <button
                    onClick={() => setDismantleNotification(null)}
                    className="text-slate-400 hover:text-white text-xs cursor-pointer ml-3 px-1.5 py-0.5 rounded bg-slate-800"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {slots.map((slotKey) => {
                  const equipped = selectedCar.equippedParts[slotKey];

                  return (
                    <div
                      key={slotKey}
                      className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                        equipped
                          ? 'bg-slate-950/80 border-slate-700 shadow-sm'
                          : 'bg-slate-950/30 border-dashed border-slate-800 text-slate-500'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <PixelPartCanvas
                            category={slotKey as PartCategory}
                            tier={equipped?.tier || 'common'}
                            width={38}
                            height={38}
                            className={!equipped ? 'opacity-30 grayscale' : ''}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block truncate">
                              {slotLabels[slotKey] || slotKey}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 block">
                              {equipped ? `Nível ${equipped.level}` : 'Vazio'}
                            </span>
                          </div>
                        </div>

                        {equipped ? (
                          <>
                            <div className="text-xs font-black font-mono text-white truncate">{equipped.name}</div>
                            <div className="flex items-center justify-between text-[10px] font-mono mt-0.5">
                              <span className="text-amber-400 font-bold capitalize">Tier {equipped.tier || 'comum'}</span>
                              <span className="text-slate-400 text-[9px]">+{getPartScrapValue(equipped)}S</span>
                            </div>
                            <div className="text-[9px] text-emerald-400 font-mono mt-1">
                              {equipped.bonusStats.topSpeed && <div>+{equipped.bonusStats.topSpeed} Speed</div>}
                              {equipped.bonusStats.acceleration && <div>+{equipped.bonusStats.acceleration} Accel</div>}
                              {equipped.bonusStats.torque && <div>+{equipped.bonusStats.torque} Torque</div>}
                              {equipped.bonusStats.durability && <div>+{equipped.bonusStats.durability} Blindagem</div>}
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] font-mono text-slate-500 py-1">Slot Desocupado</div>
                        )}
                      </div>

                      {equipped && (
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-800">
                          <button
                            onClick={() => onUpgradePart(equipped.id)}
                            title="Melhorar nível da peça usando Sucata"
                            className="flex-1 py-1 px-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <ArrowUpCircle className="w-3 h-3" />
                            <span>Up ({equipped.level * 25}S)</span>
                          </button>

                          <button
                            onClick={() => handleDismantlePartWithFeedback(equipped, selectedCar.id, slotKey)}
                            title={`Enviar peça montada diretamente para o desmanche (+${getPartScrapValue(equipped)} Sucata)`}
                            className="p-1 px-1.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-600/40 text-rose-300 text-[10px] font-mono cursor-pointer flex items-center justify-center"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => onUnequipPart(selectedCar.id, slotKey)}
                            title="Desequipar e guardar no inventário"
                            className="py-1 px-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-mono cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* INVENTORY OF UNMOUNTED PARTS (FROM FARM MAPS) */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Inventário de Peças Coletadas ({inventoryParts.length})</span>
                    <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">Farmadas nas 5 pistas</span>
                  </h4>

                  {inventoryParts.length > 1 && onDismantleAllParts && (
                    <button
                      onClick={handleDismantleAllWithFeedback}
                      className="py-1 px-2.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-600/40 text-rose-300 font-mono text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                      title="Enviar todas as peças sobressalentes ao desmanche para somar sucata rápida"
                    >
                      <Trash2 className="w-3 h-3 text-rose-400" />
                      <span>Desmanchar Todas (+{totalInventoryScrap} Sucata)</span>
                    </button>
                  )}
                </div>

                {inventoryParts.length === 0 ? (
                  <div className="text-xs font-mono text-slate-500 py-6 text-center bg-slate-950/40 rounded-xl border border-slate-800">
                    Nenhuma peça sobressalente. Participe de corridas ou ative o Farm Idle para coletar peças!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 max-h-72 overflow-y-auto pr-1">
                    {inventoryParts.map((part) => {
                      const scrapYield = getPartScrapValue(part);
                      return (
                        <div
                          key={part.id}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <PixelPartCanvas
                              category={part.category}
                              tier={part.tier}
                              width={42}
                              height={42}
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold font-mono text-white truncate">{part.name}</span>
                                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                  {slotLabels[part.category as keyof Car['equippedParts']] || part.category}
                                </span>
                                <span
                                  className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                    part.tier === 'legendary'
                                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                      : part.tier === 'epic'
                                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                      : part.tier === 'rare'
                                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {part.tier || 'comum'}
                                </span>
                                <span className="text-[10px] font-mono text-amber-400 font-bold ml-auto sm:ml-0 flex items-center gap-1">
                                  +{scrapYield} Sucata
                                </span>
                              </div>

                              <div className="text-[10px] text-emerald-400 font-mono mt-1 flex flex-wrap gap-2">
                                {part.bonusStats.topSpeed && <span>+{part.bonusStats.topSpeed} Spd</span>}
                                {part.bonusStats.acceleration && <span>+{part.bonusStats.acceleration} Acc</span>}
                                {part.bonusStats.torque && <span>+{part.bonusStats.torque} Tor</span>}
                                {part.bonusStats.durability && <span>+{part.bonusStats.durability} Blindagem</span>}
                                {part.bonusStats.handling && <span>+{part.bonusStats.handling} Dirigib.</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => onEquipPart(selectedCar.id, part)}
                              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                              title="Equipar esta peça no carro selecionado"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Equipar</span>
                            </button>

                            <button
                              onClick={() => handleDismantlePartWithFeedback(part)}
                              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-600/40 text-rose-300 hover:text-white font-mono text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                              title={`Enviar ao desmanche e receber +${scrapYield} pontos de sucata`}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              <span>Desmanchar</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMIZAÇÃO VISUAL (PINTURA, CORES, SKINS) */}
          {garageTab === 'customization' && (
            <div className="space-y-5">
              {/* Skins & Movie Liveries Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono text-slate-300 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Skins & Liveries Lendárias de Cinema:
                  </label>
                  <span className="text-[10px] font-mono text-amber-400/90 font-bold">
                    {selectedCar.visuals.skinName || 'Original de Fábrica'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {AVAILABLE_SKINS.map((skin) => {
                    const isSelected = 
                      (selectedCar.visuals.equippedSkinId === skin.id) ||
                      (!selectedCar.visuals.equippedSkinId && skin.id === 'original') ||
                      (selectedCar.visuals.skinName?.toLowerCase().includes(skin.id.replace('skin_', '')));

                    return (
                      <button
                        key={skin.id}
                        onClick={() =>
                          onUpdateVisuals(selectedCar.id, {
                            ...selectedCar.visuals,
                            skinName: skin.name,
                            equippedSkinId: skin.id
                          })
                        }
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/50 shadow-md'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-bold font-mono text-white flex items-center gap-1.5 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-white/40 flex-shrink-0"
                              style={{ backgroundColor: skin.previewColor }}
                            />
                            <span className="truncate">{skin.name}</span>
                          </span>
                          {isSelected && (
                            <span className="text-[8px] font-mono font-black uppercase px-1 py-0.5 rounded bg-amber-500 text-slate-950 flex-shrink-0">
                              Equipada
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-400 line-clamp-1 mb-1">
                          {skin.description}
                        </p>
                        <span className="text-[9px] font-mono text-slate-400 bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800 self-start">
                          {skin.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Primary Color */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono text-slate-400 block">Cor Principal da Lataria:</label>
                  <span className="text-[10px] font-mono text-slate-300 font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-white/30 inline-block" style={{ backgroundColor: selectedCar.visuals.primaryColor || '#3b82f6' }} />
                    {selectedCar.visuals.primaryColor || '#3b82f6'}
                  </span>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      onClick={() => onUpdateVisuals(selectedCar.id, { ...selectedCar.visuals, primaryColor: c })}
                      className={`w-8 h-8 rounded-lg border-2 transition-transform cursor-pointer ${
                        selectedCar.visuals.primaryColor === c ? 'scale-110 border-white ring-2 ring-amber-500' : 'border-slate-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                      title={`Cor principal: ${c}`}
                    />
                  ))}
                </div>
              </div>

              {/* Secondary Color (Teto, Listras e Detalhes) */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono text-slate-400 block">Cor Secundária da Lataria (Teto, Listras e Detalhes):</label>
                  <span className="text-[10px] font-mono text-slate-300 font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-white/30 inline-block" style={{ backgroundColor: selectedCar.visuals.secondaryColor || '#0f172a' }} />
                    {selectedCar.visuals.secondaryColor || '#0f172a'}
                  </span>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      onClick={() => onUpdateVisuals(selectedCar.id, { ...selectedCar.visuals, secondaryColor: c })}
                      className={`w-8 h-8 rounded-lg border-2 transition-transform cursor-pointer ${
                        selectedCar.visuals.secondaryColor === c ? 'scale-110 border-white ring-2 ring-amber-500' : 'border-slate-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                      title={`Cor secundária: ${c}`}
                    />
                  ))}
                </div>
              </div>

              {/* Neon Underglow */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono text-slate-400">Neon Underglow (Luz Inferior):</label>
                  <button
                    onClick={() => onUpdateVisuals(selectedCar.id, { ...selectedCar.visuals, hasNeon: !selectedCar.visuals.hasNeon })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                      selectedCar.visuals.hasNeon
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                  >
                    {selectedCar.visuals.hasNeon ? 'Ativado ✓' : 'Desativado'}
                  </button>
                </div>

                {selectedCar.visuals.hasNeon && (
                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    {NEON_PALETTE.map((nc) => (
                      <button
                        key={nc}
                        onClick={() => onUpdateVisuals(selectedCar.id, { ...selectedCar.visuals, neonColor: nc })}
                        className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                          selectedCar.visuals.neonColor === nc ? 'scale-110 border-white ring-2 ring-cyan-400' : 'border-slate-700'
                        }`}
                        style={{ backgroundColor: nc, boxShadow: `0 0 8px ${nc}` }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Spoiler Style */}
              <div className="pt-2 border-t border-slate-800">
                <label className="text-xs font-mono text-slate-400 block mb-2">Aerofólio (Spoiler):</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['none', 'small', 'gt_wing', 'ducktail'] as CarVisuals['spoiler'][]).map((sp) => (
                    <button
                      key={sp}
                      onClick={() => onUpdateVisuals(selectedCar.id, { ...selectedCar.visuals, spoiler: sp })}
                      className={`py-2 px-1 rounded-xl text-xs font-mono capitalize border transition-all cursor-pointer ${
                        selectedCar.visuals.spoiler === sp
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sp === 'none' ? 'Sem Asa' : sp === 'gt_wing' ? 'Asa GT Carbono' : sp === 'ducktail' ? 'Bico Ducktail' : 'Asa Standard'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wheel Style */}
              <div className="pt-2 border-t border-slate-800">
                <label className="text-xs font-mono text-slate-400 block mb-2">Rodas & Calotas:</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['steelies', 'spokes', 'mesh', 'spiked'] as CarVisuals['wheelStyle'][]).map((wh) => (
                    <button
                      key={wh}
                      onClick={() => onUpdateVisuals(selectedCar.id, { ...selectedCar.visuals, wheelStyle: wh })}
                      className={`py-2 px-1 rounded-xl text-xs font-mono capitalize border transition-all cursor-pointer ${
                        selectedCar.visuals.wheelStyle === wh
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {wh === 'steelies' ? 'Lata' : wh === 'spokes' ? 'Raiada' : wh === 'mesh' ? 'Mesh BBS' : 'Cravos Derby'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
