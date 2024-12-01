import { PlayerState } from "./PlayerState";
import { EvenementPartie } from "./EvenementPartie";

export class PartieDatas {
  partieId: number;
  joueur: PlayerState;
  adversaire: PlayerState;
  finDePartie: boolean;
  lastEvent: EvenementPartie;
  nomVainqueur: string;
  nomJoueurAbandon: string;

  constructor(
    partieId: number,
    joueur: PlayerState,
    adversaire: PlayerState,
    finDePartie: boolean,
    lastEvent: EvenementPartie,
    nomVainqueur: string,
    nomJoueurAbandon: string
  ) {
    this.partieId = partieId;
    this.joueur = joueur;
    this.adversaire = adversaire;
    this.finDePartie = finDePartie;
    this.lastEvent = lastEvent;
    this.nomVainqueur = nomVainqueur;
    this.nomJoueurAbandon = nomJoueurAbandon;
  }
}
