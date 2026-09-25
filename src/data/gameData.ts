import { Car, CarPart, CarSkin, CarStats, CarVisuals, MapConfig, MapType, StarterTier } from '../types';
import { SPRITE_CAR_PRESETS, createCustomAssetFromPreset } from './carTemplates';

export const STARTER_ROLL_TIERS: {
  tier: StarterTier;
  probability: number;
  name: string;
  subname: string;
  stats: { topSpeed: number; acceleration: number; torque: number };
  bodyType: 'muscle' | 'supercar' | 'tuner' | 'classic';
  description: string;
  primaryColor: string;
  secondaryColor: string;
}[] = [
  {
    tier: 'torque_focus',
    probability: 0.30,
    name: 'V8 Iron Torque',
    subname: 'Muscle Build (30% Chance)',
    stats: { topSpeed: 10, acceleration: 10, torque: 20 },
    bodyType: 'muscle',
    description: 'Monster de torque com motor bloco grande! Excelente em subidas, arrancadas pesadas e colisões derby.',
    primaryColor: '#e11d48', // red
    secondaryColor: '#1e293b'
  },
  {
    tier: 'speed_focus',
    probability: 0.30,
    name: 'Aero Phantom GT',
    subname: 'Top Speed Build (30% Chance)',
    stats: { topSpeed: 20, acceleration: 10, torque: 10 },
    bodyType: 'supercar',
    description: 'Focado em velocidade final extrema! Domina retas longas de circuito e mapas de draft.',
    primaryColor: '#0284c7', // cyan/blue
    secondaryColor: '#0f172a'
  },
  {
    tier: 'accel_focus',
    probability: 0.30,
    name: 'Silvia Turbo-X',
    subname: 'Acceleration Build (30% Chance)',
    stats: { topSpeed: 10, acceleration: 20, torque: 10 },
    bodyType: 'tuner',
    description: 'Resposta instantânea de acelerador com caracol duplo. Domina curvas de drift e saídas rápidas.',
    primaryColor: '#10b981', // emerald
    secondaryColor: '#18181b'
  },
  {
    tier: 'legendary_balanced',
    probability: 0.10,
    name: 'Apex Omega R-15',
    subname: 'Balanced Prototype (10% RARO!)',
    stats: { topSpeed: 15, acceleration: 15, torque: 15 },
    bodyType: 'supercar',
    description: 'Protótipo raro com equilíbrio perfeito de fábrica! 15 em tudo para performance sem fraquezas.',
    primaryColor: '#eab308', // gold
    secondaryColor: '#451a03'
  }
];

export function rollStarterCar(): { car: Car; tier: StarterTier } {
  const rand = Math.random();
  let cumulative = 0;
  let selected = STARTER_ROLL_TIERS[0];

  for (const item of STARTER_ROLL_TIERS) {
    cumulative += item.probability;
    if (rand <= cumulative) {
      selected = item;
      break;
    }
  }

  const id = 'car_' + Math.random().toString(36).substring(2, 9);
  const car: Car = {
    id,
    name: selected.name,
    starterTier: selected.tier,
    condition: selected.tier === 'legendary_balanced' ? 'tuned' : 'brand_new',
    baseStats: { ...selected.stats, durability: 100, handling: 15 },
    visuals: {
      bodyType: selected.bodyType,
      primaryColor: selected.primaryColor,
      secondaryColor: selected.secondaryColor,
      neonColor: selected.tier === 'legendary_balanced' ? '#eab308' : '#00f0ff',
      hasNeon: selected.tier === 'legendary_balanced',
      spoiler: selected.tier === 'legendary_balanced' ? 'gt_wing' : 'small',
      wheelStyle: selected.tier === 'legendary_balanced' ? 'mesh' : 'spokes',
      skinName: 'Pintura Original'
    },
    equippedParts: {},
    totalRaces: 0,
    wins: 0,
    acquiredAt: Date.now(),
    rarity: selected.tier === 'legendary_balanced' ? 'legendary' : 'starter'
  };

  return { car, tier: selected.tier };
}

export interface ChassisDefinition {
  id: CarVisuals['bodyType'];
  name: string;
  category: string;
  tagline: string;
  description: string;
  highlightStats: string;
  iconAccent: string;
}

