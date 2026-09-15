import { supabase } from './supabase';

const BUCKET_NAME = 'reports';

/**
 * Uploads a file to the Supabase 'reports' storage bucket.
 * @param path The path (including filename) to store the file at. e.g. 'user-123/report.pdf'
 * @param file The file object to upload (Blob, File, or Buffer)
 * @returns The public URL of the uploaded file or null if error
 */
export async function uploadReport(path: string, file: BodyInit): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .storage
            .from(BUCKET_NAME)
            .upload(path, file, {
                upsert: true,
            });

        if (error) {
            console.error('Error uploading file:', error);
            return null;
        }

        const { data: publicUrlData } = supabase
            .storage
            .from(BUCKET_NAME)
            .getPublicUrl(path);

        return publicUrlData.publicUrl;
    } catch (err) {
        console.error('Unexpected error uploading file:', err);
        return null;
    }
}

/**
 * Helper to get a public URL for a file
 */
export function getReportUrl(path: string): string {
    const { data } = supabase
        .storage
        .from(BUCKET_NAME)
        .getPublicUrl(path);

    return data.publicUrl;
}
