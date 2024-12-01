import {
  Component,
  EventEmitter,
  Input, OnChanges,
  OnInit,
  Output, SimpleChanges
} from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { AuthentificationService } from "../services/authentification.service";
import { FiltersAndSortsValues } from "../classes/FiltersAndSortsValues";
import {ReferentielService} from "../services/referentiel.service";
import {Type} from "../classes/cartes/Type";
import {Clan} from "../classes/cartes/Clan";

@Component({
  selector: 'app-bandeau-filtres-cartes',
  templateUrl: './bandeau-filtres-cartes.component.html',
  styleUrls: ['./bandeau-filtres-cartes.component.css', '../app.component.css']
})
export class BandeauFiltresCartesComponent implements OnInit, OnChanges {
  @Input() filtersAndSortsValues: FiltersAndSortsValues = {
    selectedClans: [],
    selectedTypes: [],
    selectedRaretes: [],
    sortValue: 'no'
  };

  @Output() applyFilters = new EventEmitter<FiltersAndSortsValues>();
  @Output() sortCards = new EventEmitter<string>();

  clans: string[] = [];
  types: string[] = [];
  raretes: number[] = [1, 2, 3, 4];
  selectedClans: string[] = [];
  selectedTypes: string[] = [];
  selectedRaretes: number[] = [];
  resetSort: boolean = false;

  constructor(private http: HttpClient, private authService: AuthentificationService,
    private referentielService: ReferentielService) {}

  ngOnInit() {
    this.initializeData();
  }

  ngOnChanges(changes: SimpleChanges) {
    // @ts-ignore
    if (changes.filtersAndSortsValues && !changes.filtersAndSortsValues.firstChange) {
      this.selectedClans = this.filtersAndSortsValues.selectedClans;
      this.selectedTypes = this.filtersAndSortsValues.selectedTypes;
      this.selectedRaretes = this.filtersAndSortsValues.selectedRaretes;
      this.resetSort = true;
    }
  }

  private initializeData() {
    this.referentielService.getAllClans().subscribe(
      (clans: Clan[]) => {
        this.clans = clans.map(clan => clan.nom);
      },
      (error) => {
        console.error('Erreur lors de la récupération des clans', error);
      }
    );

    this.referentielService.getAllTypes().subscribe(
      (types: Type[]) => {
        this.types = types.map(type => type.nom);
      },
      (error) => {
        console.error('Erreur lors de la récupération des types', error);
      }
    );
  }

  resetFilters() {
    this.selectedClans = [];
    this.selectedTypes = [];
    this.selectedRaretes = [];
    this.resetSort = true;

    this.applyFiltersCards();
  }

  emitSortEvent(sortValue: string) {
    this.filtersAndSortsValues.sortValue = sortValue;
    setTimeout(() => {
      this.resetSort = false;
      this.applyFiltersCards();
    });
  }

  applyFiltersCards() {
    this.filtersAndSortsValues.selectedClans = this.selectedClans;
    this.filtersAndSortsValues.selectedTypes = this.selectedTypes;
    this.filtersAndSortsValues.selectedRaretes = this.selectedRaretes;
    this.applyFilters.emit(this.filtersAndSortsValues);
  }
}
