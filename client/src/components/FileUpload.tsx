import React, { useState } from 'react';
import axios from 'axios';
import './FileUpload.css';

interface FileUploadProps {
  onFileUploaded: (fileData: any) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls', '.json'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExt)) {
      setError('仅支持 CSV, Excel (xlsx/xls), 和 JSON 文件');
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onFileUploaded(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error || '文件上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="file-upload">
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="upload-loading">
            <div className="spinner"></div>
            <p>正在上传文件...</p>
          </div>
        ) : (
          <>
            <div className="upload-icon">📁</div>
            <p className="upload-text">
              拖拽文件到此处，或者 <label htmlFor="fileInput" className="upload-link">点击选择文件</label>
            </p>
            <p className="upload-hint">支持 CSV, Excel (.xlsx/.xls), JSON 格式</p>
            <input
              id="fileInput"
              type="file"
              accept=".csv,.xlsx,.xls,.json"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </>
        )}
      </div>
      
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;