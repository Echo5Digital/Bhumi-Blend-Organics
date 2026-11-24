import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "choosing-the-right-hair-oil-for-premature-greying";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
