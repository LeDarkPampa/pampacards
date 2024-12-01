import {Utilisateur} from "../Utilisateur";
import {Ligue} from "./Ligue";
import {Deck} from "../decks/Deck";


export class UserAndLigue {
  utilisateur: Utilisateur;
  ligue: Ligue;
  decks: Deck[];

  constructor(utilisateur: Utilisateur, ligue: Ligue, decks: Deck[]) {
    this.utilisateur = utilisateur;
    this.ligue = ligue;
    this.decks = decks;
  }
}
