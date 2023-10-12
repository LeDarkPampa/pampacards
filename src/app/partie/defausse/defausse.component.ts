import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {ICarte} from "../../interfaces/ICarte";

@Component({
  selector: 'app-defausse',
  templateUrl: './defausse.component.html',
  styleUrls: ['./defausse.component.css']
})
export class DefausseComponent {
  @Input() cartes: ICarte[] = [];

}
