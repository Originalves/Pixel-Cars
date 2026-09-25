import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const app = express();
app.use(express.json());

// In-memory server-authoritative state for Headless Numerical Races & Betting
interface ServerRacer {
  id: string;
  name: string;
  buildType: 'muscle' | 'supercar' | 'tuner' | 'rally' | 'derby';
  topSpeed: number;
  acceleration: number;
  torque: number;
  durability: number;
  primaryColor: string;
  secondaryColor: string;
  odds: number;
  // Dynamic race state (numeric only)
  distance: number;
  speed: number;
  progressPercent: number;
  nitroRemaining: number;
  isNitroOn: boolean;
  health: number;
  finished: boolean;
  finishTime: number;
}

interface ServerChampionship {
  raceId: string;
  trackId: 'corrida' | 'drift' | 'draft' | 'rally' | 'derby';
  trackName: string;
  trackDistance: number;
  phase: 'betting' | 'racing' | 'results';
  phaseTimer: number; // in seconds
  racers: ServerRacer[];
  winnerId?: string;
}

const RACER_TEMPLATES: {
  name: string;
  buildType: ServerRacer['buildType'];
  topSpeed: number;
  acceleration: number;
  torque: number;
  durability: number;
  primaryColor: string;
  secondaryColor: string;
}[] = [
  { name: 'Red Comet V8', buildType: 'muscle', topSpeed: 18, acceleration: 12, torque: 26, durability: 120, primaryColor: '#ef4444', secondaryColor: '#1e293b' },
  { name: 'Cyber Phantom 99', buildType: 'supercar', topSpeed: 28, acceleration: 14, torque: 12, durability: 90, primaryColor: '#06b6d4', secondaryColor: '#0f172a' },
  { name: 'Sakura Drifter S15', buildType: 'tuner', topSpeed: 16, acceleration: 26, torque: 14, durability: 85, primaryColor: '#ec4899', secondaryColor: '#18181b' },
  { name: 'Iron Crusher 4x4', buildType: 'derby', topSpeed: 14, acceleration: 15, torque: 34, durability: 180, primaryColor: '#f97316', secondaryColor: '#292524' },
  { name: 'Dune Striker AWD', buildType: 'rally', topSpeed: 20, acceleration: 20, torque: 22, durability: 110, primaryColor: '#eab308', secondaryColor: '#78350f' },
  { name: 'Apex Stealth GT', buildType: 'supercar', topSpeed: 26, acceleration: 18, torque: 16, durability: 95, primaryColor: '#8b5cf6', secondaryColor: '#020617' },
  { name: 'Turbo Barchetta 70', buildType: 'muscle', topSpeed: 21, acceleration: 13, torque: 24, durability: 115, primaryColor: '#10b981', secondaryColor: '#0f172a' }
];

const TRACK_CONFIGS: { id: ServerChampionship['trackId']; name: string; distance: number }[] = [
  { id: 'corrida', name: 'Circuito Velocidade Máxima', distance: 1000 },
  { id: 'drift', name: 'Touge Noturno da Serra', distance: 850 },
  { id: 'draft', name: 'Wangan Highway 300', distance: 1200 },
  { id: 'rally', name: 'Dunas & Cascalho Selvagem', distance: 900 },
  { id: 'derby', name: 'Arena de Demolição e Ferro-Velho', distance: 750 }
];

let championshipRound = 1;

function generateChampionship(): ServerChampionship {
  const track = TRACK_CONFIGS[Math.floor(Math.random() * TRACK_CONFIGS.length)];
  // Pick 4 unique racers
  const shuffled = [...RACER_TEMPLATES].sort(() => 0.5 - Math.random()).slice(0, 4);
  
  // Calculate relative odds based on stats suitability to track
  const scored = shuffled.map((tpl, idx) => {
    let score = tpl.topSpeed + tpl.acceleration + tpl.torque;
    if (track.id === 'corrida' || track.id === 'draft') score += tpl.topSpeed * 1.5;
    if (track.id === 'drift') score += tpl.acceleration * 1.5;
    if (track.id === 'rally') score += (tpl.torque + tpl.acceleration) * 0.8;
    if (track.id === 'derby') score += tpl.torque * 1.5 + tpl.durability * 0.2;
    return { tpl, score, idx };
  });

  const totalScore = scored.reduce((acc, s) => acc + s.score, 0);

  const racers: ServerRacer[] = scored.map((s) => {
    const probability = s.score / totalScore;
    // Odds formula with house edge: 1 / prob * 0.9, bounded between 1.5 and 6.5
    const rawOdds = (1 / Math.max(0.12, probability)) * 0.88;
    const odds = Math.round(Math.min(7.5, Math.max(1.6, rawOdds)) * 10) / 10;

    return {
      id: `racer_${championshipRound}_${s.idx}`,
      name: s.tpl.name,
      buildType: s.tpl.buildType,
      topSpeed: s.tpl.topSpeed,
      acceleration: s.tpl.acceleration,
      torque: s.tpl.torque,
      durability: s.tpl.durability,
      primaryColor: s.tpl.primaryColor,
      secondaryColor: s.tpl.secondaryColor,
      odds,
      distance: 0,
      speed: 0,
      progressPercent: 0,
      nitroRemaining: 100,
      isNitroOn: false,
      health: s.tpl.durability,
      finished: false,
      finishTime: 0
    };
  });

  return {
    raceId: `champ_${championshipRound++}`,
    trackId: track.id,
    trackName: track.name,
    trackDistance: track.distance,
    phase: 'betting',
    phaseTimer: 15, // 15s to place bets
    racers
  };
}

