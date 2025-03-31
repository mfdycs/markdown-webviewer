# Markdown 查看器

一个简单的网页应用，用于查看和编辑 Markdown 文件，支持代码高亮显示。

[English](README.md)

## 功能特点

- 树形结构浏览和查看 Markdown 文件
- 内置 Markdown 编辑器
- 代码块语法高亮
- 创建新的 Markdown 文件
- 删除现有文件
- 响应式设计
- 支持嵌套目录

## 系统要求

- Python 3.6+
- Flask
- Markdown
- Pygments

## 安装说明

1. 克隆仓库：
```bash
git clone https://github.com/yourusername/markdown-viewer.git
cd markdown-viewer
```

2. 安装依赖：
```bash
pip install -r requirements.txt
```

3. 运行应用：
```bash
python app.py
```

4. 在浏览器中访问：
```
http://localhost:5000
```

## 使用说明

1. **查看文件**
   - 在左侧边栏浏览文件
   - 点击文件查看其内容
   - 代码块会自动高亮显示

2. **编辑文件**
   - 点击文件旁边的编辑按钮 (✎)
   - 在编辑器中修改内容
   - 点击"保存"保存更改，或"取消"放弃更改

3. **创建文件**
   - 点击"新建文件"按钮
   - 输入文件名和位置
   - 点击"创建"创建文件

4. **删除文件**
   - 点击文件旁边的删除按钮 (🗑)
   - 确认删除操作

## 项目结构

```
markdown-viewer/
├── app.py              # 主应用文件
├── requirements.txt    # Python 依赖
├── static/            # 静态文件
│   ├── css/          # CSS 样式
│   └── js/           # JavaScript 文件
├── templates/         # HTML 模板
└── markdown/         # Markdown 文件目录
```

## 参与贡献

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m '添加新特性'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。 