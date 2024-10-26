interface DOB {
  day: number;
  month: number;
  year: number;
}

export interface User {
  id: number;
  nickname: string;
  email: string;
  firstname: string;
  lastname: string;
  dob: DOB;
  aboutMe: string;
  avatarPath: string;
  isPrivate: number; // Assuming 0 or 1 represents false or true respectively, consider using boolean
  posts?: any[] //TODO: change to Post interface
  followerIds?: number[]
  followingIds?: number[] //Needs to be implemented on the backend, after following starts working properly
}