let activeChampionship: ServerChampionship = generateChampionship();

// Active bets stored in server memory
interface ServerBet {
  socketId: string;
  raceId: string;
  racerId: string;
  amount: number;
  currency: 'coins' | 'cash';
  odds: number;
}
const currentBets: ServerBet[] = [];

// HTTP API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'headless-numeric-engine',
    championship: activeChampionship.raceId,
    phase: activeChampionship.phase,
    timer: activeChampionship.phaseTimer,
    connectedSockets: clients.size
  });
});

app.get('/api/championship', (req, res) => {
  res.json({
    championship: activeChampionship
  });
});

// Create HTTP and WebSocket Server
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Map<WebSocket, { id: string }>();

function broadcast(data: object) {
  const json = JSON.stringify(data);
  for (const client of clients.keys()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  }
}

wss.on('connection', (ws) => {
  const socketId = 'sock_' + Math.random().toString(36).substring(2, 9);
  clients.set(ws, { id: socketId });

  // Send current state immediately on connect
  ws.send(JSON.stringify({
    type: 'init_state',
    championship: activeChampionship
  }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'place_bet') {
        if (activeChampionship.phase !== 'betting') {
          ws.send(JSON.stringify({ type: 'bet_error', message: 'Apostas encerradas para esta corrida!' }));
          return;
        }
        const racer = activeChampionship.racers.find(r => r.id === msg.racerId);
        if (!racer) {
          ws.send(JSON.stringify({ type: 'bet_error', message: 'Competidor não encontrado!' }));
          return;
        }

        const newBet: ServerBet = {
          socketId,
          raceId: activeChampionship.raceId,
          racerId: racer.id,
          amount: Math.max(1, Number(msg.amount)),
          currency: msg.currency === 'cash' ? 'cash' : 'coins',
          odds: racer.odds
        };
        currentBets.push(newBet);

        ws.send(JSON.stringify({
          type: 'bet_confirmed',
          bet: newBet,
          potentialPayout: Math.floor(newBet.amount * newBet.odds)
        }));
      } else if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch (e) {
      // ignore malformed
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

// HEADLESS NUMERICAL ENGINE: Tick loop (100ms = 10Hz)
// Server ONLY computes pure math (distance, speed, drafting, collision, finish)
// No textures, no canvas, 100% scalable & lightweight.
let raceElapsedSeconds = 0;

setInterval(() => {
  if (activeChampionship.phase === 'betting') {
    activeChampionship.phaseTimer -= 0.1;
    if (activeChampionship.phaseTimer <= 0) {
      // Transition to racing!
      activeChampionship.phase = 'racing';
      activeChampionship.phaseTimer = 22; // ~22 seconds race
      raceElapsedSeconds = 0;
      broadcast({
        type: 'phase_change',
        phase: 'racing',
        championship: activeChampionship
      });
    } else {
      // Broadcast countdown every full second
      if (Math.abs(Math.round(activeChampionship.phaseTimer * 10) % 10) === 0) {
        broadcast({
          type: 'betting_countdown',
          timer: Math.ceil(activeChampionship.phaseTimer)
        });
      }
    }
  } else if (activeChampionship.phase === 'racing') {
    raceElapsedSeconds += 0.1;
    const dt = 0.1;
    const trackDist = activeChampionship.trackDistance;
    let allFinished = true;

    // Numerical physics tick for each racer
    for (let i = 0; i < activeChampionship.racers.length; i++) {
      const racer = activeChampionship.racers[i];
      if (racer.finished) continue;

      allFinished = false;

      // Base target speed from topSpeed, acceleration, and track modifiers
      let targetSpeedKmh = 140 + racer.topSpeed * 4.5;
      const accelPower = 18 + racer.acceleration * 1.2;

      // Nitro chance in mid-race
      if (raceElapsedSeconds > 4 && racer.nitroRemaining > 0 && Math.random() < 0.15) {
        racer.isNitroOn = true;
      }

      if (racer.isNitroOn && racer.nitroRemaining > 0) {
        targetSpeedKmh *= 1.35;
        racer.nitroRemaining -= 15 * dt;
        if (racer.nitroRemaining <= 0) {
          racer.isNitroOn = false;
        }
      }

      // Check drafting (if another car is slightly ahead within 40m)
      const ahead = activeChampionship.racers.find(other => 
        other.id !== racer.id && other.distance > racer.distance && (other.distance - racer.distance) < 40
      );
      if (ahead) {
        targetSpeedKmh *= 1.15; // +15% draft speed bonus
      }

      // Derby damage check
      if (activeChampionship.trackId === 'derby' && Math.random() < 0.08) {
        racer.health = Math.max(15, racer.health - 3);
      }

      // Smooth acceleration physics
      const speedMps = (racer.speed * 1000) / 3600;
      const targetMps = (targetSpeedKmh * 1000) / 3600;

      // Apply torque for initial launch
      const effectiveAccel = (accelPower * (racer.torque / 15)) * (racer.distance < 150 ? 1.6 : 1.0);
      const newSpeedMps = Math.min(targetMps, speedMps + effectiveAccel * dt * (0.8 + Math.random() * 0.4));
      racer.speed = Math.round((newSpeedMps * 3600) / 1000);

      racer.distance += newSpeedMps * dt;
      racer.progressPercent = Math.min(100, Math.round((racer.distance / trackDist) * 1000) / 10);

      if (racer.distance >= trackDist) {
        racer.finished = true;
        racer.finishTime = Math.round(raceElapsedSeconds * 100) / 100;
        if (!activeChampionship.winnerId) {
          activeChampionship.winnerId = racer.id;
        }
      }
    }

    // Sort positions by distance
    const sorted = [...activeChampionship.racers].sort((a, b) => b.distance - a.distance);
    const telemetry = sorted.map((r, rank) => ({
      id: r.id,
      name: r.name,
      rank: rank + 1,
      dist: Math.round(r.distance),
      pct: r.progressPercent,
      speed: r.speed,
      nitro: r.isNitroOn,
      hp: r.health,
      done: r.finished
    }));

    // Broadcast numerical telemetry packet to all connected clients
    broadcast({
      type: 'race_tick',
      elapsedTime: Math.round(raceElapsedSeconds * 10) / 10,
      racers: telemetry
    });

    if (allFinished || raceElapsedSeconds > 28) {
      activeChampionship.phase = 'results';
      activeChampionship.phaseTimer = 8; // 8 seconds to celebrate & view winnings

      const winner = activeChampionship.racers.find(r => r.id === activeChampionship.winnerId) || sorted[0];

      // Resolve all bets placed on this race
      for (const [ws, info] of clients.entries()) {
        const userBets = currentBets.filter(b => b.socketId === info.id && b.raceId === activeChampionship.raceId);
        for (const bet of userBets) {
          const won = bet.racerId === winner.id;
          const payout = won ? Math.floor(bet.amount * bet.odds) : 0;
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'bet_resolved',
              won,
              racerName: winner.name,
              amount: bet.amount,
              payout,
              currency: bet.currency
            }));
          }
        }
      }

      broadcast({
        type: 'phase_change',
        phase: 'results',
        winner: {
          id: winner.id,
          name: winner.name,
          odds: winner.odds,
          time: winner.finishTime || 22.4
        }
      });
    }
  } else if (activeChampionship.phase === 'results') {
    activeChampionship.phaseTimer -= 0.1;
    if (activeChampionship.phaseTimer <= 0) {
      // Clear bets and roll new championship!
      currentBets.length = 0;
      activeChampionship = generateChampionship();
      broadcast({
        type: 'phase_change',
        phase: 'betting',
        championship: activeChampionship
      });
    }
  }
}, 100); // 100ms server tick rate

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Pixel Idle Racing Server] Headless Numerical Engine & WebSocket running on port ${PORT}`);
  });
}

start();
