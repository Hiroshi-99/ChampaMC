import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Preload critical assets for better performance
const preloadAssets = () => {
  // Preload rank images
  const rankImages = [
    'https://i.imgur.com/NX3RB4i.png', // VIP
    'https://i.imgur.com/gmlFpV2.png', // MVP
    'https://i.imgur.com/C4VE5b0.png', // MVP+
    'https://i.imgur.com/fiqqcOY.png', // LEGEND
    'https://i.imgur.com/z0zBiyZ.png', // DEVIL
    'https://i.imgur.com/SW6dtYW.png', // INFINITY
    'https://i.imgur.com/5xEinAj.png', // CHAMPA
  ];

  // Create link elements for preloading images
  rankImages.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });

  // Preload payment QR code
  const paymentQR = document.createElement('link');
  paymentQR.rel = 'preload';
  paymentQR.as = 'image';
  paymentQR.href = 'https://i.imgur.com/xmzqO4S.jpeg';
  document.head.appendChild(paymentQR);

  // Preload banner image
  const banner = document.createElement('link');
  banner.rel = 'preload';
  banner.as = 'image';
  banner.href = '/images/banner.gif';
  document.head.appendChild(banner);
};

// Preload assets in non-blocking way
if (window.requestIdleCallback) {
  window.requestIdleCallback(preloadAssets);
} else {
  setTimeout(preloadAssets, 500);
}

// Mount app with StrictMode for better development experience
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
