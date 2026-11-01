# 國一數學陪讀指南

陪國一孩子把數學救回來的家長指南，整理自與 Claude 的對話。核心建議：**每天少量、固定，比週末狂補有效。**

網站：https://cabbage765.github.io/math-learning-guide/

## 頁面

- `index.html`：首頁，重點摘要
- `daily-practice.html`：每日練習的做法、一週範例與打勾表
- `chapters.html`：康軒國一上學期章節列表
- `practice.html?s=2-1`：單元的關鍵建議與互動練習題（目前完成第 2、3 章）
- `rewards.html`：答題回饋的圖片設定（圖片只存在瀏覽器的 IndexedDB）
- `advice.html`：完整五點建議
- `setup.html`：製作紀錄

## 新增單元

在 `js/sections.js` 的 `SECTIONS` 裡加上單元資料，章節列表就會自動出現連結。題型有 `choice`、`number`、`fraction`、`set`、`expr`（含 x 的式子），題目文字裡的 `{a/b}` 會顯示成分數。

純 HTML + CSS + JavaScript，不需要建置，直接用瀏覽器打開 `index.html` 就能預覽。
