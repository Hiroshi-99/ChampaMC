import React, { useState, useEffect } from 'react';

/**
 * Image Proxy Utility
 * Helps fetch external images and convert them to data URLs to bypass CSP restrictions
 */

// Cache for already fetched images to avoid multiple network requests
const imageCache = new Map<string, string>();

/**
 * Fetches an image from an external URL and converts it to a data URL
 * This allows displaying images from domains not in the CSP without adding them to CSP
 * 
 * @param url The URL of the image to fetch
 * @returns A promise that resolves to a data URL of the image
 */
export const proxyImage = async (url: string): Promise<string> => {
  // If the URL is already a data URL, return it as is
  if (url.startsWith('data:')) {
    return url;
  }

  // Check if the image is already in the cache
  if (imageCache.has(url)) {
    return imageCache.get(url)!;
  }

  try {
    // Fetch the image
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // Get the image as a blob
    const blob = await response.blob();

    // Convert the blob to a data URL
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Cache the result
        imageCache.set(url, dataUrl);
        resolve(dataUrl);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    // Return a placeholder on error
    return '/assets/placeholder-payment.png';
  }
};

/**
 * React hook wrapper for the proxyImage function
 * Loads the image asynchronously and sets a local state
 * 
 * @param url The URL of the image to proxy
 * @param fallbackUrl The URL to use if proxying fails
 * @returns The proxied image URL or fallback URL
 */
export const useProxyImage = (url: string, fallbackUrl = '/assets/placeholder-payment.png'): string => {
  const [proxiedUrl, setProxiedUrl] = useState<string>(fallbackUrl);

  useEffect(() => {
    let isMounted = true;
    
    if (!url) {
      setProxiedUrl(fallbackUrl);
      return;
    }

    // If it's a local URL, don't proxy it
    if (url.startsWith('/') || url.startsWith('data:')) {
      setProxiedUrl(url);
      return;
    }

    proxyImage(url)
      .then(dataUrl => {
        if (isMounted) {
          setProxiedUrl(dataUrl);
        }
      })
      .catch(() => {
        if (isMounted) {
          setProxiedUrl(fallbackUrl);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [url, fallbackUrl]);

  return proxiedUrl;
}; 