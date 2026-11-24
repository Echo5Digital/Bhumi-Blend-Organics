import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { HttpError } from "../../lib/httpError.js";
import { escapeRegex, paginationSchema, parse } from "../../lib/validation.js";
import { BlogComment } from "../../models/BlogComment.js";

// The admin's "Messages" screen: what visitors sent through the "Leave a Reply" form under the
// blog articles. An inbox: each message is "new" until the admin marks it as read, and can be deleted.
// (Nothing here changes what the website shows.)

const listQuery = paginationSchema.extend({
  status: z.enum(["all", "new", "read"]).default("all"),
  search: z.string().trim().max(80).optional(),
});
const readBody = z.object({ isRead: z.boolean() });
const objectId = z.string().refine((id) => mongoose.isValidObjectId(id), "Not a valid message id.");
const bulkBody = z.object({ ids: z.array(objectId).min(1).max(100), action: z.enum(["read", "unread", "delete"]) });

type MessageView = {
  _id: unknown;
  postSlug: string;
  name: string;
  email: string;
  website?: string | null;
  comment: string;
  isRead: boolean;
  createdAt?: Date;
};

const view = (item: MessageView) => ({
  id: String(item._id),
  postSlug: item.postSlug,
  name: item.name,
  email: item.email,
  website: item.website ?? "",
  comment: item.comment,
  isRead: item.isRead,
  createdAt: item.createdAt,
});

export function adminMessageRoutes(): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    const query = parse(listQuery, req.query);

    const match: Record<string, unknown> = {};
    if (query.status !== "all") match.isRead = query.status === "read";
    if (query.search) {
      const pattern = { $regex: escapeRegex(query.search), $options: "i" };
      match.$or = [{ name: pattern }, { email: pattern }, { website: pattern }, { comment: pattern }, { postSlug: pattern }];
    }

    const [items, total, unread, all] = await Promise.all([
      BlogComment.find(match)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      BlogComment.countDocuments(match),
      BlogComment.countDocuments({ isRead: false }),
      BlogComment.countDocuments(),
    ]);

    res.json({
      items: items.map(view),
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.max(1, Math.ceil(total / query.limit)),
      counts: { all, new: unread, read: all - unread },
    });
  });

  router.patch("/:id", async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw HttpError.notFound("Message not found.", "MESSAGE_NOT_FOUND");
    const { isRead } = parse(readBody, req.body);
    const updated = await BlogComment.findByIdAndUpdate(req.params.id, { isRead }, { returnDocument: "after" }).lean();
    if (!updated) throw HttpError.notFound("Message not found.", "MESSAGE_NOT_FOUND");
    res.json({ message: view(updated) });
  });

  router.delete("/:id", async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw HttpError.notFound("Message not found.", "MESSAGE_NOT_FOUND");
    const deleted = await BlogComment.findByIdAndDelete(req.params.id);
    if (!deleted) throw HttpError.notFound("Message not found.", "MESSAGE_NOT_FOUND");
    res.status(204).end();
  });

  // Mark several as read / as new, or delete them.
  router.post("/bulk", async (req, res) => {
    const { ids, action } = parse(bulkBody, req.body);
    const updated =
      action === "delete"
        ? (await BlogComment.deleteMany({ _id: { $in: ids } })).deletedCount
        : (await BlogComment.updateMany({ _id: { $in: ids } }, { isRead: action === "read" })).matchedCount;
    res.json({ updated });
  });

  return router;
}
