export type StarterTier = 'torque_focus' | 'speed_focus' | 'accel_focus' | 'legendary_balanced';

export type MapType = 'corrida' | 'drift' | 'draft' | 'rally' | 'derby';

export type PartCategory = 'engine' | 'turbo' | 'transmission' | 'tires' | 'suspension' | 'nitro' | 'armor' | 'aero' | 'skin';

export interface CarStats {
  topSpeed: number;     // Maximum velocity
  acceleration: number; // Rate of speed gain
  torque: number;       // Hill climb, launch, drift recovery & impact resistance
  durability?: number;  // Crucial in Derby
  handling?: number;    // Crucial in Drift and Rally
}

export type CarBodyType =
  | 'sedan'
  | 'sports'
  | 'esportivo'
  | 'truck'
  | 'suv'
  | 'suvs'
  | 'off_road'
  | 'offroad'
  | 'coupe'
  | 'coupes'
  | 'van'
  | 'vans'
  | 'pickup'
  | 'picape'
  | 'muscle'
  | 'supercar'
  | 'tuner'
  | 'rally'
  | 'derby_tank'
  | 'classic';

export type ChassisAngle = 'right' | 'left' | 'front' | 'rear' | 'top';

export type AccessoryLayer = 'in_front' | 'behind';

export interface CustomCarAccessoryConfig {
  wheels: {
    visible: boolean;
    rearX: number; // default ~13
    rearY: number; // default ~17
    frontX: number; // default ~33
    frontY: number; // default ~17
    radius: number; // default ~5
    layer: AccessoryLayer; // in front of chassis vs behind chassis
    style: 'spokes' | 'steelies' | 'mesh' | 'spiked';
    spinning?: boolean;
    color?: string;
  };
  spoiler: {
    visible: boolean;
    x: number; // default ~4
    y: number; // default ~7
    scale: number;
    layer: AccessoryLayer;
    style: 'small' | 'gt_wing' | 'ducktail';
    color?: string;
  };
  nitro: {
    visible: boolean; // toggle animated nitro flame
    x: number; // default ~1
    y: number; // default ~17
    layer: AccessoryLayer;
  };
  headlights: {
    visible: boolean; // toggle on/off
    x: number; // default ~42
    y: number; // default ~14
    beamVisible: boolean; // farois acesos (feixe de luz) ou apagados
    layer: AccessoryLayer;
  };
  neon: {
    visible: boolean;
    color: string;
    y: number; // default ~20
  };
}

export interface CustomCarAsset {
  id: string;
  name: string;
  createdAt: number;
  width: number;
  height: number;
  // Multi-view grids:
  pixels: string[]; // Direita (frente virada para o lado direito)
  pixelsLeft?: string[]; // Esquerda (frente virada para o lado esquerdo)
  pixelsFront?: string[]; // Frente
  pixelsRear?: string[]; // Trás
  pixelsTop?: string[]; // Cima
  
  // Dynamic color binding tokens:
  basePrimaryColorToken?: string; // e.g. '__PRIMARY_BASE__'
  baseSecondaryColorToken?: string; // e.g. '__SECONDARY_BASE__'
  
  // Accessories & Layering configuration:
  accessoryConfig?: CustomCarAccessoryConfig;

  vectorPath?: string; // SVG vector path data (M... C... Z) generated from the grid silhouette
  encryptedHashId?: string; // Cryptographic unique hash id for trade and auction authenticity
  creatorId?: string; // Originating creator unique identifier
  creatorSignature?: string; // Cryptographic signature verifying authorship
  rarityScore?: number; // Calculated dynamic rarity based on curve complexity & design
  primaryColor?: string;
  secondaryColor?: string;
  neonColor?: string;
  presetBase?: string;
  isAuctionReady?: boolean;
  auctionEstimate?: number;
}

export interface CarVisuals {
  bodyType: CarBodyType;
  primaryColor: string;
  secondaryColor: string;
  neonColor: string;
  hasNeon: boolean;
  spoiler: 'none' | 'small' | 'gt_wing' | 'ducktail';
  wheelStyle: 'steelies' | 'spokes' | 'mesh' | 'spiked';
  equippedSkinId?: string;
  skinName?: string;
  customAssetId?: string;
  customPixelData?: string; // Serialized CustomCarAsset JSON or pixel data
  customAssetName?: string;
}

