"use client";
import { freshMenu, validateMenu, type MenuData } from "./menu";
import { supabase } from "./supabase";

const DEMO_KEY = "netaville-menu-demo-v1";
export interface MenuSnapshot {
  menu: MenuData;
  version: number;
  exists: boolean;
}
export async function loadMenu(): Promise<MenuSnapshot> {
  if (!supabase) {
    const raw = localStorage.getItem(DEMO_KEY);
    if (!raw) return { menu: freshMenu(), version: 0, exists: false };
    const snapshot = JSON.parse(raw) as MenuSnapshot;
    const issue = validateMenu(snapshot.menu);
    if (issue) throw new Error(issue);
    return snapshot;
  }
  const { data, error } = await supabase
    .from("menu_config")
    .select("data,version")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { menu: freshMenu(), version: 0, exists: false };
  const issue = validateMenu(data.data);
  if (issue) throw new Error(issue);
  return { menu: data.data as MenuData, version: data.version, exists: true };
}
export async function saveMenu(
  menu: MenuData,
  snapshot: MenuSnapshot,
): Promise<MenuSnapshot> {
  const issue = validateMenu(menu);
  if (issue) throw new Error(issue);
  const next = { menu, version: snapshot.version + 1, exists: true };
  if (!supabase) {
    localStorage.setItem(DEMO_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("menu-demo-change"));
    return next;
  }
  const result = snapshot.exists
    ? await supabase
        .from("menu_config")
        .update({ data: menu, version: next.version })
        .eq("id", 1)
        .eq("version", snapshot.version)
        .select("version")
    : await supabase
        .from("menu_config")
        .insert({ id: 1, data: menu, version: next.version })
        .select("version");
  if (result.error) throw result.error;
  if (result.data?.length !== 1)
    throw new Error(
      "Another admin has saved changes, or your access has changed. Reload the published menu before trying again.",
    );
  return next;
}
export async function uploadImage(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Choose a PNG, JPG or WebP image.");
  if (file.size > 5 * 1024 * 1024)
    throw new Error("Images must be smaller than 5 MB.");
  if (!supabase) {
    if (file.size > 1024 * 1024)
      throw new Error(
        "Demo uploads must be under 1 MB. Connect Supabase for larger files.",
      );
    // Demo images persist in this browser, unlike temporary object URLs.
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read image."));
      reader.readAsDataURL(file);
    });
  }
  const path = `${crypto.randomUUID()}.${file.type.split("/")[1]}`;
  const { error } = await supabase.storage
    .from("menu-images")
    .upload(path, file, { cacheControl: "31536000", upsert: false });
  if (error) throw error;
  return supabase.storage.from("menu-images").getPublicUrl(path).data.publicUrl;
}
export async function uploadImages(
  files: File[],
  onProgress?: (done: number, total: number) => void,
) {
  const results: PromiseSettledResult<string>[] = [];
  let done = 0;
  // Keep selection order while limiting simultaneous uploads.
  for (let offset = 0; offset < files.length; offset += 3) {
    results.push(
      ...(await Promise.allSettled(
        files.slice(offset, offset + 3).map(async (file) => {
          try {
            return await uploadImage(file);
          } finally {
            onProgress?.(++done, files.length);
          }
        }),
      )),
    );
  }
  const urls: string[] = [];
  const failed: { file: File; message: string }[] = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") urls.push(result.value);
    else
      failed.push({
        file: files[index],
        message:
          result.reason instanceof Error
            ? result.reason.message
            : (result.reason?.message ?? "Upload failed. Please retry."),
      });
  });
  return { urls, failed };
}
