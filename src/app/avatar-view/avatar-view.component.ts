import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';

@Component({
  selector: 'app-avatar-view',
  templateUrl: './avatar-view.component.html',
  styleUrls: ['./avatar-view.component.css']
})
export class AvatarViewComponent implements OnChanges {
  @Input() head: string = '';
  @Input() hat: string = '';
  @Input() body: string = '';
  @Input() back: string = '';
  @Input() add: string = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['head'] || changes['hat'] || changes['body'] || changes['back'] || changes['add']) {
    }
  }
}
