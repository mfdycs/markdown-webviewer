document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const fileTree = document.getElementById('file-tree');
    const contentContainer = document.getElementById('content-container');
    const markdownContent = document.getElementById('markdown-content');
    const refreshBtn = document.getElementById('refresh-btn');
    const newFileBtn = document.getElementById('new-file-btn');
    const newFileModal = document.getElementById('new-file-modal');
    const newFileForm = document.getElementById('new-file-form');
    const newFileName = document.getElementById('new-file-name');
    const newFileLocation = document.getElementById('new-file-location');
    const createFileBtn = document.getElementById('create-file-btn');
    const editorTemplate = document.getElementById('editor-template');
    
    // 当前状态
    let currentFile = null;
    let isEditMode = false;
    
    // 初始化
    loadFileTree();
    initModalEvents();
    
    // 刷新按钮点击事件
    refreshBtn.addEventListener('click', function() {
        loadFileTree();
        if (currentFile && !isEditMode) {
            loadMarkdownContent(currentFile);
        }
    });
    
    // 新建文件按钮点击事件
    newFileBtn.addEventListener('click', function() {
        openNewFileModal();
    });
    
    /**
     * 初始化模态框事件
     */
    function initModalEvents() {
        // 关闭模态框事件
        document.querySelectorAll('.modal-close, .modal-close-btn').forEach(element => {
            element.addEventListener('click', function() {
                closeModal(newFileModal);
            });
        });
        
        // 创建文件按钮点击事件
        createFileBtn.addEventListener('click', function() {
            const fileName = newFileName.value.trim();
            const directory = newFileLocation.value.trim();
            
            if (!fileName) {
                alert('请输入文件名');
                return;
            }
            
            createNewFile(fileName, directory);
        });
        
        // 表单提交事件（防止默认提交行为）
        newFileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createFileBtn.click();
        });
    }
    
    /**
     * 打开新建文件模态框
     */
    function openNewFileModal() {
        // 清空表单
        newFileName.value = '';
        
        // 获取目录列表
        updateDirectorySelect();
        
        // 显示模态框
        newFileModal.style.display = 'flex';
    }
    
    /**
     * 关闭模态框
     */
    function closeModal(modal) {
        modal.style.display = 'none';
    }
    
    /**
     * 更新目录选择下拉框
     */
    function updateDirectorySelect() {
        // 清空现有选项（保留根目录选项）
        while (newFileLocation.options.length > 1) {
            newFileLocation.remove(1);
        }
        
        function addDirectories(items, prefix = '') {
            items.forEach(item => {
                if (item.type === 'directory') {
                    const option = document.createElement('option');
                    option.value = item.path;
                    option.textContent = prefix + item.path;
                    newFileLocation.appendChild(option);
                    
                    if (item.children && item.children.length > 0) {
                        addDirectories(item.children.filter(child => child.type === 'directory'), prefix + '  ');
                    }
                }
            });
        }
        
        // 获取目录列表
        fetch('/api/files')
            .then(response => response.json())
            .then(data => {
                addDirectories(data);
            })
            .catch(error => {
                console.error('获取目录列表出错:', error);
            });
    }
    
    /**
     * 创建新文件
     */
    function createNewFile(fileName, directory) {
        fetch('/api/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: fileName,
                directory: directory
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            closeModal(newFileModal);
            loadFileTree();
            
            // 打开新创建的文件
            setTimeout(() => {
                loadMarkdownContent(data.path);
                currentFile = data.path;
                switchToEditMode();
            }, 500);
        })
        .catch(error => {
            alert('创建文件失败: ' + error.message);
            console.error('创建文件出错:', error);
        });
    }
    
    /**
     * 加载文件树
     */
    function loadFileTree() {
        fileTree.innerHTML = '<div class="loading">加载中...</div>';
        
        fetch('/api/files')
            .then(response => {
                if (!response.ok) {
                    throw new Error('获取文件列表失败');
                }
                return response.json();
            })
            .then(data => {
                fileTree.innerHTML = '';
                renderFileTree(data, fileTree);
            })
            .catch(error => {
                fileTree.innerHTML = `<div class="error">错误: ${error.message}</div>`;
                console.error('获取文件列表出错:', error);
            });
    }
    
    /**
     * 渲染文件树
     * @param {Array} items - 文件和目录项数组
     * @param {HTMLElement} container - 容器元素
     */
    function renderFileTree(items, container) {
        if (!items || items.length === 0) {
            container.innerHTML = '<div class="empty">暂无文件</div>';
            return;
        }
        
        items.forEach(item => {
            if (item.type === 'directory') {
                // 创建目录项
                const dirItem = document.createElement('div');
                dirItem.className = 'directory-item';
                dirItem.dataset.path = item.path;
                
                const dirName = document.createElement('div');
                dirName.className = 'directory-name';
                dirName.textContent = item.name;
                dirName.addEventListener('click', function() {
                    dirItem.classList.toggle('open');
                });
                
                const dirChildren = document.createElement('div');
                dirChildren.className = 'directory-children';
                
                dirItem.appendChild(dirName);
                dirItem.appendChild(dirChildren);
                container.appendChild(dirItem);
                
                // 递归渲染子项
                renderFileTree(item.children, dirChildren);
            } else {
                // 创建文件项
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.dataset.path = item.path;
                
                const fileName = document.createElement('div');
                fileName.className = 'file-name';
                fileName.textContent = item.name;
                
                const fileActions = document.createElement('div');
                fileActions.className = 'file-item-actions';
                
                const editBtn = document.createElement('button');
                editBtn.className = 'file-action-btn edit-btn';
                editBtn.textContent = '编辑';
                editBtn.addEventListener('click', function(e) {
                    e.stopPropagation(); // 防止触发文件点击事件
                    
                    if (currentFile !== item.path) {
                        // 如果当前正在编辑其他文件，先加载这个文件
                        currentFile = item.path;
                        loadMarkdownContent(item.path, true);
                    } else {
                        switchToEditMode();
                    }
                });
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'file-action-btn delete-btn';
                deleteBtn.textContent = '删除';
                deleteBtn.addEventListener('click', function(e) {
                    e.stopPropagation(); // 防止触发文件点击事件
                    if (confirm(`确定要删除文件 "${item.name}" 吗？`)) {
                        deleteFile(item.path);
                    }
                });
                
                fileActions.appendChild(editBtn);
                fileActions.appendChild(deleteBtn);
                
                fileItem.appendChild(fileName);
                fileItem.appendChild(fileActions);
                container.appendChild(fileItem);
                
                // 添加点击事件
                fileItem.addEventListener('click', function() {
                    // 如果当前正在编辑，提示用户保存或取消
                    if (isEditMode) {
                        if (confirm('您有未保存的更改，要切换文件前需要先保存或取消编辑。要保存更改吗？')) {
                            saveFile();
                        } else {
                            cancelEdit();
                        }
                        return;
                    }
                    
                    // 移除之前选中项的高亮
                    const activeItems = document.querySelectorAll('.file-item.active');
                    activeItems.forEach(item => item.classList.remove('active'));
                    
                    // 高亮当前选中项
                    fileItem.classList.add('active');
                    
                    // 加载文件内容
                    currentFile = item.path;
                    loadMarkdownContent(currentFile);
                });
                
                // 如果是当前选中的文件，添加active类
                if (item.path === currentFile) {
                    fileItem.classList.add('active');
                }
            }
        });
    }
    
    /**
     * 加载Markdown内容
     * @param {string} filePath - 文件路径
     * @param {boolean} editAfterLoad - 加载后是否直接进入编辑模式
     */
    function loadMarkdownContent(filePath, editAfterLoad = false) {
        // 如果正在编辑中，先恢复查看模式
        if (isEditMode) {
            cancelEdit();
        }
        
        markdownContent.innerHTML = '<div class="loading">加载内容中...</div>';
        
        fetch(`/api/content?path=${encodeURIComponent(filePath)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('获取文件内容失败');
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                
                // 重设内容容器
                contentContainer.innerHTML = `<div id="markdown-content" class="markdown-content">${data.content}</div>`;
                markdownContent = document.getElementById('markdown-content');
                
                // 应用代码高亮
                document.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightElement(block);
                });
                
                // 滚动到顶部
                contentContainer.scrollTop = 0;
                
                // 高亮导航中的当前文件
                highlightCurrentFile();
                
                // 如果需要，加载后直接进入编辑模式
                if (editAfterLoad) {
                    // 需要一点延迟确保DOM已更新
                    setTimeout(() => {
                        switchToEditMode(data.raw);
                    }, 100);
                }
            })
            .catch(error => {
                markdownContent.innerHTML = `<div class="error">加载失败: ${error.message}</div>`;
                console.error('加载Markdown内容出错:', error);
            });
    }
    
    /**
     * 高亮当前选中的文件
     */
    function highlightCurrentFile() {
        // 移除所有高亮
        document.querySelectorAll('.file-item.active').forEach(item => {
            item.classList.remove('active');
        });
        
        // 添加高亮到当前文件
        if (currentFile) {
            const fileItem = document.querySelector(`.file-item[data-path="${currentFile}"]`);
            if (fileItem) {
                fileItem.classList.add('active');
                
                // 展开父目录
                let parent = fileItem.parentElement;
                while (parent && parent.classList.contains('directory-children')) {
                    const dirItem = parent.parentElement;
                    if (dirItem && dirItem.classList.contains('directory-item')) {
                        dirItem.classList.add('open');
                    }
                    parent = dirItem.parentElement;
                }
            }
        }
    }
    
    /**
     * 切换到编辑模式
     * @param {string} content - 文件内容
     */
    function switchToEditMode(content) {
        if (!currentFile) {
            alert('请先选择一个文件');
            return;
        }
        
        // 标记当前为编辑模式
        isEditMode = true;
        
        // 如果未提供内容，则获取当前内容
        if (content === undefined) {
            fetch(`/api/content?path=${encodeURIComponent(currentFile)}`)
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        throw new Error(data.error);
                    }
                    createEditor(data.raw);
                })
                .catch(error => {
                    alert('获取文件内容失败: ' + error.message);
                    console.error('获取文件内容出错:', error);
                });
        } else {
            createEditor(content);
        }
    }
    
    /**
     * 创建编辑器
     * @param {string} content - 编辑器内容
     */
    function createEditor(content) {
        // 创建编辑器
        const editorClone = document.importNode(editorTemplate.content, true);
        const editor = editorClone.querySelector('.editor-container');
        const textarea = editor.querySelector('.editor-textarea');
        const saveBtn = editor.querySelector('.save-btn');
        const cancelBtn = editor.querySelector('.cancel');
        const fileInfo = editor.querySelector('.file-path');
        
        // 设置文件路径和内容
        fileInfo.textContent = currentFile;
        textarea.value = content;
        
        // 保存按钮事件
        saveBtn.addEventListener('click', saveFile);
        
        // 取消按钮事件
        cancelBtn.addEventListener('click', cancelEdit);
        
        // 替换内容容器
        contentContainer.innerHTML = '';
        contentContainer.appendChild(editor);
        
        // 聚焦到编辑器
        textarea.focus();
        
        // 设置编辑器高度
        adjustEditorHeight();
        
        // 监听窗口大小变化，调整编辑器高度
        window.addEventListener('resize', adjustEditorHeight);
    }
    
    /**
     * 调整编辑器高度
     */
    function adjustEditorHeight() {
        const textarea = document.querySelector('.editor-textarea');
        if (!textarea) return;
        
        // 设置最小高度
        const viewportHeight = window.innerHeight;
        const editorContainer = document.querySelector('.editor-container');
        const toolbar = document.querySelector('.editor-toolbar');
        
        if (editorContainer && toolbar) {
            // 计算可用空间，留出头部、底部和工具栏的空间
            const toolbarHeight = toolbar.offsetHeight;
            const headerHeight = 57; // 头部高度
            const footerHeight = 42; // 底部高度
            const availableHeight = viewportHeight - headerHeight - footerHeight - toolbarHeight - 40; // 额外留出一些空间
            
            textarea.style.height = `${Math.max(500, availableHeight)}px`;
        }
    }
    
    /**
     * 保存文件
     */
    function saveFile() {
        if (!isEditMode || !currentFile) return;
        
        const textarea = document.querySelector('.editor-textarea');
        const content = textarea.value;
        
        // 发送保存请求
        fetch('/api/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: currentFile,
                content: content
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            // 恢复查看模式
            isEditMode = false;
            
            // 移除窗口大小变化监听器
            window.removeEventListener('resize', adjustEditorHeight);
            
            // 显示更新后的内容
            contentContainer.innerHTML = `<div id="markdown-content" class="markdown-content">${data.content}</div>`;
            markdownContent = document.getElementById('markdown-content');
            
            // 应用代码高亮
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
            
            // 显示成功消息
            alert('文件保存成功');
        })
        .catch(error => {
            alert('保存文件失败: ' + error.message);
            console.error('保存文件出错:', error);
        });
    }
    
    /**
     * 取消编辑，返回查看模式
     */
    function cancelEdit() {
        isEditMode = false;
        
        // 移除窗口大小变化监听器
        window.removeEventListener('resize', adjustEditorHeight);
        
        // 重新加载内容
        if (currentFile) {
            loadMarkdownContent(currentFile);
        } else {
            // 如果没有当前文件，显示欢迎信息
            contentContainer.innerHTML = `
                <div id="markdown-content" class="markdown-content">
                    <div class="welcome-message">
                        <h2>欢迎使用Markdown查看器</h2>
                        <p>请从左侧选择一个Markdown文件来查看其内容。</p>
                    </div>
                </div>
            `;
            markdownContent = document.getElementById('markdown-content');
        }
    }
    
    /**
     * 删除文件
     * @param {string} filePath - 文件路径
     */
    function deleteFile(filePath) {
        fetch('/api/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: filePath
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            // 重新加载文件树
            loadFileTree();
            
            // 如果删除的是当前打开的文件，显示欢迎信息
            if (currentFile === filePath) {
                currentFile = null;
                contentContainer.innerHTML = `
                    <div id="markdown-content" class="markdown-content">
                        <div class="welcome-message">
                            <h2>欢迎使用Markdown查看器</h2>
                            <p>请从左侧选择一个Markdown文件来查看其内容。</p>
                        </div>
                    </div>
                `;
                markdownContent = document.getElementById('markdown-content');
            }
            
            // 显示成功消息
            alert('文件删除成功');
        })
        .catch(error => {
            alert('删除文件失败: ' + error.message);
            console.error('删除文件出错:', error);
        });
    }
}); 