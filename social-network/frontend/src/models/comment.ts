export type Comment = {
    id: number;
    postId: number;
    content: string;
    timestamp: number; // Unix timestamp
    imagePath?: string; // Relative path to the uploaded file
    privacy: number; // 0 = private, 1 = public, 2 = almost private
    creatorId?: number
    firstname?: string
    lastname?: string
};
