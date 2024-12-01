import { Utilisateur } from "../Utilisateur";

export class Partie {
  id: number;
  date_creation: string;
  status: string;
  joueurUn: Utilisateur;
  joueurDeux: Utilisateur;
  competitionId: number;
  deckJoueurUnId: number;
  deckJoueurDeuxId: number;

  constructor(
    id: number,
    date_creation: string,
    status: string,
    joueurUn: Utilisateur,
    joueurDeux: Utilisateur,
    competitionId: number,
    deckJoueurUnId: number,
    deckJoueurDeuxId: number
  ) {
    this.id = id;
    this.date_creation = date_creation;
    this.status = status;
    this.joueurUn = joueurUn;
    this.joueurDeux = joueurDeux;
    this.competitionId = competitionId;
    this.deckJoueurUnId = deckJoueurUnId;
    this.deckJoueurDeuxId = deckJoueurDeuxId;
  }
}
