import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "5-skincare-myths-you-can-let-go-of";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
