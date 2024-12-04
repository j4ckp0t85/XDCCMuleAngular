import { Channel } from './channel.interface';

export interface Server {
  id: number;
  name: string;
  address: string;
  channels: Channel[];
}
