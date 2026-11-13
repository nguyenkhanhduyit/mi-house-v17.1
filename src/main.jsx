import React from 'react';
import {createRoot} from 'react-dom/client';
import {ErrorBoundary} from './components/ErrorBoundary.jsx';

const isAdmin=window.location.pathname==='/admin'||window.location.pathname.startsWith('/admin/');
if(isAdmin){document.documentElement.classList.add('react-ready');document.getElementById('app-boot-status')?.remove();}
const host=document.getElementById('root');
if(!host)throw new Error('Không tìm thấy phần tử #root trong index.html');
const component=isAdmin?import('./cms/AdminApp.jsx'):import('./App.jsx');
component.then(({default:Page})=>{
  createRoot(host).render(<React.StrictMode><ErrorBoundary><Page/></ErrorBoundary></React.StrictMode>);
}).catch(error=>{
  console.error('Không thể nạp ứng dụng:',error);
  host.textContent='Không thể khởi tạo giao diện. Vui lòng tải lại trang.';
});
