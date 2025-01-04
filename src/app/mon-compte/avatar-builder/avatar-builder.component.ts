import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {AvatarPart} from "../../classes/AvatarPart";
import {UtilisateurService} from "../../services/utilisateur.service";
import {AuthentificationService} from "../../services/authentification.service";
import {AvatarService} from "../../services/avatar.service";
import {Avatar} from "../../classes/Avatar";

@Component({
  selector: 'app-avatar-builder',
  templateUrl: './avatar-builder.component.html',
  styleUrls: ['./avatar-builder.component.css', '../../app.component.css']
})
export class AvatarBuilderComponent implements OnInit {
  parts = {
    heads: [] as { src: string; category: string }[],
    hats: [] as { src: string; category: string }[],
    bodies: [] as { src: string; category: string }[],
    backs: [] as { src: string; category: string }[]
  };

  categories = {
    heads: [] as string[],
    hats: [] as string[],
    bodies: [] as string[],
    backs: [] as string[]
  };

  filteredParts = {
    heads: [] as { src: string; category: string }[],
    hats: [] as { src: string; category: string }[],
    bodies: [] as { src: string; category: string }[],
    backs: [] as { src: string; category: string }[]
  };

  selectedCategories = {
    heads: '',
    hats: '',
    bodies: '',
    backs: ''
  };

  selectedParts = {
    head: '',
    hat: '',
    body: '',
    back: ''
  };

  private avatar?: Avatar;

  constructor(private http: HttpClient, private utilisateurService: UtilisateurService,
              private authentificationService: AuthentificationService, private avatarService: AvatarService) {

  }

  ngOnInit(): void {

    this.avatarService.getAvatar().subscribe({
      next: avatar => {
        this.avatar = avatar;
        this.selectedParts = {
          head: avatar.tete,
          hat: avatar.chapeau,
          body: avatar.corps,
          back: avatar.dos
        };

        this.http.get<{
          heads: { src: string; category: string }[],
          hats: { src: string; category: string }[],
          bodies: { src: string; category: string }[],
          backs: { src: string; category: string }[]
        }>('assets/avatars/avatars.json').subscribe(data => {
          this.parts = data;

          // Extraire dynamiquement les catégories pour chaque type d'élément
          this.categories.heads = Array.from(new Set(data.heads.map(item => item.category)));
          this.categories.hats = Array.from(new Set(data.hats.map(item => item.category)));
          this.categories.bodies = Array.from(new Set(data.bodies.map(item => item.category)));
          this.categories.backs = Array.from(new Set(data.backs.map(item => item.category)));

          // Initialiser les catégories sélectionnées par défaut
          this.selectedCategories.heads = this.categories.heads[0] || '';
          this.selectedCategories.hats = this.categories.hats[0] || '';
          this.selectedCategories.bodies = this.categories.bodies[0] || '';
          this.selectedCategories.backs = this.categories.backs[0] || '';

          // Filtrer les éléments pour chaque catégorie par défaut
          this.filterParts('heads', this.selectedCategories.heads);
          this.filterParts('hats', this.selectedCategories.hats);
          this.filterParts('bodies', this.selectedCategories.bodies);
          this.filterParts('backs', this.selectedCategories.backs);
        });
      },
      error: error => {
        console.error('Erreur lors de la récupération de l\'avatar', error);
        alert('Erreur lors de la récupération de l\'avatar');
      }
    });
  }

  filterParts(partType: keyof typeof this.parts, category: string) {
    this.selectedCategories[partType] = category;

    this.filteredParts[partType] = this.parts[partType].filter(item => item.category === category);
  }

  selectPart(part: keyof AvatarPart, value: string) {
    this.selectedParts[part] = value;
  }

  saveAvatar() {
    const updatedAvatar: Avatar = {
      id: this.avatar?.id ? this.avatar?.id : 0,
      utilisateurId: this.authentificationService.getUserId(),
      tete: this.selectedParts.head,
      chapeau: this.selectedParts.hat,
      corps: this.selectedParts.body,
      dos: this.selectedParts.back
    };

    this.utilisateurService.saveAvatar(updatedAvatar).subscribe({
      next: (response) => {
        alert('Avatar sauvegardé avec succès !');
      },
      error: (error) => {
        console.error('Erreur lors de la sauvegarde de l\'avatar', error);
        alert('Erreur lors de la sauvegarde de l\'avatar');
      }
    });
  }
}
