import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "is-aloe-vera-gel-really-good-for-your-skin-and-hair";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
