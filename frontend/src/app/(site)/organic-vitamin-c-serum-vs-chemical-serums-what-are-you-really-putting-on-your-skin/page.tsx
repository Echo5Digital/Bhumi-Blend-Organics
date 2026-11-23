import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "organic-vitamin-c-serum-vs-chemical-serums-what-are-you-really-putting-on-your-skin";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
