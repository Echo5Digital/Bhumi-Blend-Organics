import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "dark-underarms-real-causes-and-the-body-care-routine-to-fix-them";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