export const CHASSIS_DEFINITIONS: ChassisDefinition[] = [
  {
    id: 'sedan',
    name: 'Sedan Executivo Sport',
    category: 'Sedan 3 Volumes',
    tagline: 'Silhueta clássica 3 volumes, sofisticação e estabilidade',
    description: 'Carroceria 3 volumes com capô elegante, cabine ampla de 4 portas com coluna C pronunciada e porta-malas traseiro definido. Excelente estabilidade direcional em altas velocidades.',
    highlightStats: 'Estabilidade em Alta • Centro de Gravidade Equilibrado',
    iconAccent: '#3b82f6'
  },
  {
    id: 'sports',
    name: 'Sports Apex GT',
    category: 'Coupé Super Esportivo',
    tagline: 'Perfil baixo em cunha, fluxo de ar agressivo e asa GT',
    description: 'Silhueta baixa e esguia em cunha afiada com para-brisa hiper-inclinado, teto fastback contínuo, duto NACA lateral e asa traseira GT para máxima aderência em curvas rápidas.',
    highlightStats: 'Downforce em Curvas • Arrasto Mínimo',
    iconAccent: '#06b6d4'
  },
  {
    id: 'truck',
    name: 'Heavy Commercial Truck',
    category: 'Caminhão Pesado Rig',
    tagline: 'Grade frontal imponente, chaminés duplas e rodas duplas',
    description: 'Chassi reforçado com chaminés de escape verticais cromadas, tanque cilíndrico lateral, grade frontal imponente e rodado duplo traseiro para carga pesada.',
    highlightStats: 'Força de Tração Brutal • Massa de Impacto',
    iconAccent: '#f97316'
  },
  {
    id: 'suv',
    name: 'SUV Adventure 4x4',
    category: 'SUV Familiar & Expedição',
    tagline: 'Perfil 2 volumes robusto, rack de teto e vão livre alto',
    description: 'Carroceria 2 volumes elevada com rack de teto integrado em alumínio, molduras protetoras nas caixas de roda e excelente visibilidade panorâmica.',
    highlightStats: 'Versatilidade Total • Centro Elevado',
    iconAccent: '#10b981'
  },
  {
    id: 'off_road',
    name: 'Off-Road Rock Crawler',
    category: '4x4 Extremo & Trilha',
    tagline: 'Suspensão elevada, estepe traseiro, quebra-mato e snorkel',
    description: 'Chassi com lift kit de alta suspensão, quebra-mato com guincho embutido, milhas de teto, estepe fixado na tampa e pneus biscoito para lama e rochas.',
    highlightStats: 'Superação de Obstáculos • Tração Integral',
    iconAccent: '#84cc16'
  },
  {
    id: 'coupe',
    name: 'Coupé Gran Turismo',
    category: 'Fastback 2 Portas',
    tagline: 'Teto fluido, capô longo e ombros traseiros musculosos',
    description: 'Silhueta fastback de 2 portas com balanço dianteiro estendido, janelas sem moldura, spoiler ducktail integrado e linhas aerodinâmicas envolventes.',
    highlightStats: 'Equilíbrio Dinâmico • Alta Velocidade',
    iconAccent: '#ec4899'
  },
  {
    id: 'van',
    name: 'Van Express Monospace',
    category: 'Furgão Utilitário Monospace',
    tagline: 'Espaço cúbico máximo, porta de correr e portas traseiras',
    description: 'Silhueta de volume único com para-brisa contínuo, trilho para porta de correr lateral e portas traseiras verticais para logística e suporte de corrida.',
    highlightStats: 'Capacidade Utilitária • Resistência Estrutural',
    iconAccent: '#8b5cf6'
  },
  {
    id: 'pickup',
    name: 'Picape Heavy-Duty 4x4',
    category: 'Caminhonete Cabine Dupla',
    tagline: 'Caçamba aberta, santantônio tubular e suspensão elevada',
    description: 'Silhueta com caçamba traseira aberta, santantônio tubular esportivo em aço, estribos laterais e motor V8 dianteiro de alto rendimento.',
    highlightStats: 'Vão Livre Elevado • Resistência de Caçamba',
    iconAccent: '#eab308'
  },
  {
    id: 'muscle',
    name: 'Muscle American V8',
    category: 'Fastback Bloco Grande',
    tagline: 'Força bruta e Blower Supercharger exposto',
    description: 'Capô estendido com Supercharger Blower duplo cromado, saídas laterais de escape e para-lamas alargados. Puro torque e empuxo de colisão.',
    highlightStats: 'Torque de Arrancada • Força de Impacto',
    iconAccent: '#ef4444'
  },
  {
    id: 'supercar',
    name: 'Hyper Supercar Wedge',
    category: 'Exótico Aerodinâmico',
    tagline: 'Silhueta em cunha e motor central visível',
    description: 'Perfil em cunha hiper-aerodinâmico com cockpit bolha, entradas NACA profundas e tampa traseira de vidro com motor visível.',
    highlightStats: 'Velocidade Final • Eficiência em Retas',
    iconAccent: '#0284c7'
  },
  {
    id: 'tuner',
    name: 'Tuner JDM Spec-R',
    category: 'Coupé Esportivo JDM',
    tagline: 'Linhas afiadas, aerodinâmica e equilíbrio',
    description: 'Chassi com difusor dianteiro rebaixado, intercooler frontal aparente e faróis cristal. Domina curvas técnicas e circuitos com agilidade pura.',
    highlightStats: 'Agilidade Superior • Baixo Arrasto',
    iconAccent: '#14b8a6'
  },
  {
    id: 'rally',
    name: 'Rally Cross WRC Gr.B',
    category: 'Hatchback Off-road',
    tagline: 'Suspensão elevada e 4 faróis de milha',
    description: 'Chassi elevado para terra e cascalho com quad faróis de milha amarelos no capô, para-barros de borracha e asa dupla no teto.',
    highlightStats: 'Tração em Terreno Difícil • Blindagem Média',
    iconAccent: '#f59e0b'
  },
  {
    id: 'derby_tank',
    name: 'Derby Battering Tank',
    category: 'Monstro de Demolição',
    tagline: 'Aríete de ferro fundido e gaiola soldada',
    description: 'Chassi blindado com placas de aço rebitadas, grades protetoras de ferro nas janelas, escapamento chaminé vertical e aríete dentado de impacto.',
    highlightStats: 'Durabilidade Extrema • Dano de Aríete Dobrado',
    iconAccent: '#ea580c'
  },
  {
    id: 'classic',
    name: 'Classic Hot-Rod 34',
    category: 'Vintage Chopped Coupe',
    tagline: 'Grade cromada flutuante e escapamento zoomie',
    description: 'Grade de radiador vertical em cascata cromada, teto rebaixado estilo chopped, escapamento 4-em-1 lateral aberto e para-lamas arredondados vintage.',
    highlightStats: 'Estilo Lendário • Ronco Aberto',
    iconAccent: '#a855f7'
  }
];

