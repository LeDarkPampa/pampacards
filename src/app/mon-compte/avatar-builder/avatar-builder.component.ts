import {Component, OnInit} from '@angular/core';
import {NgForOf, NgIf} from "@angular/common";
import {HttpClient} from "@angular/common/http";

@Component({
  selector: 'app-avatar-builder',
  standalone: true,
  imports: [
    NgForOf,
    NgIf
  ],
  templateUrl: './avatar-builder.component.html',
  styleUrl: './avatar-builder.component.css'
})
export class AvatarBuilderComponent implements OnInit {
  parts = {
    heads: [] as string[],
    hats: [] as string[],
    bodies: [] as string[],
    backs: [] as string[]
  };

  selectedParts: SelectedParts = {
    head: '',
    hat: '',
    body: '',
    back: ''
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<{ heads: string[]; hats: string[]; bodies: string[]; backs: string[] }>('assets/avatars/avatars.json')
      .subscribe(data => {
        this.parts = data;
        this.selectedParts = {
          head: data.heads[0] || '',
          hat: '',
          body: data.bodies[0] || '',
          back: data.backs[0] || ''
        };
      });
  }

  selectPart(part: keyof SelectedParts, value: string) {
    this.selectedParts[part] = value;
  }
}

type SelectedParts = {
  head: string;
  hat: string;
  body: string;
  back: string;
};
