import {Format} from "../decks/Format";
import {TypeCombat} from "../TypeCombat";
import {CompetitionParticipant} from "./CompetitionParticipant";
import {Round} from "./Round";

export class Tournoi {
  id: number;
  nom: string;
  nombreDeJoueurs: number;
  statut: string;
  format: Format;
  typeCombat: TypeCombat;
  participants: CompetitionParticipant[];
  rounds: Round[];

  constructor(
    id: number,
    nom: string,
    nombreDeJoueurs: number,
    statut: string,
    format: Format,
    typeCombat: TypeCombat,
    participants: CompetitionParticipant[],
    rounds: Round[]
  ) {
    this.id = id;
    this.nom = nom;
    this.nombreDeJoueurs = nombreDeJoueurs;
    this.statut = statut;
    this.format = format;
    this.typeCombat = typeCombat;
    this.participants = participants;
    this.rounds = rounds;
  }
}
