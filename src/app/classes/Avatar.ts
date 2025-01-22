export class Avatar {
  id: number;
  utilisateurId: number;
  tete: string;
  chapeau: string;
  corps: string;
  dos: string;
  add: string;
  front: string;

  constructor(id: number, utilisateurId: number, tete: string, chapeau: string, corps: string, dos: string, add: string, front: string) {
    this.id = id;
    this.utilisateurId = utilisateurId;
    this.tete = tete;
    this.chapeau = chapeau;
    this.corps = corps;
    this.dos = dos;
    this.add = add;
    this.front = front;
  }
}
