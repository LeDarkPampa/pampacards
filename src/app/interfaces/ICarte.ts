import {IClan} from "./IClan";
import {IType} from "./IType";
import {IEffet} from "./IEffet";

export interface ICarte {
  id: number;
  nom: string;
  clan: IClan;
  type: IType;
  rarete: number;
  effet: IEffet;
  puissance: number;
  image_path: string;
  silence: boolean;
  bouclier: boolean;
  insensible: boolean;
  corrompu: boolean;
  prison: boolean;
  diffPuissanceInstant: number;
  diffPuissanceContinue: number;
}
