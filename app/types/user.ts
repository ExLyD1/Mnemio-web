export interface User {
    id: string;
    email: string;
    displayName: string | null;
    username: string | null;
    birthday: string | null;
    createdAt: string;
}

export interface ProfileDetails {
    fullName: string;
    username: string;
    birthday: string;
}
