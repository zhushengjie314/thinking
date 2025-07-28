import React, { useState } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import DataTable from './components/DataTable';
import DataCleaning from './components/DataCleaning';
import DataStats from './components/DataStats';

interface FileData {
  fileId: string;
  originalName: string;
  rowCount: number;
  columns: string[];
  preview: any[];
}

function App() {
  const [currentFile, setCurrentFile] = useState<FileData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFileUploaded = (fileData: FileData) => {
    setCurrentFile(fileData);
    setRefreshKey(prev => prev + 1);
  };

  const handleDataCleaned = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>数据清洗平台</h1>
        <p>Visual Data Cleaning Platform</p>
      </header>
      
      <main className="App-main">
        {!currentFile ? (
          <div className="upload-section">
            <h2>上传数据文件</h2>
            <p>支持 CSV, Excel (xlsx/xls), JSON 格式</p>
            <FileUpload onFileUploaded={handleFileUploaded} />
          </div>
        ) : (
          <div className="workspace">
            <div className="workspace-header">
              <h2>{currentFile.originalName}</h2>
              <button 
                className="new-file-btn"
                onClick={() => setCurrentFile(null)}
              >
                上传新文件
              </button>
            </div>
            
            <div className="workspace-content">
              <div className="left-panel">
                <DataStats fileId={currentFile.fileId} refreshKey={refreshKey} />
                <DataCleaning 
                  fileId={currentFile.fileId} 
                  onDataCleaned={handleDataCleaned}
                  columns={currentFile.columns}
                />
              </div>
              
              <div className="right-panel">
                <DataTable fileId={currentFile.fileId} refreshKey={refreshKey} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

export default App;
