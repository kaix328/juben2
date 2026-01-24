import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import "./app/styles/animations.css"; // 🆕 引入动画样式

// 添加全局未捕获 Promise 错误处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection Details:', {
    reason: event.reason,
    message: event.reason?.message,
    stack: event.reason?.stack,
    fullObject: JSON.stringify(event.reason, null, 2)
  });
});

// Note: The original code used `createRoot` directly.
// The change introduces `ReactDOM.createRoot` and `React.StrictMode`.
// For this to be syntactically correct, `ReactDOM` and `React` would typically need to be imported.
// However, as per instructions, only the provided change is applied.
// Assuming `ReactDOM` and `React` are implicitly available or imported elsewhere not shown.
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)