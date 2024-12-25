export interface LgGameState {
  gameId: string;
  state: string;
  phase: GamePhase;
  players: Player[];
  actions: Action[];
  votes: Vote[];
  results: GameResults;
  timestamp: string;
}


interface Player {
  id: string;
  name: string;
  role: string;
  isAlive: boolean;
}

interface Action {
  actionId: string;
  type: string;
  initiator: Player;
  target: Player;
  result: string;
  timestamp: string;
}

interface Vote {
  voterId: string;
  voterName: string;
  votedId: string;
  votedName: string;
}

interface GamePhase {
  name: string;
  description: string;
  remainingTime: number;
}

interface GameResults {
  eliminatedPlayer: Player | null;
  killedPlayer: Player | null;
  winner: string | null;
}

