"use client";

import * as React from "react";
import { Upload, File, X, AlertCircle } from "lucide-react";
import { cn } from "../ui/utils";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";

interface FileUploadProps {
  onFilesChange?: (files: File[]) => void;
  onFileUpload?: (file: File) => Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export function FileUpload({
  onFilesChange,
  onFileUpload,
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  disabled = false,
  className,
  children
}: FileUploadProps) {
  const [files, setFiles] = React.useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | undefined => {
    if (file.size > maxSize) {
      return `File size exceeds ${formatFileSize(maxSize)}`;
    }
    return undefined;
  };

  const handleFiles = (fileList: FileList) => {
    const newFiles = Array.from(fileList);
    
    if (!multiple && newFiles.length > 1) {
      newFiles.splice(1);
    }
    
    if (files.length + newFiles.length > maxFiles) {
      return;
    }

    const validFiles: UploadedFile[] = [];
    
    newFiles.forEach(file => {
      const error = validateFile(file);
      validFiles.push({
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        status: error ? 'error' : 'pending',
        error
      });
    });

    const updatedFiles = multiple ? [...files, ...validFiles] : validFiles;
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles.map(f => f.file));

    // Auto-upload if onFileUpload is provided
    if (onFileUpload) {
      validFiles.forEach(uploadedFile => {
        if (uploadedFile.status === 'pending') {
          uploadFile(uploadedFile);
        }
      });
    }
  };

  const uploadFile = async (uploadedFile: UploadedFile) => {
    if (!onFileUpload) return;

    setFiles(prev => prev.map(f => 
      f.id === uploadedFile.id 
        ? { ...f, status: 'uploading' as const, progress: 0 }
        : f
    ));

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id && f.progress < 90
            ? { ...f, progress: f.progress + 10 }
            : f
        ));
      }, 100);

      await onFileUpload(uploadedFile.file);
      
      clearInterval(progressInterval);
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'completed' as const, progress: 100 }
          : f
      ));
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'error' as const, error: error instanceof Error ? error.message : 'Upload failed' }
          : f
      ));
    }
  };

  const removeFile = (id: string) => {
    const updatedFiles = files.filter(f => f.id !== id);
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles.map(f => f.file));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          "relative rounded-lg border-2 border-dashed border-[var(--border-default)] p-6 text-center transition-colors cursor-pointer",
          isDragOver && !disabled && "border-[var(--primary)] bg-[var(--primary-tint-10)]",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "hover:border-[var(--primary)] hover:bg-[var(--primary-tint-10)]/30"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        
        {children || (
          <div className="space-y-3">
            <Upload size={32} className="mx-auto text-[color:var(--text-secondary)]" />
            <div>
              <p className="text-sm font-medium text-[color:var(--text-primary)]">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-[color:var(--text-secondary)]">
                {accept ? `Accepts: ${accept}` : 'Any file type'} • Max {formatFileSize(maxSize)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadedFile) => (
            <div
              key={uploadedFile.id}
              className="flex items-center gap-3 p-3 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg"
            >
              <File size={16} className="text-[color:var(--text-secondary)] flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[color:var(--text-primary)] truncate">
                    {uploadedFile.file.name}
                  </p>
                  <span className="text-xs text-[color:var(--text-secondary)]">
                    {formatFileSize(uploadedFile.file.size)}
                  </span>
                </div>
                
                {uploadedFile.status === 'uploading' && (
                  <Progress value={uploadedFile.progress} className="mt-2 h-1" />
                )}
                
                {uploadedFile.status === 'error' && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle size={12} className="text-[color:var(--error)]" />
                    <span className="text-xs text-[color:var(--error)]">{uploadedFile.error}</span>
                  </div>
                )}
                
                {uploadedFile.status === 'completed' && (
                  <span className="text-xs text-[color:var(--success)]">Upload complete</span>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(uploadedFile.id)}
                className="text-[color:var(--text-secondary)] hover:text-[color:var(--error)]"
              >
                <X size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type { FileUploadProps, UploadedFile };