export const MAPS_CONFIG: Record<MapType, MapConfig> = {
  corrida: {
    id: 'corrida',
    name: 'Circuito Velocidade Máxima',
    subtitle: 'Asfalto Profissional & Retas Longas',
    description: 'Pista de circuito de alta velocidade. Requer Top Speed elevado para dominar as retas e quebrar recordes de volta.',
    distance: 1200,
    laps: 3,
    baseRewardCoins: 120,
    baseXp: 35,
    primaryStatNeeded: 'topSpeed',
    hazardOrMechanic: 'Retas com vácuo e curvas de alta aderência.',
    palette: {
      sky: '#0f172a',
      ground: '#1e293b',
      track: '#334155',
      border: '#ef4444',
      accents: '#f59e0b'
    },
    possibleDrops: {
      parts: [
        {
          name: 'Câmbio Seqüencial 6M',
          category: 'transmission',
          tier: 'rare',
          mapOrigin: 'corrida',
          level: 1,
          bonusStats: { topSpeed: 6, acceleration: 2 },
          description: 'Engrenagens forjadas para esticar a velocidade máxima sem perda de rotação.',
          scrapValue: 35,
          iconName: 'Gauge'
        },
        {
          name: 'Turbina G-Race T60',
          category: 'turbo',
          tier: 'epic',
          mapOrigin: 'corrida',
          level: 1,
          bonusStats: { topSpeed: 9, torque: 3 },
          description: 'Fluxo gigante de ar para altas velocidades em linha reta.',
          scrapValue: 60,
          iconName: 'Zap'
        },
        {
          name: 'Asa Aerodinâmica Carbon GT',
          category: 'aero',
          tier: 'rare',
          mapOrigin: 'corrida',
          level: 1,
          bonusStats: { topSpeed: 4, handling: 8 },
          description: 'Downforce em fibra de carbono para estabilidade sem arrasto excessivo.',
          scrapValue: 40,
          iconName: 'Shield'
        }
      ],
      skins: [
        {
          id: 'skin_stripes',
          name: 'Listras Le Mans',
          theme: 'racing_stripes',
          accentColor: '#ffffff',
          pattern: 'stripes',
          mapOrigin: 'corrida'
        }
      ]
    }
  },
  drift: {
    id: 'drift',
    name: 'Touge Noturno da Serra',
    subtitle: 'Asfalto Úmido, Curvas em S & Pêndulo',
    description: 'Subida e descida de montanha cheia de curvas fechadas. Requer Aceleração e Torque para sustentar o ângulo de derrapagem.',
    distance: 2600,
    laps: 2,
    baseRewardCoins: 135,
    baseXp: 40,
    primaryStatNeeded: 'acceleration',
    hazardOrMechanic: 'Deslize contínuo para carregar multiplicador de fumaça e moedas.',
    palette: {
      sky: '#09090b',
      ground: '#18181b',
      track: '#27272a',
      border: '#a855f7',
      accents: '#06b6d4'
    },
    possibleDrops: {
      parts: [
        {
          name: 'Kit Ângulo de Esterçamento Pro',
          category: 'suspension',
          tier: 'rare',
          mapOrigin: 'drift',
          level: 1,
          bonusStats: { acceleration: 5, handling: 9 },
          description: 'Mais de 65 graus de esterço para recuperar saídas de traseira impossíveis.',
          scrapValue: 40,
          iconName: 'Sliders'
        },
        {
          name: 'Freio de Mão Hidráulico Duplo',
          category: 'transmission',
          tier: 'common',
          mapOrigin: 'drift',
          level: 1,
          bonusStats: { acceleration: 3, torque: 2 },
          description: 'Trava imediata das rodas traseiras com alavanca vertical de alumínio aeronáutico.',
          scrapValue: 20,
          iconName: 'Disc'
        },
        {
          name: 'Pneus Semi-Slick 200TW',
          category: 'tires',
          tier: 'epic',
          mapOrigin: 'drift',
          level: 1,
          bonusStats: { acceleration: 7, torque: 4 },
          description: 'Borracha especial que solta fumaça densa e gera aceleração violenta nas saídas.',
          scrapValue: 55,
          iconName: 'CircleDot'
        }
      ],
      skins: [
        {
          id: 'skin_cyber_drift',
          name: 'Cyber Neon Drift',
          theme: 'cyber_drift',
          accentColor: '#f43f5e',
          pattern: 'neon_lines',
          mapOrigin: 'drift'
        }
      ]
    }
  },
  draft: {
    id: 'draft',
    name: 'Wangan Highway 300',
    subtitle: 'Autoestrada Expressa & Vácuo Contínuo',
    description: 'Autoestrada de tráfego rápido onde colar no para-choque alheio (Draft/Slipstream) dispara a velocidade e o turbo.',
    distance: 1500,
    laps: 2,
    baseRewardCoins: 150,
    baseXp: 45,
    primaryStatNeeded: 'topSpeed',
    hazardOrMechanic: 'Bônus de vácuo: +30% velocidade ao colar atrás de outro carro.',
    palette: {
      sky: '#020617',
      ground: '#0f172a',
      track: '#1e293b',
      border: '#38bdf8',
      accents: '#ec4899'
    },
    possibleDrops: {
      parts: [
        {
          name: 'Garrafa Nitro NOS Tripla',
          category: 'nitro',
          tier: 'epic',
          mapOrigin: 'draft',
          level: 1,
          bonusStats: { topSpeed: 10, acceleration: 6 },
          description: 'Injeção de óxido nitroso molhado para ultrapassagens fulminantes no vácuo.',
          scrapValue: 65,
          iconName: 'Flame'
        },
        {
          name: 'Intercooler Frontal 4-Polegadas',
          category: 'engine',
          tier: 'rare',
          mapOrigin: 'draft',
          level: 1,
          bonusStats: { topSpeed: 6, acceleration: 3 },
          description: 'Ar gelado para a admissão sustentando rotação no limitador por quilômetros.',
          scrapValue: 45,
          iconName: 'Wind'
        },
        {
          name: 'Splitter Dianteiro Efeito Venturi',
          category: 'aero',
          tier: 'common',
          mapOrigin: 'draft',
          level: 1,
          bonusStats: { topSpeed: 4, handling: 3 },
          description: 'Canaliza o ar para debaixo do assoalho reduzindo a turbulência frontal.',
          scrapValue: 25,
          iconName: 'Minimize2'
        }
      ],
      skins: [
        {
          id: 'skin_synth',
          name: 'Neon Synthwave 80s',
          theme: 'neon_synth',
          accentColor: '#38bdf8',
          pattern: 'grid',
          mapOrigin: 'draft'
        }
      ]
    }
  },
  rally: {
    id: 'rally',
    name: 'Dunas & Cascalho Selvagem',
    subtitle: 'Terra Batida, Saltos & Lamaçais',
    description: 'Pista off-road acidentada com lama, cascalho solto e pedras. Requer Torque maciço e tração reforçada para não atolar.',
    distance: 1100,
    laps: 2,
    baseRewardCoins: 140,
    baseXp: 38,
    primaryStatNeeded: 'torque',
    hazardOrMechanic: 'A lama reduz a velocidade se o torque for menor que 14.',
    palette: {
      sky: '#451a03',
      ground: '#78350f',
      track: '#92400e',
      border: '#d97706',
      accents: '#84cc16'
    },
    possibleDrops: {
      parts: [
        {
          name: 'Suspensão Curso Longo Dakar',
          category: 'suspension',
          tier: 'epic',
          mapOrigin: 'rally',
          level: 1,
          bonusStats: { torque: 6, handling: 8 },
          description: 'Amortecedores duplos com reservatório externo que engolem crateras e saltos.',
          scrapValue: 55,
          iconName: 'Activity'
        },
        {
          name: 'Diferencial Bloqueado 4x4',
          category: 'transmission',
          tier: 'rare',
          mapOrigin: 'rally',
          level: 1,
          bonusStats: { torque: 7, acceleration: 3 },
          description: 'Distribui tração 50/50 sem deixar nenhuma roda girar em falso no barro.',
          scrapValue: 40,
          iconName: 'Layers'
        },
        {
          name: 'Pneus com Cravos All-Terrain',
          category: 'tires',
          tier: 'common',
          mapOrigin: 'rally',
          level: 1,
          bonusStats: { torque: 4, handling: 4 },
          description: 'Borracha reforçada com cravos profundos que cravam no solo arenoso.',
          scrapValue: 22,
          iconName: 'Compass'
        }
      ],
      skins: [
        {
          id: 'skin_mud',
          name: 'Lamaçal Safari Dakar',
          theme: 'mud_splatter',
          accentColor: '#b45309',
          pattern: 'splatter',
          mapOrigin: 'rally'
        }
      ]
    }
  },
  derby: {
    id: 'derby',
    name: 'Arena de Demolição e Ferro-Velho',
    subtitle: 'Destruição Total, Batidas & Sobrevivência',
    description: 'Arena fechada cheia de sucata onde o objetivo é bater, destruir adversários e sobreviver. Requer Torque brutal e Blindagem pesada.',
    distance: 800,
    laps: 4,
    baseRewardCoins: 175,
    baseXp: 50,
    primaryStatNeeded: 'torque',
    hazardOrMechanic: 'Impactos reduzem durabilidade! Carros sem blindagem quebram.',
    palette: {
      sky: '#1c1917',
      ground: '#292524',
      track: '#44403c',
      border: '#f97316',
      accents: '#dc2626'
    },
    possibleDrops: {
      parts: [
        {
          name: 'Para-Choque Aríete em Aço Maciço',
          category: 'armor',
          tier: 'epic',
          mapOrigin: 'derby',
          level: 1,
          bonusStats: { torque: 8, durability: 40 },
          description: 'Trilho de trem soldado na dianteira para transformar rivais em lata amassada.',
          scrapValue: 65,
          iconName: 'ShieldAlert'
        },
        {
          name: 'Santo Antônio Tubular Chromoly',
          category: 'armor',
          tier: 'rare',
          mapOrigin: 'derby',
          level: 1,
          bonusStats: { torque: 5, durability: 30 },
          description: 'Gaiola interna de proteção contra capotamentos violentos.',
          scrapValue: 45,
          iconName: 'Crosshair'
        },
        {
          name: 'Calotas com Cravos Rompedores',
          category: 'tires',
          tier: 'rare',
          mapOrigin: 'derby',
          level: 1,
          bonusStats: { torque: 4, acceleration: 3 },
          description: 'Ponta cônica de metal para furar os pneus de quem tentar ultrapassar perto demais.',
          scrapValue: 35,
          iconName: 'Skull'
        }
      ],
      skins: [
        {
          id: 'skin_wasteland',
          name: 'Ferrugem Mad Wasteland',
          theme: 'wasteland_rust',
          accentColor: '#ea580c',
          pattern: 'rust',
          mapOrigin: 'derby'
        }
      ]
    }
  }
};

