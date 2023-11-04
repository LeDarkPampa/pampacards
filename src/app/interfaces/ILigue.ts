  import {IUtilisateur} from "./IUtilisateur";
  import {IFormat} from "./IFormat";
  import {ITypeCombat} from "./ITypeCombat";

  export interface ILigue {
    id: number;
    nom: string;
    statut: string;
    format: IFormat;
    typeCombat: ITypeCombat;
    participants: IUtilisateur[];
  }
