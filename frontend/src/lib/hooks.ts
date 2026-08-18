import { useEffect, useRef, useState } from 'react';

// Reveal on scroll: aplica a classe .visible quando o elemento entra na viewport.
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    el.querySelectorAll('.reveal').forEach((n) => io.observe(n));
    if (el.classList.contains('reveal')) io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

// Hook para obter o progresso de scroll (0..1) usado no efeito 3D da foto.
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return progress;
}

// Mouse parallax tilt para elementos .cutout-frame dentro do wrapper.
export function useTilt<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const wrap = ref.current;
    if (!wrap) return;
    const onMove = (e: MouseEvent) => {
      wrap.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const rx = (e.clientY - cy) / rect.height;
        const ry = (e.clientX - cx) / rect.width;
        el.style.transform = `rotateX(${(-rx * 14).toFixed(2)}deg) rotateY(${(ry * 18).toFixed(2)}deg)`;
      });
    };
    const onLeave = () => {
      wrap.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
        el.style.transform = '';
      });
    };
    wrap.addEventListener('mousemove', onMove);
    wrap.addEventListener('mouseleave', onLeave);
    return () => {
      wrap.removeEventListener('mousemove', onMove);
      wrap.removeEventListener('mouseleave', onLeave);
    };
  }, []);
  return ref;
}
