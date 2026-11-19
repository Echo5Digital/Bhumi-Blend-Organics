import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { ImageField, type Image } from "../components/ImageField";
import { PageContentEditor } from "../components/PageContentEditor";
import { BinIcon, Field, ErrorNotice, Loading, Notice, PageTitle, useTitle } from "../components/ui";
import { ApiError, api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { slugify } from "../lib/format";
import type { Category, Product } from "../lib/types";
import { contentFromDetails, contentToDetails, type ContentError, type ContentTab } from "../lib/pageContent";
import { useApi } from "../lib/useApi";

// Home-page rows a product can appear in (the storefront's "Best Sellers" and "Skin Care Essentials").
const COLLECTIONS = [
  { key: "best-sellers", label: "Home page: Best Sellers" },
  { key: "skin-care-essentials", label: "Home page: Skin Care Essentials" },
];

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
  const [content, setContent] = useState(() => contentFromDetails(initial?.details));
  const [contentTab, setContentTab] = useState<ContentTab>("description");
  const [contentError, setContentError] = useState<ContentError>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(justCreated ? { kind: "success", text: justCreated } : null);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

    // The three tabs' text boxes become the page's stored content; what to fix is shown on its tab.
    let details: Record<string, unknown> | null = null;
    const built = contentToDetails(content, name.trim());
    if ("error" in built) {
      setContentError(built.error);
      if (built.error.tab !== "other") setContentTab(built.error.tab);
    } else {
      setContentError(null);
      details = built.details;
    }
    setErrors(found);
    if (Object.keys(found).length > 0 || "error" in built) {
      setMessage({ kind: "error", text: "error" in built ? `Please fix the product page content: ${built.error.text}` : "Please fix the highlighted fields." });
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
    setDeleting(true);
    setMessage(null);
    try {
      await api(`/admin/products/${initial.id}`, { method: "DELETE", token });
      navigate("/products", { replace: true });
    } catch (caught) {
      setMessage({ kind: "error", text: caught instanceof ApiError ? caught.message : "Something went wrong." });
      setDeleting(false);
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
                <p className="hint">Photos you upload are stored on Cloudinary. The extra gallery photos of the product page are under “Show other page content (advanced)” at the bottom of this page.</p>
              </div>
            </section>

            <PageContentEditor value={content} onChange={setContent} tab={contentTab} onTab={setContentTab} error={contentError} />
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
                    <a className="btn" href={`/product/${initial.slug}`} target="_blank" rel="noreferrer">
                      View on site
                    </a>
                  )}
                </div>
                {!creating && (
                  <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: 14 }}>
                    <button type="button" className="btn danger" onClick={remove} disabled={busy || deleting} style={{ gap: 8, width: "100%" }}>
                      <BinIcon />
                      {deleting ? "Deleting…" : "Delete product"}
                    </button>
                  </div>
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
