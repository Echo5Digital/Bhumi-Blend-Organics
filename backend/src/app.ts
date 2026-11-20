import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import type { Env } from "./config/env.js";
import { requireAdmin } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import { createLimiter } from "./middleware/rateLimit.js";
import { adminAuthRoutes } from "./routes/admin/auth.js";
import { adminCategoryRoutes } from "./routes/admin/categories.js";
import { adminCouponRoutes } from "./routes/admin/coupons.js";
import { adminCustomerRoutes } from "./routes/admin/customers.js";
import { adminOrderRoutes } from "./routes/admin/orders.js";
import { adminProductRoutes } from "./routes/admin/products.js";
import { adminReportRoutes } from "./routes/admin/reports.js";
import { adminEmailRoutes } from "./routes/admin/emails.js";
import { adminSettingsRoutes } from "./routes/admin/settings.js";
import { adminStatsRoutes } from "./routes/admin/stats.js";
import { adminSystemRoutes } from "./routes/admin/system.js";
import { adminUploadRoutes } from "./routes/admin/uploads.js";
import { accountRoutes } from "./routes/account.js";
import { catalogRoutes } from "./routes/catalog.js";
import { orderRoutes } from "./routes/orders.js";
import { razorpayWebhook } from "./routes/webhooks.js";
import { createCloudinaryStore, type ImageStore } from "./services/images.js";
import { createMailer, type Mailer } from "./services/mailer.js";
import { createNewOrderNotifier } from "./services/orderNotifications.js";
import { createRazorpayGateway, type PaymentGateway } from "./services/payments.js";
import { createStorefrontNotifier, type StorefrontNotifier } from "./services/storefront.js";
import { createWelcomeNotifier } from "./services/welcomeEmail.js";

export type AppDeps = {
  env: Env;
  /** Defaults to the real Razorpay; tests pass a fake one. */
  payments?: PaymentGateway;
  /** Defaults to the real Cloudinary; tests pass a fake one. */
  images?: ImageStore;
  /** Defaults to real SMTP (or the console in development); tests pass one that records. */
  mailer?: Mailer;
  /** Tells the storefront to refresh after a change; defaults to calling STOREFRONT_URL (or nothing if unset). */
  notifier?: StorefrontNotifier;
};

// Builds the Express app without starting it, so tests can call it directly
// (server.ts connects the database and listens).
export function createApp({
  env,
  payments = createRazorpayGateway(env),
  images = createCloudinaryStore(env),
  mailer = createMailer(env),
  notifier = createStorefrontNotifier(env),
}: AppDeps) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY);

  app.use(helmet());
  app.use(
    cors({
      // Only the storefront / admin websites in CLIENT_ORIGINS may call the API from a browser.
      origin: (origin, callback) => callback(null, !origin || env.CLIENT_ORIGINS.includes(origin)),
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Order-Token"],
      maxAge: 600,
    }),
  );

  // The "New order" email to the shop owner, sent when an order is placed (paid, or confirmed with Pay Now).
  const newOrderEmail = createNewOrderNotifier({ env, mailer });

  // Razorpay signs the exact bytes it sends, so this one route reads the raw body.
  app.post("/api/webhooks/razorpay", express.raw({ type: "application/json", limit: "1mb" }), razorpayWebhook(payments, notifier, newOrderEmail));

  // Admin requests can carry a whole product page's content; everything else is small.
  app.use("/api/admin", express.json({ limit: "2mb" }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      database: mongoose.connection.readyState === 1,
      payments: payments.configured,
      images: images.configured,
      email: mailer.configured,
    });
  });

  const couponLimiter = createLimiter(env, { windowMinutes: 15, max: 60, message: "Too many coupon checks. Please try again later." });
  app.use("/api/coupons", couponLimiter);
  app.use("/api/account", accountRoutes({ env, mailer, onRegistered: createWelcomeNotifier({ env, mailer }) }));
  app.use("/api", catalogRoutes());
  app.use("/api", orderRoutes({ env, gateway: payments, notifier, onPlaced: newOrderEmail }));

  // Admin panel API: login is open, everything else needs a valid admin token.
  app.use("/api/admin/auth", adminAuthRoutes(env));
  const admin = express.Router();
  admin.use(requireAdmin(env));
  admin.use("/products", adminProductRoutes(notifier));
  admin.use("/categories", adminCategoryRoutes(notifier));
  admin.use("/coupons", adminCouponRoutes());
  admin.use("/orders", adminOrderRoutes(notifier));
  admin.use("/uploads", adminUploadRoutes(images));
  admin.use("/stats", adminStatsRoutes());
  admin.use("/customers", adminCustomerRoutes());
  admin.use("/reports", adminReportRoutes());
  admin.use("/settings", adminSettingsRoutes(notifier));
  admin.use("/emails", adminEmailRoutes({ env, mailer }));
  admin.use("/system", adminSystemRoutes({ env, payments, images, mailer }));
  app.use("/api/admin", admin);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
