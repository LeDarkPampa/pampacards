import {
  Component,
  Input,
  OnInit,
} from '@angular/core';

@Component({
  selector: 'app-carte',
  templateUrl: './carte.component.html',
  styleUrls: ['./carte.component.css', '../app.component.css']
})
export class CarteComponent implements OnInit {

  // @ts-ignore
  @Input() carte: CartePartie;
  @Input() taille: string = 'terrain';

  constructor() {}


  ngOnInit() {

  }

  generateStars(rarete: number): number[] {
    return Array(rarete).fill(0);
  }
}
