const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");
const Module = require("node:module");

// Run the real TypeScript modules in-process (no test workers required on Windows).
require.extensions[".ts"] = (module, filename) => {
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  module._compile(compiled.outputText, filename);
};
require.extensions[".tsx"] = require.extensions[".ts"];
const {
  freshMenu,
  validateMenu,
  stockState,
  offerActive,
  visibleItems,
  safeImageUrl,
  productImages,
  withProductImages,
} = require("../src/lib/menu.ts");
const service = { supabase: null };
const originalLoad = Module._load;
Module._load = function (request, parent, ...rest) {
  if (request === "./supabase" && parent.filename.endsWith("menu-store.ts"))
    return service;
  return originalLoad.call(this, request, parent, ...rest);
};
const {
  loadMenu,
  saveMenu,
  uploadImage,
  uploadImages,
} = require("../src/lib/menu-store.ts");
Module._load = originalLoad;
const React = require("react");
const { renderToStaticMarkup: renderServerMarkup } = require("react-dom/server");
function renderToStaticMarkup(element) {
  const browserWindow=global.window;
  delete global.window;
  try{return renderServerMarkup(element);}finally{global.window=browserWindow;}
}
Module._load = function (request, parent, ...rest) {
  if (request === "@/lib/menu") return require("../src/lib/menu.ts");
  if (request === "@/lib/menu-store")
    return require("../src/lib/menu-store.ts");
  return originalLoad.call(this, request, parent, ...rest);
};
const ProductGallery = require("../src/components/ProductGallery.tsx").default;
const ProductImagesField =
  require("../src/components/ProductImagesField.tsx").default;
Module._load = originalLoad;
const memory = new Map();
global.localStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
};
global.window = { dispatchEvent: () => {} };
test.beforeEach(() => {
  memory.clear();
  service.supabase = null;
});

