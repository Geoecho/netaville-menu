export interface Category {
  id: string;
  name: string;
  visible: boolean;
}
export interface PriceOption {
  name: string;
  price: number;
}
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  images?: string[];
  categoryId: string;
  label: string;
  visible: boolean;
  featured: boolean;
  stock: "available" | "low" | "sold-out";
  quantity: number | null;
  lowThreshold: number;
  allergens: string;
  sizes: PriceOption[];
  extras: PriceOption[];
  studentPrice: number | null;
  offerStart: string;
  offerEnd: string;
}
export interface MenuSettings {
  brandName: string;
  partnerName: string;
  logoUrl: string;
  partnerLogoUrl: string;
  logoSize: number;
  partnerLogoSize: number;
  showBranding: boolean;
  brandBackground: string;
  brandTextColor: string;
  accent: string;
  background: string;
  textColor: string;
  currency: string;
  slideSeconds: number;
  hideSoldOut: boolean;
  showSurprise: boolean;
  surpriseLabel: string;
  featuredTitle: string;
  studentTitle: string;
  emptyTitle: string;
  showBanner: boolean;
  bannerTitle: string;
  bannerText: string;
  qrUrl: string;
}
export interface MenuData {
  schemaVersion: 1;
  items: MenuItem[];
  categories: Category[];
  settings: MenuSettings;
}
export const DEFAULT_MENU: MenuData = {
  schemaVersion: 1,
  categories: [
    { id: "drinks", name: "Drinks", visible: true },
    { id: "food", name: "Food", visible: true },
  ],
  items: [
    {
      id: "matcha",
      name: "Ceremonial Matcha",
      description:
        "Premium stone-ground Japanese matcha whisked to perfection. Velvety smooth with a deep umami finish.",
      price: 250,
      imageUrl:
        "https://images.unsplash.com/photo-1582793988951-9aed55099991?auto=format&fit=crop&q=80&w=1000",
      categoryId: "drinks",
      label: "Drink",
      featured: true,
      studentPrice: 150,
    },
    {
      id: "cookie",
      name: "Dark Choc Cookie",
      description:
        "Soft-baked with 70% cacao chunks and a touch of sea salt. The perfect companion for your drink.",
      price: 120,
      imageUrl:
        "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=1000",
      categoryId: "food",
      label: "Food",
      featured: true,
      studentPrice: null,
    },
    {
      id: "latte",
      name: "Iced Latte",
      description:
        "Double shot of specialty espresso poured over chilled milk and ice. Refreshing and bold.",
      price: 180,
      imageUrl:
        "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=1000",
      categoryId: "drinks",
      label: "Drink",
      featured: false,
      studentPrice: 108,
    },
    {
      id: "pastry",
      name: "Artisan Pastry",
      description:
        "Hand-rolled layers of buttery dough, baked until golden and crisp. Selection varies daily.",
      price: 150,
      imageUrl:
        "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=1000",
      categoryId: "food",
      label: "Food",
      featured: false,
      studentPrice: 90,
    },
  ].map(
    (item) =>
      ({
        ...item,
        visible: true,
        stock: "available",
        quantity: null,
        lowThreshold: 5,
        allergens: "",
        sizes: [],
        extras: [],
        offerStart: "",
        offerEnd: "",
      }) as MenuItem,
  ),
  settings: {
    brandName: "Netaville",
    partnerName: "Eightysix",
    logoUrl: "/brands/Logo1.png",
    partnerLogoUrl: "/brands/eightysix-wordmark.png",
    logoSize: 64,
    partnerLogoSize: 72,
    showBranding: true,
    brandBackground: "#ffffff",
    brandTextColor: "#242424",
    accent: "#00bffe",
    background: "#ffffff",
    textColor: "#171717",
    currency: "MKD",
    slideSeconds: 10,
    hideSoldOut: false,
    showSurprise: true,
    surpriseLabel: "Surprise me",
    featuredTitle: "Recommended",
    studentTitle: "Student offers",
    emptyTitle: "Something good is on its way.",
    showBanner: true,
    bannerTitle: "Are you an IT student?",
    bannerText:
      "Scan the QR code, download the app, sign up with your student email & enjoy 40% off selected offers.",
    qrUrl: "",
  },
};
export const freshMenu = (): MenuData => structuredClone(DEFAULT_MENU);
// Retain imageUrl as the cover for existing records and older deployed readers.
export function productImages(
  item: Pick<MenuItem, "imageUrl" | "images">,
): string[] {
  return [...new Set([item.imageUrl, ...(item.images ?? [])].filter(Boolean))];
}
export function withProductImages(item: MenuItem, urls: string[]): MenuItem {
  const images = [...new Set(urls.filter(Boolean))];
  return { ...item, imageUrl: images[0] ?? "", images };
}
export function stockState(item: MenuItem): MenuItem["stock"] {
  if (item.stock === "sold-out" || item.quantity === 0) return "sold-out";
  if (
    item.stock === "low" ||
    (item.quantity !== null && item.quantity <= item.lowThreshold)
  )
    return "low";
  return "available";
}
export function offerActive(item: MenuItem, now = new Date()): boolean {
  const time = now.getTime();
  return (
    item.studentPrice !== null &&
    (!item.offerStart || time >= Date.parse(item.offerStart)) &&
    (!item.offerEnd || time <= Date.parse(item.offerEnd))
  );
}
export function visibleItems(menu: MenuData): MenuItem[] {
  const categories = new Set(
    menu.categories.filter((c) => c.visible).map((c) => c.id),
  );
  return menu.items.filter(
    (item) =>
      item.visible &&
      categories.has(item.categoryId) &&
      (!menu.settings.hideSoldOut || stockState(item) !== "sold-out"),
  );
}
export function safeImageUrl(value: string): boolean {
  if (!value) return true;
  if (/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value))
    return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function strings(value: Record<string, unknown>, keys: string[]): boolean {
  return keys.every((key) => typeof value[key] === "string");
}
function booleans(value: Record<string, unknown>, keys: string[]): boolean {
  return keys.every((key) => typeof value[key] === "boolean");
}
function menuShape(value: unknown): value is MenuData {
  if (
    !record(value) ||
    value.schemaVersion !== 1 ||
    !Array.isArray(value.items) ||
    !Array.isArray(value.categories) ||
    !record(value.settings)
  )
    return false;
  if (
    !value.categories.every(
      (c) =>
        record(c) &&
        strings(c, ["id", "name"]) &&
        c.id !== "" &&
        typeof c.visible === "boolean",
    )
  )
    return false;
  if (
    !value.items.every(
      (i) =>
        record(i) &&
        strings(i, [
          "id",
          "name",
          "description",
          "imageUrl",
          "categoryId",
          "label",
          "allergens",
          "offerStart",
          "offerEnd",
        ]) &&
        i.id !== "" &&
        (i.images === undefined ||
          (Array.isArray(i.images) &&
            i.images.every((url) => typeof url === "string"))) &&
        booleans(i, ["visible", "featured"]) &&
        ["available", "low", "sold-out"].includes(String(i.stock)) &&
        typeof i.price === "number" &&
        typeof i.lowThreshold === "number" &&
        (i.quantity === null || typeof i.quantity === "number") &&
        (i.studentPrice === null || typeof i.studentPrice === "number") &&
        [i.sizes, i.extras].every(
          (options) =>
            Array.isArray(options) &&
            options.every(
              (o) =>
                record(o) &&
                typeof o.name === "string" &&
                typeof o.price === "number",
            ),
        ),
    )
  )
    return false;
  const s = value.settings;
  return (
    strings(s, [
      "brandName",
      "partnerName",
      "logoUrl",
      "partnerLogoUrl",
      "brandBackground",
      "brandTextColor",
      "accent",
      "background",
      "textColor",
      "currency",
      "surpriseLabel",
      "featuredTitle",
      "studentTitle",
      "emptyTitle",
      "bannerTitle",
      "bannerText",
      "qrUrl",
    ]) &&
    booleans(s, [
      "showBranding",
      "hideSoldOut",
      "showSurprise",
      "showBanner",
    ]) &&
    [s.logoSize, s.partnerLogoSize, s.slideSeconds].every(
      (n) => typeof n === "number",
    )
  );
}
export function validateMenu(menu: unknown): string | null {
  if (!menuShape(menu)) return "Invalid menu format.";
  if (menu.categories.some((c) => ["featured", "student"].includes(c.id)))
    return "Category IDs cannot use the reserved featured or student IDs.";
  if (
    new Set(menu.items.map((i) => i.id)).size !== menu.items.length ||
    new Set(menu.categories.map((c) => c.id)).size !== menu.categories.length
  )
    return "IDs must be unique.";
  if (menu.categories.some((c) => !c.name.trim()))
    return "Every category needs a name.";
  for (const item of menu.items) {
    if (!item.name.trim()) return "Every product needs a name.";
    if (!menu.categories.some((c) => c.id === item.categoryId))
      return `Choose a category for ${item.name}.`;
    if (
      !Number.isFinite(item.price) ||
      item.price < 0 ||
      (item.studentPrice !== null &&
        (!Number.isFinite(item.studentPrice) || item.studentPrice < 0))
    )
      return `Check prices for ${item.name}.`;
    if (
      item.quantity !== null &&
      (!Number.isInteger(item.quantity) || item.quantity < 0)
    )
      return `Stock for ${item.name} must be a whole number of zero or more.`;
    if (!Number.isInteger(item.lowThreshold) || item.lowThreshold < 0)
      return `Check the low stock threshold for ${item.name}.`;
    if (!safeImageUrl(item.imageUrl))
      return `Use an HTTPS image URL for ${item.name}.`;
    if (item.images?.some((url) => !url || !safeImageUrl(url)))
      return `Check gallery image URLs for ${item.name}.`;
    if (
      [...item.sizes, ...item.extras].some(
        (o) => !o.name.trim() || !Number.isFinite(o.price) || o.price < 0,
      )
    )
      return `Check sizes and extras for ${item.name}.`;
    if (
      [item.offerStart, item.offerEnd].some(
        (d) => d && !Number.isFinite(Date.parse(d)),
      )
    )
      return `Check offer dates for ${item.name}.`;
    if (
      item.offerStart &&
      item.offerEnd &&
      Date.parse(item.offerEnd) < Date.parse(item.offerStart)
    )
      return `Offer end must follow its start for ${item.name}.`;
  }
  const s = menu.settings;
  if (!s.brandName.trim() || !s.currency.trim() || !s.emptyTitle.trim())
    return "Brand name, currency and empty-state title are required.";
  if (
    !Number.isFinite(s.slideSeconds) ||
    s.slideSeconds < 3 ||
    s.slideSeconds > 120
  )
    return "Slideshow interval must be between 3 and 120 seconds.";
  if (
    [
      s.accent,
      s.background,
      s.textColor,
      s.brandBackground,
      s.brandTextColor,
    ].some((c) => !/^#[0-9a-f]{6}$/i.test(c))
  )
    return "Use six-digit hex colours.";
  if (
    [s.logoSize, s.partnerLogoSize].some(
      (n) => !Number.isFinite(n) || n < 20 || n > 100,
    )
  )
    return "Logo sizes must be between 20 and 100 pixels.";
  if (!safeImageUrl(s.logoUrl) || !safeImageUrl(s.partnerLogoUrl))
    return "Use HTTPS URLs for logos.";
  if (s.qrUrl) {
    try {
      if (!["https:", "http:"].includes(new URL(s.qrUrl).protocol))
        return "QR destination must be a web URL.";
    } catch {
      return "Enter a complete QR destination URL.";
    }
  }
  return null;
}
