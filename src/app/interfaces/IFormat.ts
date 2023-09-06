import {ILimitationCarte} from "./ILimitationCarte";
export interface IFormat {
  formatId: number;
  nom: string;
  limitationCartes: ILimitationCarte[];
}
