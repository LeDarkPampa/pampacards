import {CartePartie} from "../cartes/CartePartie";

export class PlayerState {
  id: number;
  nom: string;
  main: CartePartie[];
  terrain: CartePartie[];
  deck: CartePartie[];
  defausse: CartePartie[];
  score: number;

  constructor(
    id: number,
    nom: string,
    main: CartePartie[],
    terrain: CartePartie[],
    deck: CartePartie[],
    defausse: CartePartie[],
    score: number
  ) {
    this.id = id;
    this.nom = nom;
    this.main = main;
    this.terrain = terrain;
    this.deck = deck;
    this.defausse = defausse;
    this.score = score;
  }
}
