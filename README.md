# Markdown查看器

一个简单的Web应用，用于浏览和显示Markdown文件内容。

## 功能特点

- 浏览文件夹和Markdown文件
- 渲染Markdown内容为HTML
- 支持代码高亮
- 响应式设计，适应不同屏幕大小
- 支持新建和编辑功能

## 技术栈

- 后端：Python + Flask
- 前端：HTML + CSS + JavaScript
- Markdown解析：Python-Markdown
- 代码高亮：highlight.js

## 安装与运行

1. 克隆本仓库
   ```bash
   git clone https://github.com/yourusername/markdown-viewer.git
   cd markdown-viewer
   ```

2. 安装依赖
   ```bash
   pip install -r requirements.txt
   ```

3. 运行应用
   ```bash
   python app.py
   ```

4. 在浏览器中访问 http://localhost:5000

## 项目结构

```
.
├── app.py             # Flask应用主文件
├── requirements.txt   # Python依赖
├── markdown/          # 示例Markdown文件目录
├── static/            # 静态资源目录
│   ├── css/           # CSS样式文件
│   └── js/            # JavaScript文件
└── templates/         # HTML模板
```

## 使用说明

1. 将你的Markdown文件放入`markdown`目录中
2. 启动应用后，在左侧边栏浏览文件夹和文件
3. 点击任何Markdown文件查看其渲染后的内容
4. 可以随时点击刷新按钮更新文件列表

## 许可证

MIT 