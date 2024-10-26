export type Post = {
    id?: number; // "omitempty" in Go translates to optional in TypeScript
    creatorId?: number;
    groupId?: number; // Optional as indicated by the comment
    title: string;
    content: string;
    timestamp?: number; // Unix timestamp, optional
    privacy: number; // 0 = private, 1 = public, 2 = almost private
    imagePath?: string; // possible image in public dir
    allowedViewers?: string[]; // Optional, array of viewer identifiers
    firstname?: string //creators first name
    lastname?: string //creators last name
};
