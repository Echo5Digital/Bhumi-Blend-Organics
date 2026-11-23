import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "are-dark-circles-really-caused-by-lack-of-sleep-or-are-most-people-treating-them-the-wrong-way";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
