import { Carte } from "../cartes/Carte";

export class LimitationCarte {
  limitationId: number;
  carte: Carte;
  limite: number;

  constructor(limitationId: number, carte: Carte, limite: number) {
    this.limitationId = limitationId;
    this.carte = carte;
    this.limite = limite;
  }
}
