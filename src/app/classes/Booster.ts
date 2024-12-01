import { Carte } from "./cartes/Carte";

export class Booster {
  id: number;
  code: string;
  nom: string;
  cartes: Carte[];

  constructor(id: number, code: string, nom: string, cartes: Carte[]) {
    this.id = id;
    this.code = code;
    this.nom = nom;
    this.cartes = cartes;
  }
}
