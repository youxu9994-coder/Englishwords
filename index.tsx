import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 获取HTML中的根元素
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// 创建React根节点并渲染主App组件
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);