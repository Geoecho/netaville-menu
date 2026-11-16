"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { productImages, type MenuItem } from "@/lib/menu";

export default function ProductGallery({
  item,
  className,
  intervalSeconds,
  placeholder,
  children,
}: {
  item: MenuItem;
  className: string;
  intervalSeconds: number;
  placeholder?: string;
  children?: ReactNode;
}) {
  const images = productImages(item);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const start = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();
  const active = images.length ? index % images.length : 0;
  function advance(direction: number) {
    setIndex(
      (previous) => (previous + direction + images.length) % images.length,
    );
  }
  useEffect(() => {
    if (images.length < 2 || paused || reduceMotion) return;
    const timer = setInterval(
      () => setIndex((previous) => (previous + 1) % images.length),
      intervalSeconds * 1000,
    );
    return () => clearInterval(timer);
  }, [images.length, intervalSeconds, paused, reduceMotion]);
  return (
    <div
      className={className}
      data-gallery={images.length > 1}
      role="group"
      aria-label={`${item.name} photos`}
      tabIndex={images.length > 1 ? 0 : undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
      onKeyDown={(e) => {
        if (images.length < 2) return;
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.stopPropagation();
          e.preventDefault();
          advance(e.key === "ArrowRight" ? 1 : -1);
        }
      }}
      onTouchStart={(e) => {
        if (images.length < 2) return;
        e.stopPropagation();
        start.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (images.length < 2) return;
        e.stopPropagation();
        if (start.current === null) return;
        const distance = e.changedTouches[0].clientX - start.current;
        start.current = null;
        if (Math.abs(distance) > 50) advance(distance < 0 ? 1 : -1);
      }}
    >
      <AnimatePresence initial={false}>
        {images.length > 0 ? (
          <motion.img
            key={images[active]}
            src={images[active]}
            alt={`${item.name}${images.length > 1 ? ` — photo ${active + 1} of ${images.length}` : ""}`}
            initial={{ opacity: reduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        ) : placeholder ? (
          <div className="photo-placeholder">{placeholder}</div>
        ) : null}
      </AnimatePresence>
      {images.length > 1 && (
        <>
          <span className="gallery-position" aria-live="off">
            {active + 1} / {images.length}
          </span>
          <div className="gallery-indicators" aria-label="Choose product photo">
            {images.map((src, at) => (
              <button
                key={src}
                type="button"
                aria-label={`Show photo ${at + 1} of ${item.name}`}
                aria-pressed={active === at}
                onClick={() => setIndex(at)}
              >
                <span />
              </button>
            ))}
          </div>
        </>
      )}
      {children}
    </div>
  );
}
