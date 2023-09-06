import { Pipe, PipeTransform } from '@angular/core';
import { ICarte } from "../interfaces/ICarte";

@Pipe({
  name: 'filtreCartes'
})
export class FiltreCartesPipe implements PipeTransform {
  transform(cartes: ICarte[], filtreClan: string, filtreType: string, filtreRarete: number): ICarte[] {
    let resultat: ICarte[] = cartes;

    if (filtreClan) {
      resultat = resultat.filter(carte => carte.clan.nom === filtreClan);
    }

    if (filtreType) {
      resultat = resultat.filter(carte => carte.type === filtreType);
    }

    if (filtreRarete) {
      resultat = resultat.filter(carte => carte.rarete === filtreRarete);
    }

    return resultat;
  }
}
