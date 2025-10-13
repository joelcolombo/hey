'use client';

import { useEffect, useRef } from 'react';
import { useLenis } from '@studio-freight/react-lenis';

export default function TrailContainer() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Hook into Lenis scroll events
  useLenis((lenis) => {
    // This will be called on every Lenis scroll frame
    // We'll trigger trail creation from here
    if (typeof window !== 'undefined' && containerRef.current) {
      const event = new CustomEvent('lenisScroll');
      window.dispatchEvent(event);
    }
  });

  useEffect(() => {
    // Configuration
    const config = {
      imageLifespan: 1000, // How long each image stays on screen (reduced from 2000)
      distanceThreshold: 50, // Min distance before creating new image
      revealDuration: 400, // Reveal transition duration (reduced from 600)
      fadeOutDuration: 300, // Fade out duration (reduced from 400)
      staggerReveal: 20, // Delay between each slice reveal (reduced from 30)
      staggerFadeOut: 15, // Delay between each slice fade out (reduced from 20)
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)' // Smooth easing
    };

    const totalImages = 25;
    const imagePaths = Array.from({ length: totalImages }, (_, i) =>
      `/images/pics/${i}.jpg`
    );

    const container = containerRef.current;
    if (!container) return;

    const isDesktop = window.innerWidth > 768;

    // State variables
    let currentIndex = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;
    let interpolatedMouseX = 0;
    let interpolatedMouseY = 0;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let animationFrameId: number | null = null;
    let trailImages: Array<{
      element: HTMLDivElement;
      createdAt: number;
      expiresAt: number;
    }> = [];
    let cleanupMouseListener: (() => void) | null = null;
    let lastScrollTime = 0;
    let scrollThrottleDelay = 100; // milliseconds between scroll trail images

    // Utility functions
    const mathUtils = {
      lerp: (start: number, end: number, factor: number) => {
        return start + (end - start) * factor;
      },
      distance: (x1: number, y1: number, x2: number, y2: number) => {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      }
    };

    const getMouseDistance = () => {
      return mathUtils.distance(
        currentMouseX,
        currentMouseY,
        lastMouseX,
        lastMouseY
      );
    };

    const isInTrailContainer = () => {
      const rect = container.getBoundingClientRect();
      return (
        currentMouseX >= rect.left &&
        currentMouseX <= rect.right &&
        currentMouseY >= rect.top &&
        currentMouseY <= rect.bottom
      );
    };

    const isNearFooter = () => {
      // Check if mouse is in bottom 100px of viewport (footer area)
      const footerZone = window.innerHeight - 100;
      return currentMouseY >= footerZone;
    };

    const isOverLink = () => {
      // Check if mouse is over any link element
      const element = document.elementFromPoint(currentMouseX, currentMouseY);
      if (!element) return false;

      // Check if element itself is a link or is inside a link
      return element.closest('a') !== null;
    };

    // Create trail image function
    const createTrailImage = (isScrollTriggered = false) => {
      const trailImage = document.createElement('div');
      trailImage.className = 'trailImage';

      // Get next image and cycle through
      const imagePath = imagePaths[currentIndex];
      currentIndex = (currentIndex + 1) % totalImages;

      // Calculate position (use screen coordinates)
      const startX = interpolatedMouseX;
      const startY = interpolatedMouseY;
      const endX = currentMouseX;
      const endY = currentMouseY;

      // Set initial position and transition
      trailImage.style.left = `${startX}px`;
      trailImage.style.top = `${startY}px`;
      trailImage.style.transform = 'translate(-50%, -50%)';

      // For scroll-triggered images, don't animate position (stay fixed)
      if (!isScrollTriggered) {
        trailImage.style.transition = `left 0.6s ${config.easing}, top 0.6s ${config.easing}`;
      }

      // Create mask layers (10 slices)
      const numSlices = 10;
      for (let i = 0; i < numSlices; i++) {
        const maskLayer = document.createElement('div');
        maskLayer.className = 'maskLayer';
        maskLayer.style.top = `${(i * 100) / numSlices}%`;

        // Initially collapsed with clip-path
        maskLayer.style.clipPath = 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)';
        maskLayer.style.transition = `clip-path ${config.revealDuration}ms ${config.easing}`;

        // Create image layer inside mask
        const imageLayer = document.createElement('div');
        imageLayer.className = 'imageLayer';
        imageLayer.style.backgroundImage = `url(${imagePath})`;
        imageLayer.style.top = `-${i * 100}%`;
        imageLayer.style.transition = `opacity ${config.fadeOutDuration}ms ${config.easing}`;

        maskLayer.appendChild(imageLayer);
        trailImage.appendChild(maskLayer);
      }

      // Add to DOM
      container.appendChild(trailImage);

      // Animate position and reveal
      requestAnimationFrame(() => {
        // Only update position for mouse movement (not scroll)
        if (!isScrollTriggered) {
          trailImage.style.left = `${endX}px`;
          trailImage.style.top = `${endY}px`;
        }

        // Animate mask layers open with stagger
        const maskLayers = trailImage.querySelectorAll('.maskLayer');
        maskLayers.forEach((layer, index) => {
          const delay = Math.abs(index - numSlices / 2) * config.staggerReveal;

          setTimeout(() => {
            (layer as HTMLElement).style.clipPath = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
          }, delay);
        });
      });

      // Store trail image with expiration time
      trailImages.push({
        element: trailImage,
        createdAt: Date.now(),
        expiresAt: Date.now() + config.imageLifespan
      });
    };

    // Remove old images function
    const removeOldImages = () => {
      if (trailImages.length === 0) return;

      const now = Date.now();
      const oldestImage = trailImages[0];

      if (now >= oldestImage.expiresAt) {
        const element = oldestImage.element;
        const maskLayers = element.querySelectorAll('.maskLayer');
        const numSlices = maskLayers.length;

        // Animate mask layers closing
        maskLayers.forEach((layer, index) => {
          const delay = Math.abs(index - numSlices / 2) * config.staggerFadeOut;

          setTimeout(() => {
            (layer as HTMLElement).style.clipPath = 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)';
          }, delay);

          // Also fade out the image
          const imageLayer = layer.querySelector('.imageLayer');
          if (imageLayer) {
            setTimeout(() => {
              (imageLayer as HTMLElement).style.opacity = '0';
            }, delay);
          }
        });

        // Remove from DOM after animation
        setTimeout(() => {
          element.remove();
        }, config.revealDuration + config.staggerFadeOut * numSlices);

        // Remove from array
        trailImages.shift();
      }
    };

    // Render loop
    const render = () => {
      if (!isDesktop) return;

      const mouseDistance = getMouseDistance();

      // Smooth interpolation
      interpolatedMouseX = mathUtils.lerp(interpolatedMouseX, currentMouseX, 0.1);
      interpolatedMouseY = mathUtils.lerp(interpolatedMouseY, currentMouseY, 0.1);

      // Create new trail image if threshold met, not near footer, and not over a link
      if (mouseDistance > config.distanceThreshold && !isNearFooter() && !isOverLink()) {
        createTrailImage();
        lastMouseX = currentMouseX;
        lastMouseY = currentMouseY;
      }

      // Clean up old images
      removeOldImages();

      animationFrameId = requestAnimationFrame(render);
    };

    // Start animation
    const startAnimation = () => {
      if (!isDesktop) return null;

      const handleMouseMove = (e: MouseEvent) => {
        currentMouseX = e.clientX;
        currentMouseY = e.clientY;
      };

      const createScrollTrailImage = () => {
        const now = Date.now();
        if (now - lastScrollTime < scrollThrottleDelay) {
          return; // Throttle: skip if too soon since last trail
        }

        // Don't create trail if near footer or over a link
        if (isNearFooter() || isOverLink()) {
          return;
        }

        lastScrollTime = now;

        if (currentMouseX !== 0 || currentMouseY !== 0) {
          interpolatedMouseX = currentMouseX;
          interpolatedMouseY = currentMouseY;
          createTrailImage(true); // Pass true to indicate scroll-triggered
          lastMouseX = currentMouseX;
          lastMouseY = currentMouseY;
        }
      };

      const handleScroll = () => {
        createScrollTrailImage();
      };

      const handleWheel = (e: WheelEvent) => {
        // Update mouse position from wheel event
        currentMouseX = e.clientX;
        currentMouseY = e.clientY;
        createScrollTrailImage();
      };

      const handleLenisScroll = () => {
        // Handle Lenis smooth scroll events
        createScrollTrailImage();
      };

      document.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('wheel', handleWheel, { passive: true });
      window.addEventListener('lenisScroll', handleLenisScroll);
      animationFrameId = requestAnimationFrame(render);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('wheel', handleWheel);
        window.removeEventListener('lenisScroll', handleLenisScroll);
      };
    };

    // Stop animation
    const stopAnimation = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      // Remove all trail images
      trailImages.forEach(({ element }) => {
        element.remove();
      });
      trailImages = [];
    };

    // Handle resize
    const handleResize = () => {
      const wasDesktop = isDesktop;
      const isNowDesktop = window.innerWidth > 768;

      if (!wasDesktop && isNowDesktop) {
        cleanupMouseListener = startAnimation();
      } else if (wasDesktop && !isNowDesktop) {
        stopAnimation();
        if (cleanupMouseListener) {
          cleanupMouseListener();
        }
      }
    };

    // Initialize
    window.addEventListener('resize', handleResize);

    if (isDesktop) {
      cleanupMouseListener = startAnimation();
    }

    // Cleanup
    return () => {
      stopAnimation();
      if (cleanupMouseListener) {
        cleanupMouseListener();
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <div ref={containerRef} className="trailContainer" />;
}
