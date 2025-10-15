"use client";

import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 2.5 }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-50 pointer-events-none flex items-center justify-start"
    >
      {/* Centered Message */}
      <div className="pl-[16px] pr-[20px] max-md:pl-[16px] max-md:pr-[16px] w-[1093.78px] max-w-full">
        <h1 className="text-left font-normal text-[80px] leading-[1.2em] max-md:text-[2.5em] max-md:leading-[1.2em]" style={{ fontWeight: 400 }}>
          The thing you were searching for got lost… but the music found you instead.
        </h1>
      </div>
    </motion.div>
  );
}
