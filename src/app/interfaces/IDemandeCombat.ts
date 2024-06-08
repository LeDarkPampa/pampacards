export interface IDemandeCombat {
  id: number;
  joueurUnId: number;
  joueurDeuxId: number;
  joueurUnPseudo: string;
  joueurDeuxPseudo: string;
  deckUnId: number;
  deckDeuxId: number;
  nomDeckUn: string;
  formatId: number;
  partieId: number;
  message: string;
  firstPlayerId: number;
  erreur: string;
  status: string;

}
