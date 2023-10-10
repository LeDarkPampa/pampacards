import {ICarte} from "./ICarte"

export interface IBooster {
  id: number;
  code: string;
  nom: string;
  cartes: ICarte[];
}
