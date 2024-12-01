import { Carte } from "../../classes/cartes/Carte";
import {Format} from "./Format";
import {Utilisateur} from "../Utilisateur";

export class Deck {
  id: number;
  nom: string;
  cartes: Carte[];
  utilisateur: Utilisateur;
  formats: Format[];
  dateCreation: Date;

  constructor(
    id: number,
    nom: string,
    // cartes: Carte[],
    cartes: Carte[],
    utilisateur: Utilisateur,
    formats: Format[],
    dateCreation: Date
  ) {
    this.id = id;
    this.nom = nom;
    this.cartes = cartes;
    this.utilisateur = utilisateur;
    this.formats = formats;
    this.dateCreation = dateCreation;
  }
}
