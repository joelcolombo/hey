"use client";
import { ReactLenis } from "@studio-freight/react-lenis";

function SmoothScrolling({ children }) {
  return (
    <ReactLenis root options={{ lerp: 0.03, duration: 3, smoothWheel: true, smoothTouch: true }}>
      {children}
    </ReactLenis>
  );
}

export default SmoothScrolling;