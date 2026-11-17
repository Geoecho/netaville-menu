"use client";
/* eslint-disable @next/next/no-img-element */
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronRight,
  Eye,
  LayoutDashboard,
  LogOut,
  Package,
  Palette,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Tags,
  Trash2,
  Upload,
  X,
  QrCode,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  loadMenu,
  saveMenu,
  uploadImage,
  type MenuSnapshot,
} from "@/lib/menu-store";
import {
  freshMenu,
  productImages,
  withProductImages,
  stockState,
  validateMenu,
  type MenuData,
  type MenuItem,
  type MenuSettings,
  type PriceOption,
} from "@/lib/menu";
import MenuDisplay, { BrandLockup } from "./MenuDisplay";
import ProductImagesField from "./ProductImagesField";
import "./admin.css";

const sections = [
  { id: "overview", name: "Overview", icon: LayoutDashboard },
  { id: "menu", name: "Menu & offers", icon: Package },
  { id: "stock", name: "Stock", icon: Tags },
  { id: "categories", name: "Categories", icon: Settings2 },
  { id: "branding", name: "Branding", icon: Palette },
  { id: "display", name: "Display", icon: Eye },
  { id: "banner", name: "Student banner", icon: QrCode },
  { id: "access", name: "Access", icon: ShieldCheck },
];
const explanation: Record<string, string> = {
  overview: "A little overview of everything on your menu.",
  menu: "Good things, thoughtfully organised. Edit your products and offers.",
  stock: "Keep the display in sync with what you can serve.",
  categories:
    "Give everything a place. Reorder categories to change the display.",
  branding: "Two identities. One place to come together.",
  display: "Make the screen feel like you.",
  banner: "A clear invitation for your student community.",
  access: "Control who can make changes to your menu.",
};
function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : typeof error === "object" && error && "message" in error
      ? String(error.message)
      : "Something went wrong. Please try again.";
}
export default function AdminPanel() {
  const [user, setUser] = useState<string | null | undefined>(undefined);
  const [allowedUser, setAllowedUser] = useState<string | null>(null);
  const [authError, setAuthError] = useState("");
  useEffect(() => {
    if (!supabase) {
      queueMicrotask(() => {
        setUser("local-demo");
        setAllowedUser("local-demo");
      });
      return;
    }
    const client = supabase;
    client.auth.getUser().then(({ data }) => setUser(data.user?.id ?? null));
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user.id ?? null),
    );
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!supabase || !user) return;
    let alive = true;
    supabase
      .from("menu_admins")
      .select("user_id")
      .eq("user_id", user)
      .maybeSingle()
      .then(({ data, error }) => {
        if (alive) {
          setAllowedUser(data ? user : null);
          setAuthError(
            error
              ? message(error)
              : data
                ? ""
                : "Your account has not been granted menu access yet.",
          );
        }
      });
    return () => {
      alive = false;
    };
  }, [user]);
  if (user === undefined)
    return <div className="admin-loading">Opening your workspace…</div>;
  if (!user) return <Login />;
  if (allowedUser !== user)
    return (
      <div className="admin-login">
        <div className="login-card">
          <ShieldCheck />
          <h1>One more step.</h1>
          <p>{authError || "Checking menu access…"}</p>
          {authError && (
            <>
              <p>
                Run <b>supabase/setup.sql</b>, create your user in Supabase
                Authentication, and add its UUID to <b>menu_admins</b>.
              </p>
              <a
                className="admin-button primary"
                href="https://supabase.com/dashboard/project/gaswetypglhpvogtpzxo/sql/new"
                target="_blank"
                rel="noreferrer"
              >
                Open SQL editor <ArrowUpRight size={16} />
              </a>
              <button
                className="admin-button"
                onClick={() => {
                  setAllowedUser(null);
                  void supabase?.auth.signOut();
                }}
              >
                Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    );
  return <Workspace key={user} />;
}
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await supabase!.auth.signInWithPassword({
        email,
        password,
      });
      if (result.error) throw result.error;
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-login">
      <div className="login-story">
        <div className="admin-wordmark">
          <BrandLockup settings={freshMenu().settings} />
        </div>
        <div>
          <span className="admin-eyebrow">Behind the good things</span>
          <h1>
            Your menu.
            <br />
            Your way.
          </h1>
          <p>
            Fresh offers, stocked shelves, and a screen that feels like home.
            All in one place.
          </p>
        </div>
        <span>THE MENU WORKSPACE</span>
      </div>
      <form className="login-card" onSubmit={submit}>
        <span className="admin-eyebrow">Welcome back</span>
        <h1>Let’s set the menu.</h1>
        <p>Sign in with your staff account to make changes.</p>
        <Field label="Email">
          <input
            autoComplete="username"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password">
          <input
            autoComplete="current-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}
        <button className="admin-button primary" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
          <ChevronRight size={16} />
        </button>
        <Link href="/" className="text-link">
          Back to the menu <ArrowUpRight size={14} />
        </Link>
        <small>
          First time? Create a user in Supabase Authentication and grant access
          with the setup SQL.
        </small>
      </form>
    </div>
  );
}
function Workspace() {
  const [snapshot, setSnapshot] = useState<MenuSnapshot | null>(null);
  const [menu, setMenu] = useState<MenuData>(freshMenu);
  const [section, setSection] = useState("overview");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [uploadCount, setUploadCount] = useState(0);
  const [filter, setFilter] = useState("");
  const [editor, setEditor] = useState<MenuItem | null>(null);
  const [preview, setPreview] = useState(false);
  const dirty = Boolean(
    snapshot && JSON.stringify(menu) !== JSON.stringify(snapshot.menu),
  );
  async function reload() {
    setBusy(true);
    setError("");
    try {
      const result = await loadMenu();
      setSnapshot(result);
      setMenu(structuredClone(result.menu));
      setNotice("");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    let alive = true;
    loadMenu()
      .then((result) => {
        if (alive) {
          setSnapshot(result);
          setMenu(structuredClone(result.menu));
        }
      })
      .catch((e) => {
        if (alive) setError(message(e));
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  async function publish() {
    if (!snapshot) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await saveMenu(menu, snapshot);
      setSnapshot(structuredClone(result));
      setNotice(
        supabase
          ? "Published. Displays will refresh within 15 seconds."
          : "Saved to this browser only.",
      );
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  function updateItem(id: string, patch: Partial<MenuItem>) {
    setMenu((m) => ({
      ...m,
      items: m.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
    setNotice("");
  }
  function updateSettings<K extends keyof MenuSettings>(
    key: K,
    value: MenuSettings[K],
  ) {
    setMenu((m) => ({ ...m, settings: { ...m.settings, [key]: value } }));
    setNotice("");
  }
  function move(kind: "items" | "categories", id: string, direction: number) {
    setMenu((m) => {
      const list = [...m[kind]];
      const at = list.findIndex((i) => i.id === id);
      const to = at + direction;
      if (to < 0 || to >= list.length) return m;
      [list[at], list[to]] = [list[to], list[at]];
      return { ...m, [kind]: list };
    });
  }
  function newItem() {
    if (!menu.categories.length) {
      setSection("categories");
      setError("Add a category before adding a product.");
      return;
    }
    setEditor({
      id: crypto.randomUUID(),
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
      categoryId: menu.categories[0].id,
      label: "Drink",
      visible: true,
      featured: false,
      stock: "available",
      quantity: null,
      lowThreshold: 5,
      allergens: "",
      sizes: [],
      extras: [],
      studentPrice: null,
      offerStart: "",
      offerEnd: "",
    });
  }
  const shown = menu.items.filter(
    (i) =>
      (!filter || i.categoryId === filter) &&
      `${i.name} ${i.description}`.toLowerCase().includes(search.toLowerCase()),
  );
  const soldOut = menu.items.filter((i) => stockState(i) === "sold-out");
  const low = menu.items.filter((i) => stockState(i) === "low");
  const title = sections.find((s) => s.id === section)!.name;
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-wordmark">
          <BrandLockup settings={menu.settings} />
        </Link>
        <div className="workspace-label">MENU WORKSPACE</div>
        <nav aria-label="Admin sections">
          {sections.map((s) => (
            <button
              key={s.id}
              className={section === s.id ? "active" : ""}
              aria-current={section === s.id ? "page" : undefined}
              onClick={() => {
                setSection(s.id);
                setSearch("");
                setFilter("");
              }}
            >
              <s.icon size={18} />
              {s.name}
              {s.id === "stock" && soldOut.length > 0 && (
                <span className="nav-count">{soldOut.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className={`connection-dot ${supabase ? "" : "demo"}`} />
          <div>
            <b>{supabase ? "Supabase connected" : "Local demo"}</b>
            <small>
              {supabase ? "Protected staff workspace" : "This browser only"}
            </small>
          </div>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <b>{title}</b>
          </div>
          <div className="topbar-actions">
            <a href="/" target="_blank" className="text-link" rel="noreferrer">
              Live menu <ArrowUpRight size={14} />
            </a>
            {supabase && (
              <button
                title="Sign out"
                aria-label="Sign out"
                className="icon-button"
                onClick={() => {
                  if (
                    !dirty ||
                    confirm("Discard unpublished changes and sign out?")
                  )
                    void supabase?.auth.signOut();
                }}
              >
                <LogOut size={17} />
              </button>
            )}
          </div>
        </header>
        <div className="admin-content">
          <div className="page-heading">
            <div>
              <span className="admin-eyebrow">MENU WORKSPACE</span>
              <h1>
                {title}
                <span className="heading-dot">.</span>
              </h1>
              <p>{explanation[section]}</p>
            </div>
            <div className="heading-actions">
              <button
                className="admin-button"
                onClick={() => {
                  const issue = validateMenu(menu);
                  if (issue) {
                    setError(issue);
                    return;
                  }
                  setPreview(true);
                }}
              >
                <Eye size={16} />
                Preview
              </button>
              <button
                className="admin-button primary"
                disabled={
                  busy ||
                  uploadCount > 0 ||
                  !snapshot ||
                  (!dirty && snapshot.exists)
                }
                onClick={publish}
              >
                <Check size={16} />
                {busy
                  ? "Saving…"
                  : !snapshot?.exists
                    ? "Publish initial menu"
                    : "Publish changes"}
              </button>
            </div>
          </div>
          <div className="save-status" role="status">
            {dirty ? (
              <>
                <span className="status-dot pending" />
                Unpublished changes · publish to update the display
              </>
            ) : (
              <>
                <span className="status-dot" />
                {notice ||
                  (!snapshot
                    ? "Loading menu…"
                    : snapshot.exists
                      ? "All changes published"
                      : "Starter menu ready · publish to make it live")}
              </>
            )}
          </div>
          {!supabase && (
            <div className="admin-callout">
              You’re in local demo mode. Changes and image uploads stay in this
              browser.
            </div>
          )}
          {error && (
            <div className="admin-error" role="alert">
              <b>Couldn’t complete that.</b> {error}
              <button
                className="text-link"
                onClick={() => {
                  if (
                    !dirty ||
                    confirm("Discard unpublished changes and reload?")
                  )
                    void reload();
                }}
              >
                Reload published menu
              </button>
              {!snapshot && (
                <p>
                  Check that <code>supabase/setup.sql</code> has been run in
                  your project.
                </p>
              )}
            </div>
          )}
          {snapshot && (
            <>
              {section === "overview" && (
                <>
                  <div className="stat-grid">
                    {[
                      {
                        name: "Products on the menu",
                        value: menu.items.length,
                        detail: `${menu.categories.length} categories`,
                      },
                      {
                        name: "Ready to serve",
                        value: menu.items.filter(
                          (i) => stockState(i) !== "sold-out",
                        ).length,
                        detail: "Availability across all products",
                      },
                      {
                        name: "Running low",
                        value: low.length,
                        detail: "A little restock might help",
                      },
                      {
                        name: "Sold out",
                        value: soldOut.length,
                        detail: "Keep your guests in the loop",
                      },
                    ].map((stat) => (
                      <div className="stat-card" key={stat.name}>
                        <span>{stat.name}</span>
                        <strong>
                          {stat.value.toString().padStart(2, "0")}
                        </strong>
                        <small>{stat.detail}</small>
                      </div>
                    ))}
                  </div>
                  <div className="overview-grid">
                    <section className="admin-card welcome-card">
                      <span className="admin-eyebrow">MAKE IT A GOOD ONE</span>
                      <h2>
                        A fresh menu.
                        <br />A familiar feeling.
                      </h2>
                      <p>
                        Keep your favourites in the spotlight, introduce
                        something new, or give the whole display a refresh.
                      </p>
                      <button
                        className="admin-button dark"
                        onClick={() => setSection("menu")}
                      >
                        Manage the menu <ArrowUpRight size={16} />
                      </button>
                      <div className="welcome-brand">
                        <BrandLockup settings={menu.settings} />
                      </div>
                    </section>
                    <section className="admin-card">
                      <div className="card-heading">
                        <h2>Needs a little attention</h2>
                        <button
                          className="text-link"
                          onClick={() => setSection("stock")}
                        >
                          View stock <ArrowUpRight size={14} />
                        </button>
                      </div>
                      {[...soldOut, ...low].length === 0 ? (
                        <div className="attention-empty">
                          <Check size={26} />
                          <h3>Looking good.</h3>
                          <p>Everything is available. You’re ready to serve.</p>
                        </div>
                      ) : (
                        [...soldOut, ...low].slice(0, 5).map((i) => (
                          <div className="attention-row" key={i.id}>
                            <div>
                              <b>{i.name}</b>
                              <small>
                                {i.quantity === null
                                  ? "Manual availability"
                                  : `${i.quantity} remaining`}
                              </small>
                            </div>
                            <StockBadge item={i} />
                          </div>
                        ))
                      )}
                    </section>
                  </div>
                  <section className="admin-card quick-links">
                    <button
                      onClick={() => {
                        setSection("menu");
                        newItem();
                      }}
                    >
                      <Plus />
                      <span>
                        <b>Add something new</b>
                        <small>A new drink, a new favourite.</small>
                      </span>
                      <ChevronRight />
                    </button>
                    <button onClick={() => setSection("branding")}>
                      <Palette />
                      <span>
                        <b>Make it yours</b>
                        <small>Logos, colours and collaboration.</small>
                      </span>
                      <ChevronRight />
                    </button>
                    <button onClick={() => setSection("banner")}>
                      <QrCode />
                      <span>
                        <b>Update student offers</b>
                        <small>A reason to stop by.</small>
                      </span>
                      <ChevronRight />
                    </button>
                  </section>
                </>
              )}
              {(section === "menu" || section === "stock") && (
                <section className="admin-card product-card">
                  <div className="list-toolbar">
                    <div className="search-field">
                      <Search size={17} />
                      <input
                        aria-label="Search products"
                        placeholder="Find a product…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <select
                      aria-label="Filter category"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="">All categories</option>
                      {menu.categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      className="admin-button"
                      onClick={() => setSection("categories")}
                    >
                      <Settings2 size={16} />
                      Manage categories
                    </button>
                    {section === "menu" && (
                      <button
                        className="admin-button primary"
                        onClick={newItem}
                      >
                        <Plus size={16} />
                        Add product
                      </button>
                    )}
                  </div>
                  <div className="table-scroll">
                    <table className="product-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>
                            {section === "stock" ? "Availability" : "Category"}
                          </th>
                          <th>{section === "stock" ? "Quantity" : "Price"}</th>
                          <th>{section === "stock" ? "Low at" : "Status"}</th>
                          <th className="align-right">
                            {section === "stock" ? "Restock" : "Actions"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {shown.map((i) => (
                          <tr key={i.id}>
                            <td>
                              <div className="product-cell">
                                {i.imageUrl ? (
                                  <img src={i.imageUrl} alt="" />
                                ) : (
                                  <span className="mini-placeholder">
                                    <Package size={20} />
                                  </span>
                                )}
                                <div>
                                  <button
                                    onClick={() =>
                                      setEditor(structuredClone(i))
                                    }
                                  >
                                    {i.name}
                                  </button>
                                  <small>
                                    {section === "stock"
                                      ? menu.categories.find(
                                          (c) => c.id === i.categoryId,
                                        )?.name
                                      : i.studentPrice !== null
                                        ? `Student: ${i.studentPrice} ${menu.settings.currency}`
                                        : i.featured
                                          ? "Featured product"
                                          : "Regular menu"}
                                  </small>
                                </div>
                              </div>
                            </td>
                            {section === "stock" ? (
                              <>
                                <td>
                                  <select
                                    aria-label={`Availability for ${i.name}`}
                                    value={i.stock}
                                    onChange={(e) =>
                                      updateItem(i.id, {
                                        stock: e.target
                                          .value as MenuItem["stock"],
                                      })
                                    }
                                  >
                                    <option value="available">Available</option>
                                    <option value="low">Low stock</option>
                                    <option value="sold-out">Sold out</option>
                                  </select>
                                  <StockBadge item={i} />
                                </td>
                                <td>
                                  <input
                                    className="stock-input"
                                    type="number"
                                    min="0"
                                    step="1"
                                    placeholder="Untracked"
                                    aria-label={`Quantity for ${i.name}`}
                                    value={i.quantity ?? ""}
                                    onChange={(e) =>
                                      updateItem(i.id, {
                                        quantity:
                                          e.target.value === ""
                                            ? null
                                            : Number(e.target.value),
                                      })
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    className="stock-input"
                                    type="number"
                                    min="0"
                                    step="1"
                                    aria-label={`Low stock threshold for ${i.name}`}
                                    value={i.lowThreshold}
                                    onChange={(e) =>
                                      updateItem(i.id, {
                                        lowThreshold: Number(e.target.value),
                                      })
                                    }
                                  />
                                </td>
                                <td className="align-right">
                                  <button
                                    className="admin-button small"
                                    onClick={() => {
                                      if (i.quantity === null) {
                                        updateItem(i.id, {
                                          stock: "available",
                                        });
                                        return;
                                      }
                                      const answer = prompt(
                                        `Total units available now for ${i.name}:`,
                                        String(i.quantity),
                                      );
                                      if (answer === null) return;
                                      const quantity = Number(answer);
                                      if (
                                        !answer.trim() ||
                                        !Number.isInteger(quantity) ||
                                        quantity < 0
                                      ) {
                                        setError(
                                          "Enter a whole-number stock quantity of zero or more.",
                                        );
                                        return;
                                      }
                                      updateItem(i.id, {
                                        stock: "available",
                                        quantity,
                                      });
                                    }}
                                  >
                                    {i.quantity === null
                                      ? "Mark available"
                                      : "Restock"}
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td>
                                  <select
                                    className="category-select"
                                    aria-label={`Category for ${i.name}`}
                                    value={i.categoryId}
                                    onChange={(e) =>
                                      updateItem(i.id, {
                                        categoryId: e.target.value,
                                      })
                                    }
                                  >
                                    {menu.categories.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name}
                                        {c.visible ? "" : " (hidden)"}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="price-cell">
                                  {i.price}{" "}
                                  <small>{menu.settings.currency}</small>
                                </td>
                                <td>
                                  <button
                                    className={`pill ${i.visible ? "green" : "neutral"}`}
                                    onClick={() =>
                                      updateItem(i.id, { visible: !i.visible })
                                    }
                                  >
                                    {i.visible ? "Visible" : "Hidden"}
                                  </button>
                                </td>
                                <td>
                                  <div className="row-actions">
                                    <button
                                      className="icon-button"
                                      aria-label={`Move ${i.name} up`}
                                      disabled={menu.items[0].id === i.id}
                                      onClick={() => move("items", i.id, -1)}
                                    >
                                      <ArrowUp size={15} />
                                    </button>
                                    <button
                                      className="icon-button"
                                      aria-label={`Move ${i.name} down`}
                                      disabled={menu.items.at(-1)?.id === i.id}
                                      onClick={() => move("items", i.id, 1)}
                                    >
                                      <ArrowDown size={15} />
                                    </button>
                                    <button
                                      className="admin-button small"
                                      onClick={() =>
                                        setEditor(structuredClone(i))
                                      }
                                    >
                                      Edit
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {shown.length === 0 && (
                    <div className="attention-empty">
                      <Package />
                      <h3>No products here yet.</h3>
                      <p>Try another search, or add your first product.</p>
                    </div>
                  )}
                  {section === "stock" && (
                    <p className="table-note">
                      Leave quantity empty for manual availability. Zero
                      quantity always shows sold out. Changes take effect after
                      publishing.
                    </p>
                  )}
                </section>
              )}
              {section === "categories" && (
                <section className="admin-card">
                  <div className="card-heading">
                    <h2>Your categories</h2>
                    <button
                      className="admin-button primary"
                      onClick={() =>
                        setMenu((m) => ({
                          ...m,
                          categories: [
                            ...m.categories,
                            {
                              id: crypto.randomUUID(),
                              name: "New category",
                              visible: true,
                            },
                          ],
                        }))
                      }
                    >
                      <Plus size={16} />
                      Add category
                    </button>
                  </div>
                  {menu.categories.map((c, index) => (
                    <div className="category-row" key={c.id}>
                      <span className="category-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <input
                        aria-label={`Category ${index + 1} name`}
                        value={c.name}
                        onChange={(e) =>
                          setMenu((m) => ({
                            ...m,
                            categories: m.categories.map((x) =>
                              x.id === c.id
                                ? { ...x, name: e.target.value }
                                : x,
                            ),
                          }))
                        }
                      />
                      <span className="category-product-count">
                        {menu.items.filter((i) => i.categoryId === c.id).length}{" "}
                        products
                      </span>
                      <button
                        className={`pill ${c.visible ? "green" : "neutral"}`}
                        onClick={() =>
                          setMenu((m) => ({
                            ...m,
                            categories: m.categories.map((x) =>
                              x.id === c.id ? { ...x, visible: !x.visible } : x,
                            ),
                          }))
                        }
                      >
                        {c.visible ? "Visible" : "Hidden"}
                      </button>
                      <button
                        className="icon-button"
                        disabled={index === 0}
                        aria-label={`Move ${c.name} up`}
                        onClick={() => move("categories", c.id, -1)}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        className="icon-button"
                        disabled={index === menu.categories.length - 1}
                        aria-label={`Move ${c.name} down`}
                        onClick={() => move("categories", c.id, 1)}
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        className="icon-button danger"
                        aria-label={`Delete ${c.name}`}
                        onClick={() => {
                          if (menu.items.some((i) => i.categoryId === c.id)) {
                            setError(
                              "Move this category’s products to another category before deleting it.",
                            );
                            return;
                          }
                          if (confirm(`Delete ${c.name}?`))
                            setMenu((m) => ({
                              ...m,
                              categories: m.categories.filter(
                                (x) => x.id !== c.id,
                              ),
                            }));
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <p className="table-note">
                    Hiding a category also hides its products from featured
                    offers and suggestions.
                  </p>
                </section>
              )}
              {section === "branding" && (
                <div className="settings-grid">
                  <section className="admin-card settings-form">
                    <h2>The collaboration</h2>
                    <Field label="Primary brand name">
                      <input
                        value={menu.settings.brandName}
                        onChange={(e) =>
                          updateSettings("brandName", e.target.value)
                        }
                      />
                    </Field>
                    <ImageField
                      label="Netaville logo"
                      onBusyChange={(busy) =>
                        setUploadCount((n) => n + (busy ? 1 : -1))
                      }
                      value={menu.settings.logoUrl}
                      onChange={(value) => updateSettings("logoUrl", value)}
                    />
                    <Field label="Primary logo height (px)">
                      <input
                        type="number"
                        min="20"
                        max="100"
                        value={menu.settings.logoSize}
                        onChange={(e) =>
                          updateSettings("logoSize", Number(e.target.value))
                        }
                      />
                    </Field>
                    <Field label="Partner name">
                      <input
                        value={menu.settings.partnerName}
                        onChange={(e) =>
                          updateSettings("partnerName", e.target.value)
                        }
                      />
                    </Field>
                    <ImageField
                      label="Eightysix logo"
                      onBusyChange={(busy) =>
                        setUploadCount((n) => n + (busy ? 1 : -1))
                      }
                      value={menu.settings.partnerLogoUrl}
                      onChange={(value) =>
                        updateSettings("partnerLogoUrl", value)
                      }
                    />
                    <Field label="Partner logo height (px)">
                      <input
                        type="number"
                        min="20"
                        max="100"
                        value={menu.settings.partnerLogoSize}
                        onChange={(e) =>
                          updateSettings(
                            "partnerLogoSize",
                            Number(e.target.value),
                          )
                        }
                      />
                    </Field>
                    <ColourField
                      label="Brand strip background"
                      value={menu.settings.brandBackground}
                      onChange={(v) => updateSettings("brandBackground", v)}
                    />
                    <ColourField
                      label="Brand strip text colour"
                      value={menu.settings.brandTextColor}
                      onChange={(v) => updateSettings("brandTextColor", v)}
                    />
                    <Toggle
                      label="Show collaboration strip"
                      checked={menu.settings.showBranding}
                      onChange={(v) => updateSettings("showBranding", v)}
                    />
                  </section>
                  <section className="admin-card brand-preview">
                    <span className="admin-eyebrow">
                      THE TWO OF YOU, TOGETHER
                    </span>
                    <div>
                      <BrandLockup settings={menu.settings} />
                    </div>
                    <h2>
                      A shared identity.
                      <br />
                      Room for both brands.
                    </h2>
                    <p>
                      Both original logos are included. Their proportions stay
                      intact, and separate sizing controls help balance the two
                      marks. No extra brand-name text is added.
                    </p>
                  </section>
                </div>
              )}
              {section === "display" && (
                <div className="settings-grid">
                  <section className="admin-card settings-form">
                    <h2>Screen settings</h2>
                    <ColourField
                      label="Accent colour"
                      value={menu.settings.accent}
                      onChange={(v) => updateSettings("accent", v)}
                    />
                    <ColourField
                      label="Page background"
                      value={menu.settings.background}
                      onChange={(v) => updateSettings("background", v)}
                    />
                    <ColourField
                      label="Text colour"
                      value={menu.settings.textColor}
                      onChange={(v) => updateSettings("textColor", v)}
                    />
                    <Field label="Currency">
                      <input
                        value={menu.settings.currency}
                        onChange={(e) =>
                          updateSettings("currency", e.target.value)
                        }
                      />
                    </Field>
                    <Field label="Slideshow interval (seconds)">
                      <input
                        type="number"
                        min="3"
                        max="120"
                        value={menu.settings.slideSeconds}
                        onChange={(e) =>
                          updateSettings("slideSeconds", Number(e.target.value))
                        }
                      />
                    </Field>
                    <Toggle
                      label="Hide sold-out products"
                      checked={menu.settings.hideSoldOut}
                      onChange={(v) => updateSettings("hideSoldOut", v)}
                    />
                    <Toggle
                      label="Show surprise button"
                      checked={menu.settings.showSurprise}
                      onChange={(v) => updateSettings("showSurprise", v)}
                    />
                  </section>
                  <section className="admin-card settings-form">
                    <h2>The words on the screen</h2>
                    {(
                      [
                        ["featuredTitle", "Featured tab"],
                        ["studentTitle", "Student banner label"],
                        ["surpriseLabel", "Surprise button"],
                        ["emptyTitle", "Empty menu message"],
                      ] as const
                    ).map(([key, label]) => (
                      <Field label={label} key={key}>
                        <input
                          value={menu.settings[key]}
                          onChange={(e) => updateSettings(key, e.target.value)}
                        />
                      </Field>
                    ))}
                    <p className="table-note">
                      Sold-out items are always excluded from surprise
                      suggestions. Use Preview to check your unpublished
                      changes.
                    </p>
                  </section>
                </div>
              )}
              {section === "banner" && (
                <section className="admin-card settings-form narrow-form">
                  <h2>Something for the students</h2>
                  <Toggle
                    label="Show student banner"
                    checked={menu.settings.showBanner}
                    onChange={(v) => updateSettings("showBanner", v)}
                  />
                  <Field label="Heading">
                    <input
                      value={menu.settings.bannerTitle}
                      onChange={(e) =>
                        updateSettings("bannerTitle", e.target.value)
                      }
                    />
                  </Field>
                  <Field label="Description">
                    <textarea
                      rows={4}
                      value={menu.settings.bannerText}
                      onChange={(e) =>
                        updateSettings("bannerText", e.target.value)
                      }
                    />
                  </Field>
                  <Field
                    label="QR destination URL"
                    hint="Set a URL to generate a new QR code. Leave empty to keep the original QR code."
                  >
                    <input
                      type="url"
                      placeholder="https://your-app.com"
                      value={menu.settings.qrUrl}
                      onChange={(e) => updateSettings("qrUrl", e.target.value)}
                    />
                  </Field>
                  <div className="admin-callout">
                    Set student prices and optional offer dates inside each
                    product’s editor.
                  </div>
                </section>
              )}
              {section === "access" && (
                <section className="admin-card settings-form narrow-form">
                  <ShieldCheck size={30} />
                  <h2>A small, trusted team.</h2>
                  <p>
                    Only authenticated users in the menu_admins allowlist can
                    publish changes or upload images. The public menu has read
                    access only.
                  </p>
                  <ol>
                    <li>
                      Create each staff account in Supabase → Authentication →
                      Users.
                    </li>
                    <li>
                      Copy its user UUID and add it to the menu_admins table.
                    </li>
                    <li>Remove the row to revoke editing and upload access.</li>
                  </ol>
                  <a
                    className="admin-button"
                    href="https://supabase.com/dashboard/project/gaswetypglhpvogtpzxo/auth/users"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Manage staff in Supabase <ArrowUpRight size={16} />
                  </a>
                  <p className="table-note">
                    Account provisioning is managed in Supabase for this
                    version. Staff members have the same editing permissions. No
                    service-role key is used by this app.
                  </p>
                </section>
              )}
              <footer className="admin-footer">
                <span>Good things start here.</span>
                <button
                  className="text-link"
                  onClick={() => {
                    if (
                      !dirty ||
                      confirm(
                        "Discard unpublished changes and reload the published menu?",
                      )
                    )
                      void reload();
                  }}
                >
                  Reload published menu
                </button>
              </footer>
            </>
          )}
        </div>
      </div>
      {editor && (
        <ProductEditor
          key={editor.id}
          item={editor}
          menu={menu}
          onClose={() => setEditor(null)}
          onSave={(item) => {
            setMenu((m) => ({
              ...m,
              items: m.items.some((i) => i.id === item.id)
                ? m.items.map((i) => (i.id === item.id ? item : i))
                : [...m.items, item],
            }));
            setEditor(null);
          }}
          onDelete={() => {
            if (confirm(`Delete ${editor.name || "this product"}?`)) {
              setMenu((m) => ({
                ...m,
                items: m.items.filter((i) => i.id !== editor.id),
              }));
              setEditor(null);
            }
          }}
        />
      )}
      {preview && <Preview menu={menu} onClose={() => setPreview(false)} />}
    </div>
  );
}
function Preview({ menu, onClose }: { menu: MenuData; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="preview-overlay"
      aria-label="Unpublished menu preview"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="preview-bar">
        <b>Draft preview</b>
        <span>Changes appear here before you publish.</span>
        <button className="admin-button" autoFocus onClick={onClose}>
          <X size={16} />
          Close preview
        </button>
      </div>
      <div className="preview-screen">
        <MenuDisplay preview={menu} />
      </div>
    </dialog>
  );
}
function StockBadge({ item }: { item: MenuItem }) {
  const state = stockState(item);
  return (
    <span
      className={`pill ${state === "sold-out" ? "red" : state === "low" ? "amber" : "green"}`}
    >
      {state === "sold-out"
        ? "Sold out"
        : state === "low"
          ? "Low stock"
          : "Available"}
    </span>
  );
}
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="toggle-field">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle-track" aria-hidden="true" />
    </label>
  );
}
function ColourField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="colour-field">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          aria-label={`${label} hex`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </Field>
  );
}
function ImageField({
  label,
  value,
  onChange,
  onBusyChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="image-field">
      <Field label={label}>
        <input
          placeholder="https://… or upload below"
          value={value.startsWith("data:") ? "" : value}
          onChange={(e) => onChange(e.target.value)}
        />
      </Field>
      <div className="image-upload-row">
        {value && <img src={value} alt={`${label} preview`} />}
        <label className={`admin-button small ${busy ? "disabled" : ""}`}>
          <Upload size={14} />
          {busy ? "Uploading…" : "Upload image"}
          <input
            type="file"
            className="sr-only"
            disabled={busy}
            accept="image/png,image/jpeg,image/webp"
            onChange={async (e) => {
              const input = e.currentTarget;
              const file = input.files?.[0];
              if (!file) return;
              setBusy(true);
              onBusyChange?.(true);
              setError("");
              try {
                onChange(await uploadImage(file));
              } catch (err) {
                setError(message(err));
              } finally {
                setBusy(false);
                onBusyChange?.(false);
                input.value = "";
              }
            }}
          />
        </label>
        {value && (
          <button
            type="button"
            className="text-link"
            onClick={() => onChange("")}
          >
            Remove
          </button>
        )}
        <small>PNG, JPG, WebP · max 5 MB</small>
      </div>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
function ProductEditor({
  item,
  menu,
  onClose,
  onSave,
  onDelete,
}: {
  item: MenuItem;
  menu: MenuData;
  onClose: () => void;
  onSave: (i: MenuItem) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(item);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [sizes, setSizes] = useState(
    item.sizes.map((o) => `${o.name} | ${o.price}`).join("\n"),
  );
  const [extras, setExtras] = useState(
    item.extras.map((o) => `${o.name} | ${o.price}`).join("\n"),
  );
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.querySelector<HTMLInputElement>("input")?.focus();
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (confirm("Close the editor and discard its unsaved changes?"))
          onClose();
      }
      if (e.key === "Tab") {
        const targets = ref.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input:not(:disabled), select, textarea, a[href]",
        );
        if (!targets?.length) return;
        const first = targets[0],
          last = targets[targets.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
      previous?.focus();
    };
  }, [onClose]);
  function patch<K extends keyof MenuItem>(key: K, value: MenuItem[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }
  function parseOptions(text: string): PriceOption[] {
    return text
      .split("\n")
      .filter((l) => l.trim())
      .map((line) => {
        const [name, price, ...rest] = line.split("|");
        if (!name?.trim() || !price?.trim() || rest.length)
          throw new Error("Use one option per line: Name | price");
        const amount = Number(price.trim());
        if (!Number.isFinite(amount) || amount < 0)
          throw new Error("Option prices must be zero or more.");
        return { name: name.trim(), price: amount };
      });
  }
  const dateValue = (value: string) => {
    if (!value) return "";
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };
  function submit(e: FormEvent) {
    e.preventDefault();
    if (uploading) return;
    try {
      const updated = {
        ...draft,
        sizes: parseOptions(sizes),
        extras: parseOptions(extras),
      };
      const issue = validateMenu({
        ...menu,
        items: menu.items.some((i) => i.id === updated.id)
          ? menu.items.map((i) => (i.id === updated.id ? updated : i))
          : [...menu.items, updated],
      });
      if (issue) throw new Error(issue);
      onSave(updated);
    } catch (e) {
      setError(message(e));
    }
  }
  return (
    <div className="editor-overlay">
      <div
        className="product-editor"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-editor-title"
      >
        <header>
          <div>
            <span className="admin-eyebrow">THE DETAILS MAKE IT</span>
            <h2 id="product-editor-title">
              {item.name ? "Edit product" : "Something new"}
            </h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close product editor"
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </header>
        <form onSubmit={submit}>
          <div className="editor-body">
            <Field label="Product name">
              <input
                required
                value={draft.name}
                onChange={(e) => patch("name", e.target.value)}
              />
            </Field>
            <Field label="Description">
              <textarea
                rows={3}
                value={draft.description}
                onChange={(e) => patch("description", e.target.value)}
              />
            </Field>
            <ProductImagesField
              onBusyChange={setUploading}
              value={productImages(draft)}
              onChange={(urls) =>
                setDraft((previous) => withProductImages(previous, urls))
              }
            />
            <div className="field-pair">
              <Field label={`Price (${menu.settings.currency})`}>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={draft.price}
                  onChange={(e) => patch("price", Number(e.target.value))}
                />
              </Field>
              <Field label="Category">
                <select
                  value={draft.categoryId}
                  onChange={(e) => patch("categoryId", e.target.value)}
                >
                  {menu.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Surprise Me heading" hint="Optional. Used when this product is drawn; leave empty for rotating headings.">
              <input maxLength={100} placeholder="Your new afternoon ritual." value={draft.surpriseHeading ?? ""} onChange={(e) => patch("surpriseHeading", e.target.value)} />
            </Field>
            <Field label="Product label">
              <input
                placeholder="Drink, Food, Special…"
                value={draft.label}
                onChange={(e) => patch("label", e.target.value)}
              />
            </Field>
            <Field label="Allergens">
              <input
                placeholder="Milk, gluten, nuts…"
                value={draft.allergens}
                onChange={(e) => patch("allergens", e.target.value)}
              />
            </Field>
            <div className="field-pair">
              <Field label="Sizes" hint="One per line: Large | 220">
                <textarea
                  rows={3}
                  value={sizes}
                  onChange={(e) => setSizes(e.target.value)}
                />
              </Field>
              <Field label="Extras" hint="One per line: Oat milk | 30">
                <textarea
                  rows={3}
                  value={extras}
                  onChange={(e) => setExtras(e.target.value)}
                />
              </Field>
            </div>
            <div className="editor-section-title">Offers & visibility</div>
            <Toggle
              label="Visible on menu"
              checked={draft.visible}
              onChange={(v) => patch("visible", v)}
            />
            <Toggle
              label="Featured product"
              checked={draft.featured}
              onChange={(v) => patch("featured", v)}
            />
            <Field
              label={`Student price (${menu.settings.currency})`}
              hint="Leave empty to exclude from student offers."
            >
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.studentPrice ?? ""}
                onChange={(e) =>
                  patch(
                    "studentPrice",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
              />
            </Field>
            <div className="field-pair">
              <Field label="Offer starts (local time)">
                <input
                  type="datetime-local"
                  value={dateValue(draft.offerStart)}
                  onChange={(e) =>
                    patch(
                      "offerStart",
                      e.target.value
                        ? new Date(e.target.value).toISOString()
                        : "",
                    )
                  }
                />
              </Field>
              <Field label="Offer ends (local time)">
                <input
                  type="datetime-local"
                  value={dateValue(draft.offerEnd)}
                  onChange={(e) =>
                    patch(
                      "offerEnd",
                      e.target.value
                        ? new Date(e.target.value).toISOString()
                        : "",
                    )
                  }
                />
              </Field>
            </div>
            <p className="table-note">
              Leave dates empty for an ongoing offer. Set availability and
              quantities in the Stock section.
            </p>
            {error && (
              <p className="admin-error" role="alert">
                {error}
              </p>
            )}
          </div>
          <footer>
            <button
              type="button"
              className="icon-button danger"
              aria-label="Delete product"
              onClick={onDelete}
            >
              <Trash2 size={18} />
            </button>
            <div>
              <button type="button" className="admin-button" onClick={onClose}>
                Cancel
              </button>
              <button className="admin-button primary" disabled={uploading}>
                Apply to draft <Check size={16} />
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
