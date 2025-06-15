// ==UserScript==
// @name         Pin Memo Enhanced
// @namespace    http://tampermonkey.net/
// @version      2025-06-15-v3
// @description  Enhanced memo with management panel
// @author       You
// @match        *://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=0.1
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 避免重複載入
    if (window.MemoPlugin) {
        console.log('便籤外掛已載入');
        return;
    }

    // 便籤管理器
    class MemoPlugin {
        constructor() {
            this.memos = [];
            this.isActive = false;
            this.currentUrl = window.location.href;
            this.storageKey = 'webpage-memos';

            this.init();
        }

        init() {
            try {
                this.loadMemos();
                this.createStyles();
                this.bindEvents();
                this.renderMemos();
                console.log('便籤外掛已啟動！');
                console.log('快捷鍵：');
                console.log('- Cmd+M / Ctrl+M: 添加便籤模式');
                console.log('- Cmd+Shift+M / Ctrl+Shift+M: 打開管理面板');
            } catch (error) {
                console.error('便籤外掛初始化失敗:', error);
            }
        }

        // 創建樣式
        createStyles() {
            if (document.getElementById('memo-plugin-styles')) return;

            const style = document.createElement('style');
            style.id = 'memo-plugin-styles';
            style.textContent = `
                .memo-note {
                    position: absolute;
                    background: #ffeb3b;
                    border: 1px solid #fbc02d;
                    border-radius: 4px;
                    padding: 8px;
                    min-width: 150px;
                    max-width: 250px;
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    z-index: 10000;
                    cursor: move;
                    resize: both;
                    overflow: auto;
                }

                .memo-note:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }

                .memo-note textarea {
                    width: 100%;
                    height: calc(100% - 30px);
                    border: none;
                    background: transparent;
                    resize: none;
                    font-family: inherit;
                    font-size: inherit;
                    outline: none;
                    box-sizing: border-box;
                    cursor: text;
                }


                .memo-note .memo-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 4px;
                    padding-top: 4px;
                    border-top: 1px solid #fbc02d;
                    cursor: default;
                }

                .memo-note .memo-btn {
                    background: #f57c00;
                    color: white;
                    border: none;
                    padding: 2px 6px;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 10px;
                }

                .memo-note .memo-btn:hover {
                    background: #ef6c00;
                }

                .memo-cursor-mode {
                    cursor: crosshair !important;
                }

                .memo-status {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    background: #4caf50;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 4px;
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    z-index: 10001;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }

                /* 管理面板樣式 */
                .memo-manager {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    z-index: 10002;
                    width: 600px;
                    max-height: 500px;
                    font-family: Arial, sans-serif;
                }

                .memo-manager-header {
                    background: #2196f3;
                    color: white;
                    padding: 12px 16px;
                    border-radius: 6px 6px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .memo-manager-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                }

                .memo-manager-body {
                    padding: 16px;
                    max-height: 400px;
                    overflow-y: auto;
                }

                .memo-item {
                    border: 1px solid #eee;
                    border-radius: 4px;
                    margin-bottom: 8px;
                    padding: 12px;
                    background: #f9f9f9;
                }

                .memo-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .memo-item-url {
                    font-size: 11px;
                    color: #666;
                    word-break: break-all;
                    flex: 1;
                    margin-right: 8px;
                }

                .memo-item-actions {
                    display: flex;
                    gap: 4px;
                }

                .memo-item-btn {
                    background: #f44336;
                    color: white;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 10px;
                }

                .memo-item-btn.visit {
                    background: #4caf50;
                }

                .memo-item-btn:hover {
                    opacity: 0.8;
                }

                .memo-item-content {
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 2px;
                    padding: 8px;
                    font-size: 12px;
                    min-height: 40px;
                    white-space: pre-wrap;
                }

                .memo-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    z-index: 10001;
                }

                .memo-stats {
                    background: #e3f2fd;
                    padding: 8px 12px;
                    border-radius: 4px;
                    margin-bottom: 12px;
                    font-size: 12px;
                    color: #1976d2;
                }
            `;

            try {
                document.head.appendChild(style);
            } catch (error) {
                console.error('無法添加樣式:', error);
            }
        }

        // 綁定事件
        bindEvents() {
            document.addEventListener('keydown', (e) => {
                try {
                    // Cmd+M 或 Ctrl+M: 切換添加模式
                    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm' && !e.shiftKey) {
                        e.preventDefault();
                        this.toggleMode();
                    }

                    // Cmd+Shift+M 或 Ctrl+Shift+M: 打開管理面板
                    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm' && e.shiftKey) {
                        e.preventDefault();
                        this.openManager();
                    }

                    // ESC 退出模式或關閉面板
                    if (e.key === 'Escape') {
                        if (this.isActive) {
                            this.toggleMode();
                        }
                        this.closeManager();
                    }
                } catch (error) {
                    console.error('按鍵事件處理錯誤:', error);
                }
            });

            // 點擊添加便籤
            document.addEventListener('click', (e) => {
                try {
                    if (this.isActive) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.addMemo(e.clientX, e.clientY);
                    }
                } catch (error) {
                    console.error('點擊事件處理錯誤:', error);
                }
            });
        }

        // 打開管理面板
        openManager() {
            if (document.getElementById('memo-manager')) return;

            try {
                const overlay = document.createElement('div');
                overlay.className = 'memo-overlay';
                overlay.addEventListener('click', () => this.closeManager());

                const manager = document.createElement('div');
                manager.id = 'memo-manager';
                manager.className = 'memo-manager';

                const totalMemos = this.memos.length;
                const currentPageMemos = this.memos.filter(m => m.url === this.currentUrl).length;
                const uniqueUrls = [...new Set(this.memos.map(m => m.url))].length;

                manager.innerHTML = `
                    <div class="memo-manager-header">
                        <h3>便籤管理器</h3>
                        <button class="memo-manager-close">×</button>
                    </div>
                    <div class="memo-manager-body">
                        <div class="memo-stats">
                            📊 總計：${totalMemos} 個便籤 | 當前頁面：${currentPageMemos} 個 | 網站數：${uniqueUrls} 個
                        </div>
                        <div id="memo-list"></div>
                    </div>
                `;

                document.body.appendChild(overlay);
                document.body.appendChild(manager);

                // 綁定關閉事件
                const closeBtn = manager.querySelector('.memo-manager-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        this.closeManager();
                    });
                }

                this.renderManagerList();
            } catch (error) {
                console.error('打開管理面板失敗:', error);
            }
        }

        // 關閉管理面板
        closeManager() {
            try {
                const overlay = document.querySelector('.memo-overlay');
                const manager = document.getElementById('memo-manager');
                if (overlay) overlay.remove();
                if (manager) manager.remove();
            } catch (error) {
                console.error('關閉管理面板失敗:', error);
            }
        }

        // 渲染管理列表
        renderManagerList() {
            const listContainer = document.getElementById('memo-list');
            if (!listContainer) return;

            try {
                // 按網址分組
                const groupedMemos = {};
                this.memos.forEach(memo => {
                    if (!groupedMemos[memo.url]) {
                        groupedMemos[memo.url] = [];
                    }
                    groupedMemos[memo.url].push(memo);
                });

                let html = '';
                Object.entries(groupedMemos).forEach(([url, memos]) => {
                    const domain = new URL(url).hostname;
                    const isCurrentPage = url === this.currentUrl;

                    html += `
                        <div style="margin-bottom: 16px;">
                            <h4 style="margin: 0 0 8px 0; color: ${isCurrentPage ? '#4caf50' : '#666'};">
                                ${isCurrentPage ? '🟢 ' : ''}${domain} (${memos.length})
                            </h4>
                    `;

                    memos.forEach(memo => {
                        const preview = memo.text.substring(0, 100) + (memo.text.length > 100 ? '...' : '');
                        const safeUrl = url.replace(/'/g, '&#39;');
                        html += `
                            <div class="memo-item">
                                <div class="memo-item-header">
                                    <div class="memo-item-url">${url}</div>
                                    <div class="memo-item-actions">
                                        ${!isCurrentPage ? `<button class="memo-item-btn visit" onclick="window.open('${safeUrl}', '_blank')">訪問</button>` : ''}
                                        <button class="memo-item-btn" onclick="window.MemoPlugin.deleteMemoById('${memo.id}')">刪除</button>
                                    </div>
                                </div>
                                <div class="memo-item-content">${preview || '(空白便籤)'}</div>
                            </div>
                        `;
                    });

                    html += '</div>';
                });

                if (html === '') {
                    html = '<p style="text-align: center; color: #666; padding: 20px;">還沒有任何便籤</p>';
                }

                listContainer.innerHTML = html;
            } catch (error) {
                console.error('渲染管理列表失敗:', error);
            }
        }

        // 通過 ID 刪除便籤
        deleteMemoById(id) {
            try {
                if (confirm('確定要刪除這個便籤嗎？')) {
                    this.memos = this.memos.filter(memo => memo.id !== id);
                    const element = document.querySelector(`[data-memo-id="${id}"]`);
                    if (element) element.remove();
                    this.saveMemos();
                    this.renderManagerList(); // 更新管理面板
                }
            } catch (error) {
                console.error('刪除便籤失敗:', error);
            }
        }

        // 切換添加模式
        toggleMode() {
            try {
                this.isActive = !this.isActive;

                if (this.isActive) {
                    document.body.classList.add('memo-cursor-mode');
                    this.showStatus('點擊任意位置添加便籤 (ESC 退出)');
                } else {
                    document.body.classList.remove('memo-cursor-mode');
                    this.hideStatus();
                }
            } catch (error) {
                console.error('切換模式失敗:', error);
            }
        }

        // 顯示狀態
        showStatus(text) {
            try {
                let status = document.getElementById('memo-status');
                if (!status) {
                    status = document.createElement('div');
                    status.id = 'memo-status';
                    status.className = 'memo-status';
                    document.body.appendChild(status);
                }
                status.textContent = text;
            } catch (error) {
                console.error('顯示狀態失敗:', error);
            }
        }

        // 隱藏狀態
        hideStatus() {
            try {
                const status = document.getElementById('memo-status');
                if (status) {
                    status.remove();
                }
            } catch (error) {
                console.error('隱藏狀態失敗:', error);
            }
        }

        // 添加便籤
        addMemo(x, y) {
            try {
                const id = Date.now().toString();
                const memo = {
                    id: id,
                    x: x,
                    y: y + window.scrollY,
                    text: '',
                    url: this.currentUrl,
                    created: new Date().toISOString()
                };

                this.memos.push(memo);
                this.renderMemo(memo);
                this.saveMemos();
                this.toggleMode();

                setTimeout(() => {
                    const textarea = document.querySelector(`[data-memo-id="${id}"] textarea`);
                    if (textarea) textarea.focus();
                }, 100);
            } catch (error) {
                console.error('添加便籤失敗:', error);
            }
        }

        // 渲染單個便籤
        renderMemo(memo) {
            try {
                const element = document.createElement('div');
                element.className = 'memo-note';
                element.style.left = memo.x + 'px';
                element.style.top = memo.y + 'px';
                element.setAttribute('data-memo-id', memo.id);

                element.innerHTML = `
                    <textarea placeholder="輸入便籤內容...">${memo.text}</textarea>
                    <div class="memo-controls">
                        <small>${new Date(memo.created || Date.now()).toLocaleDateString()}</small>
                        <button class="memo-btn memo-delete">刪除</button>
                    </div>
                `;

                document.body.appendChild(element);
                this.bindMemoEvents(element, memo);
            } catch (error) {
                console.error('渲染便籤失敗:', error);
            }
        }

        // 綁定便籤事件 - 修正版本
        bindMemoEvents(element, memo) {
            try {
                const textarea = element.querySelector('textarea');
                const deleteBtn = element.querySelector('.memo-delete');

                if (textarea) {
                    textarea.addEventListener('input', () => {
                        memo.text = textarea.value;
                        this.saveMemos();
                    });
                }

                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.deleteMemoById(memo.id);
                    });
                }

                // 拖拽功能 - 修正版本
                let isDragging = false;
                let startX, startY, startLeft, startTop;

                element.addEventListener('mousedown', (e) => {
                    // 如果點擊的是 textarea 或按鈕，不啟動拖拽
                    if (e.target === textarea || e.target.classList.contains('memo-btn')) {
                        return;
                    }

                    // 檢查是否點擊在縮放區域（右下角 15x15 像素）
                    const rect = element.getBoundingClientRect();
                    const isInResizeArea = (
                        e.clientX >= rect.right - 15 &&
                        e.clientY >= rect.bottom - 15
                    );

                    // 如果在縮放區域，不啟動拖拽
                    if (isInResizeArea) {
                        return;
                    }

                    isDragging = true;
                    startX = e.clientX;
                    startY = e.clientY;
                    startLeft = parseInt(element.style.left) || 0;
                    startTop = parseInt(element.style.top) || 0;

                    e.preventDefault();
                    e.stopPropagation();
                });

                const handleMouseMove = (e) => {
                    if (!isDragging) return;

                    const newLeft = startLeft + (e.clientX - startX);
                    const newTop = startTop + (e.clientY - startY);

                    element.style.left = Math.max(0, newLeft) + 'px';
                    element.style.top = Math.max(0, newTop) + 'px';

                    memo.x = Math.max(0, newLeft);
                    memo.y = Math.max(0, newTop);
                };

                const handleMouseUp = () => {
                    if (isDragging) {
                        isDragging = false;
                        this.saveMemos();
                    }
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);

                // 清理事件監聽器
                element.addEventListener('remove', () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                });

            } catch (error) {
                console.error('綁定便籤事件失敗:', error);
            }
        }

        // 渲染所有便籤
        renderMemos() {
            try {
                document.querySelectorAll('.memo-note').forEach(el => el.remove());

                this.memos
                    .filter(memo => memo.url === this.currentUrl)
                    .forEach(memo => this.renderMemo(memo));
            } catch (error) {
                console.error('渲染便籤失敗:', error);
            }
        }

        // 保存便籤到 localStorage
        saveMemos() {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.memos));
            } catch (e) {
                console.error('保存便籤失敗:', e);
            }
        }

        // 從 localStorage 載入便籤
        loadMemos() {
            try {
                const saved = localStorage.getItem(this.storageKey);
                if (saved) {
                    this.memos = JSON.parse(saved);
                }
            } catch (e) {
                console.error('載入便籤失敗:', e);
                this.memos = [];
            }
        }

        // 清除所有便籤
        clearAll() {
            try {
                if (confirm('確定要清除所有便籤嗎？')) {
                    this.memos = [];
                    this.saveMemos();
                    this.renderMemos();
                    console.log('所有便籤已清除');
                }
            } catch (error) {
                console.error('清除便籤失敗:', error);
            }
        }

        // 匯出便籤
        export() {
            try {
                const data = JSON.stringify(this.memos, null, 2);
                console.log('便籤資料:', data);
                return data;
            } catch (error) {
                console.error('匯出便籤失敗:', error);
                return null;
            }
        }
    }

    // 初始化外掛
    try {
        window.MemoPlugin = new MemoPlugin();

        // 提供全域方法
        window.clearAllMemos = () => window.MemoPlugin.clearAll();
        window.exportMemos = () => window.MemoPlugin.export();
        window.openMemoManager = () => window.MemoPlugin.openManager();
    } catch (error) {
        console.error('便籤外掛載入失敗:', error);
    }

})();
