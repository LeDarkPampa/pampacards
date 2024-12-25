export interface LgGameState {
  gameId: number;
  state: string;
  phase: GamePhase;
  players: Player[];
  actions: Action[];
  votes: Vote[];
  results: GameResults;
  roleStates: RoleStates;
  timestamp: string;
}

export interface Player {
  id: string;
  name: string;
  role: string;
  isAlive: boolean;
}

export interface Action {
  actionId: string;
  type: string;
  initiator: ActionParticipant;
  target: ActionParticipant;
}

export interface ActionParticipant {
  id: string;
}

export interface Vote {
  voterId: string;
  targetId: string;
}

export interface GamePhase {
  name: string;
  description: string;
  remainingTime: number;
}

export interface GameResults {
  winner: string | null;
}

export interface RoleStates {
  lastProtectedPlayerId: string | null;
  influencerUsedPower: boolean;
  platformUsedPower: boolean;
  haterTriggered: boolean;
  gamerVotedOutFirstRound: boolean;
  loverLinks: Record<string, string>;
  minorMentorId: string | null;
  botCheckedPlayerId: string | null;
  timeoutVotes: Record<string, number>;
  usedPotions: {
    potionDeath: boolean;
    potionLife: boolean;
  };
}
