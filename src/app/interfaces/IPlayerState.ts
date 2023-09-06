import {ICarte} from "./ICarte";

export interface IPlayerState {
  id: number;
  nom: string;
  main: ICarte[];
  terrain: ICarte[];
  deck: ICarte[];
  defausse: ICarte[];
  score: number;
}
