import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
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
    backs: [] as { src: string; category: string }[],
    adds: [] as { src: string; category: string }[]
  };

  categories = {
    heads: [] as string[],
    hats: [] as string[],
    bodies: [] as string[],
    backs: [] as string[],
    adds: [] as string[]
  };

  filteredParts = {
    heads: [] as { src: string; category: string }[],
    hats: [] as { src: string; category: string }[],
    bodies: [] as { src: string; category: string }[],
    backs: [] as { src: string; category: string }[],
    adds: [] as { src: string; category: string }[]
  };

  selectedCategories = {
    heads: '',
    hats: '',
    bodies: '',
    backs: '',
    adds: ''
  };

  selectedParts = {
    head: '',
    hat: '',
    body: '',
    back: '',
    add: ''
  };

  private avatar?: Avatar;

  debloqueElements: any[] = [];

  constructor(private http: HttpClient, private utilisateurService: UtilisateurService,
              private authentificationService: AuthentificationService, private avatarService: AvatarService,
              private cd: ChangeDetectorRef) {

  }

  ngOnInit(): void {
    this.avatarService.getAvatar().subscribe({
      next: avatar => {
        this.avatar = avatar;
        this.selectedParts = {
          head: avatar.tete,
          hat: avatar.chapeau,
          body: avatar.corps,
          back: avatar.dos,
          add: avatar.add
        };

        this.utilisateurService.getElementsDebloques(this.authentificationService.getUserId()).subscribe(debloqueElements => {
          this.debloqueElements = debloqueElements;
        });

        this.http.get<{
          heads: { src: string; category: string }[],
          hats: { src: string; category: string }[],
          bodies: { src: string; category: string }[],
          backs: { src: string; category: string }[],
          adds: { src: string; category: string }[]
        }>('assets/avatars/avatars.json').subscribe(data => {
          this.parts = data;

          this.categories.heads = Array.from(new Set(data.heads.map(item => item.category)));
          this.categories.hats = Array.from(new Set(data.hats.map(item => item.category)));
          this.categories.bodies = Array.from(new Set(data.bodies.map(item => item.category)));
          this.categories.backs = Array.from(new Set(data.backs.map(item => item.category)));
          this.categories.adds = Array.from(new Set(data.adds.map(item => item.category)));

          this.selectedCategories.heads = this.getCategoryFromPart('heads', this.selectedParts.head);
          this.selectedCategories.hats = this.getCategoryFromPart('hats', this.selectedParts.hat);
          this.selectedCategories.bodies = this.getCategoryFromPart('bodies', this.selectedParts.body);
          this.selectedCategories.backs = this.getCategoryFromPart('backs', this.selectedParts.back);
          this.selectedCategories.adds = this.getCategoryFromPart('adds', this.selectedParts.add);

          this.filterParts('heads', this.selectedCategories.heads);
          this.filterParts('hats', this.selectedCategories.hats);
          this.filterParts('bodies', this.selectedCategories.bodies);
          this.filterParts('backs', this.selectedCategories.backs);
          this.filterParts('adds', this.selectedCategories.adds);
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
    this.cd.detectChanges();
  }

  selectPart(part: keyof AvatarPart, value: string) {
    this.selectedParts[part] = value;

    if (value === '') {
      const categoryKey = part + 's' as keyof typeof this.selectedCategories;
      this.selectedCategories[categoryKey] = '';
    }

    this.cd.detectChanges();
  }


  saveAvatar() {
    const updatedAvatar: Avatar = {
      id: this.avatar?.id ? this.avatar?.id : 0,
      utilisateurId: this.authentificationService.getUserId(),
      tete: this.selectedParts.head,
      chapeau: this.selectedParts.hat,
      corps: this.selectedParts.body,
      dos: this.selectedParts.back,
      add: this.selectedParts.add
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

  isDebloque(element: any): boolean {
    return true;
  }

  private getCategoryFromPart(partType: keyof typeof this.parts, partSrc: string): string {
    const part = this.parts[partType].find(item => item.src === partSrc);
    return part ? part.category : ''; // Retourne la catégorie correspondante ou '' si non trouvée
  }

  getFilteredCategories(partType: 'heads' | 'hats' | 'bodies' | 'backs' | 'adds'): string[] {
    return this.categories[partType];
  }

}
