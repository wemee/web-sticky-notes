# 🔖 網頁便籤

為任何網頁添加便籤功能的小工具。

## 🚀 安裝使用

1. 安裝 [Tampermonkey](https://www.tampermonkey.net/) 瀏覽器擴充功能
2. 複製 `web-sticky-notes.js` 的程式碼
3. 在 Tampermonkey 建立新腳本，貼上程式碼並儲存

## ⌨️ 快捷鍵

- **Ctrl/Cmd + Shift + N** - 建立新便籤
- **Ctrl/Cmd + Shift + M** - 開啟管理面板
- **ESC** - 關閉面板

## 🛠️ 自訂快捷鍵

修改程式碼中的這兩行：

```javascript
// 建立便籤的快捷鍵 (目前是 N)
if ((e.metaKey || e.ctrlKey) && e.key === 'n' && e.shiftKey) {

// 管理面板的快捷鍵 (目前是 M)  
if ((e.metaKey || e.ctrlKey) && e.key === 'm' && e.shiftKey) {
```

**改成你想要的字母**，例如：
- 改成 `'b'` → Ctrl+Shift+B
- 改成 `'j'` → Ctrl+Shift+J

## 📝 使用方法

1. **建立便籤** - 按快捷鍵或右鍵選單
2. **編輯內容** - 直接點擊便籤輸入文字
3. **拖拽移動** - 按住便籤標題列拖拽
4. **刪除便籤** - 點擊右上角 ✕ 按鈕
5. **管理所有便籤** - 用快捷鍵開啟管理面板

## 💡 小提醒

- 便籤會自動儲存到瀏覽器
- 每個網站的便籤分開管理
- 重新整理頁面後便籤依然存在

---

簡單好用的網頁便籤工具 ✨
