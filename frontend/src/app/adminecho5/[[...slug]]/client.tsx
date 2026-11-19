"use client";

import dynamic from "next/dynamic";

// The admin is a single-page app that only runs in the browser (it keeps its login in localStorage),
// so it is not rendered on the server.
const App = dynamic(() => import("@/admin/App").then((module) => module.App), { ssr: false });

export function ClientOnly() {
  return (
    <div id="root">
      <App />
    </div>
  );
}
