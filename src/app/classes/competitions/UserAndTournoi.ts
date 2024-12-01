import {Utilisateur} from "../Utilisateur";
import {Deck} from "../decks/Deck";
import {Tournoi} from "./Tournoi";


export class UserAndTournoi {
  utilisateur: Utilisateur;
  tournoi: Tournoi;
  decks: Deck[];

  // Constructeur pour initialiser les propriétés
  constructor(utilisateur: Utilisateur, tournoi: Tournoi, decks: Deck[]) {
    this.utilisateur = utilisateur;
    this.tournoi = tournoi;
    this.decks = decks;
  }
}
