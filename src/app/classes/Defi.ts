export interface Defi {
  defiId: number;
  titre: string;
  description: string;
  code: string;
  actif: boolean;
  elementType: string;  // Type de l'élément déblocable
  elementCode: string;  // Code de l'élément déblocable
  reussi: boolean;  // Indique si le défi est terminé
}
