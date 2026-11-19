import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";
import { Shell } from "./components/Shell";
import { PageTitle, useTitle } from "./components/ui";
import { AuthProvider, useAuth } from "./lib/auth";
import { Categories } from "./pages/Categories";
import { CouponEdit } from "./pages/CouponEdit";
import { Coupons } from "./pages/Coupons";
import { CustomerPage } from "./pages/CustomerPage";
import { Customers } from "./pages/Customers";
import { EmailScreen, EmailsList } from "./pages/Emails";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { OrderPage } from "./pages/OrderPage";
import { Orders } from "./pages/Orders";
import { ProductEdit } from "./pages/ProductEdit";
import { Products } from "./pages/Products";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";

/** Everything except the login page needs a login. */
function RequireAuth({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

function NotFound() {
  useTitle("Not found");
  return (
    <div className="page">
      <PageTitle title="Page not found" />
      <p>There's nothing at this address. Use the menu on the left.</p>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      {/* the admin lives under /adminecho5 (app/adminecho5 in the storefront); every link and route below is relative to it */}
      <BrowserRouter basename="/adminecho5">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <Shell />
              </RequireAuth>
            }
          >
            <Route index element={<Home />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:number" element={<OrderPage />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductEdit />} />
            <Route path="products/categories" element={<Categories />} />
            <Route path="products/:id" element={<ProductEdit />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerPage />} />
            <Route path="coupons" element={<Coupons />} />
            <Route path="coupons/new" element={<CouponEdit />} />
            <Route path="coupons/:id" element={<CouponEdit />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="settings/emails" element={<EmailsList />} />
            <Route path="settings/emails/:kind" element={<EmailScreen />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
