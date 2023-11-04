  import {IUtilisateur} from "./IUtilisateur";
  import {IFormat} from "./IFormat";
  import {ITypeCombat} from "./ITypeCombat";

  export interface ITournoi {
    id: number;
    nom: string;
    nombreDeJoueurs: number;
    statut: string;
    format: IFormat;
    typeCombat: ITypeCombat;
    participants: IUtilisateur[];
  }
