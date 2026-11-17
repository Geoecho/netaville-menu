"use client";
/* Remote media is rendered directly, without an image proxy. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { QRCodeSVG } from "qrcode.react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Shuffle, X } from "lucide-react";
import "./menu-display.css";
import ProductGallery from "./ProductGallery";
import { loadMenu } from "@/lib/menu-store";
import { supabase } from "@/lib/supabase";
import {
  freshMenu,
  offerActive,
  productImages,
  stockState,
  visibleItems,
  type MenuData,
  type MenuItem,
} from "@/lib/menu";

export function BrandLockup({
  settings: s,
}: {
  settings: MenuData["settings"];
}) {
  return (
    <div
      className="brand-lockup"
      style={{ background: s.brandBackground, color: s.brandTextColor }}
    >
      {s.logoUrl && (
        <img
          className="primary-logo"
          src={s.logoUrl}
          alt={s.brandName}
          style={{ height: s.logoSize }}
        />
      )}
      {s.logoUrl && s.partnerLogoUrl && (
        <>
          <span className="brand-cross" aria-label="in collaboration with">
            ×
          </span>
        </>
      )}
      {s.partnerLogoUrl && (
        <img
          className="partner-logo"
          src={s.partnerLogoUrl}
          alt={s.partnerName}
          style={{ height: s.partnerLogoSize }}
        />
      )}
    </div>
  );
}
const surpriseHeadings = [
  "Meet your next favourite.",
  "A little out of the ordinary.",
  "Your next good decision.",
  "Something worth a try.",
  "Let your curiosity choose.",
  "A new ritual starts here.",
];

export default function MenuDisplay({ preview }: { preview?: MenuData }) {
  const [menu, setMenu] = useState<MenuData>(preview ?? freshMenu());
  const [loaded, setLoaded] = useState(Boolean(preview));
  const [error, setError] = useState("");
  const [active, setActive] = useState("featured");
  const [index, setIndex] = useState(0);
  const [surpriseId, setSurpriseId] = useState<string | null>(null);
  const [choosingCategory, setChoosingCategory] = useState(false);
  const [surpriseCategory, setSurpriseCategory] = useState<string | null>(null);
  const [draw, setDraw] = useState(0);
  const [paused, setPaused] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const surpriseRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (preview) return;
    let alive = true;
    const refresh = async () => {
      try {
        const result = await loadMenu();
        if (alive) {
          setMenu(result.menu);
          setLoaded(true);
          setError("");
        }
      } catch {
        if (alive)
          setError("Menu updates are unavailable. Please try again shortly.");
      }
    };
    void refresh();
    const timer = setInterval(refresh, 15000);
    window.addEventListener("storage", refresh);
    window.addEventListener("menu-demo-change", refresh);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("menu-demo-change", refresh);
    };
  }, [preview]);
  const data = preview ?? menu;
  const s = data.settings;
  const available = visibleItems(data);
  const tabs = [
    {
      id: "featured",
      name: s.featuredTitle,
      items: available.filter((i) => i.featured),
    },
    ...data.categories
      .filter((c) => c.visible)
      .map((c) => ({
        ...c,
        items: available.filter((i) => i.categoryId === c.id),
      })),
  ];
  const tab = tabs.find((t) => t.id === active) ?? tabs[0];
  const current = tab?.items.length
    ? tab.items[index % tab.items.length]
    : undefined;
  const currentImageCount = current ? productImages(current).length : 0;
  const choices = available.filter((i) => stockState(i) !== "sold-out");
  const surprise = choices.find((i) => i.id === surpriseId);
  const sheetOpen = choosingCategory || Boolean(surprise);
  function next(direction = 1) {
    if (!tab?.items.length) return;
    const position = (index % tab.items.length) + direction;
    if (position >= tab.items.length) {
      const playableTabs = tabs.filter((t) => t.items.length > 0);
      const nextTab =
        playableTabs[
          (playableTabs.findIndex((t) => t.id === tab.id) + 1) %
            playableTabs.length
        ];
      setActive(nextTab.id);
      setIndex(0);
    } else setIndex((position + tab.items.length) % tab.items.length);
  }
  const advance = useRef<() => void>(() => {});
  useEffect(() => {
    advance.current = () => next();
  });
  useEffect(() => {
    if (sheetOpen || paused) return;
    const timer = setInterval(
      () => advance.current(),
      s.slideSeconds * 1000 * Math.max(1, currentImageCount),
    );
    return () => clearInterval(timer);
  }, [
    s.slideSeconds,
    sheetOpen,
    paused,
    currentImageCount,
    current?.id,
    tab?.id,
  ]);
  function handleSurpriseClick(similar = false, category = surpriseCategory) {
    const candidates =
      similar && surprise
        ? choices.filter(
            (i) => i.categoryId === surprise.categoryId && i.id !== surprise.id,
          )
        : choices.filter((i) => category === null || i.categoryId === category);
    const pool =
      candidates.length > 1
        ? candidates.filter((i) => i.id !== surpriseId)
        : candidates;
    if (pool.length) {
      const sample = crypto.getRandomValues(new Uint32Array(1))[0];
      setChoosingCategory(false);
      setSurpriseId(pool[sample % pool.length].id);
      setDraw((value) => value + 1);
    }
  }
  function closeSheet() {
    setChoosingCategory(false);
    setSurpriseId(null);
    surpriseRef.current?.focus();
  }
  useEffect(() => {
    if (!sheetOpen) return;
    closeRef.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setChoosingCategory(false);
        setSurpriseId(null);
        surpriseRef.current?.focus();
      }
      if (event.key === "Tab") {
        event.preventDefault();
        const buttons = document.querySelectorAll<HTMLButtonElement>(
          ".surprise-dialog button:not(:disabled)",
        );
        const position = Array.from(buttons).indexOf(
          document.activeElement as HTMLButtonElement,
        );
        buttons[
          (position + (event.shiftKey ? buttons.length - 1 : 1)) %
            buttons.length
        ]?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [sheetOpen, choosingCategory]);
  const style = {
    "--menu-accent": s.accent,
    "--menu-bg": s.background,
    "--menu-text": s.textColor,
    overflow: sheetOpen ? "hidden" : undefined,
  } as CSSProperties;
  return (
    <main
      className={`menu-display ${preview ? "is-preview" : ""}`}
      style={style}
    >
      {!preview && !supabase && (
        <div className="display-notice">
          Local demo · changes stay in this browser
        </div>
      )}
      {error && (
        <div className="display-notice" role="status">
          {error}
        </div>
      )}
      {(s.showBranding || (loaded && s.showSurprise && choices.length > 0)) && (
        <header className="menu-topbar">
          {s.showBranding && <BrandLockup settings={s} />}
          {loaded && s.showSurprise && choices.length > 0 && (
            <button
              ref={surpriseRef}
              className="surprise-trigger"
              onClick={() => {
                setSurpriseId(null);
                setChoosingCategory(true);
              }}
            >
              <AnimatedShuffle />
              <span>{s.surpriseLabel}</span>
            </button>
          )}
        </header>
      )}
      {!loaded ? (
        <div className="menu-empty">
          {error ? "Unable to load the menu." : "Preparing your menu…"}
        </div>
      ) : (
        <>
          <section
            className="menu-stage"
            aria-label="Product slideshow"
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") setPaused(true);
            }}
            onPointerLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
            }}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
            onTouchCancel={() => setPaused(false)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.target !== e.currentTarget) return;
              if (e.key === "ArrowRight") {
                e.preventDefault();
                next();
              }
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                next(-1);
              }
            }}
          >
            <div className="menu-toolbar">
              <nav aria-label="Menu categories">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    aria-pressed={tab?.id === t.id}
                    onClick={() => {
                      setActive(t.id);
                      setIndex(0);
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </nav>
            </div>
            {current ? (
              <AnimatePresence mode="wait" initial={false}>
                <motion.article
                  key={`${tab.id}-${current.id}`}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
                  transition={{ duration: 0.25 }}
                  className="menu-product"
                  onTouchStart={(e) => {
                    touchStart.current = e.touches[0].clientX;
                  }}
                  onTouchEnd={(e) => {
                    if (touchStart.current === null) return;
                    const distance =
                      e.changedTouches[0].clientX - touchStart.current;
                    touchStart.current = null;
                    if (Math.abs(distance) > 60) next(distance < 0 ? 1 : -1);
                  }}
                >
                  <div className="product-heading">
                    <div>
                      <div className="product-meta">
                        <span className="product-category">
                          {
                            data.categories.find(
                              (category) => category.id === current.categoryId,
                            )?.name
                          }
                        </span>
                        <span
                          className="product-position"
                          aria-label={`Product ${(index % tab.items.length) + 1} of ${tab.items.length}`}
                        >
                          {(index % tab.items.length) + 1} / {tab.items.length}
                        </span>
                      </div>
                      <h1>{current.name}</h1>
                      <p>{current.description}</p>
                    </div>
                    <div className="product-price">
                      <strong>
                        {current.price} {s.currency}
                      </strong>
                      {offerActive(current) && (
                        <StudentPrice item={current} currency={s.currency} />
                      )}
                    </div>
                    <ProductDetails item={current} currency={s.currency} />
                  </div>
                  <ProductGallery
                    item={current}
                    className="product-photo"
                    intervalSeconds={s.slideSeconds}
                    placeholder={s.brandName}
                  >
                    {stockState(current) !== "available" && (
                      <span className={`availability ${stockState(current)}`}>
                        {stockState(current) === "sold-out"
                          ? "Sold out"
                          : "Limited availability"}
                      </span>
                    )}
                  </ProductGallery>
                </motion.article>
              </AnimatePresence>
            ) : (
              <div className="menu-empty">{s.emptyTitle}</div>
            )}
          </section>
          {s.showBanner && (
            <section className="student-banner">
              <div>
                <span className="menu-eyebrow">{s.studentTitle}</span>
                <h2>{s.bannerTitle}</h2>
                <p>{s.bannerText}</p>
              </div>
              {s.qrUrl ? (
                <a
                  className="student-qr"
                  href={s.qrUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open student offer"
                >
                  <QRCodeSVG value={s.qrUrl} size={112} marginSize={2} />
                </a>
              ) : (
                <div className="student-qr">
                  <img
                    src="/qr-code.svg"
                    alt="Scan to open the Netaville student app"
                    width={112}
                    height={112}
                  />
                </div>
              )}
            </section>
          )}
        </>
      )}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            className="surprise-overlay"
            initial={{
              backgroundColor: "rgba(16,24,30,0)",
              backdropFilter: "blur(0px)",
            }}
            animate={{
              backgroundColor: "rgba(16,24,30,.35)",
              backdropFilter: "blur(8px)",
            }}
            exit={{
              backgroundColor: "rgba(16,24,30,0)",
              backdropFilter: "blur(0px)",
            }}
            transition={{ duration: reduceMotion ? 0 : 0.25 }}
            onClick={closeSheet}
          >
            <motion.section
              className="surprise-dialog"
              initial={{ y: reduceMotion ? 0 : "100%" }}
              animate={{ y: 0 }}
              exit={{ y: reduceMotion ? 0 : "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="surprise-title"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                ref={closeRef}
                className="dialog-close"
                aria-label="Close suggestion"
                onClick={closeSheet}
              >
                <X />
              </button>
              {choosingCategory ? (
                <div className="surprise-picker">
                  <span className="menu-eyebrow">LET CURIOSITY LEAD</span>
                  <h2 id="surprise-title">What are you in the mood for?</h2>
                  <p>Choose a category. We�ll find you something good.</p>
                  <div className="surprise-categories">
                    {[
                      { id: null, name: "Anything", count: choices.length },
                      ...data.categories
                        .filter((c) => c.visible)
                        .map((c) => ({
                          ...c,
                          count: choices.filter((i) => i.categoryId === c.id)
                            .length,
                        })),
                    ]
                      .filter((c) => c.count > 0)
                      .map((c) => (
                        <motion.button
                          key={c.id ?? "all"}
                          whileHover={reduceMotion ? undefined : { y: -3 }}
                          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                          onClick={() => {
                            setSurpriseCategory(c.id);
                            handleSurpriseClick(false, c.id);
                          }}
                        >
                          <span>
                            {c.name}
                            <small>{c.count} available</small>
                          </span>
                          <AnimatedShuffle />
                        </motion.button>
                      ))}
                  </div>
                </div>
              ) : (
                surprise && (
                  <>
                    <div className="sheet-heading">
                      <span className="menu-eyebrow">A LITTLE INSPIRATION</span>
                      <motion.p
                        key={`${surprise.id}-${draw}`}
                        initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22 }}
                      >
                        {surprise.surpriseHeading?.trim() ||
                          surpriseHeadings[
                            (draw - 1 + surpriseHeadings.length) %
                              surpriseHeadings.length
                          ]}
                      </motion.p>
                    </div>
                    <div className="sheet-product">
                      {productImages(surprise).length > 0 && (
                        <ProductGallery
                          key={surprise.id}
                          item={surprise}
                          className="sheet-photo"
                          intervalSeconds={s.slideSeconds}
                        />
                      )}
                      <div className="sheet-copy">
                        <h2 id="surprise-title">{surprise.name}</h2>
                        <p>{surprise.description}</p>
                        <strong>
                          {surprise.price} {s.currency}
                        </strong>
                        {offerActive(surprise) && (
                          <StudentPrice item={surprise} currency={s.currency} />
                        )}
                        <ProductDetails item={surprise} currency={s.currency} />
                      </div>
                    </div>
                    <div className="sheet-actions">
                      {choices.some(
                        (i) =>
                          i.categoryId === surprise.categoryId &&
                          i.id !== surprise.id,
                      ) && (
                        <button
                          className="sheet-reroll"
                          onClick={() => handleSurpriseClick(true)}
                        >
                          Something similar
                        </button>
                      )}
                      <button
                        className="sheet-reroll"
                        onClick={() => handleSurpriseClick()}
                        disabled={
                          choices.filter(
                            (i) =>
                              surpriseCategory === null ||
                              i.categoryId === surpriseCategory,
                          ).length < 2
                        }
                      >
                        <AnimatedShuffle />
                        Try another
                      </button>
                      <button
                        className="sheet-reroll"
                        onClick={() => setChoosingCategory(true)}
                      >
                        Change category
                      </button>
                      <button className="surprise-trigger" onClick={closeSheet}>
                        Looks good
                        <ArrowUpRight size={17} />
                      </button>
                    </div>
                  </>
                )
              )}
            </motion.section>
            {surprise && !choosingCategory && !reduceMotion && (
              <div key={draw} className="brand-confetti" aria-hidden="true">
                {Array.from({ length: 20 }, (_, i) => {
                  const src = i % 2 === 0 ? s.logoUrl : s.partnerLogoUrl;
                  return src ? (
                    <motion.img
                      key={i}
                      src={src}
                      alt=""
                      initial={{ x: 0, y: -60, opacity: 0, rotate: -35 }}
                      animate={{
                        x: [0, i % 2 ? 45 : -45, 0],
                        y: "105vh",
                        opacity: [0, 0.9, 0.9, 0],
                        rotate: i % 2 ? 170 : -170,
                      }}
                      transition={{
                        duration: 2.6 + (i % 3) * 0.2,
                        delay: i * 0.035,
                        ease: "easeOut",
                      }}
                      style={{
                        left: `${2 + ((i * 37) % 96)}%`,
                        top: `${-(i % 5) * 28}px`,
                      }}
                    />
                  ) : null;
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
function ProductDetails({
  item,
  currency,
}: {
  item: MenuItem;
  currency: string;
}) {
  return (
    <div className="product-details">
      {item.sizes.length > 0 && (
        <p>
          <b>Sizes</b>{" "}
          {item.sizes
            .map((o) => `${o.name} ${o.price} ${currency}`)
            .join(" · ")}
        </p>
      )}
      {item.extras.length > 0 && (
        <p>
          <b>Extras</b>{" "}
          {item.extras
            .map((o) => `${o.name} +${o.price} ${currency}`)
            .join(" · ")}
        </p>
      )}
      {item.allergens && (
        <p className="product-allergens">
          <b>Allergens</b> {item.allergens}
        </p>
      )}
    </div>
  );
}

function StudentPrice({
  item,
  currency,
}: {
  item: MenuItem;
  currency: string;
}) {
  return (
    <div className="student-price">
      <span>Student price</span>
      <b>
        {item.studentPrice} {currency}
      </b>
    </div>
  );
}

const MotionShuffle = motion.create(Shuffle);
function AnimatedShuffle() {
  const reduced = useReducedMotion();
  return (
    <MotionShuffle
      size={18}
      aria-hidden="true"
      whileHover={reduced ? undefined : { rotate: [0, -15, 15, 0] }}
      transition={{ duration: 0.4 }}
    />
  );
}