// Dealership Showroom Cars (high price, guaranteed top stats)
export const DEALERSHIP_CARS: Omit<Car, 'id' | 'acquiredAt' | 'equippedParts' | 'totalRaces' | 'wins'>[] = [
  {
    name: 'Bavaria M-Executive V8 Sedan',
    condition: 'brand_new',
    rarity: 'legendary',
    baseStats: { topSpeed: 30, acceleration: 28, torque: 26, durability: 120, handling: 27 },
    visuals: {
      bodyType: 'sedan',
      primaryColor: '#2563eb', // Royal blue
      secondaryColor: '#0f172a',
      neonColor: '#60a5fa',
      hasNeon: true,
      spoiler: 'none',
      wheelStyle: 'mesh',
      skinName: 'Listras Clássicas de Corrida'
    }
  },
  {
    name: 'Silverado C10 Beast 4x4',
    condition: 'brand_new',
    rarity: 'epic',
    baseStats: { topSpeed: 22, acceleration: 24, torque: 36, durability: 160, handling: 20 },
    visuals: {
      bodyType: 'picape',
      primaryColor: '#d97706', // Amber gold
      secondaryColor: '#1c1917',
      neonColor: '#f59e0b',
      hasNeon: true,
      spoiler: 'none',
      wheelStyle: 'steelies',
      skinName: 'Lama Off-Road Extrema'
    }
  },
  {
    name: 'Apex RS Esportivo Carbon',
    condition: 'brand_new',
    rarity: 'legendary',
    baseStats: { topSpeed: 34, acceleration: 30, torque: 24, durability: 95, handling: 32 },
    visuals: {
      bodyType: 'esportivo',
      primaryColor: '#06b6d4', // Cyan
      secondaryColor: '#080c14',
      neonColor: '#22d3ee',
      hasNeon: true,
      spoiler: 'gt_wing',
      wheelStyle: 'spokes',
      skinName: 'Cyberpunk Neon Glow'
    }
  },
  {
    name: 'Vortex Hyper-GT 900',
    condition: 'brand_new',
    rarity: 'legendary',
    baseStats: { topSpeed: 32, acceleration: 26, torque: 20, durability: 100, handling: 25 },
    visuals: {
      bodyType: 'supercar',
      primaryColor: '#6366f1', // indigo
      secondaryColor: '#0f172a',
      neonColor: '#818cf8',
      hasNeon: true,
      spoiler: 'gt_wing',
      wheelStyle: 'mesh',
      skinName: 'Hiper Fibra de Carbono'
    }
  },
  {
    name: 'Goliath Dreadnought 8x8',
    condition: 'brand_new',
    rarity: 'epic',
    baseStats: { topSpeed: 18, acceleration: 18, torque: 38, durability: 180, handling: 16 },
    visuals: {
      bodyType: 'derby_tank',
      primaryColor: '#78716c', // stone
      secondaryColor: '#1c1917',
      neonColor: '#ea580c',
      hasNeon: true,
      spoiler: 'none',
      wheelStyle: 'spiked',
      skinName: 'Blindagem de Combate'
    }
  },
  {
    name: 'Kenji Spirit RX-Drifter',
    condition: 'brand_new',
    rarity: 'epic',
    baseStats: { topSpeed: 24, acceleration: 32, torque: 22, durability: 95, handling: 30 },
    visuals: {
      bodyType: 'tuner',
      primaryColor: '#ec4899', // pink
      secondaryColor: '#18181b',
      neonColor: '#f43f5e',
      hasNeon: true,
      spoiler: 'ducktail',
      wheelStyle: 'spokes',
      skinName: 'Estilo Midnight Touge'
    }
  },
  {
    name: 'Dakar Sandstorm 4WD',
    condition: 'brand_new',
    rarity: 'rare',
    baseStats: { topSpeed: 22, acceleration: 22, torque: 30, durability: 120, handling: 24 },
    visuals: {
      bodyType: 'rally',
      primaryColor: '#eab308', // amber
      secondaryColor: '#713f12',
      neonColor: '#f59e0b',
      hasNeon: false,
      spoiler: 'small',
      wheelStyle: 'steelies',
      skinName: 'Raid dos Sertões'
    }
  },
  {
    name: 'Nissan Skyline GT-R R34 V-Spec',
    condition: 'brand_new',
    rarity: 'legendary',
    baseStats: { topSpeed: 33, acceleration: 32, torque: 28, durability: 110, handling: 31 },
    visuals: {
      bodyType: 'tuner',
      primaryColor: '#1d4ed8',
      secondaryColor: '#0f172a',
      neonColor: '#38bdf8',
      hasNeon: true,
      spoiler: 'gt_wing',
      wheelStyle: 'spokes',
      skinName: 'Bayside Blue Legend',
      customPixelData: JSON.stringify(createCustomAssetFromPreset(SPRITE_CAR_PRESETS.skyline_r34)),
      customAssetName: 'Nissan Skyline GT-R R34 (Oficial)'
    }
  },
  {
    name: 'BMW M3 GTR E46 Most Wanted',
    condition: 'brand_new',
    rarity: 'legendary',
    baseStats: { topSpeed: 35, acceleration: 31, torque: 30, durability: 105, handling: 33 },
    visuals: {
      bodyType: 'supercar',
      primaryColor: '#cbd5e1',
      secondaryColor: '#1e40af',
      neonColor: '#60a5fa',
      hasNeon: true,
      spoiler: 'gt_wing',
      wheelStyle: 'mesh',
      skinName: 'Most Wanted Livery',
      customPixelData: JSON.stringify(createCustomAssetFromPreset(SPRITE_CAR_PRESETS.bmw_m3_gtr)),
      customAssetName: 'BMW M3 GTR E46 (Oficial)'
    }
  },
  {
    name: 'Mazda RX-7 FD3S Rotary Twin-Turbo',
    condition: 'brand_new',
    rarity: 'legendary',
    baseStats: { topSpeed: 31, acceleration: 34, torque: 25, durability: 90, handling: 35 },
    visuals: {
      bodyType: 'tuner',
      primaryColor: '#eab308',
      secondaryColor: '#18181b',
      neonColor: '#facc15',
      hasNeon: true,
      spoiler: 'gt_wing',
      wheelStyle: 'spokes',
      skinName: 'Competition Yellow Wankel',
      customPixelData: JSON.stringify(createCustomAssetFromPreset(SPRITE_CAR_PRESETS.rx7_fd)),
      customAssetName: 'Mazda RX-7 FD3S Rotary (Oficial)'
    }
  },
  {
    name: 'Subaru Impreza WRX STI WRC',
    condition: 'brand_new',
    rarity: 'legendary',
    baseStats: { topSpeed: 30, acceleration: 33, torque: 34, durability: 130, handling: 32 },
    visuals: {
      bodyType: 'rally',
      primaryColor: '#2563eb',
      secondaryColor: '#0f172a',
      neonColor: '#06b6d4',
      hasNeon: true,
      spoiler: 'gt_wing',
      wheelStyle: 'mesh',
      skinName: 'WR Blue Rallye Pearl',
      customPixelData: JSON.stringify(createCustomAssetFromPreset(SPRITE_CAR_PRESETS.wrx_sti)),
      customAssetName: 'Subaru WRX STI Rally (Oficial)'
    }
  },
  {
    name: 'Mitsubishi Lancer Evolution IX MR',
    condition: 'brand_new',
    rarity: 'legendary',
    baseStats: { topSpeed: 31, acceleration: 34, torque: 32, durability: 125, handling: 33 },
    visuals: {
      bodyType: 'rally',
      primaryColor: '#dc2626',
      secondaryColor: '#0f172a',
      neonColor: '#ef4444',
      hasNeon: true,
      spoiler: 'gt_wing',
      wheelStyle: 'spokes',
      skinName: 'Apex Red Rally MR',
      customPixelData: JSON.stringify(createCustomAssetFromPreset(SPRITE_CAR_PRESETS.lancer_evo)),
      customAssetName: 'Lancer Evolution IX MR (Oficial)'
    }
  },
  {
    name: 'Chevrolet Corvette C6.R Le Mans',
    condition: 'brand_new',
    rarity: 'legendary',
    baseStats: { topSpeed: 36, acceleration: 30, torque: 33, durability: 100, handling: 30 },
    visuals: {
      bodyType: 'muscle',
      primaryColor: '#facc15',
      secondaryColor: '#18181b',
      neonColor: '#fde047',
      hasNeon: true,
      spoiler: 'ducktail',
      wheelStyle: 'mesh',
      skinName: 'Velocity Yellow Le Mans',
      customPixelData: JSON.stringify(createCustomAssetFromPreset(SPRITE_CAR_PRESETS.corvette_c6)),
      customAssetName: 'Corvette C6.R Racing (Oficial)'
    }
  },
  {
    name: 'Dodge Viper SRT-10 Venom V10',
    condition: 'brand_new',
    rarity: 'legendary',
    baseStats: { topSpeed: 37, acceleration: 32, torque: 37, durability: 105, handling: 29 },
    visuals: {
      bodyType: 'muscle',
      primaryColor: '#1d4ed8',
      secondaryColor: '#f8fafc',
      neonColor: '#00f0ff',
      hasNeon: true,
      spoiler: 'ducktail',
      wheelStyle: 'spokes',
      skinName: 'Viper GTS Dual Stripes',
      customPixelData: JSON.stringify(createCustomAssetFromPreset(SPRITE_CAR_PRESETS.viper_srt)),
      customAssetName: 'Dodge Viper SRT-10 V10 (Oficial)'
    }
  },
  {
    name: 'Lamborghini Murciélago LP670 SV',
    condition: 'brand_new',
    rarity: 'legendary',
    baseStats: { topSpeed: 38, acceleration: 33, torque: 31, durability: 95, handling: 34 },
    visuals: {
      bodyType: 'supercar',
      primaryColor: '#22c55e',
      secondaryColor: '#09090b',
      neonColor: '#4ade80',
      hasNeon: true,
      spoiler: 'gt_wing',
      wheelStyle: 'spiked',
      skinName: 'Verde Ithaca SuperVeloce',
      customPixelData: JSON.stringify(createCustomAssetFromPreset(SPRITE_CAR_PRESETS.murcielago)),
      customAssetName: 'Murciélago LP670 SV (Oficial)'
    }
  }
];

