export interface LgGameState {
  gameId: number; // Correspond à "gameId" de type Long dans le JSON
  state: string;
  phase: GamePhase;
  players: Player[];
  actions: Action[];
  votes: Vote[];
  results: GameResults;
  roleStates: RoleStates; // Ajout pour refléter la clé "roleStates"
  timestamp: string; // La date est sous forme de chaîne ISO 8601
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
  initiator: ActionParticipant; // Correctif pour refléter le format JSON
  target: ActionParticipant; // Correctif pour refléter le format JSON
}

export interface ActionParticipant {
  id: string; // Initiator et Target contiennent uniquement l'id
}

export interface Vote {
  voterId: string;
  targetId: string; // Correction pour correspondre au JSON
}

export interface GamePhase {
  name: string;
  description: string;
  remainingTime: number;
}

export interface GameResults {
  eliminatedPlayer: string | null; // Correspond aux noms dans le JSON
  killedPlayer: string | null;
  winner: string | null;
}

export interface RoleStates {
  lastProtectedPlayerId: string | null;
  influencerUsedPower: boolean;
  platformUsedPower: boolean;
  haterTriggered: boolean;
  gamerVotedOutFirstRound: boolean;
  loverLinks: Record<string, string>; // Correspond à un objet clé-valeur
  minorMentorId: string | null;
  botCheckedPlayerId: string | null;
  timeoutVotes: Record<string, number>; // Correspond à un objet clé-valeur
  usedPotions: {
    potionDeath: boolean;
    potionLife: boolean;
  };
}
