const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// 上传文件的存储目录
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// 上传文件存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // 保留原始文件名，添加时间戳避免冲突
    const timestamp = Date.now();
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    // 安全：只取文件名本身，去掉客户端可能塞进来的路径部分，防止路径穿越
    const safeName = path.basename(originalName).replace(/[\\/]/g, '') || 'unnamed';
    cb(null, `${timestamp}_${safeName}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 限制 500MB
});

// 安全：把 URL 参数里的文件名收敛为 uploads 目录内的安全路径，防止 ../ 路径穿越
function resolveUploadPath(name) {
  const filename = path.basename(String(name || ''));
  const filepath = path.join(UPLOAD_DIR, filename);
  if (!filename || !filepath.startsWith(UPLOAD_DIR + path.sep)) {
    return null;
  }
  return { filename, filepath };
}

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));
app.use('/files', express.static(UPLOAD_DIR));

// 获取本机 IP 地址
function getLocalIP() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// API: 获取文件列表
app.get('/api/files', (req, res) => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    return res.json([]);
  }
  
  fs.readdir(UPLOAD_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: '无法读取文件列表' });
    
    const fileList = files.map(filename => {
      const stats = fs.statSync(path.join(UPLOAD_DIR, filename));
      return {
        name: filename.replace(/^\d+_/, ''), // 移除时间戳前缀显示
        filename: filename,
        size: formatFileSize(stats.size),
        sizeBytes: stats.size,
        uploadTime: stats.mtime.toLocaleString('zh-CN')
      };
    }).reverse(); // 最新的在前
    
    res.json(fileList);
  });
});

// API: 上传文件
app.post('/api/upload', upload.array('files'), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: '没有文件被上传' });
  }
  res.json({ 
    success: true, 
    message: `成功上传 ${req.files.length} 个文件`,
    files: req.files.map(f => f.originalname)
  });
});

// API: 删除文件
app.delete('/api/files/:filename', (req, res) => {
  const target = resolveUploadPath(req.params.filename);
  if (!target) {
    return res.status(400).json({ error: '非法文件名' });
  }

  fs.unlink(target.filepath, (err) => {
    if (err) return res.status(500).json({ error: '删除失败' });
    res.json({ success: true, message: '删除成功' });
  });
});

// API: 下载文件
app.get('/api/download/:filename', (req, res) => {
  const target = resolveUploadPath(req.params.filename);
  if (!target) {
    return res.status(400).json({ error: '非法文件名' });
  }

  if (!fs.existsSync(target.filepath)) {
    return res.status(404).json({ error: '文件不存在' });
  }
  
  const displayName = target.filename.replace(/^\d+_/, '');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(displayName)}`);
  res.sendFile(target.filepath);
});

// ==================== 文本共享功能 ====================

const TEXT_FILE = path.join(__dirname, 'shared-text.txt');

// API: 获取共享文本
app.get('/api/text', (req, res) => {
  try {
    if (fs.existsSync(TEXT_FILE)) {
      const content = fs.readFileSync(TEXT_FILE, 'utf8');
      const stats = fs.statSync(TEXT_FILE);
      res.json({
        content: content,
        lastModified: stats.mtime.toISOString(),
        exists: true
      });
    } else {
      res.json({
        content: '',
        lastModified: null,
        exists: false
      });
    }
  } catch (err) {
    res.status(500).json({ error: '无法读取文本' });
  }
});

// API: 保存共享文本
app.post('/api/text', express.json(), (req, res) => {
  try {
    const { content } = req.body;
    fs.writeFileSync(TEXT_FILE, content || '', 'utf8');
    res.json({
      success: true,
      message: '文本已保存',
      lastModified: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: '保存失败: ' + err.message });
  }
});

// API: 删除共享文本
app.delete('/api/text', (req, res) => {
  try {
    if (fs.existsSync(TEXT_FILE)) {
      fs.unlinkSync(TEXT_FILE);
    }
    res.json({ success: true, message: '文本已清空' });
  } catch (err) {
    res.status(500).json({ error: '删除失败' });
  }
});

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 启动服务器
app.listen(PORT, () => {
  const ip = getLocalIP();
  console.log('\n========================================');
  console.log('  🚀 文件中转站已启动！');
  console.log('========================================');
  console.log(`\n  📱 手机/其他设备请访问:`);
  console.log(`     http://${ip}:${PORT}`);
  console.log(`\n  💻 本机访问:`);
  console.log(`     http://localhost:${PORT}`);
  console.log(`     http://${ip}:${PORT}`);
  console.log('\n  按 Ctrl+C 停止服务器');
  console.log('========================================\n');
});

module.exports = app;
