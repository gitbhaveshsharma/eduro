/**
 * File Upload Service - RLS-Compliant File Upload to Supabase Storage
 * Uses File objects directly without conversions
 * Handles files table operations and storage bucket uploads
 */
import { createClient } from "@/lib/supabase/client";

export interface FileOperationResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export type UploadType = 'instruction' | 'submission' | 'temp_instruction';

export interface UploadFileParams {
    file: File;
    assignmentId: string;
    uploadType: UploadType;
    studentId?: string; // Required for submission type
}

export interface UploadedFileData {
    id: string; // File record ID from files table
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    publicUrl: string;
    signedUrl?: string;
    contextType: string;
    contextId: string;
}

export class FileUploadService {
    private static instance: FileUploadService;
    private supabase = createClient();

    private constructor() { }

    public static getInstance(): FileUploadService {
        if (!FileUploadService.instance) {
            FileUploadService.instance = new FileUploadService();
        }
        return FileUploadService.instance;
    }

    /**
     * Get current authenticated user
     */
    private async getCurrentUser() {
        const { data: { user }, error } = await this.supabase.auth.getUser();
        if (error || !user) {
            throw new Error('User not authenticated');
        }
        return user;
    }

    /**
     * Generate RLS-compliant file path based on upload type
     */
    private generateFilePath(params: {
        uploadType: UploadType;
        assignmentId: string;
        userId: string;
        studentId?: string;
        fileName: string;
    }): string {
        const { uploadType, assignmentId, userId, studentId, fileName } = params;
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueFileName = `${timestamp}_${sanitizedFileName}`;

        switch (uploadType) {
            case 'instruction':
                // Path: instruction/{assignmentId}/{filename}
                return `instruction/${assignmentId}/${uniqueFileName}`;

            case 'submission':
                // Path: submission/{assignmentId}/{studentId}/{filename}
                if (!studentId) {
                    throw new Error('studentId is required for submission uploads');
                }
                return `submission/${assignmentId}/${studentId}/${uniqueFileName}`;

            case 'temp_instruction':
                // Path: assignment_instruction/temp_{userId}/{filename}
                return `assignment_instruction/temp_${userId}/${uniqueFileName}`;

            default:
                throw new Error(`Invalid upload type: ${uploadType}`);
        }
    }

    /**
     * Get context type for files table based on upload type
     */
    private getContextType(uploadType: UploadType): string {
        switch (uploadType) {
            case 'instruction':
                return 'assignment_instruction';
            case 'submission':
                return 'submission';
            case 'temp_instruction':
                return 'assignment_instruction';
            default:
                throw new Error(`Invalid upload type: ${uploadType}`);
        }
    }

