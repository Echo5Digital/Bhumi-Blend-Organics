import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "how-to-remove-sun-tan-from-hands-and-legs";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
