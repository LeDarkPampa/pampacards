import {IClan} from "./IClan";
import {IType} from "./IType";
import {IEffet} from "./IEffet";

export interface ICarte {
  id: number;
  nom: string;
  clan: IClan;
  type: IType;
  rarete: number;
  effet: IEffet | null;
  puissance: number;
  image_path: string;
  silence: boolean;
  bouclier: boolean;
  insensible: boolean;
  prison: boolean;
  diffPuissanceInstant: number;
  diffPuissanceContinue: number;
  released: boolean;
}
