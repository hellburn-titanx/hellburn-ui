import { useRef, useEffect } from "react";

export default function FireCanvas() {
  const ref = useRef(null);
  const particles = useRef([]);
  const raf = useRef(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const resize = () => { c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2; };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      // Spawn
      for (let i = 0; i < 2; i++) {
        particles.current.push({
          x: Math.random() * c.width, y: c.height + 10,
          vx: (Math.random() - 0.5) * 1.5, vy: -(1.5 + Math.random() * 3),
          r: 1.5 + Math.random() * 3, life: 1,
          decay: 0.003 + Math.random() * 0.008,
          hue: 10 + Math.random() * 30,
        });
      }
      particles.current = particles.current.filter((p) => {
        p.x += p.vx; p.y += p.vy; p.vy *= 0.99; p.life -= p.decay;
        if (p.life <= 0) return false;
        const a = p.life * 0.6;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        g.addColorStop(0, `hsla(${p.hue},100%,65%,${a})`);
        g.addColorStop(0.4, `hsla(${p.hue - 5},95%,50%,${a * 0.5})`);
        g.addColorStop(1, `hsla(${p.hue - 10},90%,30%,0)`);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        return true;
      });
      raf.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} className="fixed inset-0 w-full h-full opacity-30 pointer-events-none z-0" />;
}
