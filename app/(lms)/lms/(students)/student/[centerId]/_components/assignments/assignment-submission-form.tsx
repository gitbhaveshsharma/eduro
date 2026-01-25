/**
 * Assignment Submission Form Component
 * 
 * Form for students to submit their assignment work
 * Supports both text and file submissions
 */

'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
    FileUp,
    Type,
    Send,
    Save,
    AlertCircle,
    CheckCircle2,
    Upload,
    X,
    File,
    Loader2,
} from 'lucide-react';
import type { Assignment, AssignmentSubmission } from '@/lib/branch-system/types/assignment.types';
import { AssignmentSubmissionType, formatFileSize, getDueDateStatus, formatDateTime } from '@/lib/branch-system/assignment';
import { fileUploadService } from '@/lib/branch-system/services/file-upload.service';
import { useAssignmentStore } from '@/lib/branch-system/stores/assignment.store';
import { showSuccessToast, showErrorToast, showLoadingToast } from '@/lib/toast';

export interface AssignmentSubmissionFormProps {
    assignment: Assignment;
    submission: AssignmentSubmission | null;
    studentId: string;
    classId: string;
    onSubmissionComplete: () => void;
}

export function AssignmentSubmissionForm({
    assignment,
    submission,
    studentId,
    classId,
    onSubmissionComplete,
}: AssignmentSubmissionFormProps) {
    const { submitAssignment, saveDraft } = useAssignmentStore();

    const [submissionText, setSubmissionText] = useState(submission?.submission_text || '');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadedFileId, setUploadedFileId] = useState<string | null>(submission?.submission_file_id || null);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);

    const dueDateStatus = assignment.due_date ? getDueDateStatus(assignment.due_date) : null;
    const isOverdue = dueDateStatus?.isOverdue || false;
    const canSubmit = !isOverdue || assignment.allow_late_submission;
    const isGraded = submission?.grading_status === 'MANUAL_GRADED' || submission?.grading_status === 'AUTO_GRADED';
    const hasSubmitted = submission?.is_final === true;

    // Handle file selection
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file size
        if (file.size > assignment.max_file_size) {
            showErrorToast(`File size exceeds ${formatFileSize(assignment.max_file_size)} limit`);
            return;
        }

        // Validate file extension
        if (assignment.allowed_extensions && assignment.allowed_extensions.length > 0) {
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            if (!fileExtension || !assignment.allowed_extensions.includes(fileExtension)) {
                showErrorToast(`File type not allowed. Allowed: ${assignment.allowed_extensions.join(', ')}`);
                return;
            }
        }

        setSelectedFile(file);
        setUploadedFileId(null);
        setUploadedFileName(null);
    };

    // Handle file upload
    const handleFileUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        const toastId = showLoadingToast('Uploading file...');

        try {
            const result = await fileUploadService.uploadFile({
                file: selectedFile,
                assignmentId: assignment.id,
                uploadType: 'submission',
                studentId: studentId,
            });

            if (result.success && result.data) {
                setUploadedFileId(result.data.id);
                setUploadedFileName(result.data.fileName);
                setSelectedFile(null);
                showSuccessToast('File uploaded successfully', { id: toastId });
            } else {
                showErrorToast(result.error || 'Failed to upload file', { id: toastId });
            }
        } catch (error) {
            console.error('Upload error:', error);
            showErrorToast('Failed to upload file', { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    // Handle file removal
    const handleFileRemove = async () => {
        if (uploadedFileId) {
            await fileUploadService.deleteFileById(uploadedFileId);
        }
        setUploadedFileId(null);
        setUploadedFileName(null);
        setSelectedFile(null);
    };

    // Handle save draft
    const handleSaveDraft = async () => {
        setIsSavingDraft(true);
        const toastId = showLoadingToast('Saving draft...');

        try {
            const success = await saveDraft({
                assignment_id: assignment.id,
                student_id: studentId,
                class_id: classId,
                submission_text: submissionText || undefined,
                submission_file_id: uploadedFileId || undefined,
            });

            if (success) {
                showSuccessToast('Draft saved successfully', { id: toastId });
            } else {
                showErrorToast('Failed to save draft', { id: toastId });
            }
        } catch (error) {
            console.error('Save draft error:', error);
            showErrorToast('Failed to save draft', { id: toastId });
        } finally {
            setIsSavingDraft(false);
        }
    };

    // Handle final submission
    const handleSubmit = async () => {
        // Validate submission
        if (assignment.submission_type === AssignmentSubmissionType.FILE && !uploadedFileId) {
            showErrorToast('Please upload a file to submit');
            return;
        }

        if (assignment.submission_type === AssignmentSubmissionType.TEXT && !submissionText.trim()) {
            showErrorToast('Please enter your submission text');
            return;
        }

        setIsSubmitting(true);
        const toastId = showLoadingToast('Submitting assignment...');

        try {
            const success = await submitAssignment({
                assignment_id: assignment.id,
                student_id: studentId,
                class_id: classId,
                submission_text: submissionText || undefined,
                submission_file_id: uploadedFileId || undefined,
                is_final: true,
            });

            if (success) {
                showSuccessToast('Assignment submitted successfully!', { id: toastId });
                onSubmissionComplete();
            } else {
                showErrorToast('Failed to submit assignment', { id: toastId });
            }
        } catch (error) {
            console.error('Submit error:', error);
            showErrorToast('Failed to submit assignment', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    // If already graded, show read-only view
    if (isGraded) {
        return (
            <Card className="border-green-200">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="h-5 w-5" />
                        Your Submission (Graded)
                    </CardTitle>
                    <CardDescription>
                        Submitted on {submission?.submitted_at && formatDateTime(submission.submitted_at, 'full')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {submission?.submission_text && (
                        <div className="p-4 rounded-lg bg-muted/50">
                            <p className="whitespace-pre-wrap">{submission.submission_text}</p>
                        </div>
                    )}
                    {submission?.submission_file && (
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 mt-3">
                            <File className="h-8 w-8 text-muted-foreground" />
                            <div>
                                <p className="font-medium">{submission.submission_file.file_name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatFileSize(submission.submission_file.file_size)}
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    // If already submitted (final) but not graded
    if (hasSubmitted) {
        return (
            <Card className="border-blue-200">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                        <CheckCircle2 className="h-5 w-5" />
                        Your Submission
                    </CardTitle>
                    <CardDescription>
                        Submitted on {submission?.submitted_at && formatDateTime(submission.submitted_at, 'full')}
                        {submission?.is_late && (
                            <span className="text-amber-600 ml-2">(Late submission)</span>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Your assignment has been submitted and is waiting to be graded.
                        </AlertDescription>
                    </Alert>
                    {submission?.submission_text && (
                        <div className="p-4 rounded-lg bg-muted/50">
                            <p className="whitespace-pre-wrap">{submission.submission_text}</p>
                        </div>
                    )}
                    {submission?.submission_file && (
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 mt-3">
                            <File className="h-8 w-8 text-muted-foreground" />
                            <div>
                                <p className="font-medium">{submission.submission_file.file_name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatFileSize(submission.submission_file.file_size)}
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    {assignment.submission_type === AssignmentSubmissionType.FILE ? (
                        <FileUp className="h-5 w-5" />
                    ) : (
                        <Type className="h-5 w-5" />
                    )}
                    Submit Your Work
                </CardTitle>
                <CardDescription>
                    {assignment.submission_type === AssignmentSubmissionType.FILE
                        ? 'Upload your file to submit this assignment'
                        : 'Enter your response in the text area below'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Overdue Warning */}
                {isOverdue && (
                    <Alert variant={assignment.allow_late_submission ? 'default' : 'destructive'}>
                        <AlertDescription>
                            {assignment.allow_late_submission
                                ? `This assignment is overdue. A ${assignment.late_penalty_percentage}% penalty will be applied.`
                                : 'This assignment is overdue and no longer accepts submissions.'}
                        </AlertDescription>
                    </Alert>
                )}

                {canSubmit && (
                    <>
                        {/* Text Submission */}
                        {assignment.submission_type === AssignmentSubmissionType.TEXT && (
                            <div className="space-y-2">
                                <Label htmlFor="submission-text">Your Response</Label>
                                <Textarea
                                    id="submission-text"
                                    placeholder="Enter your response here..."
                                    value={submissionText}
                                    onChange={(e) => setSubmissionText(e.target.value)}
                                    rows={10}
                                    className="resize-y"
                                />
                            </div>
                        )}

                        {/* File Submission */}
                        {assignment.submission_type === AssignmentSubmissionType.FILE && (
                            <div className="space-y-4">
                                {/* Uploaded File Display */}
                                {(uploadedFileId || selectedFile) && (
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                        <div className="flex items-center gap-3">
                                            <File className="h-8 w-8 text-primary" />
                                            <div>
                                                <p className="font-medium">
                                                    {uploadedFileName || selectedFile?.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {selectedFile && formatFileSize(selectedFile.size)}
                                                    {uploadedFileId && !selectedFile && (
                                                        <span className="text-green-600 flex items-center gap-1">
                                                            <CheckCircle2 className="h-3 w-3" /> Uploaded
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {selectedFile && !uploadedFileId && (
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={handleFileUpload}
                                                    disabled={isUploading}
                                                >
                                                    {isUploading ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Upload className="h-4 w-4" />
                                                    )}
                                                    Upload
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={handleFileRemove}
                                                disabled={isUploading}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* File Input */}
                                {!uploadedFileId && !selectedFile && (
                                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="hidden"
                                            onChange={handleFileSelect}
                                            accept={assignment.allowed_extensions?.map(ext => `.${ext}`).join(',')}
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className="cursor-pointer flex flex-col items-center"
                                        >
                                            <FileUp className="h-12 w-12 text-muted-foreground mb-2" />
                                            <p className="font-medium">Click to upload a file</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Max size: {formatFileSize(assignment.max_file_size)}
                                            </p>
                                            {assignment.allowed_extensions && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Allowed: {assignment.allowed_extensions.join(', ')}
                                                </p>
                                            )}
                                        </label>
                                    </div>
                                )}
                            </div>
                        )}

                        <Separator />

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                variant="outline"
                                onClick={handleSaveDraft}
                                disabled={isSavingDraft || isSubmitting}
                                className="flex-1"
                            >
                                {isSavingDraft ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                Save Draft
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={
                                    isSubmitting ||
                                    isSavingDraft ||
                                    (assignment.submission_type === AssignmentSubmissionType.FILE && !uploadedFileId) ||
                                    (assignment.submission_type === AssignmentSubmissionType.TEXT && !submissionText.trim())
                                }
                                className="flex-1"
                                loading={isSubmitting}
                                loadingText="Submitting..."
                            >
                                <Send className="h-4 w-4 mr-2" />
                                Submit Assignment
                            </Button>
                        </div>

                        {isOverdue && assignment.allow_late_submission && (
                            <p className="text-sm text-amber-600 text-center">
                                ⚠️ Your submission will be marked as late with a {assignment.late_penalty_percentage}% penalty.
                            </p>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
