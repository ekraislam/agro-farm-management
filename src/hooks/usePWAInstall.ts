import { useState, useEffect } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/** Register the production Service Worker for 100% offline support */
function registerProductionServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const doRegister = () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Check for updates periodically
        setInterval(() => {
          reg.update().catch(() => {});
        }, 5 * 60 * 1000);
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });
  };

  if (document.readyState === 'complete') {
    // Slight defer to never compete with critical first paint
    setTimeout(doRegister, 1000);
  } else {
    window.addEventListener('load', () => setTimeout(doRegister, 1000), { once: true });
  }
}

// Kick off registration
registerProductionServiceWorker();

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    // Check if running in standalone PWA display mode
    const isStandalone =
      (typeof window !== 'undefined' &&
        window.matchMedia('(display-mode: standalone)').matches) ||
      (typeof window !== 'undefined' &&
        (window.navigator as unknown as { standalone?: boolean }).standalone === true);

    if (isStandalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          setIsModalOpen(false);
          return;
        }
      } catch {
        // Fallback to guide modal
      }
    }
    setIsModalOpen(true);
  };

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isModalOpen,
    setIsModalOpen,
    triggerInstall,
    deferredPrompt,
    isOnline,
  };
}
