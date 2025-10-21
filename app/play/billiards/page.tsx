import Script from 'next/script';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://joelcolombo.co'),
  title: 'Joel Colombo ✦ Interactive Billiards',
  description: 'Play with interactive physics-based billiards balls. Drag and throw the 8-balls to see realistic collision physics in action.',
  keywords: ['Joel Colombo', 'Creative Director', 'Interactive Design', 'Physics Simulation', 'Billiards', 'WebGL', 'Three.js', 'Creative Coding', 'Web Experiment'],
  authors: [{ name: 'Joel Colombo' }],
  creator: 'Joel Colombo',
  openGraph: {
    title: 'Joel Colombo ✦ Interactive Billiards',
    description: 'Play with interactive physics-based billiards balls. Drag and throw the 8-balls to see realistic collision physics in action.',
    url: 'https://joelcolombo.co/play/billiards',
    siteName: 'Joel Colombo',
    images: [
      {
        url: 'https://joelcolombo.co/play/billiards/og-joelcolombo-play-billiards.png',
        width: 1200,
        height: 630,
        alt: 'Interactive billiards game with 8-balls spelling HEY JOE FC',
      },
    ],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Joel Colombo ✦ Interactive Billiards',
    description: 'Play with interactive physics-based billiards balls. Drag and throw the 8-balls to see realistic collision physics in action.',
    images: ['https://joelcolombo.co/play/billiards/og-joelcolombo-play-billiards.png'],
    creator: '@joelcolombo',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function BilliardsPage() {
  return (
    <>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" strategy="beforeInteractive" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/cannon@0.6.2/build/cannon.min.js" strategy="beforeInteractive" />

      <div dangerouslySetInnerHTML={{ __html: `
        <style>
            body {
                margin: 0;
                overflow: hidden;
                font-family: 'Arial', sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                cursor: grab;
                user-select: none;
            }
            body.grabbing {
                cursor: grabbing;
            }
            #loading {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 24px;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                z-index: 1000;
            }

            /* Logo */
            #logo {
                position: fixed;
                top: 20px;
                left: 20px;
                z-index: 100;
                opacity: 0.9;
                transition: opacity 0.3s ease;
            }

            #logo:hover {
                opacity: 1;
            }

            #logo img {
                height: 40px;
                width: auto;
            }

            /* Instructions */
            #instructions {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                color: white;
                font-size: 14px;
                text-align: center;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                z-index: 100;
                pointer-events: none;
                opacity: 0.8;
            }

            /* Easter egg notification */
            .easter-egg-notification {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
                padding: 20px 40px;
                border-radius: 20px;
                font-size: 24px;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                z-index: 1000;
                animation: popIn 0.3s ease-out;
                pointer-events: none;
            }

            @keyframes popIn {
                0% {
                    transform: translate(-50%, -50%) scale(0);
                    opacity: 0;
                }
                50% {
                    transform: translate(-50%, -50%) scale(1.1);
                }
                100% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 1;
                }
            }

            .easter-egg-notification.fade-out {
                animation: fadeOut 0.3s ease-out forwards;
            }

            @keyframes fadeOut {
                to {
                    transform: translate(-50%, -50%) scale(0.9);
                    opacity: 0;
                }
            }
        </style>

        <div id="loading">Loading HEY JOE FC...</div>

        <!-- Logo/Home Link -->
        <a href="/" id="logo" title="Back to home">
            <img src="https://joelcolombo.co/images/logo-joelcolombo.gif" alt="Joel Colombo">
        </a>

        <!-- Instructions -->
        <div id="instructions">
            🎱 Drag and throw the balls • Click anywhere to reset • Find the easter egg!
        </div>

        <script>
            // Global variables for three.js scene
            let scene, camera, renderer;
            let world;
            let balls = [];
            let ballBodies = [];
            let ballMeshes = [];
            let groundBody;
            let isDragging = false;
            let draggedBall = null;
            let draggedBody = null;
            let mouseConstraint = null;
            let raycaster = new THREE.Raycaster();
            let mouse = new THREE.Vector2();
            let dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
            let dragStartPoint = new THREE.Vector3();
            let dragStartTime = 0;
            let lastMousePosition = { x: 0, y: 0 };
            let mouseVelocity = { x: 0, y: 0 };
            let easterEggTriggered = false;
            let clickStartTime = 0;
            let clickStartPosition = { x: 0, y: 0 };

            const ballLetters = ['H', 'E', 'Y', 'J', 'O', 'E', 'F', 'C'];
            const ballPositions = [
                { x: -3.5, y: 3 },
                { x: -2.5, y: 3 },
                { x: -1.5, y: 3 },
                { x: -0.5, y: 3 },
                { x: 0.5, y: 3 },
                { x: 1.5, y: 3 },
                { x: 2.5, y: 3 },
                { x: 3.5, y: 3 }
            ];

            // Helper function to check easter egg
            function checkEasterEgg() {
                const tolerance = 0.5;
                const targetOrder = ['J', 'O', 'E', 'L'];

                const sortedBalls = balls
                    .filter(ball => targetOrder.includes(ball.userData.letter))
                    .sort((a, b) => a.position.x - b.position.x);

                if (sortedBalls.length !== 4) return false;

                const letters = sortedBalls.map(ball => ball.userData.letter).join('');

                if (letters === 'JOEL') {
                    const firstBall = sortedBalls[0];
                    const lastBall = sortedBalls[3];

                    for (let i = 1; i < sortedBalls.length; i++) {
                        const expectedX = firstBall.position.x + i * 1.1;
                        if (Math.abs(sortedBalls[i].position.x - expectedX) > tolerance) {
                            return false;
                        }

                        if (Math.abs(sortedBalls[i].position.y - firstBall.position.y) > tolerance) {
                            return false;
                        }
                    }

                    return true;
                }

                return false;
            }

            function showEasterEgg() {
                if (easterEggTriggered) return;
                easterEggTriggered = true;

                const notification = document.createElement('div');
                notification.className = 'easter-egg-notification';
                notification.textContent = '🎉 You found it! JOEL! 🎉';
                document.body.appendChild(notification);

                setTimeout(() => {
                    notification.classList.add('fade-out');
                    setTimeout(() => notification.remove(), 300);
                }, 2000);
            }
        </script>
      ` }} />

      <Script src="/play/billiards/billiards.js" strategy="afterInteractive" />
    </>
  );
}