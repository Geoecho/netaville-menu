"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { uploadImages } from "@/lib/menu-store";
import { safeImageUrl } from "@/lib/menu";

export default function ProductImagesField({
  value,
  onChange,
  onBusyChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [failed, setFailed] = useState<{ file: File; message: string }[]>([]);
  async function upload(files: File[]) {
    if (!files.length || busy) return;
    setBusy(true);
    onBusyChange(true);
    setError("");
    setFailed([]);
    setProgress(`Uploading 0 of ${files.length}…`);
    try {
      const result = await uploadImages(files, (done, total) =>
        setProgress(`Uploading ${done} of ${total}…`),
      );
      onChange([...new Set([...value, ...result.urls])]);
      setFailed(result.failed);
      setProgress(
        `${result.urls.length} image${result.urls.length === 1 ? "" : "s"} added to draft${result.failed.length ? `; ${result.failed.length} failed` : ""}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload images.");
    } finally {
      setBusy(false);
      onBusyChange(false);
    }
  }
  function move(index: number, direction: number) {
    const next = [...value];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    onChange(next);
  }
  function cover(index: number) {
    onChange([value[index], ...value.filter((_, i) => i !== index)]);
  }
  function addUrl() {
    const next = url.trim();
    if (!next || !safeImageUrl(next)) {
      setError("Enter an HTTPS image URL.");
      return;
    }
    onChange([...new Set([...value, next])]);
    setUrl("");
    setError("");
  }
  return (
    <section className="product-image-field" aria-label="Product images">
      <div className="gallery-field-heading">
        <div>
          <b>Product images</b>
          <small>The first image is the cover. Upload several at once.</small>
        </div>
        <label className={`admin-button small ${busy ? "disabled" : ""}`}>
          <Upload size={14} />
          {busy ? "Uploading…" : "Upload images"}
          <input
            className="sr-only"
            type="file"
            multiple
            disabled={busy}
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const files = Array.from(e.currentTarget.files ?? []);
              e.currentTarget.value = "";
              void upload(files);
            }}
          />
        </label>
      </div>
      {value.length > 0 ? (
        <div className="product-image-grid">
          {value.map((src, index) => (
            <figure
              className={`product-image-tile ${index === 0 ? "is-cover" : ""}`}
              key={src}
            >
              <button
                type="button"
                className="gallery-cover-button"
                disabled={busy}
                onClick={() => cover(index)}
                aria-label={`Use image ${index + 1} as cover`}
              >
                <img src={src} alt={`Product image ${index + 1}`} />
              </button>
              <figcaption>
                {index === 0 ? (
                  <span>
                    <Check size={11} />
                    Cover
                  </span>
                ) : (
                  <span>Image {index + 1}</span>
                )}
                <button
                  type="button"
                  className="icon-button danger"
                  aria-label={`Remove image ${index + 1}`}
                  disabled={busy}
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                >
                  <Trash2 size={13} />
                </button>
              </figcaption>
              <div className="gallery-order-actions">
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Move image ${index + 1} earlier`}
                  disabled={busy || index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowLeft size={13} />
                </button>
                {index > 0 && (
                  <button
                    type="button"
                    className="text-link"
                    disabled={busy}
                    onClick={() => cover(index)}
                  >
                    Set cover
                  </button>
                )}
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Move image ${index + 1} later`}
                  disabled={busy || index === value.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowRight size={13} />
                </button>
              </div>
            </figure>
          ))}
        </div>
      ) : (
        <div className="gallery-upload-empty">
          <Upload size={22} />
          <p>Add your product photos</p>
          <small>
            Select multiple PNG, JPG or WebP files. Up to 5 MB each.
          </small>
        </div>
      )}
      <label className="admin-field">
        <span>Or add an image URL</span>
        <div className="gallery-url-row">
          <input
            aria-label="Product image URL"
            placeholder="https://…"
            value={url}
            disabled={busy}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
          />
          <button
            type="button"
            className="admin-button small"
            disabled={busy || !url.trim()}
            onClick={addUrl}
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </label>
      {progress && (
        <small className="gallery-progress-message" role="status">
          {progress}
        </small>
      )}
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      {failed.length > 0 && (
        <div className="admin-error" role="alert">
          <b>Some photos weren’t uploaded.</b>
          <ul>
            {failed.map((failure, index) => (
              <li key={index}>
                {failure.file.name}: {failure.message}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="admin-button small"
            disabled={busy}
            onClick={() => void upload(failed.map((f) => f.file))}
          >
            Retry failed uploads
          </button>
        </div>
      )}
    </section>
  );
}
