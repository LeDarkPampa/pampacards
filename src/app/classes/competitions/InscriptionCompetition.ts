import {Deck} from "../decks/Deck";

export class InscriptionCompetition {
  status: string;
  decks: Deck[];

  constructor(status: string, decks: Deck[]) {
    this.status = status;
    this.decks = decks;
  }
}
