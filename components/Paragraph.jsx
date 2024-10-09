import { motion, useScroll, useTransform } from 'framer-motion';
import React, { useRef } from 'react';
import styles from './style.module.css';

export default function Paragraph({paragraph}) {

  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start 1", "start 0.15"]
  })

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <motion.p 
      ref={container}         
      className={styles.paragraph}
      style={{opacity}}
    >
      {paragraph}
    </motion.p>
  )
}