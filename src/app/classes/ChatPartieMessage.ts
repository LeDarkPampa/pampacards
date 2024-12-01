export class ChatPartieMessage {
  id: number;
  partieId: number;
  auteur: string;
  texte: string;

  constructor(id: number, partieId: number, auteur: string, texte: string) {
    this.id = id;
    this.partieId = partieId;
    this.auteur = auteur;
    this.texte = texte;
  }
}
