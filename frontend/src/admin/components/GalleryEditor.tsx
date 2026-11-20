import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ApiError, imageSrc, uploadMedia } from "../lib/api";
import { useAuth } from "../lib/auth";
import { looksLikeVideo, newGalleryItem, type GalleryItem } from "../lib/pageContent";

// The photos and video shown at the top of the product page, in order: the first one is the big
// picture, the rest are the little pictures under it. Drag a tile or use the arrows to reorder.

const MB = 1024 * 1024;
const MAX_PHOTO = 5 * MB;
const MAX_VIDEO = 50 * MB;

type Props = {
  /** The chosen gallery; null = nothing chosen yet. */
  items: GalleryItem[] | null;
  /** What the page shows while nothing is chosen: the main photo, then the hover photo. */
  automatic: GalleryItem[];
  onChange: (items: GalleryItem[] | null) => void;
  /** Tells the form when an upload is under way (saving then would leave the new file out). */
  onBusy?: (busy: boolean) => void;
};

export function GalleryEditor({ items, automatic, onChange, onBusy }: Props) {
  const { token } = useAuth();
  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  // Which tile is being dragged: a ref for the handlers (always current), state only for the look.
  const dragFrom = useRef<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const endDrag = () => {
    dragFrom.current = null;
    setDragging(null);
    setOver(null);
  };

  // Showing the main/hover photos until the admin changes something; the first change turns them into real tiles.
  const shown = items ?? automatic;
  // Files upload one after the other; each one is added to the list as it stands by then.
  const latest = useRef(shown);
  useEffect(() => {
    latest.current = shown;
  });

  const commit = (next: GalleryItem[]) => {
    latest.current = next;
    onChange(next.length > 0 ? next : null);
  };

  async function upload(files: FileList | null) {
    const chosen = files ? Array.from(files) : [];
    if (chosen.length === 0) return;
    setUploading(true);
    onBusy?.(true);
    setProblems([]);
    const failed: string[] = [];
    for (const file of chosen) {
      const video = file.type.startsWith("video/");
      if (file.size > (video ? MAX_VIDEO : MAX_PHOTO)) {
        failed.push(`${file.name}: too large (${video ? "videos 50 MB" : "photos 5 MB"} at most).`);
        continue;
      }
      try {
        const stored = await uploadMedia(file, token);
        commit([...latest.current, newGalleryItem({ src: stored.url, alt: "", ...(stored.kind === "video" && { kind: "video" as const, ...(stored.poster && { poster: stored.poster }) }) })]);
      } catch (caught) {
        failed.push(`${file.name}: ${caught instanceof ApiError ? caught.message : "The upload failed."}`);
      }
    }
    setProblems(failed);
    setUploading(false);
    onBusy?.(false);
    if (photoInput.current) photoInput.current.value = "";
    if (videoInput.current) videoInput.current.value = "";
  }

  function addAddress() {
    const value = address.trim();
    if (!value) return;
    commit([...latest.current, newGalleryItem({ src: value, alt: "", ...(looksLikeVideo(value) && { kind: "video" as const }) })]);
    setAddress("");
  }

  function reorder(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= shown.length || to >= shown.length) return;
    const next = [...shown];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    commit(next);
  }

  const remove = (index: number) => commit(shown.filter((_, i) => i !== index));

  // Enter in the address box adds it (it must not save the whole product form).
  const onAddressKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addAddress();
  };

  return (
    <div className="stack">
      {shown.length > 0 && (
        <ul className="gallery-grid" aria-label="Product page photos and video, in order">
          {shown.map((item, index) => {
            const label = `${item.kind === "video" ? "video" : "photo"} ${index + 1}`;
            return (
              <li
                key={item.key}
                className={`gallery-tile${dragging === index ? " dragging" : ""}${over === index && dragging !== null && dragging !== index ? " over" : ""}`}
                draggable
                onDragStart={(event) => {
                  dragFrom.current = index;
                  setDragging(index);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", String(index));
                }}
                onDragOver={(event) => {
                  if (dragFrom.current === null) return;
                  event.preventDefault();
                  setOver(index);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragFrom.current !== null) reorder(dragFrom.current, index);
                  endDrag();
                }}
                onDragEnd={endDrag}
              >
                <div className="gallery-media">
                  {item.kind === "video" ? (
                    <>
                      <video src={`${imageSrc(item.src)}#t=0.1`} muted playsInline preload="metadata" style={item.fit === "contain" ? { objectFit: "contain" } : undefined} />
                      <span className="gallery-badge">Video</span>
                    </>
                  ) : (
                    <img src={imageSrc(item.src)} alt="" draggable={false} style={item.fit === "contain" ? { objectFit: "contain" } : undefined} />
                  )}
                  <span className="gallery-num">{index + 1}</span>
                </div>
                <div className="gallery-tools">
                  <span>
                    <button type="button" className="link-button" aria-label={`Move ${label} earlier`} disabled={index === 0} onClick={() => reorder(index, index - 1)}>
                      ←
                    </button>
                    <button type="button" className="link-button" aria-label={`Move ${label} later`} disabled={index === shown.length - 1} onClick={() => reorder(index, index + 1)}>
                      →
                    </button>
                  </span>
                  <button type="button" className="link-button danger" aria-label={`Remove ${label}`} onClick={() => remove(index)}>
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="gallery-actions">
        <input ref={photoInput} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="sr-only" aria-label="Choose photos to upload" onChange={(event) => void upload(event.target.files)} />
        <input ref={videoInput} type="file" accept="video/mp4,video/webm" className="sr-only" aria-label="Choose a video to upload" onChange={(event) => void upload(event.target.files)} />
        <button type="button" className="btn" disabled={uploading} onClick={() => photoInput.current?.click()}>
          Upload photos
        </button>
        <button type="button" className="btn" disabled={uploading} onClick={() => videoInput.current?.click()}>
          Upload a video
        </button>
        {uploading && <span>Uploading…</span>}
      </div>

      <div className="gallery-address">
        <input type="text" aria-label="Photo or video address" placeholder="Or paste a photo / video address" value={address} onChange={(event) => setAddress(event.target.value)} onKeyDown={onAddressKey} />
        <button type="button" className="btn" disabled={!address.trim()} onClick={addAddress}>
          Add
        </button>
      </div>

      {problems.map((problem) => (
        <p key={problem} className="field-error">
          {problem}
        </p>
      ))}

      <p className="hint">
        {items === null
          ? "Nothing chosen yet, so the page shows the main photo, then the hover photo. Upload more here and they join them."
          : "Shown on the product page in this order — the first one is the big picture. Remove them all to go back to the main and hover photo."}{" "}
        Drag a tile or use the arrows to change the order. Photos up to 5 MB each; a video must be MP4 or WebM, up to 50 MB.
      </p>
    </div>
  );
}
