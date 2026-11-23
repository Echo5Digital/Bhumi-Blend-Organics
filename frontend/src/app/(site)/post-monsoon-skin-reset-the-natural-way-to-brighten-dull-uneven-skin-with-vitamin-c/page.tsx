import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "post-monsoon-skin-reset-the-natural-way-to-brighten-dull-uneven-skin-with-vitamin-c";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
