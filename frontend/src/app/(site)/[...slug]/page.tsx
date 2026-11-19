import { notFound } from "next/navigation";

// With two root layouts (this one and the admin's) an address that matches no page would get Next's
// bare 404. This catch-all sends it through the shop's own layout instead, so it keeps the header.
export default function UnknownAddress() {
  notFound();
}
