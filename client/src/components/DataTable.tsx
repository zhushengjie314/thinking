import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DataTable.css';

interface DataTableProps {
  fileId: string;
  refreshKey: number;
}

const DataTable: React.FC<DataTableProps> = ({ fileId, refreshKey }) => {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/data/${fileId}`);
        setData(response.data.data);
        setColumns(response.data.columns);
        setCurrentPage(1);
        setError(null);
      } catch (error: any) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fileId, refreshKey]);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await axios.get(`/api/export/${fileId}?format=${format}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cleaned_data.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="data-table-loading">
        <div className="spinner"></div>
        <p>加载数据中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="data-table-error">
        <p>❌ {error}</p>
      </div>
    );
  }

  return (
    <div className="data-table">
      <div className="table-header">
        <h3>数据预览 ({data.length} 行)</h3>
        <div className="export-buttons">
          <button onClick={() => handleExport('csv')} className="export-btn">
            导出 CSV
          </button>
          <button onClick={() => handleExport('json')} className="export-btn">
            导出 JSON
          </button>
        </div>
      </div>
      
      {data.length === 0 ? (
        <div className="empty-state">
          <p>暂无数据</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table-content">
              <thead>
                <tr>
                  {columns.map((column, index) => (
                    <th key={index}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} title={String(row[column] || '')}>
                        {row[column] !== null && row[column] !== undefined 
                          ? String(row[column]) 
                          : <span className="null-value">NULL</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                上一页
              </button>
              <span className="pagination-info">
                第 {currentPage} 页，共 {totalPages} 页
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DataTable;