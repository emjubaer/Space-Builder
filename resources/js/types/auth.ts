export type User = {
    id: number;
    name: string | null;
    email: string;
    mobile?: string | null;
    referral_code?: string | null;
    avatar?: string;
    email_verified_at: string | null;
    roles?: string[];
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User | null;
};
