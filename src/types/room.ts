import { Coin } from "./coin";


export interface Scale {
  x: number;
  y: number;
  z: number;
}

export interface Room {
  id: string;
  coinsAmount: number;
  scale: Scale;
  capacity?: number;
  clients?: string[];
  coins?: Coin[];
  isActive?: boolean;
}
