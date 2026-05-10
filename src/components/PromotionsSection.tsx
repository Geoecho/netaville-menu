"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { BorderBeam } from "./magicui/border-beam";
import { CoolMode } from "./magicui/cool-mode";

interface Promotion {
  id: number;
  name: string;
  price: string;
  description: string;
  imageUrl: string;
  category: "New" | "Recommended";
  label?: "Drink" | "Food";
}

const PROMOTIONS: Promotion[] = [
  {
    id: 1,
    name: "Ceremonial Matcha",
    price: "250 MKD",
    category: "Recommended",
    label: "Drink",
    description: "Premium stone-ground Japanese matcha whisked to perfection. Velvety smooth with a deep umami finish.",
    imageUrl: "https://images.unsplash.com/photo-1582793988951-9aed55099991?auto=format&fit=crop&q=80&w=1000",
  },
  {
    id: 2,
    name: "Dark Choc Cookie",
    price: "120 MKD",
    category: "Recommended",
    label: "Food",
    description: "Soft-baked with 70% cacao chunks and a touch of sea salt. The perfect companion for your drink.",
    imageUrl: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=1000",
  },
  {
    id: 3,
    name: "Iced Latte",
    price: "180 MKD",
    category: "New",
    label: "Drink",
    description: "Double shot of specialty espresso poured over chilled milk and ice. Refreshing and bold.",
    imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=1000",
  },
  {
    id: 4,
    name: "Artisan Pastry",
    category: "New",
    label: "Food",
    description: "Hand-rolled layers of buttery dough, baked until golden and crisp. Selection varies daily.",
    price: "150 MKD",
    imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=1000",
  },
];

