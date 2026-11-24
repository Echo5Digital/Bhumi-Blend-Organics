import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "how-to-create-a-sustainable-skincare-routine";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
