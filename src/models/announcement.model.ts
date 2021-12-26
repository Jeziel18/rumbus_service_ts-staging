export interface Announcement {
    id: string;
    user_id: string;
    content: string;
    headline: string;
    created_on: Date;
    updated_on: Date;
    expire_at: Date;
}
