import { useEffect, useRef, useState } from 'react';

/* ==========================================================================
   Scroll primitives

   No animation library. Everything here is one rAF-throttled scroll listener
   feeding plain numbers, so a section can scale an image, drift a photograph
   past a headline, or pin a sequence without pulling in a runtime.

   The app scrolls inside `.body`, not the window, so every hook resolves its
   own scroller rather than assuming document.
   ========================================================================== */

const scrollerOf = (el: Element | null): HTMLElement | Window => {
  let node = el?.parentElement ?? null;
  while (node) {
    const oy = getComputedStyle(node).overflowY;
    if (oy === 'auto' || oy === 'scroll') return node;
    node = node.parentElement;
  }
  return window;
};

const viewportOf = (s: HTMLElement | Window) =>
  s === window ? window.innerHeight : (s as HTMLElement).clientHeight;

/** True once the element has come into view; stays true (reveal-once). */
export function useInView<T extends HTMLElement>(rootMargin = '-12% 0px -12% 0px') {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return [ref, seen] as const;
}

/**
 * 0 → 1 as the element travels through the viewport.
 * 0 when its top hits the bottom edge, 1 when its bottom leaves the top.
 */
export function useProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [p, setP] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setP(0.5);
      return;
    }

    const scroller = scrollerOf(el);
    let frame = 0;

    const read = () => {
      frame = 0;
      const vh = viewportOf(scroller);
      const r = el.getBoundingClientRect();
      const top = scroller === window ? r.top : r.top - (scroller as HTMLElement).getBoundingClientRect().top;
      const span = r.height + vh;
      setP(Math.min(1, Math.max(0, (vh - top) / span)));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };

    read();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return [ref, p] as const;
}

/**
 * For a section taller than the viewport that pins its contents: returns how
 * far through the pinned run we are, 0 → 1, and which step that lands on.
 */
export function usePinned<T extends HTMLElement>(steps: number) {
  const ref = useRef<T>(null);
  const [p, setP] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const scroller = scrollerOf(el);
    let frame = 0;

    const read = () => {
      frame = 0;
      const vh = viewportOf(scroller);
      const r = el.getBoundingClientRect();
      const top = scroller === window ? r.top : r.top - (scroller as HTMLElement).getBoundingClientRect().top;
      /* Runs from the moment the section tops out to when its tail clears. */
      const travel = Math.max(1, r.height - vh);
      setP(Math.min(1, Math.max(0, -top / travel)));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };

    read();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const index = Math.min(steps - 1, Math.floor(p * steps * 0.999));
  return [ref, p, index] as const;
}

/** Maps p from one range onto another, clamped. */
export const map = (p: number, a: number, b: number, from: number, to: number) => {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a || 1)));
  return from + (to - from) * t;
};
