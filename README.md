# 数据清洗平台 (Visual Data Cleaning Platform)

一个可视化的数据清洗平台，支持 CSV、Excel 和 JSON 文件的上传、预览、清洗和导出。

## 功能特性

### 文件支持
- ✅ CSV 文件 (.csv)
- ✅ Excel 文件 (.xlsx, .xls)  
- ✅ JSON 文件 (.json)

### 数据清洗操作
- 🔄 **去除重复数据** - 删除完全重复的行
- 🚫 **删除空行** - 移除完全为空的数据行
- 📝 **填充缺失值** - 为指定列的空值填充默认值
- ❌ **删除列** - 移除不需要的数据列
- ✏️ **重命名列** - 修改列名
- 🔍 **筛选数据** - 根据条件过滤数据行

### 数据可视化
- 📊 **数据统计** - 显示行数、列数、数据类型等信息
- 📈 **完整率分析** - 每列的数据完整度可视化
- 🔢 **数据类型检测** - 自动识别数字、文本、日期类型
- 📋 **实时预览** - 清洗过程中实时查看数据变化

### 导出功能
- 💾 **CSV 导出** - 清洗后的数据导出为 CSV 格式
- 📄 **JSON 导出** - 清洗后的数据导出为 JSON 格式

## 技术栈

### 前端
- **React 18** + **TypeScript** - 现代化的用户界面
- **Axios** - HTTP 请求处理
- **CSS-in-JS** - 组件样式管理

### 后端
- **Node.js** + **Express** - 服务器框架
- **Multer** - 文件上传处理
- **XLSX** - Excel 文件解析
- **CSV-Parser/Writer** - CSV 文件处理
- **Lodash** - 数据处理工具

## 安装和运行

### 前置要求
- Node.js 16+ 
- npm 或 yarn

### 安装依赖
```bash
# 安装所有依赖
npm run install-all
```

### 开发模式
```bash
# 同时启动前端和后端开发服务器
npm run dev
```

### 生产模式
```bash
# 构建前端
npm run build

# 启动生产服务器
npm start
```

## 使用方法

1. **上传文件**
   - 拖拽文件到上传区域，或点击选择文件
   - 支持 CSV、Excel、JSON 格式

2. **查看数据**
   - 系统自动解析并显示数据预览
   - 右侧面板显示数据表格
   - 左侧面板显示统计信息

3. **清洗数据**
   - 使用左侧面板的清洗工具
   - 每次操作后数据会实时更新
   - 查看统计信息了解清洗效果

4. **导出结果**
   - 点击导出按钮下载清洗后的数据
   - 支持 CSV 和 JSON 格式

## 项目结构

```
thinking/
├── server/                 # 后端代码
│   ├── index.js           # Express 服务器
│   └── uploads/           # 文件上传目录
├── client/                # 前端代码
│   ├── src/
│   │   ├── components/    # React 组件
│   │   │   ├── FileUpload.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── DataCleaning.tsx
│   │   │   └── DataStats.tsx
│   │   ├── App.tsx       # 主应用组件
│   │   └── index.tsx     # 入口文件
│   └── public/           # 静态资源
├── package.json          # 项目配置
└── README.md            # 项目文档
```

## API 接口

### POST /api/upload
上传数据文件

### GET /api/data/:fileId  
获取文件数据

### POST /api/clean/:fileId
执行数据清洗操作

### GET /api/stats/:fileId
获取数据统计信息

### GET /api/export/:fileId
导出清洗后的数据

## 贡献

欢迎提交 Issues 和 Pull Requests 来改进这个项目！

## 许可证

MIT License