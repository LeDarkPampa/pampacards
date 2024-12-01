import { Utilisateur } from "./Utilisateur";
import { Carte } from "./cartes/Carte";

export class Collection {
  id: number;
  cartes: Carte[];
  utilisateur: Utilisateur;

  constructor(id: number, cartes: Carte[], utilisateur: Utilisateur) {
    this.id = id;
    this.cartes = cartes;
    this.utilisateur = utilisateur;
  }
}
