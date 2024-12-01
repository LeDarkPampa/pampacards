import { Pipe, PipeTransform } from '@angular/core';
import {Carte} from "../classes/cartes/Carte";

@Pipe({
  name: 'sortCardsByName'
})
export class SortCardsByNamePipe implements PipeTransform {

  transform(value: Carte[]): Carte[] {
    return value.sort((n1,n2) =>
    {
      return n1.nom.localeCompare(n2.nom);
    });
  }

}