    /**
     * Insert file record into files table
     */
    private async insertFileRecord(params: {
        fileName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        contextType: string;
        contextId: string;
        uploadedBy: string;
        isPermanent?: boolean;
        expiresAt?: string;
    }): Promise<FileOperationResult<{ id: string }>> {
        try {
            const { data, error } = await this.supabase
                .from('files')
                .insert({
                    file_name: params.fileName,
                    file_path: params.filePath,
                    file_size: params.fileSize,
                    mime_type: params.mimeType,
                    storage_provider: 'supabase',
                    context_type: params.contextType,
                    context_id: params.contextId,
                    uploaded_by: params.uploadedBy,
                    is_permanent: params.isPermanent || false,
                    expires_at: params.expiresAt || null,
                })
                .select('id')
                .single();

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, data: { id: data.id } };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error inserting file record',
            };
        }
    }

    /**
     * Delete file record from files table
     */
    private async deleteFileRecord(filePath: string): Promise<FileOperationResult<void>> {
        try {
            const { error } = await this.supabase
                .from('files')
                .delete()
                .eq('file_path', filePath);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error deleting file record',
            };
        }
    }

    /**
     * Upload a file to the assignments bucket with RLS-compliant paths
     * File path structure depends on uploadType:
     * - instruction: instruction/{assignmentId}/{timestamp}_{filename}
     * - submission: submission/{assignmentId}/{studentId}/{timestamp}_{filename}
     * - temp_instruction: assignment_instruction/temp_{userId}/{timestamp}_{filename}
     */
    async uploadFile(params: UploadFileParams): Promise<FileOperationResult<UploadedFileData>> {
        try {
            const { file, assignmentId, uploadType, studentId } = params;

            // Get authenticated user
            const user = await this.getCurrentUser();
            const userId = user.id;

            // Validate studentId for submission uploads
            if (uploadType === 'submission' && !studentId) {
                return { success: false, error: 'studentId is required for submission uploads' };
            }

            // Validate file size (100MB limit)
            const maxSize = 100 * 1024 * 1024; // 100MB in bytes
            if (file.size > maxSize) {
                return { success: false, error: 'File size exceeds 100MB limit' };
            }

            // Validate MIME type
            const allowedMimeTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain',
                'application/rtf',
                'image/jpeg',
                'image/png',
                'image/gif',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/csv',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'application/zip',
                'application/x-zip-compressed'
            ];

            if (!allowedMimeTypes.includes(file.type)) {
                return { success: false, error: 'File type not allowed' };
            }

            // Generate RLS-compliant file path
            const filePath = this.generateFilePath({
                uploadType,
                assignmentId,
                userId,
                studentId,
                fileName: file.name,
            });

            // Upload to storage
            const { data: storageData, error: storageError } = await this.supabase.storage
                .from('assignments')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (storageError) {
                return { success: false, error: storageError.message };
            }

            // Get public URL (for private buckets, this returns a path that requires auth)
            const { data: { publicUrl } } = this.supabase.storage
                .from('assignments')
                .getPublicUrl(filePath);

            // Generate signed URL for preview (valid for 1 hour)
            const { data: signedData } = await this.supabase.storage
                .from('assignments')
                .createSignedUrl(filePath, 3600);

            // Get context type for files table
            const contextType = this.getContextType(uploadType);

            // Insert file record into files table
            const fileRecordResult = await this.insertFileRecord({
                fileName: file.name,
                filePath: filePath,
                fileSize: file.size,
                mimeType: file.type,
                contextType: contextType,
                contextId: assignmentId,
                uploadedBy: userId,
                isPermanent: uploadType === 'instruction', // Instruction files are permanent
                expiresAt: uploadType === 'temp_instruction'
                    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days for temp files
                    : undefined,
            });

            if (!fileRecordResult.success || !fileRecordResult.data) {
                // Rollback: Delete uploaded file from storage
                await this.supabase.storage
                    .from('assignments')
                    .remove([filePath]);

                return {
                    success: false,
                    error: `File uploaded but failed to create database record: ${fileRecordResult.error}`
                };
            }

            const uploadedFileData: UploadedFileData = {
                id: fileRecordResult.data.id,
                fileName: file.name,
                filePath: filePath,
                fileSize: file.size,
                mimeType: file.type,
                publicUrl: publicUrl,
                signedUrl: signedData?.signedUrl,
                contextType: contextType,
                contextId: assignmentId,
            };

            return { success: true, data: uploadedFileData };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during upload',
            };
        }
    }

    /**
     * Upload multiple files with RLS-compliant paths
     */
    async uploadFiles(params: {
        files: File[];
        assignmentId: string;
        uploadType: UploadType;
        studentId?: string;
    }): Promise<FileOperationResult<UploadedFileData[]>> {
        try {
            const { files, assignmentId, uploadType, studentId } = params;

            const results = await Promise.allSettled(
                files.map(file => this.uploadFile({
                    file,
                    assignmentId,
                    uploadType,
                    studentId,
                }))
            );

            const successfulUploads: UploadedFileData[] = [];
            const errors: string[] = [];

            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value.success && result.value.data) {
                    successfulUploads.push(result.value.data);
                } else if (result.status === 'fulfilled' && result.value.error) {
                    errors.push(`File ${files[index].name}: ${result.value.error}`);
                } else if (result.status === 'rejected') {
                    errors.push(`File ${files[index].name}: ${result.reason}`);
                }
            });

            if (successfulUploads.length === 0) {
                return { success: false, error: errors.join('; ') };
            }

            if (errors.length > 0) {
                return {
                    success: true,
                    data: successfulUploads,
                    error: `Some files failed: ${errors.join('; ')}`
                };
            }

            return { success: true, data: successfulUploads };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during batch upload',
            };
        }
    }

    /**
     * Delete a file from storage and files table
     */
    async deleteFile(filePath: string): Promise<FileOperationResult<void>> {
        try {
            // Delete from files table first
            const fileRecordResult = await this.deleteFileRecord(filePath);
            if (!fileRecordResult.success) {
                console.warn(`Failed to delete file record: ${fileRecordResult.error}`);
                // Continue to delete from storage anyway
            }

            // Delete from storage
            const { error: storageError } = await this.supabase.storage
                .from('assignments')
                .remove([filePath]);

            if (storageError) {
                return { success: false, error: storageError.message };
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during delete',
            };
        }
    }

    /**
     * Delete file by file record ID
     */
    async deleteFileById(fileId: string): Promise<FileOperationResult<void>> {
        try {
            // Get file record to get the file path
            const { data: fileRecord, error: fetchError } = await this.supabase
                .from('files')
                .select('file_path')
                .eq('id', fileId)
                .single();

            if (fetchError || !fileRecord) {
                return { success: false, error: 'File record not found' };
            }

            // Delete using file path
            return await this.deleteFile(fileRecord.file_path);
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during delete',
            };
        }
    }

    /**
     * Get file details by file record ID
     */
    async getFileById(fileId: string): Promise<FileOperationResult<{
        id: string;
        fileName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        signedUrl?: string;
    }>> {
        try {
            const { data: fileRecord, error: fetchError } = await this.supabase
                .from('files')
                .select('*')
                .eq('id', fileId)
                .single();

            if (fetchError || !fileRecord) {
                return { success: false, error: 'File record not found' };
            }

            // Generate signed URL
            const { data: signedData } = await this.supabase.storage
                .from('assignments')
                .createSignedUrl(fileRecord.file_path, 3600);

            return {
                success: true,
                data: {
                    id: fileRecord.id,
                    fileName: fileRecord.file_name,
                    filePath: fileRecord.file_path,
                    fileSize: fileRecord.file_size,
                    mimeType: fileRecord.mime_type,
                    signedUrl: signedData?.signedUrl,
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error fetching file',
            };
        }
    }

    /**
     * Get signed URL for a file path
     */
    async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<FileOperationResult<string>> {
        try {
            const { data, error } = await this.supabase.storage
                .from('assignments')
                .createSignedUrl(filePath, expiresIn);

            if (error || !data) {
                return { success: false, error: error?.message || 'Failed to generate signed URL' };
            }

            return { success: true, data: data.signedUrl };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error generating signed URL',
            };
        }
    }

    /**
     * Get files by assignment ID and context type
     */
    async getFilesByAssignmentId(
        assignmentId: string,
        contextType: 'assignment_instruction' | 'submission' = 'assignment_instruction'
    ): Promise<FileOperationResult<Array<{
        id: string;
        fileName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        signedUrl?: string;
        createdAt: string;
    }>>> {
        try {
            const { data, error } = await this.supabase
                .from('files')
                .select('*')
                .eq('context_id', assignmentId)
                .eq('context_type', contextType)
                .order('created_at', { ascending: false });

            if (error) {
                return { success: false, error: error.message };
            }

            if (!data || data.length === 0) {
                return { success: true, data: [] };
            }

            // Generate signed URLs for each file
            const filesWithUrls = await Promise.all(
                data.map(async (file: any) => {
                    const urlResult = await this.getSignedUrl(file.file_path, 3600);
                    return {
                        id: file.id,
                        fileName: file.file_name,
                        filePath: file.file_path,
                        fileSize: file.file_size,
                        mimeType: file.mime_type || 'application/octet-stream',
                        signedUrl: urlResult.success ? urlResult.data : undefined,
                        createdAt: file.created_at,
                    };
                })
            );

            return { success: true, data: filesWithUrls };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error fetching files',
            };
        }
    }
}

export const fileUploadService = FileUploadService.getInstance();

// Also export as fileService for backward compatibility
export const fileService = fileUploadService;
