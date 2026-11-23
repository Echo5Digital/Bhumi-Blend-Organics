import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "your-30s-skincare-wakeup-call";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