export const GACHA_NAMES = [
  'Rusty Chevelle 74', 'Barn-Find Supra', 'Datsun 240Z Enferrujado', 'Fox Body Mustang Sucata',
  'Opala 6 Cilindros de Galpão', 'E30 BMW de Quintal', 'Fusca Baja de Trilha', 'Corcel 2 Relíquia',
  'Skyline R32 Abandonado', 'C10 Pick-up Cavernosa', 'Miata Naftalina', 'Gol Quadrado AP Turbo'
];

export function rollJunkyardCar(): Car {
  const name = GACHA_NAMES[Math.floor(Math.random() * GACHA_NAMES.length)];
  const randQuality = Math.random();
  
  let rarity: Car['rarity'] = 'common';
  let statBase = 8;
  let condition: Car['condition'] = 'barn_find';

  if (randQuality > 0.92) {
    rarity = 'epic';
    statBase = 18;
    condition = 'tuned';
  } else if (randQuality > 0.65) {
    rarity = 'rare';
    statBase = 14;
    condition = 'tuned';
  } else if (randQuality > 0.30) {
    rarity = 'common';
    statBase = 11;
  } else {
    condition = 'derby_beaten';
    statBase = 9;
  }

  const topSpeed = statBase + Math.floor(Math.random() * 6);
  const acceleration = statBase + Math.floor(Math.random() * 6);
  const torque = statBase + Math.floor(Math.random() * 6);

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#d97706'];
  const bodyTypes: CarVisuals['bodyType'][] = ['muscle', 'tuner', 'classic', 'supercar', 'rally', 'derby_tank'];

  return {
    id: 'gacha_' + Math.random().toString(36).substring(2, 9),
    name,
    condition,
    baseStats: {
      topSpeed,
      acceleration,
      torque,
      durability: condition === 'derby_beaten' ? 70 : 100,
      handling: 12 + Math.floor(Math.random() * 8)
    },
    visuals: {
      bodyType: bodyTypes[Math.floor(Math.random() * bodyTypes.length)],
      primaryColor: colors[Math.floor(Math.random() * colors.length)],
      secondaryColor: '#1e293b',
      neonColor: '#38bdf8',
      hasNeon: Math.random() > 0.6,
      spoiler: Math.random() > 0.5 ? 'small' : 'none',
      wheelStyle: Math.random() > 0.5 ? 'spokes' : 'steelies',
      skinName: condition === 'barn_find' ? 'Poeira de Celeiro' : 'Pintura Envernizada'
    },
    equippedParts: {},
    totalRaces: 0,
    wins: 0,
    acquiredAt: Date.now(),
    rarity
  };
}

