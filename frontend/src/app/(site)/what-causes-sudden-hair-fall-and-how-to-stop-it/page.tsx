import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "what-causes-sudden-hair-fall-and-how-to-stop-it";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