test("starter menu is valid and each draft is independent", () => {
  const a = freshMenu(),
    b = freshMenu();
  a.items[0].name = "Changed";
  assert.notEqual(a.items[0].name, b.items[0].name);
  assert.equal(validateMenu(b), null);
});
test("gallery renders the cover and photo selectors without arrow buttons", () => {
  const item = withProductImages(freshMenu().items[0], [
    "https://example.com/first.jpg",
    "https://example.com/second.jpg",
  ]);
  const html = renderToStaticMarkup(
    React.createElement(ProductGallery, {
      item,
      className: "product-photo",
      intervalSeconds: 10,
    }),
  );
  assert.match(html, /src="https:\/\/example.com\/first.jpg"/);
  assert.match(html, /photo 1 of 2/);
  assert.match(html, /Show photo 2 of Ceremonial Matcha/);
  assert.doesNotMatch(html, /Next image|Previous image/);
});
test("existing single-photo products render without gallery controls", () => {
  const item = freshMenu().items[0];
  const html = renderToStaticMarkup(
    React.createElement(ProductGallery, {
      item,
      className: "sheet-photo",
      intervalSeconds: 10,
    }),
  );
  assert.ok(html.includes(item.imageUrl.replaceAll("&", "&amp;")));
  assert.doesNotMatch(html, /Choose product photo/);
});
test("multi-image editor accepts multiple files and exposes cover, reorder and removal controls", () => {
  const html = renderToStaticMarkup(
    React.createElement(ProductImagesField, {
      value: ["https://example.com/one.jpg", "https://example.com/two.jpg"],
      onChange: () => {},
      onBusyChange: () => {},
    }),
  );
  assert.match(html, /type="file"[^>]*multiple=""/);
  assert.match(html, /Use image 2 as cover/);
  assert.match(html, /Move image 2 earlier/);
  assert.match(html, /Remove image 1/);
});
test("gallery without photos uses the placeholder rather than a broken image", () => {
  const item = withProductImages(freshMenu().items[0], []);
  const html = renderToStaticMarkup(
    React.createElement(ProductGallery, {
      item,
      className: "product-photo",
      intervalSeconds: 10,
      placeholder: "No image yet",
    }),
  );
  assert.match(html, /No image yet/);
  assert.doesNotMatch(html, /<img/);
});
test("existing single-image products remain valid without a migration", () => {
  const menu = freshMenu();
  assert.equal(menu.items[0].images, undefined);
  assert.deepEqual(productImages(menu.items[0]), [menu.items[0].imageUrl]);
  assert.equal(validateMenu(menu), null);
});
test("gallery order, cover replacement and removal stay compatible with old readers", () => {
  const original = freshMenu().items[0];
  const urls = [
    "https://example.com/front.jpg",
    "https://example.com/back.jpg",
  ];
  const updated = withProductImages(original, urls);
  assert.deepEqual(productImages(updated), urls);
  assert.equal(updated.imageUrl, urls[0]);
  const reordered = withProductImages(updated, [urls[1], urls[0]]);
  assert.equal(reordered.imageUrl, urls[1]);
  assert.deepEqual(productImages(reordered), [urls[1], urls[0]]);
  const empty = withProductImages(reordered, []);
  assert.equal(empty.imageUrl, "");
  assert.deepEqual(productImages(empty), []);
  assert.equal(original.images, undefined);
});
test("legacy cover updates are honoured and duplicate gallery URLs render once", () => {
  const item = {
    ...freshMenu().items[0],
    imageUrl: "https://example.com/new.jpg",
    images: ["https://example.com/old.jpg", "https://example.com/new.jpg"],
  };
  assert.deepEqual(productImages(item), [
    "https://example.com/new.jpg",
    "https://example.com/old.jpg",
  ]);
});
test("gallery validation rejects malformed arrays and unsafe URLs", () => {
  for (const images of [
    "not-an-array",
    [null],
    ["javascript:alert(1)"],
    [""],
    ["data:image/svg+xml;base64,PHN2Zz4="],
  ]) {
    const menu = freshMenu();
    menu.items[0].images = images;
    assert.ok(validateMenu(menu));
  }
  const valid = freshMenu();
  valid.items[0] = withProductImages(valid.items[0], [
    "https://example.com/a.jpg",
    "/brands/Logo1.png",
  ]);
  assert.equal(validateMenu(valid), null);
});
test("multiple uploads preserve order, limit concurrency, and retain successes after a failure", async () => {
  let active = 0,
    maxActive = 0;
  let fail = true;
  const uploaded = new Map();
  const requests = [];
  const files = Array.from({ length: 7 }, (_, i) => ({
    name: `photo-${i}.png`,
    type: "image/png",
    size: 100,
  }));
  service.supabase = {
    storage: {
      from: () => ({
        upload: async (path, file) => {
          uploaded.set(path, file.name);
          requests.push(file.name);
          active++;
          maxActive = Math.max(maxActive, active);
          await new Promise((resolve) =>
            setTimeout(resolve, file.name === "photo-0.png" ? 12 : 1),
          );
          active--;
          return file.name === "photo-2.png" && fail
            ? { error: { message: "Storage unavailable" } }
            : { error: null };
        },
        getPublicUrl: (path) => ({
          data: { publicUrl: `https://example.com/${uploaded.get(path)}` },
        }),
      }),
    },
  };
  const progress = [];
  const result = await uploadImages(files, (done, total) =>
    progress.push([done, total]),
  );
  assert.equal(result.urls.length, 6);
  assert.deepEqual(
    result.urls,
    files
      .filter((_, index) => index !== 2)
      .map((file) => `https://example.com/${file.name}`),
  );
  assert.ok(maxActive <= 3);
  assert.equal(result.failed.length, 1);
  assert.equal(result.failed[0].file, files[2]);
  assert.equal(result.failed[0].message, "Storage unavailable");
  assert.deepEqual(
    progress.map((p) => p[0]),
    [1, 2, 3, 4, 5, 6, 7],
  );
  assert.ok(progress.every((p) => p[1] === 7));
  fail = false;
  const retry = await uploadImages(result.failed.map((f) => f.file));
  assert.deepEqual(retry.urls, ["https://example.com/photo-2.png"]);
  assert.equal(retry.failed.length, 0);
  assert.equal(requests.length, 8);
  assert.equal(requests.filter((name) => name === "photo-0.png").length, 1);
});
test("multi-image galleries survive save and reload with their cover", async () => {
  const snapshot = await loadMenu();
  const menu = structuredClone(snapshot.menu);
  menu.items[0] = withProductImages(menu.items[0], [
    "https://example.com/one.jpg",
    "https://example.com/two.jpg",
  ]);
  await saveMenu(menu, snapshot);
  const published = await loadMenu();
  assert.deepEqual(productImages(published.menu.items[0]), [
    "https://example.com/one.jpg",
    "https://example.com/two.jpg",
  ]);
  assert.equal(published.menu.items[0].imageUrl, "https://example.com/one.jpg");
});
test("zero quantity overrides available, thresholds and manual sold-out work", () => {
  const item = freshMenu().items[0];
  assert.equal(stockState({ ...item, quantity: 0 }), "sold-out");
  assert.equal(stockState({ ...item, quantity: 3 }), "low");
  assert.equal(stockState({ ...item, quantity: 6 }), "available");
  assert.equal(
    stockState({ ...item, stock: "sold-out", quantity: 100 }),
    "sold-out",
  );
  assert.equal(stockState({ ...item, quantity: null }), "available");
});
test("hidden categories hide products everywhere; hide-sold-out respects quantity zero", () => {
  const menu = freshMenu();
  menu.categories[0].visible = false;
  assert.deepEqual(
    visibleItems(menu).map((i) => i.id),
    ["cookie", "pastry"],
  );
  menu.items[1].quantity = 0;
  menu.settings.hideSoldOut = true;
  assert.deepEqual(
    visibleItems(menu).map((i) => i.id),
    ["pastry"],
  );
});
test("an empty published menu remains empty", async () => {
  const menu = freshMenu();
  menu.items = [];
  await saveMenu(menu, { menu, version: 0, exists: false });
  assert.deepEqual((await loadMenu()).menu.items, []);
});
test("student offers respect start and end dates including free offers", () => {
  const item = {
    ...freshMenu().items[0],
    studentPrice: 0,
    offerStart: "2026-11-16T08:00:00Z",
    offerEnd: "2026-11-16T18:00:00Z",
  };
  assert.equal(offerActive(item, new Date("2026-11-16T07:59:59Z")), false);
  assert.equal(offerActive(item, new Date("2026-11-16T12:00:00Z")), true);
  assert.equal(offerActive(item, new Date("2026-11-16T18:00:01Z")), false);
  assert.equal(offerActive({ ...item, studentPrice: null }), false);
});
test("negative or fractional stock, negative prices and reversed dates cannot publish", () => {
  for (const patch of [
    { quantity: -1 },
    { quantity: 1.5 },
    { price: -1 },
    { studentPrice: -2 },
    { offerStart: "2026-12-01", offerEnd: "2026-11-01" },
  ]) {
    const menu = freshMenu();
    Object.assign(menu.items[0], patch);
    assert.ok(validateMenu(menu));
  }
});
test("missing categories and duplicate products cannot publish", () => {
  const menu = freshMenu();
  menu.categories = [];
  assert.match(validateMenu(menu), /category/);
  const duplicate = freshMenu();
  duplicate.items.push(duplicate.items[0]);
  assert.match(validateMenu(duplicate), /unique/);
});
test("malformed stored JSON fails validation without throwing", () => {
  for (const value of [
    null,
    {},
    [],
    { schemaVersion: 1, items: [null], categories: [], settings: {} },
    { ...freshMenu(), items: [{ ...freshMenu().items[0], sizes: null }] },
  ])
    assert.equal(validateMenu(value), "Invalid menu format.");
});
test("media and QR validation rejects executable URLs", () => {
  assert.equal(safeImageUrl("javascript:alert(1)"), false);
  assert.equal(safeImageUrl("//untrusted.example/test.png"), false);
  assert.equal(safeImageUrl("data:image/svg+xml;base64,PHN2Zz4="), false);
  assert.equal(safeImageUrl("https://example.com/photo.webp"), true);
  assert.equal(safeImageUrl("data:image/png;base64,aGVsbG8="), true);
  const menu = freshMenu();
  menu.settings.qrUrl = "javascript:alert(1)";
  assert.ok(validateMenu(menu));
});
test("local drafts save explicitly and survive a reload", async () => {
  const original = await loadMenu();
  const menu = structuredClone(original.menu);
  menu.items[0].price = 999;
  assert.notEqual((await loadMenu()).menu.items[0].price, 999);
  await saveMenu(menu, original);
  const saved = await loadMenu();
  assert.equal(saved.menu.items[0].price, 999);
  assert.equal(saved.version, 1);
});
test("cloud read failures never fall back to demo content", async () => {
  service.supabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: null,
            error: { message: "Database unavailable" },
          }),
        }),
      }),
    }),
  };
  await assert.rejects(loadMenu(), (e) => e.message === "Database unavailable");
  assert.equal(memory.size, 0);
});
test("a concurrent publish is detected instead of overwriting another admin", async () => {
  const predicates = [];
  const chain = {
    eq: (key, value) => {
      predicates.push([key, value]);
      return chain;
    },
    select: async () => ({ data: [], error: null }),
  };
  service.supabase = { from: () => ({ update: () => chain }) };
  const menu = freshMenu();
  await assert.rejects(
    saveMenu(menu, { menu, version: 7, exists: true }),
    /Another admin/,
  );
  assert.deepEqual(predicates, [
    ["id", 1],
    ["version", 7],
  ]);
  assert.equal(memory.size, 0);
});
test("unauthorised writes surface errors and do not claim a local save", async () => {
  const chain = {
    eq: () => chain,
    select: async () => ({
      data: null,
      error: { message: "row-level security denied" },
    }),
  };
  service.supabase = { from: () => ({ update: () => chain }) };
  const menu = freshMenu();
  await assert.rejects(
    saveMenu(menu, { menu, version: 1, exists: true }),
    (e) => e.message.includes("row-level security"),
  );
  assert.equal(memory.size, 0);
});
test("uploads reject SVG and oversized images before contacting storage", async () => {
  await assert.rejects(
    uploadImage({ type: "image/svg+xml", size: 100 }),
    /PNG, JPG or WebP/,
  );
  await assert.rejects(
    uploadImage({ type: "image/png", size: 6 * 1024 * 1024 }),
    /5 MB/,
  );
});
