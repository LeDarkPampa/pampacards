import {ICarte} from "./ICarte";
import {IUtilisateur} from "./IUtilisateur";

export interface ICollection {
  id: number;
  cartes: ICarte[];
  utilisateur: IUtilisateur;
}
