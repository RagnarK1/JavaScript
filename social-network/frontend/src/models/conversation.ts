export interface Conversation {
  id: number;
  uniqueId: number; //needed to distinguish temporary conversations
  type: 'group' | 'direct';
  targetUserId?: number;
  ownerFirstname?: string;
  ownerLastname?: string;
  participants: number[];
}
