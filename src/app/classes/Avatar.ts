export class Avatar {
  id: number;
  utilisateurId: number;
  tete: string;
  chapeau: string;
  corps: string;
  dos: string;

  constructor(id: number, utilisateurId: number, tete: string, chapeau: string, corps: string, dos: string) {
    this.id = id;
    this.utilisateurId = utilisateurId;
    this.tete = tete;
    this.chapeau = chapeau;
    this.corps = corps;
    this.dos = dos;
  }
}
