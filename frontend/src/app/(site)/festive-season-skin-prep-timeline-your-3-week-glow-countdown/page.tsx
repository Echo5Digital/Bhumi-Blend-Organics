import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "festive-season-skin-prep-timeline-your-3-week-glow-countdown";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
