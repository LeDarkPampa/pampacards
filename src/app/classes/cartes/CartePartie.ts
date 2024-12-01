import {Clan} from "./Clan";
import {Type} from "./Type";
import {Effet} from "./Effet";
import {Carte} from "./Carte";

export class CartePartie extends Carte {

  cartePartieId: number;
  silence: boolean;
  bouclier: boolean;
  insensible: boolean;
  prison: boolean;
  diffPuissanceInstant: number;
  diffPuissanceContinue: number;

  constructor(
    cartePartieId: number,
    id: number,
    nom: string,
    clan: Clan,
    type: Type,
    rarete: number,
    effet: Effet,
    puissance: number,
    image_path: string,
    silence: boolean,
    bouclier: boolean,
    insensible: boolean,
    prison: boolean,
    diffPuissanceInstant: number,
    diffPuissanceContinue: number,
    released: boolean
  ) {
    super(
      id,
      nom,
      clan,
      type,
      rarete,
      effet,
      puissance,
      image_path,
      released
    );

    this.cartePartieId = cartePartieId;
    this.silence = silence;
    this.bouclier = bouclier;
    this.insensible = insensible;
    this.prison = prison;
    this.diffPuissanceInstant = diffPuissanceInstant;
    this.diffPuissanceContinue = diffPuissanceContinue;
  }
}
