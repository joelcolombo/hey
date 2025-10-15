"use client";

import { motion } from 'framer-motion';

interface EqualizerProps {
  isPlaying?: boolean;
}

export default function Equalizer({ isPlaying = true }: EqualizerProps) {
  const bars = [
    { height: 21.25, delay: 0 },
    { height: 13.75, delay: 0.1 },
    { height: 7.625, delay: 0.2 },
    { height: 14.875, delay: 0.3 },
    { height: 12.5, delay: 0.4 },
    { height: 17.063, delay: 0.5 },
    { height: 21.25, delay: 0.6 },
    { height: 10.125, delay: 0.7 },
  ];

  return (
    <div className="inline-flex gap-[2px] items-end h-[21.25px]">
      {bars.map((bar, index) => (
        <motion.div
          key={index}
          className="w-[2.5px] bg-[var(--foreground)]"
          initial={{ height: `${bar.height}px` }}
          animate={
            isPlaying
              ? {
                  height: [`${bar.height}px`, `${bar.height * 0.5}px`, `${bar.height}px`],
                }
              : {
                  height: `${bar.height * 0.3}px`,
                }
          }
          transition={{
            duration: 0.8,
            repeat: isPlaying ? Infinity : 0,
            ease: "easeInOut",
            delay: bar.delay,
          }}
        />
      ))}
    </div>
  );
}

