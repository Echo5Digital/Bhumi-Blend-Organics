import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "how-to-age-gracefully-restore-rejuvenate-and-glow-naturally";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
