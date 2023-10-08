import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';

@Component({
  selector: 'app-pampa-tour-animation',
  templateUrl: './pampa-tour-animation.component.html',
  styleUrls: ['./pampa-tour-animation.component.css']
})
export class PampaTourAnimationComponent implements OnChanges {
  @Input() tour: number = 1;
  tourAffiche = 0;
  positions: number[][] = [
    [9, 5], [71, 5],
    [71, 24], [9, 24],
    [9, 44], [71, 44],
    [71, 63], [9, 63],
    [9, 81], [71, 81],
    [71, 100], [9, 100]];


  ngOnChanges(changes: SimpleChanges) {
    if ('tour' in changes) {
      this.tourAffiche = Math.ceil(this.tour / 2);
    }
  }

  incrementTour() {
    this.tour = this.tour + 1;
    this.tourAffiche = Math.ceil(this.tour / 2);
  }

  afficherTour(i: number) {
    return Math.ceil((i+1)/2);
  }
}
