import { api } from "./api";

// "Leave a Reply" under the blog articles. The backend saves the comment as pending (it is not shown
// on the website until the shop owner approves it).

export type BlogCommentInput = {
  /** The article's address, e.g. "how-to-age-gracefully-restore-rejuvenate-and-glow-naturally". */
  postSlug: string;
  name: string;
  email: string;
  website: string;
  comment: string;
  /** A hidden box people never see: it must stay empty (robots fill it in). */
  company: string;
};

export function sendBlogComment(input: BlogCommentInput) {
  return api<{ status: "pending"; message: string }>("/blog-comments", { method: "POST", body: input });
}
