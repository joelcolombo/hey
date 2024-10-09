'use client';
import Character from '../components/Character';

const paragraph = "I'm Joel Colombo, a designer turned entrepreneur. My journey started as an independent designer and evolved into co-founding and leading a design agency. What really drives me is helping other founders bring their vision to life through design, technology & strategy. After twenty years of restless work, I'm taking a sabbatical to reflect, recharge, and prepare for my next adventure. While still on a career break, I'm always open to meeting new people and exploring fresh ideas. Let's connect!"

export default function Home() {
  return (
    <main>
      <div style={{height: "50vh"}}></div>
      <Character paragraph={paragraph}/>
      <div style={{height: "50vh"}}></div>
    </main>
  )
}