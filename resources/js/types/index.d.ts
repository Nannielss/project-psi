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
    teacher_id?: number;
    teacher?: Teacher;
}

export interface Major {
    id: number;
    kode: string;
    name: string;
    created_at?: string;
    updated_at?: string;
}

export interface Student {
    id: number;
    nis: string;
    name: string;
    major_id: number;
    class: string;
    created_at: string;
    updated_at: string;
    major?: Major;
}

export interface Subject {
    id: number;
    nama: string;
    created_at?: string;
    updated_at?: string;
}

export interface Teacher {
    id: number;
    nip: string;
    name: string;
    created_at: string;
    updated_at: string;
    subjects?: Subject[];
}

export interface Material {
    id: number;
    nama_bahan: string;
    stok: number;
    satuan: string;
    foto?: string;
    keterangan?: string;
    created_at: string;
    updated_at: string;
}

export interface MaterialPickup {
    id: number;
    material_id: number;
    teacher_id: number;
    jumlah: number;
    keterangan?: string;
    created_at: string;
    updated_at: string;
    material?: Material;
    teacher?: Teacher;
}

export interface ToolUnit {
    id: number;
    tool_id: number;
    unit_number: number;
    unit_code: string;
    condition: 'good' | 'damaged' | 'scrapped';
    description?: string;
    created_at: string;
    updated_at: string;
    tool?: Tool;
}

export interface Tool {
    id: number;
    code: string;
    name: string;
    location: string;
    photo?: string;
    description?: string;
    created_at: string;
    updated_at: string;
    units?: ToolUnit[];
    total_units?: number;
    good_count?: number;
    damaged_count?: number;
    scrapped_count?: number;
    available_count?: number;
    borrowed_count?: number;
}

export interface DeviceLocation {
    id: number;
    name: string;
    password_hash?: string; // Hashed password (for internal use, not displayed)
    plain_password?: string; // Decrypted plain text password for display
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ToolLoan {
    id: number;
    student_id?: number;
    borrower_teacher_id?: number;
    device_location_id?: number;
    tool_unit_id: number;
    teacher_id?: number;
    subject_id?: number;
    borrow_photo: string;
    return_photo?: string;
    borrowed_at: string;
    returned_at?: string;
    status: 'borrowed' | 'returned';
    return_condition?: 'good' | 'damaged';
    notes?: string;
    created_at: string;
    updated_at: string;
    student?: Student;
    borrower_teacher?: Teacher;
    tool_unit?: ToolUnit;
    teacher?: Teacher;
    subject?: Subject;
    device_location?: DeviceLocation;
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
