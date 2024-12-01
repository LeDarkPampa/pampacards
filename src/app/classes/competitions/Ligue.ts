
import { Affrontement } from "../combats/Affrontement";
import {Format} from "../decks/Format";
import {TypeCombat} from "../TypeCombat";
import {CompetitionParticipant} from "./CompetitionParticipant";

export class Ligue {
  id: number;
  nom: string;
  statut: string;
  format: Format;
  typeCombat: TypeCombat;
  participants: CompetitionParticipant[];
  affrontements: Affrontement[];

  constructor(
    id: number,
    nom: string,
    statut: string,
    format: Format,
    typeCombat: TypeCombat,
    participants: CompetitionParticipant[],
    affrontements: Affrontement[]
  ) {
    this.id = id;
    this.nom = nom;
    this.statut = statut;
    this.format = format;
    this.typeCombat = typeCombat;
    this.participants = participants;
    this.affrontements = affrontements;
  }
}
