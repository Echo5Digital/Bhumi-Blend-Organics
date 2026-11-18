import { useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Field, ErrorNotice, Loading, Notice, PageTitle, useTitle } from "../components/ui";
import { ApiError, STOREFRONT_URL, api, imageSrc, uploadImage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { slugify } from "../lib/format";
import type { Category, Product } from "../lib/types";
import { useApi } from "../lib/useApi";

// Home-page rows a product can appear in (the storefront's "Best Sellers" and "Skin Care Essentials").
const COLLECTIONS = [
  { key: "best-sellers", label: "Home page: Best Sellers" },
  { key: "skin-care-essentials", label: "Home page: Skin Care Essentials" },
];

type Image = { url: string; publicId?: string };

/** A photo picker: paste an address, or upload a file (goes to Cloudinary). */
function ImageField({ label, image, onChange, error, required }: { label: string; image: Image | null; onChange: (image: Image | null) => void; error?: string; required?: boolean }) {
  const { token } = useAuth();
  const file = useRef<HTMLInputElement>(null);
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
            <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="sr-only" id={`upload-${label}`} onChange={(event) => void upload(event.target.files?.[0])} />
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

function ProductForm({ initial, categories }: { initial: Product | null; categories: Category[] }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  // arriving here right after "Create product" says so (the create step passes it along)
  const justCreated = (useLocation().state as { saved?: string } | null)?.saved;
  const creating = initial === null;
  useTitle(creating ? "Add product" : `Edit ${initial.name}`);

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!creating);
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [regularPrice, setRegularPrice] = useState(initial?.regularPrice !== undefined ? String(initial.regularPrice) : "");
  const [weight, setWeight] = useState(initial?.weight ?? "");
  const [trackStock, setTrackStock] = useState(typeof initial?.stockQuantity === "number");
  const [stockQuantity, setStockQuantity] = useState(typeof initial?.stockQuantity === "number" ? String(initial.stockQuantity) : "");
  const [inStock, setInStock] = useState(initial?.inStock ?? true);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [image, setImage] = useState<Image | null>(initial?.image ?? null);
  const [hoverImage, setHoverImage] = useState<Image | null>(initial?.hoverImage ?? null);
  const [chosenCategories, setChosenCategories] = useState(new Set(initial?.categories.map((entry) => entry.category) ?? []));
  const [chosenCollections, setChosenCollections] = useState(new Set(initial?.collections.map((entry) => entry.key) ?? []));
  const [detailsText, setDetailsText] = useState(initial?.details ? JSON.stringify(initial.details, null, 2) : "");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(justCreated ? { kind: "success", text: justCreated } : null);
  const [busy, setBusy] = useState(false);

  const toggle = (set: Set<string>, setter: (value: Set<string>) => void, key: string, on: boolean) => {
    const next = new Set(set);
    if (on) next.add(key);
    else next.delete(key);
    setter(next);
  };

  async function save(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    const found: Record<string, string> = {};
    if (!name.trim()) found.name = "Give the product a name.";
    if (!slug.trim()) found.slug = "The web address needs a value.";
    if (price.trim() === "" || Number.isNaN(Number(price)) || Number(price) < 0) found.price = "Enter the selling price.";
    if (regularPrice.trim() !== "" && (Number.isNaN(Number(regularPrice)) || Number(regularPrice) < Number(price))) found.regularPrice = "The original price must be at least the selling price.";
    if (!image?.url) found.image = "Add a main photo.";
    if (trackStock && (stockQuantity.trim() === "" || !Number.isInteger(Number(stockQuantity)) || Number(stockQuantity) < 0)) found.stockQuantity = "Enter a whole number, 0 or more.";

    let details: Record<string, unknown> | null = null;
    if (detailsText.trim()) {
      try {
        const parsed: unknown = JSON.parse(detailsText);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("not an object");
        details = parsed as Record<string, unknown>;
      } catch {
        found.details = "This isn't valid JSON. Fix it, or clear the box to leave the page content empty.";
      }
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setMessage({ kind: "error", text: "Please fix the highlighted fields." });
      return;
    }

    // Keep each category's / row's existing place in its order; new ones go first.
    const placed = (entries: { category?: string; key?: string; position: number }[] | undefined, key: string) => entries?.find((entry) => (entry.category ?? entry.key) === key)?.position ?? 0;
    const body = {
      slug: slug.trim(),
      name: name.trim(),
      price: Number(price),
      image: { url: image!.url.trim(), ...(image!.publicId && { publicId: image!.publicId }) },
      isActive,
      categories: [...chosenCategories].map((category) => ({ category, position: placed(initial?.categories, category) })),
      collections: [...chosenCollections].map((key) => ({ key, position: placed(initial?.collections, key) })),
      // For a new product a blank field is simply left out; when editing, blank clears it (null).
      ...(creating
        ? {
            ...(sku.trim() && { sku: sku.trim() }),
            ...(regularPrice.trim() && { regularPrice: Number(regularPrice) }),
            ...(weight.trim() && { weight: weight.trim() }),
            ...(hoverImage?.url && { hoverImage: { url: hoverImage.url.trim(), ...(hoverImage.publicId && { publicId: hoverImage.publicId }) } }),
            ...(details && { details }),
            ...(trackStock ? { stockQuantity: Number(stockQuantity) } : { inStock }),
          }
        : {
            sku: sku.trim() || null,
            regularPrice: regularPrice.trim() ? Number(regularPrice) : null,
            weight: weight.trim() || null,
            hoverImage: hoverImage?.url ? { url: hoverImage.url.trim(), ...(hoverImage.publicId && { publicId: hoverImage.publicId }) } : null,
            details,
            stockQuantity: trackStock ? Number(stockQuantity) : null,
            ...(trackStock ? {} : { inStock }),
          }),
    };

    setBusy(true);
    try {
      if (creating) {
        const result = await api<{ product: Product }>("/admin/products", { method: "POST", token, body });
        navigate(`/products/${result.product.id}`, { replace: true, state: { saved: "Product created." } });
      } else {
        await api<{ product: Product }>(`/admin/products/${initial.id}`, { method: "PATCH", token, body });
        setMessage({ kind: "success", text: "Product saved." });
      }
    } catch (caught) {
      if (caught instanceof ApiError) {
        const fields: Record<string, string> = {};
        for (const [path, text] of Object.entries(caught.fields)) fields[path === "image.url" ? "image" : path] = text;
        setErrors(fields);
        setMessage({ kind: "error", text: caught.code === "DUPLICATE" ? "Another product already uses that web address (slug)." : caught.message });
      } else {
        setMessage({ kind: "error", text: "Something went wrong." });
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!initial || !window.confirm(`Delete "${initial.name}" for good? Orders already placed keep their copy of it. To just take it off the shop, untick Published instead.`)) return;
    try {
      await api(`/admin/products/${initial.id}`, { method: "DELETE", token });
      navigate("/products", { replace: true });
    } catch (caught) {
      setMessage({ kind: "error", text: caught instanceof ApiError ? caught.message : "Something went wrong." });
    }
  }

  return (
    <div className="page">
      <PageTitle title={creating ? "Add new product" : "Edit product"}>
        <Link to="/products" className="btn">
          ← All products
        </Link>
      </PageTitle>
      {message && <Notice kind={message.kind} onDismiss={() => setMessage(null)}>{message.text}</Notice>}

      <form onSubmit={save} noValidate>
        <div className="grid-2">
          <div>
            <section className="card">
              <div className="body stack">
                <Field label="Product name" htmlFor="name" error={errors.name}>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    className={errors.name ? "invalid" : ""}
                    onChange={(event) => {
                      setName(event.target.value);
                      if (!slugTouched) setSlug(slugify(event.target.value));
                    }}
                  />
                </Field>
                <Field label="Web address (slug)" htmlFor="slug" error={errors.slug} hint="Lowercase letters, numbers and dashes.">
                  <input
                    id="slug"
                    type="text"
                    value={slug}
                    className={errors.slug ? "invalid" : ""}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setSlug(event.target.value);
                    }}
                  />
                </Field>
              </div>
            </section>

            <section className="card">
              <div className="card-head">
                <h2>Product data</h2>
              </div>
              <div className="body field-grid">
                <Field label="Selling price (₹)" htmlFor="price" error={errors.price}>
                  <input id="price" type="number" min="0" step="0.01" value={price} className={errors.price ? "invalid" : ""} onChange={(event) => setPrice(event.target.value)} />
                </Field>
                <Field label="Original price (₹)" htmlFor="regular" error={errors.regularPrice} hint="Fill in to show a crossed-out price and a discount.">
                  <input id="regular" type="number" min="0" step="0.01" value={regularPrice} className={errors.regularPrice ? "invalid" : ""} onChange={(event) => setRegularPrice(event.target.value)} />
                </Field>
                <Field label="SKU" htmlFor="sku" error={errors.sku}>
                  <input id="sku" type="text" value={sku} onChange={(event) => setSku(event.target.value)} />
                </Field>
                <Field label="Size" htmlFor="weight" hint='Shown under the name, e.g. "100g" or "450ml".'>
                  <input id="weight" type="text" value={weight} onChange={(event) => setWeight(event.target.value)} />
                </Field>
                <div className="full">
                  <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}>
                    <input type="checkbox" checked={trackStock} onChange={(event) => setTrackStock(event.target.checked)} />
                    Count stock for this product
                  </label>
                  <p className="hint">When on, each paid order takes from the quantity, and the product sells out at 0.</p>
                </div>
                {trackStock ? (
                  <Field label="Stock quantity" htmlFor="stock" error={errors.stockQuantity}>
                    <input id="stock" type="number" min="0" step="1" value={stockQuantity} className={errors.stockQuantity ? "invalid" : ""} onChange={(event) => setStockQuantity(event.target.value)} />
                  </Field>
                ) : (
                  <Field label="Stock status" htmlFor="instock">
                    <select id="instock" value={inStock ? "in" : "out"} onChange={(event) => setInStock(event.target.value === "in")}>
                      <option value="in">In stock</option>
                      <option value="out">Out of stock</option>
                    </select>
                  </Field>
                )}
              </div>
            </section>

            <section className="card">
              <div className="card-head">
                <h2>Photos</h2>
              </div>
              <div className="body stack">
                <ImageField label="Main photo" image={image} onChange={setImage} error={errors.image} required />
                <ImageField label="Photo shown on hover" image={hoverImage} onChange={setHoverImage} />
                <p className="hint">Photos you upload are stored on Cloudinary. The extra gallery photos of the product page live in the page content below.</p>
              </div>
            </section>

            <section className="card">
              <div className="card-head">
                <h2>Product page content (advanced)</h2>
              </div>
              <div className="body">
                <p className="hint" style={{ marginTop: 0 }}>
                  Everything on the product page below the buttons — description, ingredients, how to use, FAQs, gallery, related products — is stored as JSON. Edit it carefully; leave it empty for a bare page.
                </p>
                <textarea
                  aria-label="Product page content as JSON"
                  rows={14}
                  spellCheck={false}
                  value={detailsText}
                  className={errors.details ? "invalid" : ""}
                  style={{ fontFamily: "ui-monospace, Consolas, monospace", fontSize: 12 }}
                  onChange={(event) => setDetailsText(event.target.value)}
                />
                {errors.details && <p className="field-error">{errors.details}</p>}
              </div>
            </section>
          </div>

          <aside>
            <section className="card">
              <div className="card-head">
                <h2>Publish</h2>
              </div>
              <div className="body stack">
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
                  Published (visible in the shop)
                </label>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <button type="submit" className="btn primary" disabled={busy}>
                    {busy ? "Saving…" : creating ? "Create product" : "Save changes"}
                  </button>
                  {!creating && initial.isActive && (
                    <a className="btn" href={`${STOREFRONT_URL}/product/${initial.slug}`} target="_blank" rel="noreferrer">
                      View on site
                    </a>
                  )}
                </div>
                {!creating && (
                  <button type="button" className="link-button danger" onClick={remove} style={{ textAlign: "left" }}>
                    Delete product
                  </button>
                )}
              </div>
            </section>

            <section className="card">
              <div className="card-head">
                <h2>Categories</h2>
              </div>
              <div className="body checks">
                {categories.length === 0 && <p className="hint">No categories yet. <Link to="/products/categories">Add one</Link>.</p>}
                {categories.map((category) => (
                  <label key={category.slug}>
                    <input type="checkbox" checked={chosenCategories.has(category.slug)} onChange={(event) => toggle(chosenCategories, setChosenCategories, category.slug, event.target.checked)} />
                    {category.name}
                  </label>
                ))}
              </div>
            </section>

            <section className="card">
              <div className="card-head">
                <h2>Home page rows</h2>
              </div>
              <div className="body checks">
                {COLLECTIONS.map((collection) => (
                  <label key={collection.key}>
                    <input type="checkbox" checked={chosenCollections.has(collection.key)} onChange={(event) => toggle(chosenCollections, setChosenCollections, collection.key, event.target.checked)} />
                    {collection.label}
                  </label>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </form>
    </div>
  );
}

export function ProductEdit() {
  const { id } = useParams();
  const creating = id === undefined;
  const product = useApi<{ product: Product }>(creating ? null : `/admin/products/${id}`);
  const categories = useApi<{ items: Category[] }>("/admin/categories");

  const ready = categories.data && (creating || product.data);
  if (!ready) {
    return (
      <div className="page">
        <PageTitle title={creating ? "Add new product" : "Edit product"} />
        <ErrorNotice error={product.error ?? categories.error} />
        {!(product.error ?? categories.error) && <Loading />}
        <Link to="/products">← All products</Link>
      </div>
    );
  }
  // `key` starts the form afresh for each product.
  return <ProductForm key={id ?? "new"} initial={creating ? null : product.data!.product} categories={categories.data!.items} />;
}
