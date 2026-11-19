import { ClientOnly } from "./client";

// Every address under /adminecho5 (/adminecho5/orders, /adminecho5/products/new, …) lands on this one
// page; the admin's own router (src/admin/App.tsx) then shows the right screen in the browser.
export function generateStaticParams() {
  return [{ slug: [""] }];
}

export default function AdminPage() {
  return <ClientOnly />;
}
