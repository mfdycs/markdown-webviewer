import os
import markdown
from flask import Flask, render_template, jsonify, request, abort
from pathlib import Path
import traceback

app = Flask(__name__)

# 配置Markdown目录路径
MARKDOWN_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'markdown')

# 确保Markdown目录存在
os.makedirs(MARKDOWN_DIR, exist_ok=True)

@app.route('/')
def index():
    """渲染主页"""
    return render_template('index.html')

@app.route('/api/files')
def get_files():
    """获取文件结构，返回JSON格式数据"""
    result = []
    
    def scan_directory(directory, parent_path=''):
        items = []
        try:
            for item in os.listdir(directory):
                item_path = os.path.join(directory, item)
                relative_path = os.path.join(parent_path, item) if parent_path else item
                
                if os.path.isdir(item_path):
                    # 如果是目录，递归扫描
                    children = scan_directory(item_path, relative_path)
                    items.append({
                        'name': item,
                        'path': relative_path,
                        'type': 'directory',
                        'children': children
                    })
                elif item.endswith('.md'):
                    # 如果是Markdown文件
                    items.append({
                        'name': item,
                        'path': relative_path,
                        'type': 'file'
                    })
            
            # 先显示文件夹，然后是文件，并按名称排序
            dirs = sorted([i for i in items if i['type'] == 'directory'], key=lambda x: x['name'])
            files = sorted([i for i in items if i['type'] == 'file'], key=lambda x: x['name'])
            return dirs + files
        except Exception as e:
            app.logger.error(f"扫描目录时出错: {directory}, 错误: {str(e)}")
            return []
    
    try:
        result = scan_directory(MARKDOWN_DIR)
        return jsonify(result)
    except Exception as e:
        app.logger.error(f"获取文件结构时出错: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/content')
def get_content():
    """获取并渲染Markdown文件内容"""
    file_path = request.args.get('path')
    
    if not file_path:
        return jsonify({'error': '未提供文件路径'}), 400
    
    try:
        # 清理文件路径
        file_path = file_path.lstrip('/\\')
        file_path = os.path.normpath(file_path).replace('\\', '/')
        
        # 构建完整路径
        full_path = os.path.join(MARKDOWN_DIR, file_path)
        full_path = os.path.normpath(full_path)
        
        # 检查路径安全性
        if not os.path.exists(full_path):
            app.logger.error(f"请求的文件不存在: {full_path}")
            return jsonify({'error': '文件不存在'}), 404
            
        markdown_dir_abs = os.path.abspath(MARKDOWN_DIR)
        file_path_abs = os.path.abspath(full_path)
        
        # 检查文件是否在MARKDOWN_DIR内
        common_prefix = os.path.commonpath([markdown_dir_abs, file_path_abs])
        if common_prefix != markdown_dir_abs:
            app.logger.error(f"尝试访问目录外的文件: {file_path_abs}")
            return jsonify({'error': '无效的文件路径'}), 403
        
        if not os.path.isfile(full_path) or not full_path.endswith('.md'):
            return jsonify({'error': '不是Markdown文件'}), 404
            
        # 读取文件内容
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except UnicodeDecodeError:
            # 尝试使用其他编码
            with open(full_path, 'r', encoding='gbk') as f:
                content = f.read()
                
        # 将Markdown转换为HTML
        html_content = markdown.markdown(
            content,
            extensions=[
                'markdown.extensions.fenced_code',  # 支持围栏代码块
                'markdown.extensions.tables',       # 支持表格
                'markdown.extensions.codehilite',   # 代码高亮
                'markdown.extensions.nl2br',        # 换行符转为<br>
                'markdown.extensions.toc'           # 支持目录
            ]
        )
        
        return jsonify({
            'content': html_content,
            'raw': content
        })
    except Exception as e:
        app.logger.error(f"读取文件时出错: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/save', methods=['POST'])
def save_content():
    """保存Markdown文件内容"""
    data = request.json
    file_path = data.get('path')
    content = data.get('content')
    
    if not file_path or content is None:
        return jsonify({'error': '未提供文件路径或内容'}), 400
    
    try:
        # 清理文件路径
        file_path = file_path.lstrip('/\\')
        file_path = os.path.normpath(file_path).replace('\\', '/')
        
        # 构建完整路径
        full_path = os.path.join(MARKDOWN_DIR, file_path)
        full_path = os.path.normpath(full_path)
        
        # 检查路径安全性
        markdown_dir_abs = os.path.abspath(MARKDOWN_DIR)
        file_path_abs = os.path.abspath(full_path)
        
        # 检查文件是否在MARKDOWN_DIR内
        common_prefix = os.path.commonpath([markdown_dir_abs, file_path_abs])
        if common_prefix != markdown_dir_abs:
            app.logger.error(f"尝试保存到目录外的文件: {file_path_abs}")
            return jsonify({'error': '无效的文件路径'}), 403
        
        # 确保目录存在
        dir_path = os.path.dirname(full_path)
        if not os.path.exists(dir_path):
            os.makedirs(dir_path, exist_ok=True)
        
        # 写入文件
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # 将Markdown转换为HTML以返回
        html_content = markdown.markdown(
            content,
            extensions=[
                'markdown.extensions.fenced_code',
                'markdown.extensions.tables',
                'markdown.extensions.codehilite',
                'markdown.extensions.nl2br',
                'markdown.extensions.toc'
            ]
        )
        
        return jsonify({
            'success': True,
            'message': '文件保存成功',
            'content': html_content
        })
    except Exception as e:
        app.logger.error(f"保存文件时出错: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/create', methods=['POST'])
def create_file():
    """创建新的Markdown文件"""
    data = request.json
    file_name = data.get('name', '').strip()
    directory = data.get('directory', '')
    
    if not file_name:
        return jsonify({'error': '未提供文件名'}), 400
    
    try:
        # 移除可能存在的.md后缀，然后重新添加
        file_name = file_name.replace('.md', '')
        file_name = f"{file_name}.md"
        
        # 检查文件名是否包含非法字符
        if any(char in file_name for char in ['/', '\\', ':', '*', '?', '"', '<', '>', '|']):
            return jsonify({'error': '文件名包含非法字符'}), 400
        
        # 清理路径
        directory = directory.lstrip('/\\')
        directory = os.path.normpath(directory).replace('\\', '/') if directory else ''
        
        # 构建文件路径
        relative_path = os.path.join(directory, file_name) if directory else file_name
        full_path = os.path.join(MARKDOWN_DIR, relative_path)
        full_path = os.path.normpath(full_path)
        
        # 检查路径安全性
        markdown_dir_abs = os.path.abspath(MARKDOWN_DIR)
        file_path_abs = os.path.abspath(full_path)
        
        # 检查文件是否在MARKDOWN_DIR内
        common_prefix = os.path.commonpath([markdown_dir_abs, file_path_abs])
        if common_prefix != markdown_dir_abs:
            app.logger.error(f"尝试创建目录外的文件: {file_path_abs}")
            return jsonify({'error': '无效的文件路径'}), 403
        
        # 检查文件是否已存在
        if os.path.exists(full_path):
            return jsonify({'error': '文件已存在'}), 409
        
        # 确保目录存在
        dir_path = os.path.dirname(full_path)
        if not os.path.exists(dir_path):
            os.makedirs(dir_path, exist_ok=True)
        
        # 创建空文件
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write('# ' + os.path.splitext(file_name)[0] + '\n\n在这里编写你的Markdown内容...')
        
        return jsonify({
            'success': True,
            'message': '文件创建成功',
            'path': relative_path.replace('\\', '/')
        })
    except Exception as e:
        app.logger.error(f"创建文件时出错: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete', methods=['POST'])
def delete_file():
    """删除Markdown文件"""
    data = request.json
    file_path = data.get('path')
    
    if not file_path:
        return jsonify({'error': '未提供文件路径'}), 400
    
    try:
        # 清理文件路径
        file_path = file_path.lstrip('/\\')
        file_path = os.path.normpath(file_path).replace('\\', '/')
        
        # 构建完整路径
        full_path = os.path.join(MARKDOWN_DIR, file_path)
        full_path = os.path.normpath(full_path)
        
        # 检查路径安全性
        markdown_dir_abs = os.path.abspath(MARKDOWN_DIR)
        file_path_abs = os.path.abspath(full_path)
        
        # 检查文件是否在MARKDOWN_DIR内
        common_prefix = os.path.commonpath([markdown_dir_abs, file_path_abs])
        if common_prefix != markdown_dir_abs:
            app.logger.error(f"尝试删除目录外的文件: {file_path_abs}")
            return jsonify({'error': '无效的文件路径'}), 403
        
        # 检查文件是否存在
        if not os.path.isfile(full_path) or not full_path.endswith('.md'):
            return jsonify({'error': '文件不存在或不是Markdown文件'}), 404
        
        # 删除文件
        os.remove(full_path)
        
        return jsonify({
            'success': True,
            'message': '文件删除成功'
        })
    except Exception as e:
        app.logger.error(f"删除文件时出错: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0') 