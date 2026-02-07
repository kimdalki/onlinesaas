import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import './FileUploader.css';

const FileUploader = ({ onFileLoaded }) => {
    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target.result;
            onFileLoaded(content, file.name);
        };

        reader.onerror = () => {
            alert('파일을 읽는 중 오류가 발생했습니다.');
        };

        reader.readAsText(file);
    }, [onFileLoaded]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/dxf': ['.dxf'],
            'image/vnd.dxf': ['.dxf'],
            'text/plain': ['.dxf']
        },
        multiple: false
    });

    return (
        <div
            {...getRootProps()}
            className={`file-uploader ${isDragActive ? 'drag-active' : ''}`}
        >
            <input {...getInputProps()} />
            <div className="upload-icon">📁</div>
            {isDragActive ? (
                <p className="upload-text">파일을 여기에 놓으세요...</p>
            ) : (
                <>
                    <p className="upload-text">DXF 파일을 드래그 앤 드롭하거나</p>
                    <p className="upload-text-sub">클릭하여 파일을 선택하세요</p>
                </>
            )}
        </div>
    );
};

export default FileUploader;
