import './DataCleaning.css';
import React, { useState } from 'react';
import axios from 'axios';

interface DataCleaningProps {
  fileId: string;
  onDataCleaned: () => void;
  columns: string[];
}

const DataCleaning: React.FC<DataCleaningProps> = ({ fileId, onDataCleaned, columns }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const cleanData = async (operation: string, parameters: any = {}) => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await axios.post(`/api/clean/${fileId}`, {
        operation,
        parameters
      });

      setMessage({
        type: 'success',
        text: `操作成功！当前数据行数: ${response.data.rowCount}`
      });
      onDataCleaned();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || '操作失败'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="data-cleaning">
      <h3>数据清洗操作</h3>
      
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="cleaning-operations">
        {/* Remove Duplicates */}
        <div className="operation-group">
          <h4>🔄 去除重复数据</h4>
          <button
            onClick={() => cleanData('removeDuplicates')}
            disabled={loading}
            className="operation-btn"
          >
            删除所有重复行
          </button>
        </div>

        {/* Remove Null Rows */}
        <div className="operation-group">
          <h4>🚫 删除空行</h4>
          <button
            onClick={() => cleanData('removeNullRows')}
            disabled={loading}
            className="operation-btn"
          >
            删除完全为空的行
          </button>
        </div>

        {/* Fill Missing Values */}
        <div className="operation-group">
          <h4>📝 填充缺失值</h4>
          <div className="operation-form">
            <select id="fillColumn" className="form-select">
              <option value="">选择列</option>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
            <input
              type="text"
              id="fillValue"
              placeholder="填充值"
              className="form-input"
            />
            <button
              onClick={() => {
                const columnSelect = document.getElementById('fillColumn') as HTMLSelectElement;
                const valueInput = document.getElementById('fillValue') as HTMLInputElement;
                
                if (columnSelect.value && valueInput.value) {
                  cleanData('fillMissingValues', {
                    column: columnSelect.value,
                    fillValue: valueInput.value
                  });
                }
              }}
              disabled={loading}
              className="operation-btn"
            >
              填充
            </button>
          </div>
        </div>

        {/* Remove Column */}
        <div className="operation-group">
          <h4>❌ 删除列</h4>
          <div className="operation-form">
            <select id="removeColumn" className="form-select">
              <option value="">选择要删除的列</option>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
            <button
              onClick={() => {
                const columnSelect = document.getElementById('removeColumn') as HTMLSelectElement;
                
                if (columnSelect.value) {
                  cleanData('removeColumn', {
                    columnToRemove: columnSelect.value
                  });
                }
              }}
              disabled={loading}
              className="operation-btn danger"
            >
              删除列
            </button>
          </div>
        </div>

        {/* Rename Column */}
        <div className="operation-group">
          <h4>✏️ 重命名列</h4>
          <div className="operation-form">
            <select id="renameOldColumn" className="form-select">
              <option value="">选择列</option>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
            <input
              type="text"
              id="renameNewColumn"
              placeholder="新列名"
              className="form-input"
            />
            <button
              onClick={() => {
                const oldColumnSelect = document.getElementById('renameOldColumn') as HTMLSelectElement;
                const newColumnInput = document.getElementById('renameNewColumn') as HTMLInputElement;
                
                if (oldColumnSelect.value && newColumnInput.value) {
                  cleanData('renameColumn', {
                    oldName: oldColumnSelect.value,
                    newName: newColumnInput.value
                  });
                }
              }}
              disabled={loading}
              className="operation-btn"
            >
              重命名
            </button>
          </div>
        </div>

        {/* Filter Rows */}
        <div className="operation-group">
          <h4>🔍 筛选数据</h4>
          <div className="operation-form">
            <select id="filterColumn" className="form-select">
              <option value="">选择列</option>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
            <select id="filterOperator" className="form-select">
              <option value="equals">等于</option>
              <option value="contains">包含</option>
              <option value="greaterThan">大于</option>
              <option value="lessThan">小于</option>
            </select>
            <input
              type="text"
              id="filterValue"
              placeholder="筛选值"
              className="form-input"
            />
            <button
              onClick={() => {
                const columnSelect = document.getElementById('filterColumn') as HTMLSelectElement;
                const operatorSelect = document.getElementById('filterOperator') as HTMLSelectElement;
                const valueInput = document.getElementById('filterValue') as HTMLInputElement;
                
                if (columnSelect.value && operatorSelect.value && valueInput.value) {
                  cleanData('filterRows', {
                    column: columnSelect.value,
                    operator: operatorSelect.value,
                    value: valueInput.value
                  });
                }
              }}
              disabled={loading}
              className="operation-btn"
            >
              筛选
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>处理中...</p>
        </div>
      )}
    </div>
  );
};

export default DataCleaning;
