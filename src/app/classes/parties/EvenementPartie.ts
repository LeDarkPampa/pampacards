export class EvenementPartie {
  id: number;
  status: string;
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

  constructor(
    id: number,
    status: string,
    tour: number,
    joueurActifId: number,
    premierJoueurId: number,
    dateEvent: string,
    cartesDeckJoueurUn: string,
    cartesDeckJoueurDeux: string,
    cartesMainJoueurUn: string,
    cartesMainJoueurDeux: string,
    cartesTerrainJoueurUn: string,
    cartesTerrainJoueurDeux: string,
    cartesDefausseJoueurUn: string,
    cartesDefausseJoueurDeux: string,
    partie_id: number,
    deckJoueurUnId: number,
    deckJoueurDeuxId: number,
    stopJ1: boolean,
    stopJ2: boolean,
    carteJouee: boolean,
    carteDefaussee: boolean
  ) {
    this.id = id;
    this.status = status;
    this.tour = tour;
    this.joueurActifId = joueurActifId;
    this.premierJoueurId = premierJoueurId;
    this.dateEvent = dateEvent;
    this.cartesDeckJoueurUn = cartesDeckJoueurUn;
    this.cartesDeckJoueurDeux = cartesDeckJoueurDeux;
    this.cartesMainJoueurUn = cartesMainJoueurUn;
    this.cartesMainJoueurDeux = cartesMainJoueurDeux;
    this.cartesTerrainJoueurUn = cartesTerrainJoueurUn;
    this.cartesTerrainJoueurDeux = cartesTerrainJoueurDeux;
    this.cartesDefausseJoueurUn = cartesDefausseJoueurUn;
    this.cartesDefausseJoueurDeux = cartesDefausseJoueurDeux;
    this.partie_id = partie_id;
    this.deckJoueurUnId = deckJoueurUnId;
    this.deckJoueurDeuxId = deckJoueurDeuxId;
    this.stopJ1 = stopJ1;
    this.stopJ2 = stopJ2;
    this.carteJouee = carteJouee;
    this.carteDefaussee = carteDefaussee;
  }
}
