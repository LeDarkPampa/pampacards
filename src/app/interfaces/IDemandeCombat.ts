export interface IDemandeCombat {
  id: number;
  joueurUnId: number;
  joueurDeuxId: number;
  joueurUnPseudo: string;
  joueurDeuxPseudo: string;
  deckUnId: number;
  deckDeuxId: number;
  nomDeckUn: string;
  nomFormat: string;
  partieId: number;
  message: string;
  erreur: string;
  status: string;

}