export default function PromotionsSection() {
  const [promotions, setPromotions] = useState<Promotion[]>(PROMOTIONS);
  const [activeCategory, setActiveCategory] = useState<"New" | "Recommended">("Recommended");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const handleCategoryChange = (category: "New" | "Recommended") => {
    if (category === activeCategory) return;
    setDirection(category === "Recommended" ? -1 : 1);
    setActiveCategory(category);
    setCurrentIndex(0);
  };

  const filteredPromotions = promotions.filter(p => p.category === activeCategory);
  
  // Removed the useEffect that was resetting currentIndex without direction

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/promotions");
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            setPromotions(data);
            return;
          }
        }
      } catch { /* API not available */ }
      // Fallback to localStorage
      const saved = localStorage.getItem("netaville_promotions");
      if (saved) {
        const parsed = JSON.parse(saved);
        const withCategories = parsed.map((p: any, i: number) => ({
          ...p,
          category: p.category || (i % 2 === 0 ? "Recommended" : "New")
        }));
        setPromotions(withCategories);
      }
    };
    load();
  }, []);

  useEffect(() => {
    promotions.forEach((promo) => {
      const img = new window.Image();
      img.src = promo.imageUrl;
    });
  }, [promotions]);

  const nextSlide = useCallback(() => {
    if (filteredPromotions.length === 0) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex >= filteredPromotions.length) {
      setDirection(1);
      const nextCategory = activeCategory === "Recommended" ? "New" : "Recommended";
      setActiveCategory(nextCategory);
    } else {
      setDirection(1);
      setCurrentIndex(nextIndex);
    }
  }, [filteredPromotions.length, currentIndex, activeCategory]);

  useEffect(() => {
    const timer = setInterval(nextSlide, 10000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const currentPromotion = filteredPromotions[currentIndex];

  if (!currentPromotion) return null;

  return (
    <section className="h-[78vh] w-full relative rounded-lg">
      <BorderBeam 
        duration={8} 
        colorFrom="#00BFFE" 
        colorTo="#00BFFE" 
        borderWidth={2}
      />

      <div className="absolute inset-0 overflow-hidden rounded-[inherit] bg-white border-t border-zinc-100">
        <div className="absolute top-8 left-8 md:left-12 lg:left-16 z-50">
          <div className="relative grid grid-cols-2 bg-zinc-100/80 backdrop-blur-md p-1.5 rounded-[1.25rem] border border-zinc-200/50 shadow-sm">
            <div className="absolute inset-1.5 pointer-events-none z-0">
              <motion.div
                className="h-full w-1/2 bg-white rounded-xl shadow-md"
                initial={false}
                animate={{ x: activeCategory === "Recommended" ? "0%" : "100%" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            </div>
            {(["Recommended", "New"] as const).map((tab) => (
              <CoolMode key={tab} options={{ particle: "/netaville-logo.svg", particleCount: 12 }}>
                <button
                  onClick={() => handleCategoryChange(tab)}
                  className="relative z-10 w-full px-8 py-3.5 rounded-xl text-[14px] font-bold tracking-tight transition-colors duration-300"
                >
                  <span className={`flex items-center justify-center gap-2 ${activeCategory === tab ? "text-[#00BFFE]" : "text-zinc-500 hover:text-zinc-800"}`}>
                    {tab === "Recommended" ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    )}
                    {tab}
                  </span>
                </button>
              </CoolMode>
            ))}
          </div>
        </div>

        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={`${activeCategory}-${currentIndex}`}
            custom={direction}
            variants={{
              enter: (direction: number) => ({
                x: direction > 0 ? "100%" : "-100%",
                opacity: 0,
              }),
              center: {
                zIndex: 1,
                x: 0,
                opacity: 1,
              },
              exit: (direction: number) => ({
                zIndex: 0,
                x: direction < 0 ? "100%" : "-100%",
                opacity: 0,
              }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 35 },
              opacity: { duration: 0.3 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              if (filteredPromotions.length <= 1) return;
              const swipe = Math.abs(offset.x) > 50 && Math.abs(velocity.x) > 500;
              if (swipe) {
                if (offset.x > 0) {
                  setDirection(-1);
                  setCurrentIndex((prev) => (prev - 1 + filteredPromotions.length) % filteredPromotions.length);
                } else {
                  setDirection(1);
                  setCurrentIndex((prev) => (prev + 1) % filteredPromotions.length);
                }
              }
            }}
            style={{ willChange: "transform" }}
            className="absolute inset-0 flex flex-col bg-white cursor-grab active:cursor-grabbing px-8 md:px-12 lg:px-16 pt-[12vh] pb-24"
          >
            <div className="flex-shrink-0 flex flex-col justify-center space-y-[3vh] mb-[4vh]">
              <div className="space-y-[2vh]">
                <div className="space-y-[1vh]">
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-black tracking-tighter leading-[1.0]">
                    {currentPromotion.name}
                  </h2>
                  <div className="flex items-center gap-3">
                    <div className="bg-[#00BFFE]/10 border-l-[6px] border-[#00BFFE] px-6 py-2.5 rounded-r-xl">
                      <span className="text-xl md:text-2xl font-black text-[#00BFFE] italic">
                        {currentPromotion.price}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-lg md:text-xl text-zinc-400 font-medium leading-relaxed max-w-2xl">
                  {currentPromotion.description}
                </p>
              </div>
            </div>

            <div className="relative flex-1 w-full rounded-xl overflow-hidden border border-zinc-100 bg-zinc-50">
              <Image
                src={currentPromotion.imageUrl}
                alt={currentPromotion.name}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent" />
              {currentPromotion.label && (
                <span className="absolute bottom-5 right-5 inline-flex items-center gap-1.5 px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl text-[14px] font-bold text-zinc-600 tracking-wide shadow-sm">
                  {currentPromotion.label === "Drink" ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 110 8h-1"/><path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>
                  )}
                  {currentPromotion.label}
                </span>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {filteredPromotions.length > 1 && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30">
            {filteredPromotions.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                className={`transition-all duration-500 rounded-full h-2 ${
                  index === currentIndex 
                    ? "w-12 bg-[#00BFFE]" 
                    : "w-4 bg-zinc-200 hover:bg-zinc-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
