import './DataStats.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface DataStatsProps {
  fileId: string;
  refreshKey: number;
}

interface ColumnStats {
  totalValues: number;
  nonNullValues: number;
  nullValues: number;
  uniqueValues: number;
  dataType: string;
}

interface Stats {
  current: {
    rowCount: number;
    columnCount: number;
    columns: string[];
  };
  original: {
    rowCount: number;
    columnCount: number;
  };
  columnStats: { [key: string]: ColumnStats };
}

const DataStats: React.FC<DataStatsProps> = ({ fileId, refreshKey }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/stats/${fileId}`);
        setStats(response.data);
        setError(null);
      } catch (error: any) {
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [fileId, refreshKey]);

  if (loading) {
    return (
      <div className="stats-loading">
        <div className="spinner"></div>
        <p>加载统计信息...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="stats-error">
        <p>❌ {error}</p>
      </div>
    );
  }

  const getDataTypeIcon = (type: string) => {
    switch (type) {
      case 'number': return '🔢';
      case 'date': return '📅';
      case 'text': return '📝';
      default: return '❓';
    }
  };

  const getDataTypeColor = (type: string) => {
    switch (type) {
      case 'number': return '#28a745';
      case 'date': return '#17a2b8';
      case 'text': return '#6f42c1';
      default: return '#6c757d';
    }
  };

  return (
    <div className="data-stats">
      <h3>数据统计</h3>
      
      {/* Overall Statistics */}
      <div className="stats-section">
        <h4>总体信息</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">当前行数</span>
            <span className="stat-value">{stats.current.rowCount.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">原始行数</span>
            <span className="stat-value">{stats.original.rowCount.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">列数</span>
            <span className="stat-value">{stats.current.columnCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">清洗进度</span>
            <span className="stat-value">
              {stats.original.rowCount > 0 
                ? `${((stats.current.rowCount / stats.original.rowCount) * 100).toFixed(1)}%`
                : '0%'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Column Statistics */}
      <div className="stats-section">
        <h4>列统计</h4>
        <div className="column-stats">
          {Object.entries(stats.columnStats).map(([columnName, columnStats]) => (
            <div key={columnName} className="column-stat-item">
              <div className="column-header">
                <span className="column-name">{columnName}</span>
                <span 
                  className="data-type-badge"
                  style={{ backgroundColor: getDataTypeColor(columnStats.dataType) }}
                >
                  {getDataTypeIcon(columnStats.dataType)} {columnStats.dataType}
                </span>
              </div>
              
              <div className="column-details">
                <div className="detail-row">
                  <span>非空值:</span>
                  <span>{columnStats.nonNullValues.toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span>空值:</span>
                  <span className={columnStats.nullValues > 0 ? 'warning' : ''}>
                    {columnStats.nullValues.toLocaleString()}
                  </span>
                </div>
                <div className="detail-row">
                  <span>唯一值:</span>
                  <span>{columnStats.uniqueValues.toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span>完整率:</span>
                  <span>
                    {((columnStats.nonNullValues / columnStats.totalValues) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              {/* Completeness bar */}
              <div className="completeness-bar">
                <div 
                  className="completeness-fill"
                  style={{ 
                    width: `${(columnStats.nonNullValues / columnStats.totalValues) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataStats;
