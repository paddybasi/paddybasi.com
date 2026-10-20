import { useEffect, useRef } from 'react';

interface Props {
  items: { label: string; group: number }[];
}

const GROUP_CLASSES = ['text-violet', 'text-cyan', 'text-lime', 'text-fg'];

/** Even spread of n points on a unit sphere. */
function fibonacciSphere(n: number): [number, number, number][] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    return [Math.cos(golden * i) * r, y, Math.sin(golden * i) * r];
  });
}

/**
 * Drag-to-spin 3D tag sphere, projected onto plain DOM text: crisp, cheap, no WebGL.
 * Decorative (aria-hidden); the same skills are listed in the cards beside it.
 */
export default function SkillSphere({ items }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const tags = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const points = fibonacciSphere(items.length);
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const auto = still ? 0 : 0.004;
    const rot = { x: -0.3, y: 0 };
    const vel = { x: 0, y: auto };
    let drag: { x: number; y: number } | null = null;
    let frame = 0;
    let running = false;

    const render = () => {
      const radius = el.clientWidth * 0.42;
      const [cx, sx, cy, sy] = [Math.cos(rot.x), Math.sin(rot.x), Math.cos(rot.y), Math.sin(rot.y)];
      points.forEach(([x, y, z], i) => {
        const tag = tags.current[i];
        if (!tag) return;
        const x1 = x * cy + z * sy;
        const z1 = z * cy - x * sy;
        const y2 = y * cx - z1 * sx;
        const z2 = y * sx + z1 * cx; // -1 (back) … 1 (front)
        const depth = (z2 + 1) / 2;
        tag.style.transform = `translate(-50%, -50%) translate3d(${x1 * radius}px, ${y2 * radius}px, 0) scale(${0.6 + depth * 0.6})`;
        tag.style.opacity = String(0.15 + depth * 0.85);
        tag.style.zIndex = String(Math.round(depth * 100));
        tag.style.filter = depth < 0.35 ? 'blur(1px)' : '';
      });
    };

    const tick = () => {
      if (!drag) {
        // Ease back to the idle spin after a flick.
        vel.x *= 0.95;
        vel.y += (auto - vel.y) * 0.03;
      }
      rot.x = Math.max(-1.2, Math.min(1.2, rot.x + vel.x));
      rot.y += vel.y;
      render();
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const down = (e: PointerEvent) => {
      drag = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      vel.y = (e.clientX - drag.x) * 0.004;
      vel.x = -(e.clientY - drag.y) * 0.004;
      drag = { x: e.clientX, y: e.clientY };
    };
    const up = () => {
      drag = null;
    };

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    io.observe(el);
    render();

    return () => {
      stop();
      io.disconnect();
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, [items]);

  return (
    <div
      ref={box}
      aria-hidden="true"
      className="relative aspect-square w-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
    >
      <div className="absolute inset-[18%] rounded-full bg-gradient-to-tr from-violet/20 via-cyan/10 to-lime/10 blur-3xl" />
      {items.map((item, i) => (
        <span
          key={item.label}
          ref={(n) => {
            tags.current[i] = n;
          }}
          className={`absolute top-1/2 left-1/2 font-mono text-xs font-medium whitespace-nowrap will-change-transform sm:text-sm ${GROUP_CLASSES[item.group % GROUP_CLASSES.length]}`}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}
