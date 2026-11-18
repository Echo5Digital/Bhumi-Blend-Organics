import { Router } from "express";
import { Order } from "../../models/Order.js";
import { Product } from "../../models/Product.js";

// GET /api/admin/stats — the numbers for the admin dashboard's first screen.
export function adminStatsRoutes(): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    const [orderCounts, revenue, toShip, products] = await Promise.all([
      Order.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$paymentStatus", n: { $sum: 1 } } }]),
      Order.aggregate<{ total: number; orders: number }>([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" }, orders: { $sum: 1 } } },
      ]),
      Order.countDocuments({ paymentStatus: "paid", fulfilmentStatus: { $in: ["new", "processing"] } }),
      Product.aggregate<{ _id: boolean; n: number }>([{ $group: { _id: "$isActive", n: { $sum: 1 } } }]),
    ]);

    const byPayment = Object.fromEntries(orderCounts.map((row) => [row._id, row.n]));
    res.json({
      orders: {
        paid: byPayment.paid ?? 0,
        awaitingPayment: byPayment.pending ?? 0,
        refunded: byPayment.refunded ?? 0,
        toShip,
      },
      revenue: { total: revenue[0]?.total ?? 0, paidOrders: revenue[0]?.orders ?? 0, currency: "INR" },
      products: {
        active: products.find((row) => row._id === true)?.n ?? 0,
        hidden: products.find((row) => row._id === false)?.n ?? 0,
      },
    });
  });

  return router;
}
