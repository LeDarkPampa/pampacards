import {IAffrontement} from "./IAffrontement";

export interface IRound {
  id: number;
  tournoiId: number;
  roundNumber: number;
  affrontements: IAffrontement[];
}
