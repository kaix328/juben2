import { createRoot } from "react-dom/client";
import "./styles/index.css";

// 最小化测试 - 不加载任何复杂组件
function MinimalApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>✅ 开发服务器运行正常！</h1>
      <p>如果你看到这个页面，说明 Vite 和 React 基础配置是正常的。</p>
      <p>时间: {new Date().toLocaleString()}</p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<MinimalApp />);
