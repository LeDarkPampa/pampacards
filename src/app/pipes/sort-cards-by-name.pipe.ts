import { Pipe, PipeTransform } from '@angular/core';
import {ICarte} from "../interfaces/ICarte";

@Pipe({
  name: 'sortCardsByName'
})
export class SortCardsByNamePipe implements PipeTransform {

  transform(value: ICarte[]): ICarte[] {
    return value.sort((n1,n2) =>
    {
      return n1.nom.localeCompare(n2.nom);
    });
  }

}
