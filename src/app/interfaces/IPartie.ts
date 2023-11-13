import {IUtilisateur} from "./IUtilisateur";
import {IDeck} from "./IDeck";

export interface IPartie {
  id: number;
  date_creation: string;
  status: string;
  joueurUn: IUtilisateur;
  joueurDeux: IUtilisateur;
  competitionId: number;
}
