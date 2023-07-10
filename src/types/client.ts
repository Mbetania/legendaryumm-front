import { Room } from "./room";
import { Coin } from "./coin";

export interface Client {
  id: string;
  room?: Room;
  roomId?: string;
  status: ClientStatus;
  token: string;
  coins: Coin[];
}

export enum ClientStatus {
  PENDING,
  INGAME,
}
