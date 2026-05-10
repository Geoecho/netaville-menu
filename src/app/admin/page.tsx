"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface Promotion {
  id: number;
  name: string;
  price: string;
  description: string;
  imageUrl: string;
  category: "New" | "Recommended";
  label?: "Drink" | "Food";
}

export default function AdminPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const fetchPromotions = async () => {
    try {
      const res = await fetch("/api/promotions");
      if (res.ok) {
        const data = await res.json();
        setPromotions(data);
        return true;
      }
    } catch { /* API not available */ }
    return false;
  };

  useEffect(() => {
    const init = async () => {
      const fromApi = await fetchPromotions();
      if (!fromApi) {
        // Fallback to localStorage for local dev
        const saved = localStorage.getItem("netaville_promotions");
        if (saved) setPromotions(JSON.parse(saved));
      }
      setIsLoaded(true);
    };
    init();
  }, []);

  const saveItem = async (promo: Promotion) => {
    setSaving(promo.id);
    try {
      await fetch(`/api/promotions/${promo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promo),
      });
    } catch {
      localStorage.setItem("netaville_promotions", JSON.stringify(promotions));
    }
    setSaving(null);
  };

  const handleUpdate = (id: number, field: keyof Promotion, value: string) => {
    const updated = promotions.map((p) =>
      p.id === id ? { ...p, [field]: value } : p
    );
    setPromotions(updated);

    // Debounce API save
    const key = `${id}-${field}`;
    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
    debounceTimers.current[key] = setTimeout(() => {
      const item = updated.find((p) => p.id === id);
      if (item) saveItem(item);
    }, 500);
  };

  const handleAdd = async () => {
    const newItem = {
      name: "New Item",
      price: "0 MKD",
      category: "New",
      label: "Drink",
      description: "Enter description here...",
      imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=1000",
    };
    try {
      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      if (res.ok) {
        await fetchPromotions();
        return;
      }
    } catch { /* fallback */ }
    // Fallback for local dev
    const local: Promotion = { ...newItem, id: Date.now(), category: "New", label: "Drink" };
    const updated = [...promotions, local];
    setPromotions(updated);
    localStorage.setItem("netaville_promotions", JSON.stringify(updated));
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await fetch(`/api/promotions/${id}`, { method: "DELETE" });
    } catch { /* fallback */ }
    const updated = promotions.filter((p) => p.id !== id);
    setPromotions(updated);
    localStorage.setItem("netaville_promotions", JSON.stringify(updated));
  };

  const moveItem = async (index: number, direction: "up" | "down") => {
    const updated = [...promotions];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= updated.length) return;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setPromotions(updated);
    try {
      await fetch("/api/promotions/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: updated.map((p) => p.id) }),
      });
    } catch {
      localStorage.setItem("netaville_promotions", JSON.stringify(updated));
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset all items to factory defaults?")) return;
    try {
      const res = await fetch("/api/promotions/seed", { method: "POST" });
      if (res.ok) {
        await fetchPromotions();
        return;
      }
    } catch { /* fallback */ }
    localStorage.removeItem("netaville_promotions");
    window.location.reload();
  };

  const handleImageUpload = async (id: number, file: File) => {
    setUploading(id);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const { url } = await res.json();
        handleUpdate(id, "imageUrl", url);
        setUploading(null);
        return;
      }
    } catch { /* fallback */ }
    // Fallback: use object URL for local preview
    const localUrl = URL.createObjectURL(file);
    handleUpdate(id, "imageUrl", localUrl);
    setUploading(null);
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-zinc-50 p-8 md:p-12 lg:p-16">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-black tracking-tight mb-2 uppercase">Menu Admin</h1>
            <p className="text-zinc-500 font-medium">Manage categories, sort items, and update menu details.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleReset}
              className="px-6 py-2.5 bg-zinc-200 text-zinc-600 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-300 transition-all"
            >
              Reset to Defaults
            </button>
            <button 
              onClick={handleAdd}
              className="px-6 py-2.5 bg-[#00BFFE] text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 transition-all shadow-lg shadow-[#00BFFE]/20"
            >
              Add New Item
            </button>
          </div>
        </header>

        <div className="space-y-6">
          {promotions.map((promo, index) => (
            <motion.div 
              key={promo.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100 hover:border-[#00BFFE]/30 transition-all"
            >
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Image Preview & Sort Controls */}
                <div className="lg:w-48 space-y-4">
                  <div className="aspect-square rounded-2xl overflow-hidden border border-zinc-100 relative group-hover:shadow-md transition-all">
                    <img src={promo.imageUrl} alt="" className="w-full h-full object-cover" />
                    {uploading === promo.id && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-[#00BFFE] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-all cursor-pointer group/upload">
                      <span className="text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover/upload:opacity-100 transition-opacity">
                        Upload
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(promo.id, file);
                        }}
                      />
                    </label>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex gap-1">
                      <button 
                        onClick={() => moveItem(index, 'up')}
                        disabled={index === 0}
                        className="p-2 bg-zinc-50 rounded-lg hover:bg-zinc-100 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button 
                        onClick={() => moveItem(index, 'down')}
                        disabled={index === promotions.length - 1}
                        className="p-2 bg-zinc-50 rounded-lg hover:bg-zinc-100 disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>
                    <button 
                      onClick={() => handleDelete(promo.id)}
                      className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Edit Fields */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Category</label>
                      <select 
                        value={promo.category}
                        onChange={(e) => handleUpdate(promo.id, "category", e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:ring-2 focus:ring-[#00BFFE]/50 focus:outline-none transition-all font-bold text-sm"
                      >
                        <option value="Recommended">Recommended</option>
                        <option value="New">New</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Label</label>
                      <select 
                        value={promo.label || ""}
                        onChange={(e) => handleUpdate(promo.id, "label", e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:ring-2 focus:ring-[#00BFFE]/50 focus:outline-none transition-all font-bold text-sm"
                      >
                        <option value="">No label</option>
                        <option value="Drink">Drink</option>
                        <option value="Food">Food</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Item Name</label>
                      <input 
                        type="text" 
                        value={promo.name}
                        onChange={(e) => handleUpdate(promo.id, "name", e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:ring-2 focus:ring-[#00BFFE]/50 focus:outline-none transition-all font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Price</label>
                      <input 
                        type="text" 
                        value={promo.price}
                        onChange={(e) => handleUpdate(promo.id, "price", e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:ring-2 focus:ring-[#00BFFE]/50 focus:outline-none transition-all font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Image URL</label>
                      <input 
                        type="text" 
                        value={promo.imageUrl}
                        onChange={(e) => handleUpdate(promo.id, "imageUrl", e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:ring-2 focus:ring-[#00BFFE]/50 focus:outline-none transition-all text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Description</label>
                    <textarea 
                      value={promo.description}
                      onChange={(e) => handleUpdate(promo.id, "description", e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:ring-2 focus:ring-[#00BFFE]/50 focus:outline-none transition-all font-medium text-zinc-600"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-zinc-200 flex justify-between items-center">
          <a 
            href="/"
            className="px-10 py-4 bg-black text-white font-black rounded-full text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-black/10"
          >
            ← Back to Tablet Menu
          </a>
          <p className="text-[11px] font-bold text-zinc-400 italic">Changes are saved instantly.</p>
        </div>
      </div>
    </div>
  );
}
