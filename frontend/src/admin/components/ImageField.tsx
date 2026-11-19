import { useId, useRef, useState } from "react";
import { ApiError, imageSrc, uploadImage } from "../lib/api";
import { useAuth } from "../lib/auth";

export type Image = { url: string; publicId?: string };

/** A photo picker: paste an address, or upload a file (goes to Cloudinary). */
export function ImageField({ label, image, onChange, error, required }: { label: string; image: Image | null; onChange: (image: Image | null) => void; error?: string; required?: boolean }) {
  const { token } = useAuth();
  const file = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [problem, setProblem] = useState("");

  async function upload(chosen: File | undefined) {
    if (!chosen) return;
    setUploading(true);
    setProblem("");
    try {
      const stored = await uploadImage(chosen, token);
      onChange({ url: stored.url, publicId: stored.publicId });
    } catch (caught) {
      setProblem(caught instanceof ApiError ? caught.message : "The upload failed.");
    } finally {
      setUploading(false);
      if (file.current) file.current.value = "";
    }
  }

  return (
    <div className="field">
      <label className="label">
        {label}
        {required && " *"}
      </label>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {image?.url ? <img className="thumb" style={{ width: 84, height: 84 }} src={imageSrc(image.url)} alt="" /> : <div className="thumb" style={{ width: 84, height: 84, display: "grid", placeItems: "center", color: "#000", fontSize: 12 }}>No photo</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <input type="text" aria-label={`${label} address`} placeholder="https://… or /photo.jpg" value={image?.url ?? ""} className={error ? "invalid" : ""} onChange={(event) => onChange(event.target.value ? { url: event.target.value } : null)} />
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="sr-only" id={inputId} onChange={(event) => void upload(event.target.files?.[0])} />
            <button type="button" className="btn" disabled={uploading} onClick={() => file.current?.click()}>
              {uploading ? "Uploading…" : "Upload a photo"}
            </button>
            {image && !required && (
              <button type="button" className="link-button danger" onClick={() => onChange(null)}>
                Remove
              </button>
            )}
          </div>
          {problem && <p className="field-error">{problem}</p>}
          {error && <p className="field-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}
