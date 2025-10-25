'use client';

export default function BilliardsPage() {
  return (
    <iframe
      src="/play/billiards/index.html"
      style={{
        width: '100vw',
        height: '100vh',
        border: 'none',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0
      }}
      title="Interactive Billiards Game"
    />
  );
}