import {ICarte} from "./ICarte"
import {IUtilisateur} from "./IUtilisateur";
import {IFormat} from "./IFormat";
export interface ILimitationCarte {
  limitationId: number;
  carte: ICarte;
  format: IFormat;
  limite: number;
}
