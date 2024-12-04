import { Channel } from './channel.type';

export type Server = {
  id: number;
  name: string;
  address: string;
  channels: Channel[];
};
