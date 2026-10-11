import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || 'অপ্রত্যাশিত ত্রুটি' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught exception:', error, errorInfo);

    // If dynamic chunk import failed (e.g., new app version deployed with new hashes),
    // automatically reload once to fetch the latest assets
    const isChunkFailed =
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('Importing a module script failed') ||
      error.message?.includes('error loading dynamically imported module');

    if (isChunkFailed) {
      const hasReloaded = sessionStorage.getItem('momin_chunk_reload');
      if (!hasReloaded) {
        sessionStorage.setItem('momin_chunk_reload', 'true');
        window.location.reload();
      }
    }
  }

  handleReload = () => {
    sessionStorage.removeItem('momin_chunk_reload');
    window.location.reload();
  };

  handleClearCacheAndReload = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }
    } catch (err) {
      console.warn('Failed clearing cache:', err);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FBF9F4',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '24px',
          boxSizing: 'border-box',
        }}>
          <div style={{
            maxWidth: '420px',
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '36px 28px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
            border: '1px solid #EAE2D0',
            textAlign: 'center',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto 20px',
            }}>
              ⚠️
            </div>

            <h2 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#16402C',
              margin: '0 0 10px',
            }}>
              মুমিন এগ্রো লোড হতে সমস্যা হয়েছে
            </h2>

            <p style={{
              fontSize: '14px',
              color: '#5A7A6A',
              lineHeight: '1.6',
              margin: '0 0 24px',
            }}>
              অ্যাপটি চালু করতে নিচের বাটনে চাপ দিন। আপনার পূর্বের সংরক্ষিত সকল তথ্য নিরাপদে রয়েছে।
            </p>

            <button
              onClick={this.handleReload}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                background: '#16402C',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '12px',
              }}
            >
              🔄 পুনরায় লোড করুন
            </button>

            <button
              onClick={this.handleClearCacheAndReload}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '14px',
                background: 'transparent',
                color: '#8A6D3B',
                border: '1px solid #EAE2D0',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              🧹 ক্যাশ পরিষ্কার করে নতুন করে খুলুন
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
