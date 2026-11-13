import React from 'react';

/** Render React errors visibly instead of leaving an empty page. */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[Mi House React] Lỗi render:', error, info.componentStack);
    document.getElementById('app-boot-status')?.remove();
  }

  render() {
    if (this.state.error) {
      return (
        <main className="page-not-found" role="alert" style={{ minHeight: '55vh' }}>
          <h1>Không hiển thị được nội dung trang</h1>
          <p>Ứng dụng đã gặp lỗi khi dựng giao diện. Kiểm tra F12 → Console để xem chi tiết.</p>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', margin: '16px auto', padding: 14, maxWidth: 740, background: '#f7eee6', textAlign: 'left' }}>
            {this.state.error?.message || 'Unknown React error'}
          </pre>
          <button type="button" onClick={() => window.location.reload()}>Tải lại trang</button>
        </main>
      );
    }
    return this.props.children;
  }
}