export function calculateEffectiveStats(car: Car): CarStats {
  const stats: CarStats = {
    topSpeed: car.baseStats.topSpeed,
    acceleration: car.baseStats.acceleration,
    torque: car.baseStats.torque,
    durability: car.baseStats.durability || 100,
    handling: car.baseStats.handling || 15
  };

  for (const key of Object.keys(car.equippedParts) as (keyof typeof car.equippedParts)[]) {
    const part = car.equippedParts[key];
    if (part && part.bonusStats) {
      if (part.bonusStats.topSpeed) stats.topSpeed += part.bonusStats.topSpeed * (1 + (part.level - 1) * 0.2);
      if (part.bonusStats.acceleration) stats.acceleration += part.bonusStats.acceleration * (1 + (part.level - 1) * 0.2);
      if (part.bonusStats.torque) stats.torque += part.bonusStats.torque * (1 + (part.level - 1) * 0.2);
      if (part.bonusStats.durability && stats.durability) stats.durability += part.bonusStats.durability * (1 + (part.level - 1) * 0.2);
      if (part.bonusStats.handling && stats.handling) stats.handling += part.bonusStats.handling * (1 + (part.level - 1) * 0.2);
    }
  }

  return {
    topSpeed: Math.round(stats.topSpeed),
    acceleration: Math.round(stats.acceleration),
    torque: Math.round(stats.torque),
    durability: Math.round(stats.durability || 100),
    handling: Math.round(stats.handling || 15)
  };
}

