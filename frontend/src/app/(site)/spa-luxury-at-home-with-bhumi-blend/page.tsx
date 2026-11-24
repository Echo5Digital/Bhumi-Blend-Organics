import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "spa-luxury-at-home-with-bhumi-blend";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
