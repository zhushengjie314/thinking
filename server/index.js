const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const _ = require('lodash');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.csv', '.xlsx', '.xls', '.json'];
        const fileExt = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(fileExt)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only CSV, Excel, and JSON files are allowed.'));
        }
    }
});

// Store uploaded data in memory (in production, use a database)
let uploadedData = {};

// Helper function to parse different file types
function parseFile(filePath, originalName) {
    const extension = path.extname(originalName).toLowerCase();
    
    return new Promise((resolve, reject) => {
        try {
            if (extension === '.json') {
                const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                resolve(Array.isArray(jsonData) ? jsonData : [jsonData]);
            } else if (extension === '.xlsx' || extension === '.xls') {
                const workbook = XLSX.readFile(filePath);
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(worksheet);
                resolve(data);
            } else if (extension === '.csv') {
                const results = [];
                fs.createReadStream(filePath)
                    .pipe(csv())
                    .on('data', (data) => results.push(data))
                    .on('end', () => resolve(results))
                    .on('error', reject);
            } else {
                reject(new Error('Unsupported file type'));
            }
        } catch (error) {
            reject(error);
        }
    });
}

// API Routes

// Upload file
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileId = req.file.filename;
        const data = await parseFile(req.file.path, req.file.originalname);
        
        // Store data with metadata
        uploadedData[fileId] = {
            originalName: req.file.originalname,
            data: data,
            originalData: _.cloneDeep(data), // Keep original for comparison
            columns: data.length > 0 ? Object.keys(data[0]) : [],
            rowCount: data.length,
            uploadTime: new Date()
        };

        res.json({
            fileId: fileId,
            originalName: req.file.originalname,
            rowCount: data.length,
            columns: data.length > 0 ? Object.keys(data[0]) : [],
            preview: data.slice(0, 5) // Return first 5 rows as preview
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get data
app.get('/api/data/:fileId', (req, res) => {
    const { fileId } = req.params;
    const fileData = uploadedData[fileId];
    
    if (!fileData) {
        return res.status(404).json({ error: 'File not found' });
    }
    
    res.json(fileData);
});

// Data cleaning operations
app.post('/api/clean/:fileId', (req, res) => {
    const { fileId } = req.params;
    const { operation, parameters } = req.body;
    const fileData = uploadedData[fileId];
    
    if (!fileData) {
        return res.status(404).json({ error: 'File not found' });
    }
    
    let cleanedData = _.cloneDeep(fileData.data);
    
    try {
        switch (operation) {
            case 'removeDuplicates':
                cleanedData = _.uniqBy(cleanedData, parameters.columns || undefined);
                break;
                
            case 'removeNullRows':
                cleanedData = cleanedData.filter(row => {
                    return Object.values(row).some(value => 
                        value !== null && value !== undefined && value !== '');
                });
                break;
                
            case 'fillMissingValues':
                const { column, fillValue } = parameters;
                cleanedData = cleanedData.map(row => ({
                    ...row,
                    [column]: row[column] === null || row[column] === undefined || row[column] === '' 
                        ? fillValue : row[column]
                }));
                break;
                
            case 'removeColumn':
                const { columnToRemove } = parameters;
                cleanedData = cleanedData.map(row => {
                    const newRow = { ...row };
                    delete newRow[columnToRemove];
                    return newRow;
                });
                break;
                
            case 'renameColumn':
                const { oldName, newName } = parameters;
                cleanedData = cleanedData.map(row => {
                    const newRow = { ...row };
                    if (oldName in newRow) {
                        newRow[newName] = newRow[oldName];
                        delete newRow[oldName];
                    }
                    return newRow;
                });
                break;
                
            case 'filterRows':
                const { column: filterColumn, operator, value } = parameters;
                cleanedData = cleanedData.filter(row => {
                    const cellValue = row[filterColumn];
                    switch (operator) {
                        case 'equals':
                            return cellValue == value;
                        case 'contains':
                            return String(cellValue).includes(value);
                        case 'greaterThan':
                            return Number(cellValue) > Number(value);
                        case 'lessThan':
                            return Number(cellValue) < Number(value);
                        default:
                            return true;
                    }
                });
                break;
                
            default:
                return res.status(400).json({ error: 'Unknown operation' });
        }
        
        // Update stored data
        uploadedData[fileId].data = cleanedData;
        uploadedData[fileId].columns = cleanedData.length > 0 ? Object.keys(cleanedData[0]) : [];
        uploadedData[fileId].rowCount = cleanedData.length;
        
        res.json({
            success: true,
            rowCount: cleanedData.length,
            columns: cleanedData.length > 0 ? Object.keys(cleanedData[0]) : [],
            preview: cleanedData.slice(0, 5)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get statistics
app.get('/api/stats/:fileId', (req, res) => {
    const { fileId } = req.params;
    const fileData = uploadedData[fileId];
    
    if (!fileData) {
        return res.status(404).json({ error: 'File not found' });
    }
    
    const { data, originalData } = fileData;
    const columns = data.length > 0 ? Object.keys(data[0]) : [];
    
    const stats = {
        current: {
            rowCount: data.length,
            columnCount: columns.length,
            columns: columns
        },
        original: {
            rowCount: originalData.length,
            columnCount: originalData.length > 0 ? Object.keys(originalData[0]).length : 0
        }
    };
    
    // Calculate column statistics
    stats.columnStats = {};
    columns.forEach(column => {
        const values = data.map(row => row[column]).filter(val => 
            val !== null && val !== undefined && val !== '');
        
        stats.columnStats[column] = {
            totalValues: data.length,
            nonNullValues: values.length,
            nullValues: data.length - values.length,
            uniqueValues: new Set(values).size,
            dataType: detectDataType(values)
        };
    });
    
    res.json(stats);
});

// Helper function to detect data type
function detectDataType(values) {
    if (values.length === 0) return 'empty';
    
    const sample = values.slice(0, Math.min(100, values.length));
    let numberCount = 0;
    let dateCount = 0;
    
    sample.forEach(value => {
        if (!isNaN(Number(value))) numberCount++;
        if (!isNaN(Date.parse(value))) dateCount++;
    });
    
    if (numberCount / sample.length > 0.8) return 'number';
    if (dateCount / sample.length > 0.8) return 'date';
    return 'text';
}

// Export cleaned data
app.get('/api/export/:fileId', (req, res) => {
    const { fileId } = req.params;
    const { format = 'csv' } = req.query;
    const fileData = uploadedData[fileId];
    
    if (!fileData) {
        return res.status(404).json({ error: 'File not found' });
    }
    
    const { data, originalName } = fileData;
    const baseName = path.basename(originalName, path.extname(originalName));
    
    if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${baseName}_cleaned.json"`);
        res.send(JSON.stringify(data, null, 2));
    } else {
        // CSV export
        if (data.length === 0) {
            return res.status(400).json({ error: 'No data to export' });
        }
        
        const columns = Object.keys(data[0]);
        const csvWriter = createCsvWriter({
            path: path.join(uploadsDir, `${baseName}_cleaned.csv`),
            header: columns.map(col => ({ id: col, title: col }))
        });
        
        csvWriter.writeRecords(data)
            .then(() => {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="${baseName}_cleaned.csv"`);
                const fileStream = fs.createReadStream(path.join(uploadsDir, `${baseName}_cleaned.csv`));
                fileStream.pipe(res);
            })
            .catch(error => {
                res.status(500).json({ error: error.message });
            });
    }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.listen(port, () => {
    console.log(`Data Cleaning Platform server running on port ${port}`);
});