export interface AvailableSkin {
  id: string;
  name: string;
  category: string;
  description: string;
  iconAccent: string;
  previewColor: string;
}

export const AVAILABLE_SKINS: AvailableSkin[] = [
  {
    id: 'original',
    name: 'Original de Fábrica',
    category: 'Padrão',
    description: 'Pintura sólida limpa com brilho e reflexos autênticos de fábrica.',
    iconAccent: '#94a3b8',
    previewColor: '#64748b'
  },
  {
    id: 'skin_stripes',
    name: 'Listras Le Mans (Eleanor GT500 / Bullitt)',
    category: 'Lendário Muscle',
    description: 'Dupla faixa contínua branca sobre o capô, teto e traseira com faixas de soleira GT.',
    iconAccent: '#ffffff',
    previewColor: '#ffffff'
  },
  {
    id: 'skin_cyber_drift',
    name: 'Tribal Street (Supra Fast & Furious)',
    category: 'Street Tuner',
    description: 'Grafismo tribal esportivo verde neon e prata ao longo das portas e para-lamas traseiros.',
    iconAccent: '#84cc16',
    previewColor: '#84cc16'
  },
  {
    id: 'skin_herbie',
    name: 'Listras Históricas #53 (Herbie)',
    category: 'Clássico de Cinema',
    description: 'Faixa central tricolor vermelha/branca/azul com círculo número #53 nas portas.',
    iconAccent: '#dc2626',
    previewColor: '#dc2626'
  },
  {
    id: 'skin_general',
    name: 'General 01 Racing (Dodge Charger)',
    category: 'Muscle Stock',
    description: 'Numeração clássica 01 em branco com contorno preto nas portas laterais.',
    iconAccent: '#ea580c',
    previewColor: '#ea580c'
  },
  {
    id: 'skin_bumblebee',
    name: 'Rally Stripes Amarelo (Bumblebee)',
    category: 'Autobot Muscle',
    description: 'Faixas duplas pretas sobre capô e teto inspiradas no lendário muscle car.',
    iconAccent: '#eab308',
    previewColor: '#000000'
  },
  {
    id: 'skin_police',
    name: 'Interceptor Policial 911',
    category: 'Patrulha',
    description: 'Portas brancas de perseguição, insígnia POLICE e giroflex strobes no teto.',
    iconAccent: '#3b82f6',
    previewColor: '#3b82f6'
  },
  {
    id: 'skin_mud',
    name: 'Lamaçal Safari Dakar',
    category: 'Off-Road',
    description: 'Textura de terra e respingos de lama nas caixas de roda e soleiras.',
    iconAccent: '#78350f',
    previewColor: '#78350f'
  },
  {
    id: 'skin_wasteland',
    name: 'Ferrugem Mad Wasteland',
    category: 'Pós-Apocalíptico',
    description: 'Pátina de oxidação, marcas de solda e aço desgastado de batalha.',
    iconAccent: '#b45309',
    previewColor: '#b45309'
  }
];

