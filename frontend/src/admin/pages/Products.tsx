import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ErrorNotice, Notice, PageTitle, Pagination, SortHeader, useTitle } from "../components/ui";
import { ApiError, api, imageSrc } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatDate, money } from "../lib/format";
import type { Category, Product, ProductList } from "../lib/types";
import { useApi } from "../lib/useApi";

function StockCell({ product }: { product: Product }) {
  const tracked = typeof product.stockQuantity === "number";
  if (!product.inStock || product.stockQuantity === 0) {
    return <span className="badge outofstock">Out of stock{tracked ? " (0)" : ""}</span>;
  }
  return <span className="badge instock">In stock{tracked ? ` (${product.stockQuantity})` : ""}</span>;
}

export function Products() {
  useTitle("Products");
  const { token } = useAuth();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "all";
  const stock = params.get("stock") ?? "all";
  const category = params.get("category") ?? "";
  const search = params.get("search") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
  const sort = params.get("sort") ?? "position";
  const dir = (params.get("dir") ?? "asc") as "asc" | "desc";
  const [searchText, setSearchText] = useState(search);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const update = (changes: Record<string, string | null>) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      if (!("page" in changes)) next.delete("page");
      return next;
    });

  const query = new URLSearchParams({ status, stock, page: String(page), limit: "20", sort, dir });
  if (category) query.set("category", category);
  if (search) query.set("search", search);

  const { data, error, loading, reload } = useApi<ProductList>(`/admin/products?${query}`);
  const categories = useApi<{ items: Category[] }>("/admin/categories");
  const categoryName = new Map((categories.data?.items ?? []).map((item) => [item.slug, item.name]));
  const counts = data?.counts;

  const toggleSort = (field: string) => update({ sort: field, dir: sort === field && dir === "asc" ? "desc" : "asc" });

  async function setVisible(product: Product, isActive: boolean) {
    try {
      await api(`/admin/products/${product.id}`, { method: "PATCH", token, body: { isActive } });
      setMessage({ kind: "success", text: `${product.name} is now ${isActive ? "published" : "hidden"}.` });
      reload();
    } catch (caught) {
      setMessage({ kind: "error", text: caught instanceof ApiError ? caught.message : "Something went wrong." });
    }
  }

  const tabs: { key: string; label: string; count: number | undefined }[] = [
    { key: "all", label: "All", count: counts?.all },
    { key: "active", label: "Published", count: counts?.active },
    { key: "hidden", label: "Hidden", count: counts?.hidden },
  ];

  return (
    <div className="page">
      <PageTitle title="Products">
        <Link to="/products/new" className="btn">
          Add New
        </Link>
      </PageTitle>
      {message && <Notice kind={message.kind} onDismiss={() => setMessage(null)}>{message.text}</Notice>}
      <ErrorNotice error={error} />

      <ul className="subsubsub">
        {tabs.map((tab) => (
          <li key={tab.key}>
            <a
              href="#"
              className={status === tab.key ? "current" : ""}
              onClick={(event) => {
                event.preventDefault();
                update({ status: tab.key === "all" ? null : tab.key });
              }}
            >
              {tab.label} <span className="num">({tab.count ?? 0})</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="toolbar">
        <select aria-label="Filter by stock status" value={stock} onChange={(event) => update({ stock: event.target.value === "all" ? null : event.target.value })}>
          <option value="all">Filter by stock status</option>
          <option value="instock">In stock</option>
          <option value="outofstock">Out of stock</option>
          <option value="low">Low in stock</option>
        </select>
        <select aria-label="Filter by category" value={category} onChange={(event) => update({ category: event.target.value })}>
          <option value="">All categories</option>
          {(categories.data?.items ?? []).map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        <form
          className="search-box"
          onSubmit={(event) => {
            event.preventDefault();
            update({ search: searchText.trim() });
          }}
        >
          <input type="search" aria-label="Search products" placeholder="Name, slug or SKU" value={searchText} onChange={(event) => setSearchText(event.target.value)} />
          <button type="submit" className="btn">
            Search products
          </button>
        </form>
        <Pagination page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} onPage={(next) => update({ page: String(next) })} />
      </div>

      <div className={`table-wrap ${loading && data ? "loading-dim" : ""}`}>
        <table className="list">
          <thead>
            <tr>
              <th style={{ width: 52 }}>
                <span className="sr-only">Photo</span>
              </th>
              <SortHeader label="Name" field="name" sort={sort} dir={dir} onSort={toggleSort} />
              <th>SKU</th>
              <SortHeader label="Stock" field="stock" sort={sort} dir={dir} onSort={toggleSort} />
              <SortHeader label="Price" field="price" sort={sort} dir={dir} onSort={toggleSort} />
              <th>Categories</th>
              <SortHeader label="Date" field="date" sort={sort} dir={dir} onSort={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {(data?.items.length ?? 0) === 0 && (
              <tr>
                <td colSpan={7} className="empty">
                  {loading ? "Loading products…" : "No products found."}
                </td>
              </tr>
            )}
            {data?.items.map((product) => (
              <tr key={product.id}>
                <td>
                  <img className="thumb" src={imageSrc(product.image.url)} alt="" loading="lazy" />
                </td>
                <td>
                  <Link to={`/products/${product.id}`} className="strong">
                    {product.name}
                  </Link>{" "}
                  {!product.isActive && <span className="badge hidden-product">Hidden</span>}
                  <div className="row-actions">
                    <span>
                      <Link to={`/products/${product.id}`}>Edit</Link>
                    </span>
                    {product.isActive && (
                      <span>
                        <a href={`/product/${product.slug}`} target="_blank" rel="noreferrer">
                          View
                        </a>
                      </span>
                    )}
                    <span>
                      <button type="button" className="link-button" onClick={() => setVisible(product, !product.isActive)}>
                        {product.isActive ? "Hide" : "Publish"}
                      </button>
                    </span>
                  </div>
                </td>
                <td>{product.sku ?? "–"}</td>
                <td>
                  <StockCell product={product} />
                </td>
                <td>
                  {product.regularPrice && product.regularPrice > product.price ? (
                    <>
                      <del className="muted">{money(product.regularPrice)}</del> <strong>{money(product.price)}</strong>
                    </>
                  ) : (
                    money(product.price)
                  )}
                </td>
                <td>{product.categories.map((entry) => categoryName.get(entry.category) ?? entry.category).join(", ") || "–"}</td>
                <td>
                  {product.createdAt ? formatDate(product.createdAt) : "–"}
                  <div className="muted" style={{ fontSize: 12 }}>
                    {product.isActive ? "Published" : "Hidden"}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
