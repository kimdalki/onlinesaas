import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import './UploadCard.css';

interface UploadCardProps {
    onFileSelect: (file: File) => void;
    isUploading: boolean;
}

const UploadCard: React.FC<UploadCardProps> = ({ onFileSelect, isUploading }) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onFileSelect(acceptedFiles[0]);
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/dxf': ['.dxf'],
            'application/x-dxf': ['.dxf'],
            'image/vnd.dxf': ['.dxf'],
            'application/dwg': ['.dwg'],
            'application/x-dwg': ['.dwg'],
            'application/step': ['.step', '.stp'],
            'application/vnd.step': ['.step', '.stp'],
        },
        multiple: false,
        disabled: isUploading,
    });

    return (
        <div
            {...getRootProps()}
            className={`upload-dropzone ${isDragActive ? 'active' : ''} ${isUploading ? 'disabled' : ''}`}
        >
            <input {...getInputProps()} />
            {isUploading ? (
                <div className="upload-loading">
                    <div className="upload-spinner"></div>
                    <p>Uploading...</p>
                </div>
            ) : (
                <div className="upload-content">
                    <div className="upload-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="12" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points="9,15 12,12 15,15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <p className="upload-text">
                        DROP FILES OR <span className="upload-link">UPLOAD</span>
                    </p>
                    <p className="upload-hint">.dxf, .dwg, .ai, .eps, .step, or .stp</p>
                </div>
            )}
        </div>
    );
};

export default UploadCard;
