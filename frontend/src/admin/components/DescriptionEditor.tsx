import { useEffect, useRef, useState } from "react";
import { ApiError, imageSrc, uploadMedia } from "../lib/api";
import { useAuth } from "../lib/auth";
import { insertPhotoMarker, markerNumbers, photoMarker, removePhotoMarker, type DescriptionPhoto, type PageContent } from "../lib/pageContent";
import { Field } from "./ui";

// The Description text and the photos inside it. A photo shows where its line `[photo 1]` sits in the
// text: click in the text where the photo should go, press "Add a photo at the cursor", and the line
// appears right there. Cut and paste (or drag) that line to move the photo; delete it to take the photo off.

const MAX_PHOTO = 5 * 1024 * 1024;

type Props = {
  description: string;
  photos: DescriptionPhoto[];
  onChange: (update: (current: PageContent) => PageContent) => void;
  /** Tells the form while a photo is being sent (saving then would leave it out). */
  onBusy?: (busy: boolean) => void;
};

export function DescriptionEditor({ description, photos, onChange, onBusy }: Props) {
  const { token } = useAuth();
  const file = useRef<HTMLInputElement>(null);
  // Where the text cursor was last (null = the admin hasn't clicked in the text yet: the end is used).
  const caret = useRef<number | null>(null);
  // What the file chooser is for: new photos at the cursor, or one photo's replacement.
  const target = useRef<{ kind: "insert" } | { kind: "replace"; n: number }>({ kind: "insert" });
  const [uploading, setUploading] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  // Photos arrive one after the other; each is added to the text as it stands by then.
  const latest = useRef({ description, photos });
  useEffect(() => {
    latest.current = { description, photos };
  });

  const placed = markerNumbers(description);

  const choose = (next: typeof target.current) => {
    target.current = next;
    if (file.current) file.current.multiple = next.kind === "insert";
    file.current?.click();
  };

  async function upload(files: FileList | null) {
    const chosen = files ? Array.from(files) : [];
    const aim = target.current;
    if (chosen.length === 0) return;
    setUploading(true);
    onBusy?.(true);
    setProblems([]);
    const failed: string[] = [];
    for (const picked of aim.kind === "replace" ? chosen.slice(0, 1) : chosen) {
      if (picked.size > MAX_PHOTO) {
        failed.push(`${picked.name}: too large (5 MB at most).`);
        continue;
      }
      try {
        const stored = await uploadMedia(picked, token);
        const size = stored.width && stored.height ? { width: stored.width, height: stored.height } : {};
        if (aim.kind === "replace") {
          // a new picture is shown uncropped, so it is no longer the old wide photo
          onChange((c) => ({ ...c, descriptionPhotos: c.descriptionPhotos.map((photo) => (photo.n === aim.n ? { n: photo.n, src: stored.url, alt: photo.alt, ...size } : photo)) }));
        } else {
          const { description: text, photos: all } = latest.current;
          const n = Math.max(0, ...all.map((photo) => photo.n)) + 1;
          const placedAt = insertPhotoMarker(text, caret.current ?? text.length, n);
          const photo: DescriptionPhoto = { n, src: stored.url, alt: "", ...size };
          latest.current = { description: placedAt.text, photos: [...all, photo] };
          caret.current = placedAt.caret;
          onChange((c) => ({ ...c, description: placedAt.text, descriptionPhotos: [...c.descriptionPhotos, photo] }));
        }
      } catch (caught) {
        failed.push(`${picked.name}: ${caught instanceof ApiError ? caught.message : "The upload failed."}`);
      }
    }
    setProblems(failed);
    setUploading(false);
    onBusy?.(false);
    if (file.current) file.current.value = "";
  }

  const remember = (area: HTMLTextAreaElement) => {
    caret.current = area.selectionStart;
  };
  const patch = (n: number, change: Partial<DescriptionPhoto>) => onChange((c) => ({ ...c, descriptionPhotos: c.descriptionPhotos.map((photo) => (photo.n === n ? { ...photo, ...change } : photo)) }));
  const putAtCursor = (n: number) => {
    const placedAt = insertPhotoMarker(description, caret.current ?? description.length, n);
    caret.current = placedAt.caret;
    onChange((c) => ({ ...c, description: placedAt.text }));
  };
  const remove = (n: number) => onChange((c) => ({ ...c, description: removePhotoMarker(c.description, n), descriptionPhotos: c.descriptionPhotos.filter((photo) => photo.n !== n) }));

  return (
    <div className="stack">
      <Field label="Description" htmlFor="pc-desc" hint="Leave a blank line between paragraphs.">
        <textarea
          id="pc-desc"
          rows={9}
          value={description}
          readOnly={uploading}
          onChange={(event) => {
            remember(event.currentTarget);
            const text = event.target.value;
            onChange((c) => ({ ...c, description: text }));
          }}
          onSelect={(event) => remember(event.currentTarget)}
          onBlur={(event) => remember(event.currentTarget)}
        />
      </Field>

      <div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 12px" }}>
          <button type="button" className="btn" disabled={uploading} onClick={() => choose({ kind: "insert" })}>
            + Add a photo at the cursor
          </button>
          {uploading && <span>Uploading…</span>}
        </div>
        <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="sr-only" aria-label="Choose photos for the description" onChange={(event) => void upload(event.target.files)} />
        <p className="hint">
          Click in the text where the photo should go, then press the button. A line like {photoMarker(1)} appears there, and the photo shows on that spot of the page. To move a photo, move its line (cut and paste, or drag it). Delete the line to take the photo off the page. Photos up to 5 MB each.
        </p>
        {problems.map((problem) => (
          <p key={problem} className="field-error">
            {problem}
          </p>
        ))}
      </div>

      {photos.map((photo) => (
        <div key={photo.n} className="row-card">
          <div className="row-head">
            <span>
              Photo {photo.n} <span style={{ fontWeight: 400 }}>— its line is {photoMarker(photo.n)}</span>
            </span>
            <span className="row-tools">
              <button type="button" className="link-button" onClick={() => putAtCursor(photo.n)}>
                Put at cursor
              </button>
              <button type="button" className="link-button" disabled={uploading} onClick={() => choose({ kind: "replace", n: photo.n })}>
                Replace
              </button>
              <button type="button" className="link-button danger" onClick={() => remove(photo.n)}>
                Remove
              </button>
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            {photo.src ? <img className="thumb" style={{ width: 84, height: 84 }} src={imageSrc(photo.src)} alt="" /> : <div className="thumb" style={{ width: 84, height: 84, display: "grid", placeItems: "center", color: "#000", fontSize: 12 }}>No photo</div>}
            <div style={{ flex: 1, minWidth: 0 }} className="stack">
              <input type="text" aria-label={`Photo ${photo.n} address`} placeholder="https://… or /photo.jpg" value={photo.src} onChange={(event) => patch(photo.n, { src: event.target.value, width: undefined, height: undefined })} />
              <input type="text" aria-label={`Photo ${photo.n} description`} placeholder="What the photo shows (for screen readers, optional)" value={photo.alt} onChange={(event) => patch(photo.n, { alt: event.target.value })} />
              {!placed.has(photo.n) && <p className="field-error" style={{ margin: 0 }}>Not in the text, so it won't show on the page. Click in the text where it should go, then press “Put at cursor”.</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
