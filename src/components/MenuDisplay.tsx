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
export default function MenuDisplay({ preview }: { preview?: MenuData }) {
  const [menu, setMenu] = useState<MenuData>(preview ?? freshMenu());
  const [loaded, setLoaded] = useState(Boolean(preview));
  const [error, setError] = useState("");
  const [active, setActive] = useState("featured");
  const [index, setIndex] = useState(0);
  const [surpriseId, setSurpriseId] = useState<string | null>(null);
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
  const sheetOpen = Boolean(surprise);
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
    if (sheetOpen) return;
    const timer = setInterval(
      () => advance.current(),
      s.slideSeconds * 1000 * Math.max(1, currentImageCount),
    );
    return () => clearInterval(timer);
  }, [s.slideSeconds, sheetOpen, currentImageCount, current?.id, tab?.id]);
  function handleSurpriseClick() {
    const pool =
      choices.length > 1 ? choices.filter((i) => i.id !== surpriseId) : choices;
    if (pool.length) {
      const sample = crypto.getRandomValues(new Uint32Array(1))[0];
      setSurpriseId(pool[sample % pool.length].id);
    }
  }
  function closeSheet() {
    setSurpriseId(null);
    surpriseRef.current?.focus();
  }
  useEffect(() => {
    if (!sheetOpen) return;
    closeRef.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
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
  }, [sheetOpen]);
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
      {s.showBranding && <BrandLockup settings={s} />}
      {!loaded ? (
        <div className="menu-empty">
          {error ? "Unable to load the menu." : "Preparing your menu…"}
        </div>
      ) : (
        <>
          <section
            className="menu-stage"
            aria-label="Product slideshow"
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
              {s.showSurprise && choices.length > 0 && (
                <button
                  ref={surpriseRef}
                  className="surprise-trigger"
                  onClick={handleSurpriseClick}
                >
                  <Shuffle size={16} />
                  <span>{s.surpriseLabel}</span>
                </button>
              )}
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
                      <span className="menu-eyebrow">{current.label}</span>
                      <h1>{current.name}</h1>
                      <p>{current.description}</p>
                    </div>
                    <div className="product-price">
                      <strong>
                        {current.price} {s.currency}
                      </strong>
                      {offerActive(current) && (
                        <small className="student-price">
                          Student price {current.studentPrice} {s.currency}
                        </small>
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
        {surprise && (
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
              <div className="sheet-handle" aria-hidden="true" />
              <button
                ref={closeRef}
                className="dialog-close"
                aria-label="Close suggestion"
                onClick={closeSheet}
              >
                <X />
              </button>
              <div className="sheet-heading">
                <span className="menu-eyebrow">A LITTLE INSPIRATION</span>
                <p>Meet your next favourite.</p>
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
                  <span className="sheet-label">{surprise.label}</span>
                  <h2 id="surprise-title">{surprise.name}</h2>
                  <p>{surprise.description}</p>
                  <strong>
                    {surprise.price} {s.currency}
                  </strong>
                  <ProductDetails item={surprise} currency={s.currency} />
                </div>
              </div>
              <div className="sheet-actions">
                <button
                  className="sheet-reroll"
                  onClick={handleSurpriseClick}
                  disabled={choices.length < 2}
                >
                  <Shuffle size={17} />
                  Try another
                </button>
                <button className="surprise-trigger" onClick={closeSheet}>
                  Looks good
                  <ArrowUpRight size={17} />
                </button>
              </div>
            </motion.section>
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
