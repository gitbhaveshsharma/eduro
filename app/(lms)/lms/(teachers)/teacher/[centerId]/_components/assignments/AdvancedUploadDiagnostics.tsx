"use client";

import { useState } from "react";
import { fileService } from "@/lib/branch-system/services/file-upload.service";
import type { AssignmentFile } from "@/lib/branch-system/types/assignment.types";

export default function FileServiceTest() {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<AssignmentFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Test assignment ID from your database
    const ASSIGNMENT_ID = "f910623a-3aa6-4f51-ae4f-1c96bd0a9622";

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
            setError(null);
            setSuccess(null);
        }
    };

    const handleSingleUpload = async () => {
        if (selectedFiles.length === 0) {
            setError("Please select a file first");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        const result = await fileService.uploadFile({
            file: selectedFiles[0],
            assignmentId: ASSIGNMENT_ID,
            uploadType: 'temp_instruction', // For testing purposes, use temp upload
        });

        setLoading(false);

        if (result.success && result.data) {
            setSuccess(`File uploaded successfully: ${result.data.fileName}`);
            setUploadedFiles([...uploadedFiles, result.data]);
            setSelectedFiles([]);
        } else {
            setError(result.error || "Upload failed");
        }
    };

    const handleMultipleUpload = async () => {
        if (selectedFiles.length === 0) {
            setError("Please select files first");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        const result = await fileService.uploadFiles({
            files: selectedFiles,
            assignmentId: ASSIGNMENT_ID,
            uploadType: 'temp_instruction', // For testing purposes, use temp upload
        });

        setLoading(false);

        if (result.success && result.data) {
            setSuccess(
                `${result.data.length} file(s) uploaded successfully${result.error ? `. ${result.error}` : ""
                }`
            );
            setUploadedFiles([...uploadedFiles, ...result.data]);
            setSelectedFiles([]);
        } else {
            setError(result.error || "Upload failed");
        }
    };

    const handleDelete = async (fileId: string) => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const result = await fileService.deleteFile(fileId);

        setLoading(false);

        if (result.success) {
            setSuccess("File deleted successfully");
            setUploadedFiles(uploadedFiles.filter((f) => f.id !== fileId));
        } else {
            setError(result.error || "Delete failed");
        }
    };

    const handleGetSignedUrl = async (filePath: string) => {
        const result = await fileService.getSignedUrl(filePath);

        if (result.success && result.data) {
            window.open(result.data, "_blank");
        } else {
            setError(result.error || "Failed to get signed URL");
        }
    };

    const handleDownload = async (filePath: string, fileName: string) => {
        setLoading(true);
        setError(null);

        const result = await fileService.downloadFile(filePath);

        setLoading(false);

        if (result.success && result.data) {
            // Create download link
            const url = URL.createObjectURL(result.data);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setSuccess("File downloaded successfully");
        } else {
            setError(result.error || "Download failed");
        }
    };

    const loadFilesByIds = async () => {
        if (uploadedFiles.length === 0) {
            setError("No files to load");
            return;
        }

        setLoading(true);
        setError(null);

        const fileIds = uploadedFiles.map((f) => f.id);
        const result = await fileService.getFilesByIds(fileIds);

        setLoading(false);

        if (result.success && result.data) {
            setSuccess(`Loaded ${result.data.length} file(s)`);
            console.log("Files:", result.data);
        } else {
            setError(result.error || "Failed to load files");
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold mb-4">File Service Test</h1>
                <p className="text-gray-600 mb-2">
                    Testing assignment ID: <code className="bg-gray-100 px-2 py-1 rounded">{ASSIGNMENT_ID}</code>
                </p>

                {/* Alerts */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                        {success}
                    </div>
                )}

                {/* File Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Files
                    </label>
                    <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.txt,.rtf,.jpg,.jpeg,.png,.gif,.xls,.xlsx,.csv,.ppt,.pptx,.zip"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        disabled={loading}
                    />
                    {selectedFiles.length > 0 && (
                        <p className="mt-2 text-sm text-gray-600">
                            {selectedFiles.length} file(s) selected
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <button
                        onClick={handleSingleUpload}
                        disabled={loading || selectedFiles.length === 0}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Upload First File
                    </button>
                    <button
                        onClick={handleMultipleUpload}
                        disabled={loading || selectedFiles.length === 0}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Upload All Files
                    </button>
                    <button
                        onClick={loadFilesByIds}
                        disabled={loading || uploadedFiles.length === 0}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Reload Files
                    </button>
                </div>

                {loading && (
                    <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Processing...</p>
                    </div>
                )}
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4">Uploaded Files ({uploadedFiles.length})</h2>
                    <div className="space-y-3">
                        {uploadedFiles.map((file) => (
                            <div
                                key={file.id}
                                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">{file.file_name}</h3>
                                        <p className="text-sm text-gray-500">
                                            Size: {formatFileSize(file.file_size)} | Type: {file.file_type}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Path: {file.file_path}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            ID: {file.id}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => handleGetSignedUrl(file.file_path)}
                                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => handleDownload(file.file_path, file.file_name)}
                                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                                        >
                                            Download
                                        </button>
                                        <button
                                            onClick={() => handleDelete(file.id)}
                                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Test Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Test Features:</h3>
                <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                    <li>Single file upload with automatic user detection</li>
                    <li>Multiple file upload with partial success handling</li>
                    <li>File deletion with authorization check</li>
                    <li>Signed URL generation for viewing files</li>
                    <li>File download functionality</li>
                    <li>Load files by IDs</li>
                    <li>File size validation (100MB limit)</li>
                    <li>MIME type validation</li>
                </ul>
            </div>
        </div>
    );
}