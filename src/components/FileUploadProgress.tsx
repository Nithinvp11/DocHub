'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X, CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface FileUploadProgressProps {
  files: FileUploadItem[];
  onCancel?: (fileId: string) => void;
  onRetry?: (fileId: string) => void;
  onDismiss?: (fileId: string) => void;
}

export function FileUploadProgress({
  files,
  onCancel,
  onRetry,
  onDismiss,
}: FileUploadProgressProps) {
  if (files.length === 0) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 overflow-y-auto space-y-2 z-50">
      {files.map((file) => (
        <Card key={file.id} className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="mt-1">
                {file.status === 'uploading' && (
                  <Upload className="h-5 w-5 text-blue-500 animate-pulse" />
                )}
                {file.status === 'success' && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                {file.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    {file.status === 'uploading' && onCancel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCancel(file.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {file.status === 'success' && onDismiss && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDismiss(file.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {file.status === 'error' && onRetry && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRetry(file.id)}
                        className="h-6 px-2 text-xs"
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {file.status === 'uploading' && (
                  <div className="mt-2">
                    <Progress value={file.progress} className="h-1" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {file.progress}% uploaded
                    </p>
                  </div>
                )}

                {/* Success Message */}
                {file.status === 'success' && (
                  <p className="text-xs text-green-600 mt-1">
                    Upload complete!
                  </p>
                )}

                {/* Error Message */}
                {file.status === 'error' && (
                  <p className="text-xs text-destructive mt-1">
                    {file.error || 'Upload failed'}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Hook for managing file uploads
export function useFileUpload() {
  const [files, setFiles] = React.useState<FileUploadItem[]>([]);

  const addFile = (file: File) => {
    const newFile: FileUploadItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading',
    };
    setFiles((prev) => [...prev, newFile]);
    return newFile.id;
  };

  const updateProgress = (fileId: string, progress: number) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, progress: Math.min(100, progress) } : f
      )
    );
  };

  const setSuccess = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: 'success' as const, progress: 100 } : f
      )
    );
  };

  const setError = (fileId: string, error: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: 'error' as const, error } : f
      )
    );
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const clearAll = () => {
    setFiles([]);
  };

  return {
    files,
    addFile,
    updateProgress,
    setSuccess,
    setError,
    removeFile,
    clearAll,
  };
}
