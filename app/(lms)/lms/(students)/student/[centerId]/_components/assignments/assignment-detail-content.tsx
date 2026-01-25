'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    FileText,
    Paperclip,
    Download,
    Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Assignment, AssignmentSubmission } from '@/lib/branch-system/types/assignment.types';
import { formatFileSize } from '@/lib/branch-system/assignment';
import { fileUploadService } from '@/lib/branch-system/services/file-upload.service';
import { showErrorToast } from '@/lib/toast';
import { AssignmentInstructions } from './assignment-instructions';

interface FileData {
    id: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    signedUrl?: string;
}

export interface AssignmentDetailContentProps {
    assignment: Assignment;
    submission: AssignmentSubmission | null;
}

export function AssignmentDetailContent({
    assignment,
    submission,
}: AssignmentDetailContentProps) {
    const [instructionFiles, setInstructionFiles] = useState<FileData[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

    // Fetch instruction files
    useEffect(() => {
        if (assignment?.id) {
            setLoadingFiles(true);
            fileUploadService
                .getFilesByAssignmentId(assignment.id, 'assignment_instruction')
                .then((result) => {
                    if (result.success && result.data) {
                        setInstructionFiles(result.data);
                    }
                })
                .finally(() => setLoadingFiles(false));
        }
    }, [assignment?.id]);

    const handleFileDownload = async (file: FileData) => {
        try {
            setDownloadingFile(file.id);

            let downloadUrl = file.signedUrl;

            if (!downloadUrl) {
                const result = await fileUploadService.getSignedUrl(file.filePath, 3600);
                if (!result.success || !result.data) {
                    showErrorToast('Failed to prepare file for download');
                    return;
                }
                downloadUrl = result.data;
            }

            // Create download link
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = file.fileName;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download error:', error);
            showErrorToast('Failed to download file');
        } finally {
            setDownloadingFile(null);
        }
    };

    const handleFilePreview = async (file: FileData) => {
        try {
            let previewUrl = file.signedUrl;

            if (!previewUrl) {
                const result = await fileUploadService.getSignedUrl(file.filePath, 3600);
                if (!result.success || !result.data) {
                    showErrorToast('Failed to prepare file for preview');
                    return;
                }
                previewUrl = result.data;
            }

            window.open(previewUrl, '_blank');
        } catch (error) {
            console.error('Preview error:', error);
            showErrorToast('Failed to preview file');
        }
    };

    // Get file icon based on mime type
    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
        if (mimeType.includes('zip') || mimeType.includes('compressed')) return '📦';
        return '📎';
    };

    return (
        <div className="space-y-6">
            {/* Description */}
            {assignment.description && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Description
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                            {assignment.description}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Instructions - Using separate component */}
            {assignment.instructions && (
                <AssignmentInstructions
                    instructions={assignment.instructions}
                    isMarkdown={true}
                    defaultExpanded={true}
                />
            )}

            {/* Attached Files */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Paperclip className="h-5 w-5" />
                        Attached Files
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loadingFiles ? (
                        <div className="space-y-3">
                            {[1, 2].map((i) => (
                                <Skeleton key={i} className="h-16 rounded-lg" />
                            ))}
                        </div>
                    ) : instructionFiles.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No files attached to this assignment
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {instructionFiles.map((file) => (
                                <div
                                    key={file.id}
                                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">{file.fileName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatFileSize(file.fileSize)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {/* Preview Button (for images and PDFs) */}
                                        {(file.mimeType.startsWith('image/') || file.mimeType.includes('pdf')) && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleFilePreview(file)}
                                                title="Preview"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {/* Download Button */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleFileDownload(file)}
                                            disabled={downloadingFile === file.id}
                                            title="Download"
                                        >
                                            <Download className={cn(
                                                'h-4 w-4',
                                                downloadingFile === file.id && 'animate-pulse'
                                            )} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Rubric (if visible to students) */}
            {assignment.show_rubric_to_students && assignment.grading_rubric && assignment.grading_rubric.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            📋 Grading Rubric
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {assignment.grading_rubric.map((item, index) => (
                                <div key={item.id || index} className="p-3 rounded-lg border">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-medium">{item.criteria}</p>
                                            {item.description && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-sm font-semibold text-primary shrink-0">
                                            {item.max_points} pts
                                        </span>
                                    </div>
                                    {item.levels && item.levels.length > 0 && (
                                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                            {item.levels.map((level, levelIndex) => (
                                                <div
                                                    key={levelIndex}
                                                    className="p-2 rounded bg-muted/50 text-xs"
                                                >
                                                    <p className="font-medium">{level.level} ({level.points} pts)</p>
                                                    <p className="text-muted-foreground mt-0.5">
                                                        {level.description}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Feedback (if graded) */}
            {submission?.feedback && (
                <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-400">
                            💬 Teacher Feedback
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap">{submission.feedback}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}