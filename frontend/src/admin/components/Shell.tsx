import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { useAuth } from "../lib/auth";
import type { OrderList } from "../lib/types";
import { useApi } from "../lib/useApi";

const icons = {
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  orders: "M5 4h14l1 5H4l1-5zM4 9v11h16V9M9 13h6",
  products: "M12 3l9 4.5v9L12 21l-9-4.5v-9L12 3zM3 7.5l9 4.5 9-4.5M12 12v9",
  customers: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c0-3.6 2.9-5.5 6.5-5.5s6.5 1.9 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 6.5M18.5 14.8c1.9.7 3 2.3 3 5.2",
  coupons: "M3 12V4h8l10 10-8 8L3 12zM8 8.5h.01",
  reports: "M4 20V10M10 20V4M16 20v-8M22 20H2",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  menu: "M4 7h16M4 12h16M4 17h16",
};

function Icon({ name }: { name: keyof typeof icons }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={icons[name]} />
    </svg>
  );
}

type Item = { label: string; to: string; icon: keyof typeof icons; match: (path: string) => boolean; badge?: number; submenu?: { label: string; to: string }[] };

// The frame around every screen: the black bar on top ("Howdy, …"), the dark menu on
// the left, and the page itself on the right.
export function Shell() {
  const { admin, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // The Orders menu item shows how many orders are waiting to be processed.
  const waiting = useApi<OrderList>("/admin/orders?status=processing&limit=1");
  const processing = waiting.data?.counts.processing ?? 0;

  useEffect(() => setOpen(false), [location.pathname]);

  const items: Item[] = [
    { label: "Dashboard", to: "/", icon: "home", match: (path) => path === "/" },
    { label: "Orders", to: "/orders", icon: "orders", match: (path) => path.startsWith("/orders"), badge: processing },
    {
      label: "Products",
      to: "/products",
      icon: "products",
      match: (path) => path.startsWith("/products"),
      submenu: [
        { label: "All Products", to: "/products" },
        { label: "Add New", to: "/products/new" },
        { label: "Categories", to: "/products/categories" },
      ],
    },
    { label: "Customers", to: "/customers", icon: "customers", match: (path) => path.startsWith("/customers") },
    { label: "Coupons", to: "/coupons", icon: "coupons", match: (path) => path.startsWith("/coupons") },
    { label: "Reports", to: "/reports", icon: "reports", match: (path) => path.startsWith("/reports") },
    { label: "Settings", to: "/settings", icon: "settings", match: (path) => path.startsWith("/settings") },
  ];

  return (
    <>
      <div className="adminbar">
        <button type="button" className="menu-toggle" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          <svg className="icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d={icons.menu} />
          </svg>
        </button>
        <Link className="brand" to="/" aria-label="Bhumi Blend dashboard">
          <img src="/bb_logo_.png" alt="" width={40} height={38} />
          <span className="name">
            Bhumi Blend
            <small>Admin</small>
          </span>
        </Link>
        <span className="spacer" />
        <a className="view-site" href="/" target="_blank" rel="noreferrer">
          View store
        </a>
        <span className="user">
          <span className="avatar" aria-hidden="true">
            {admin?.name?.trim().charAt(0) || "A"}
          </span>
          <span>{admin?.name}</span>
        </span>
        <button type="button" className="logout" onClick={logout}>
          Log out
        </button>
      </div>

      <nav className={`sidebar ${open ? "open" : ""}`} aria-label="Main">
        <ul>
          {items.map((item) => {
            const active = item.match(location.pathname);
            return (
              <li key={item.to} className={`item ${active ? "active" : ""}`}>
                <NavLink to={item.to} end={item.to === "/"} aria-current={active ? "page" : undefined}>
                  <Icon name={item.icon} />
                  <span className="label">{item.label}</span>
                  {item.badge ? <span className="count" aria-label={`${item.badge} waiting`}>{item.badge}</span> : null}
                </NavLink>
                {active && item.submenu && (
                  <div className="submenu">
                    {item.submenu.map((sub) => (
                      <Link key={sub.to} to={sub.to} className={location.pathname === sub.to ? "active" : ""}>
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <main className="content">
        <Outlet />
      </main>
    </>
  );
}
