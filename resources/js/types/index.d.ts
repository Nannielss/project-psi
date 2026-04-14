export interface User {
    id: number;
    username: string;
    role?: string;
    photo?: string;
    name?: string;
    email?: string;
    email_verified_at?: string;
    avatar?: string;
    created_at?: string;
    updated_at?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    branding?: {
        business_name?: string;
        business_tagline?: string | null;
        business_address?: string | null;
        business_phone?: string | null;
        logo_path?: string | null;
        logo_url?: string | null;
    };
    flash?: {
        success?: string;
        error?: string;
        [key: string]: unknown;
    };
};
