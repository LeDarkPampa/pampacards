export class FiltersAndSortsValues {
  selectedClans: string[];
  selectedTypes: string[];
  selectedRaretes: number[];
  sortValue: string;

  constructor(
    selectedClans: string[],
    selectedTypes: string[],
    selectedRaretes: number[],
    sortValue: string
  ) {
    this.selectedClans = selectedClans;
    this.selectedTypes = selectedTypes;
    this.selectedRaretes = selectedRaretes;
    this.sortValue = sortValue;
  }
}
