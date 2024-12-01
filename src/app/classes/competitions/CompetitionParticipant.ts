import {Utilisateur} from "../Utilisateur";
import {Deck} from "../decks/Deck";

export class CompetitionParticipant {
  id: number;
  utilisateur: Utilisateur;
  decks: Deck[];

  constructor(id: number, utilisateur: Utilisateur, decks: Deck[]) {
    this.id = id;
    this.utilisateur = utilisateur;
    this.decks = decks;
  }
}
