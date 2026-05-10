"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const [showSurprise, setShowSurprise] = useState(false);
  const [surpriseItem, setSurpriseItem] = useState<Promotion | null>(null);

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
      setCurrentIndex(0); // Ensure we start at the first item of the new category
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
    <section className="h-full w-full relative rounded-lg">
      <BorderBeam 
        duration={8} 
        colorFrom="#00BFFE" 
        colorTo="#00BFFE" 
        borderWidth={2}
      />

      <div className="absolute inset-0 overflow-hidden rounded-[inherit] bg-white border-t border-zinc-100 z-10">
        <div className="absolute top-8 left-8 right-8 md:left-12 md:right-12 lg:left-16 lg:right-16 z-50 flex items-center justify-between">
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
          
          {/* Surprise Me Button */}
          <CoolMode options={{ particle: "/netaville-logo.svg", particleCount: 20 }}>
            <button
              onClick={() => {
                const randomPromo = promotions[Math.floor(Math.random() * promotions.length)];
                setSurpriseItem(randomPromo);
                setShowSurprise(true);
              }}
              className="h-[52px] px-6 bg-[#00BFFE] text-white rounded-xl font-black text-[14px] uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>
              Surprise Me
            </button>
          </CoolMode>
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
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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

      <SurpriseModal 
        show={showSurprise} 
        onClose={() => setShowSurprise(false)} 
        item={surpriseItem}
        onReroll={() => {
          const newRandom = promotions[Math.floor(Math.random() * promotions.length)];
          setSurpriseItem(newRandom);
        }}
      />
    </section>
  );
}

function SurpriseModal({ 
  show, 
  onClose, 
  item, 
  onReroll 
}: { 
  show: boolean; 
  onClose: () => void; 
  item: Promotion | null;
  onReroll: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {show && item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[999]"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "110%" }}
            transition={{ 
              type: "tween", 
              ease: [0.32, 0.72, 0, 1],
              duration: 0.5
            }}
            style={{ willChange: "transform" }}
            className="fixed inset-x-8 bottom-8 top-24 md:inset-x-24 md:bottom-24 md:top-32 lg:inset-x-64 lg:bottom-12 lg:top-40 bg-white rounded-xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] z-[1000] overflow-hidden flex flex-col"
          >
            <div className="relative h-1/2 w-full">
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className="object-cover"
              />
              <button
                onClick={onClose}
                className="absolute top-8 right-8 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="flex-1 p-10 md:p-14 flex flex-col justify-center items-center text-center space-y-6">
              <div className="space-y-2">
                <span className="text-[12px] font-black uppercase tracking-[0.3em] text-[#00BFFE]">Your Surprise Pick</span>
                <h3 className="text-4xl md:text-5xl font-black text-black tracking-tighter">{item.name}</h3>
              </div>
              <p className="text-zinc-500 text-lg md:text-xl font-medium max-w-md leading-relaxed">
                {item.description}
              </p>
              <div className="pt-4 flex items-center gap-4">
                <div className="bg-[#00BFFE]/10 border-l-[6px] border-[#00BFFE] px-8 py-3 rounded-r-xl">
                  <span className="text-2xl md:text-3xl font-black text-[#00BFFE] italic">{item.price}</span>
                </div>
                <button
                  onClick={onReroll}
                  className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 transition-all active:scale-90"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.getElementById("modal-root")!
  );
}
