export class Utilisateur {
  id: number;
  pseudo: string;
  email: string;
  password: string;
  testeur: boolean;
  bot: boolean;

  constructor(id: number, pseudo: string, email: string, password: string, testeur: boolean, bot: boolean) {
    this.id = id;
    this.pseudo = pseudo;
    this.email = email;
    this.password = password;
    this.testeur = testeur;
    this.bot = bot;
  }
}
