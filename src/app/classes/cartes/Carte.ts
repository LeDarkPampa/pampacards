import {Clan} from "./Clan";
import {Type} from "./Type";
import {Effet} from "./Effet";

export class Carte {
  id: number;
  nom: string;
  clan: Clan;
  type: Type;
  rarete: number;
  effet: Effet;
  puissance: number;
  image_path: string;
  released: boolean;

  constructor(
    id: number,
    nom: string,
    clan: Clan,
    type: Type,
    rarete: number,
    effet: Effet,
    puissance: number,
    image_path: string,
    released: boolean
  ) {
    this.id = id;
    this.nom = nom;
    this.clan = clan;
    this.type = type;
    this.rarete = rarete;
    this.effet = effet;
    this.puissance = puissance;
    this.image_path = image_path;
    this.released = released;
  }

}
