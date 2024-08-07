export interface IEvenementPartie {
  id: number;
  status:string;
  tour: number;
  joueurActifId: number;
  premierJoueurId: number;
  dateEvent: string;
  cartesDeckJoueurUn: string;
  cartesDeckJoueurDeux: string;
  cartesMainJoueurUn: string;
  cartesMainJoueurDeux: string;
  cartesTerrainJoueurUn: string;
  cartesTerrainJoueurDeux: string;
  cartesDefausseJoueurUn: string;
  cartesDefausseJoueurDeux: string;
  partie_id: number;
  deckJoueurUnId: number;
  deckJoueurDeuxId: number;
  stopJ1: boolean;
  stopJ2: boolean;
  carteJouee: boolean;
  carteDefaussee: boolean;
}
