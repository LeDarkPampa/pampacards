import { Carte } from "../cartes/Carte";

export class CarteAndQuantity {carte: Carte;
  quantity: number;

  constructor(carte: Carte, quantity: number) {
    this.carte = carte;
    this.quantity = quantity;
  }
}
