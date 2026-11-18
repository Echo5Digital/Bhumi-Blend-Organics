import { Router } from "express";
import mongoose from "mongoose";
import type { Env } from "../../config/env.js";
import { Category } from "../../models/Category.js";
import { Coupon } from "../../models/Coupon.js";
import { Customer } from "../../models/Customer.js";
import { Order } from "../../models/Order.js";
import { Product } from "../../models/Product.js";
import type { ImageStore } from "../../services/images.js";
import type { Mailer } from "../../services/mailer.js";
import type { PaymentGateway } from "../../services/payments.js";

// Status → System status in the admin: is everything connected, and what's the
// server running on. Never includes a key, password or database link — only
// whether each is set up.
export function adminSystemRoutes({
  env,
  payments,
  images,
  mailer,
}: {
  env: Env;
  payments: PaymentGateway;
  images: ImageStore;
  mailer: Mailer;
}): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    const [products, categories, customers, orders, coupons] = await Promise.all([
      Product.estimatedDocumentCount(),
      Category.estimatedDocumentCount(),
      Customer.estimatedDocumentCount(),
      Order.estimatedDocumentCount(),
      Coupon.estimatedDocumentCount(),
    ]);

    res.json({
      server: {
        environment: env.NODE_ENV,
        nodeVersion: process.version,
        uptimeSeconds: Math.round(process.uptime()),
        serverTime: new Date().toISOString(),
        timezone: "Asia/Kolkata (shop days and reports)",
        allowedOrigins: env.CLIENT_ORIGINS,
      },
      database: {
        connected: mongoose.connection.readyState === 1,
        name: mongoose.connection.name,
        counts: { products, categories, customers, orders, coupons },
      },
      services: {
        payments: {
          label: "Razorpay payments",
          configured: payments.configured,
          hint: "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env (and RAZORPAY_WEBHOOK_SECRET for the webhook).",
        },
        images: {
          label: "Cloudinary image storage",
          configured: images.configured,
          hint: "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in backend/.env.",
        },
        email: {
          label: "Email (SMTP)",
          configured: mailer.configured,
          hint: "Set SMTP_HOST and MAIL_FROM (plus SMTP_USER / SMTP_PASS) in backend/.env.",
        },
      },
    });
  });

  return router;
}
