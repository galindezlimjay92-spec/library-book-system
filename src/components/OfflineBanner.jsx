import { useEffect, useState } from 'react';

export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      className="alert alert-warning text-center mb-0 rounded-0 position-fixed bottom-0 start-0 end-0"
      style={{ zIndex: 2000 }}
      role="alert"
    >
      <i className="bi bi-wifi-off me-2"></i>
      Offline ka ngayon. Makikita mo pa rin ang mga dating na-load na data.
    </div>
  );
}