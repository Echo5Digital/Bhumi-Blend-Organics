import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { ImageField, type Image } from "../components/ImageField";
import { ErrorNotice, Field, Loading, Notice, PageTitle, useTitle } from "../components/ui";
import { ApiError, api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { slugify } from "../lib/format";
import type { Category } from "../lib/types";
import { useApi } from "../lib/useApi";

// Products → Categories: the shop's categories (they power the storefront's category pages).
export function Categories() {
  useTitle("Categories");
  const { token } = useAuth();
  const { data, error, loading, reload } = useApi<{ items: Category[] }>("/admin/categories");

  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<Image | null>(null);
  const [position, setPosition] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  function reset() {
    setEditing(null);
    setName("");
    setSlug("");
    setSlugTouched(false);
    setDescription("");
    setImage(null);
    setPosition("0");
    setIsActive(true);
    setErrors({});
  }

  function edit(category: Category) {
    setEditing(category);
    setName(category.name);
    setSlug(category.slug);
    setSlugTouched(true);
    setDescription(category.description ?? "");
    setImage(category.image ?? null);
    setPosition(String(category.position));
    setIsActive(category.isActive);
    setErrors({});
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    const found: Record<string, string> = {};
    if (!name.trim()) found.name = "Give the category a name.";
    if (!slug.trim()) found.slug = "The web address needs a value.";
    if (!Number.isInteger(Number(position)) || Number(position) < 0) found.position = "Enter a whole number, 0 or more.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      // For a new category a blank field is simply left out; when editing, blank clears it (null).
      const photo = image?.url.trim() ? { url: image.url.trim(), ...(image.publicId && { publicId: image.publicId }) } : null;
      const body = {
        name: name.trim(),
        slug: slug.trim(),
        position: Number(position),
        isActive,
        description: editing ? description.trim() || null : description.trim() || undefined,
        image: editing ? photo : (photo ?? undefined),
      };
      if (editing) await api(`/admin/categories/${editing.id}`, { method: "PATCH", token, body });
      else await api("/admin/categories", { method: "POST", token, body });
      setMessage({ kind: "success", text: editing ? "Category updated." : "Category added." });
      reset();
      reload();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setErrors(caught.fields);
        setMessage({ kind: "error", text: caught.code === "DUPLICATE" ? "A category with that web address already exists." : caught.message });
      } else setMessage({ kind: "error", text: "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  async function remove(category: Category) {
    if (!window.confirm(`Delete the category "${category.name}"? Products stay in the shop; they just leave this category.`)) return;
    try {
      await api(`/admin/categories/${category.id}`, { method: "DELETE", token });
      setMessage({ kind: "success", text: "Category deleted." });
      if (editing?.id === category.id) reset();
      reload();
    } catch (caught) {
      setMessage({ kind: "error", text: caught instanceof ApiError ? caught.message : "Something went wrong." });
    }
  }

  return (
    <div className="page">
      <PageTitle title="Product categories" />
      {message && <Notice kind={message.kind} onDismiss={() => setMessage(null)}>{message.text}</Notice>}
      <ErrorNotice error={error} />

      <div className="grid-2">
        <div>
          <div className={`table-wrap ${loading && data ? "loading-dim" : ""}`}>
            <table className="list">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Web address</th>
                  <th className="num">Order</th>
                </tr>
              </thead>
              <tbody>
                {!data && (
                  <tr>
                    <td colSpan={4} className="empty">
                      <Loading />
                    </td>
                  </tr>
                )}
                {data?.items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty">
                      No categories yet.
                    </td>
                  </tr>
                )}
                {data?.items.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <button type="button" className="link-button strong" onClick={() => edit(category)}>
                        {category.name}
                      </button>{" "}
                      {!category.isActive && <span className="badge hidden-product">Hidden</span>}
                      <div className="row-actions">
                        <span>
                          <button type="button" className="link-button" onClick={() => edit(category)}>
                            Edit
                          </button>
                        </span>
                        <span>
                          <Link to={`/products?category=${category.slug}`}>Products</Link>
                        </span>
                        <span>
                          <button type="button" className="link-button danger" onClick={() => remove(category)}>
                            Delete
                          </button>
                        </span>
                      </div>
                    </td>
                    <td>{category.description ? (category.description.length > 90 ? `${category.description.slice(0, 90)}…` : category.description) : "–"}</td>
                    <td>{category.slug}</td>
                    <td className="num">{category.position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside>
          <form className="card" onSubmit={save} noValidate>
            <div className="card-head">
              <h2>{editing ? `Edit “${editing.name}”` : "Add new category"}</h2>
            </div>
            <div className="body stack">
              <Field label="Name" htmlFor="cat-name" error={errors.name}>
                <input
                  id="cat-name"
                  type="text"
                  value={name}
                  className={errors.name ? "invalid" : ""}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (!slugTouched) setSlug(slugify(event.target.value));
                  }}
                />
              </Field>
              <Field label="Web address (slug)" htmlFor="cat-slug" error={errors.slug} hint="Used in the category page address.">
                <input
                  id="cat-slug"
                  type="text"
                  value={slug}
                  className={errors.slug ? "invalid" : ""}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setSlug(event.target.value);
                  }}
                />
              </Field>
              <Field label="Description" htmlFor="cat-description">
                <textarea id="cat-description" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
              </Field>
              <div>
                <ImageField label="Photo for the Category menu" image={image} onChange={setImage} error={errors["image.url"]} onUploading={setUploadingPhoto} />
                <p className="hint">The picture on this category's card in the shop's Category menu. A tall photo (about 4 wide by 5 high) fits best. Leave empty for a card with just the name.</p>
              </div>
              <Field label="Order" htmlFor="cat-position" error={errors.position} hint="Smaller numbers come first in the menu.">
                <input id="cat-position" type="number" min="0" step="1" value={position} className={errors.position ? "invalid" : ""} onChange={(event) => setPosition(event.target.value)} />
              </Field>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
                Visible in the shop
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" className="btn primary" disabled={busy || uploadingPhoto}>
                  {uploadingPhoto ? "Uploading…" : editing ? "Update category" : "Add new category"}
                </button>
                {editing && (
                  <button type="button" className="btn" onClick={reset}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
