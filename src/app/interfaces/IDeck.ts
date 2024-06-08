import {ICarte} from "./ICarte"
import {IUtilisateur} from "./IUtilisateur";
import {IFormat} from "./IFormat";
export interface IDeck {
  id: number;
  nom: string;
  cartes: ICarte[];
  utilisateur: IUtilisateur;
  formats: IFormat[];
  dateCreation: Date;
}