export interface CarPart {
  id: string;
  name: string;
  category: PartCategory;
  tier: 'common' | 'rare' | 'epic' | 'legendary';
  mapOrigin: MapType | 'universal';
  level: number;
  bonusStats: Partial<CarStats>;
  description: string;
  scrapValue: number;
  iconName: string;
}

export interface CarSkin {
  id: string;
  name: string;
  theme: 'racing_stripes' | 'neon_synth' | 'cyber_drift' | 'mud_splatter' | 'wasteland_rust' | 'golden_apex' | 'police_interceptor';
  accentColor: string;
  pattern: string;
  mapOrigin: MapType | 'exclusive';
  priceCoins?: number;
  priceCash?: number;
}

export interface Car {
  id: string;
  name: string;
  starterTier?: StarterTier;
  condition: 'brand_new' | 'tuned' | 'barn_find' | 'derby_beaten';
  baseStats: CarStats;
  visuals: CarVisuals;
  equippedParts: {
    engine?: CarPart;
    turbo?: CarPart;
    transmission?: CarPart;
    tires?: CarPart;
    suspension?: CarPart;
    nitro?: CarPart;
    armor?: CarPart;
    aero?: CarPart;
  };
  totalRaces: number;
  wins: number;
  acquiredAt: number;
  rarity: 'starter' | 'common' | 'rare' | 'epic' | 'legendary';
}

export interface MapConfig {
  id: MapType;
  name: string;
  subtitle: string;
  description: string;
  distance: number;       // meters
  laps: number;
  baseRewardCoins: number;
  baseXp: number;
  primaryStatNeeded: keyof CarStats;
  hazardOrMechanic: string;
  palette: {
    sky: string;
    ground: string;
    track: string;
    border: string;
    accents: string;
  };
  possibleDrops: {
    parts: Omit<CarPart, 'id'>[];
    skins: CarSkin[];
  };
}

export interface Bet {
  id: string;
  racerId: string;
  racerName: string;
  amount: number;
  currency: 'coins' | 'cash';
  odds: number;
  potentialPayout: number;
}

export interface LiveRacerTelemetry {
  id: string;
  name: string;
  car: Car;
  position: number;      // 1 to 4
  distance: number;      // meters covered
  currentSpeed: number;  // km/h
  progressPercent: number; // 0 to 100
  odds: number;
  health: number;        // For Derby (0 - 100)
  nitroActive: boolean;
  status: 'racing' | 'crashed' | 'finished';
  finishTime?: number;
}

export interface LiveRaceState {
  raceId: string;
  track: MapConfig;
  status: 'betting' | 'in_progress' | 'finished';
  countdown: number;     // seconds remaining in current state
  elapsedTime: number;
  racers: LiveRacerTelemetry[];
  winnerId?: string;
  winningCarName?: string;
}

export interface IdleHarvestReward {
  coins: number;
  scrapMetal: number;
  droppedParts: CarPart[];
  droppedSkins: CarSkin[];
  elapsedSeconds: number;
}

export interface PlayerProfile {
  id: string;
  nickname: string;
  coins: number;
  cash: number;
  scrapMetal: number;
  activeCarId: string;
  ownedCars: Car[];
  inventoryParts: CarPart[];
  unlockedSkins: CarSkin[];
  activeBets: Bet[];
  idleFarmMap: MapType;
  idleLastSync: number;
  starterTierClaimed: StarterTier;
  customAssets?: CustomCarAsset[];
}

export type WsClientMessage =
  | { type: 'ping' }
  | { type: 'join_betting' }
  | { type: 'place_bet'; bet: { racerId: string; amount: number; currency: 'coins' | 'cash' } }
  | { type: 'start_farm'; mapId: MapType }
  | { type: 'harvest_farm' }
  | { type: 'sync_player'; profile: PlayerProfile };

export type WsServerMessage =
  | { type: 'pong' }
  | { type: 'betting_state'; state: LiveRaceState }
  | { type: 'race_tick'; racers: LiveRacerTelemetry[]; elapsedTime: number; status: 'in_progress' | 'finished' }
  | { type: 'race_finished'; winnerId: string; results: { racerId: string; place: number; time: number }[] }
  | { type: 'bet_resolved'; won: boolean; payout: number; currency: 'coins' | 'cash'; racerName: string }
  | { type: 'idle_tick'; coinsEarned: number; scrapEarned: number; partsEarned?: CarPart[] };
