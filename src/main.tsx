import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import "./app/styles/animations.css";
import "./styles/ipad.css"; // 🆕 iPad 专属优化样式
import "./styles/landscape.css"; // 🆕 横屏优化样式

// 添加全局未捕获 Promise 错误处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection Details:', {
    reason: event.reason,
    message: event.reason?.message,
    stack: event.reason?.stack,
    fullObject: JSON.stringify(event.reason, null, 2)
  });
});

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
