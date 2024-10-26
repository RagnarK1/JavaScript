import { User } from './user';

export interface Message {
  conversationId: number;
  authorId: number;
  content: string;
  timestamp: number;
  receivers?: number[];
  firstname?: string;
  lastname?: string;
}
