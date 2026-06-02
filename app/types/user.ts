export interface User {
    id: string;
    email: string;
    displayName: string | null;
    username: string | null;
    birthday: string | null;
    avatarUrl: string | null;
    xp: number;
    createdAt: string;
}

export interface ProfileDetails {
    fullName: string;
    username: string;
    birthday: string;
}

export interface Preference {
    interests: string[];
    goal: string | null;
    nativeLanguage: string | null;
    learningLanguages: string[];
    avatarHue: number | null;
    mimiPlacement: 'left' | 'right' | null;
    favorites: string[];
    updatedAt: string;
}

export type PreferenceInput = Partial<Omit<Preference, 'updatedAt'>>;
