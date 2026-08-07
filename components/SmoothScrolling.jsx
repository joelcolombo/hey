"use client";
import { ReactLenis } from "@studio-freight/react-lenis";

function SmoothScrolling({ children }) {
  return (
    <ReactLenis root options={{ lerp: 0.12, duration: 1.2, smoothWheel: true, smoothTouch: true }}>
      {children}
    </ReactLenis>
  );
}

export default SmoothScrolling;