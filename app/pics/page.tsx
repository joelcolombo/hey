'use client'
import styles from './page.module.css'
import { useRef } from 'react';

export default function Images() {

  let steps: number = 0;
  let currentIndex: number = 0;
  let nbOfImages: number = 0;
  let maxNumberOfImages: number = 8;
  let refs: React.RefObject<HTMLImageElement>[] = [];

  const manageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, movementX, movementY } = e;

    steps += Math.abs(movementX) + Math.abs(movementY);

    if (steps >= currentIndex * 150) {
      moveImage(clientX, clientY);

      if (nbOfImages === maxNumberOfImages) {
        removeImage();
      }
    }

    if (currentIndex === refs.length) {
      currentIndex = 0;
      steps = -150;
    }
  }

  const moveImage = (x: number, y: number) => {
    const currentImage = refs[currentIndex].current;
    if (currentImage) {
      currentImage.style.left = x + "px";
      currentImage.style.top = y + "px";
      currentImage.style.display = "block";
    }
    currentIndex++;
    nbOfImages++;
    setZIndex();
  }

  const setZIndex = () => {
    const images = getCurrentImages();
    for (let i = 0; i < images.length; i++) {
      images[i].style.zIndex = i.toString();
    }
  }

  const removeImage = () => {
    const images = getCurrentImages();
    if (images[0]) {
      images[0].style.display = "none";
    }
    nbOfImages--;
  }

  const getCurrentImages = () => {
    let images: HTMLImageElement[] = [];
    let indexOfFirst = currentIndex - nbOfImages;
    for (let i = indexOfFirst; i < currentIndex; i++) {
      let targetIndex = i;
      if (targetIndex < 0) targetIndex += refs.length;
      images.push(refs[targetIndex].current!);
    }
    return images;
  }

  return (
    <div onMouseMove={manageMouseMove} className={styles.main}>
      {
        Array.from({length: 19}, (_, index) => {
          const ref = useRef<HTMLImageElement>(null);
          refs.push(ref);
          return <img key={index} onClick={() => { console.log(refs) }} ref={ref} src={`/images/pics/${index}.jpg`} />;
        })
      }
    </div>
  )
}
