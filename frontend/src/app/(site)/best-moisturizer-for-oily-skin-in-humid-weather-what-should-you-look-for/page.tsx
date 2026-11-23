import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "best-moisturizer-for-oily-skin-in-humid-weather-what-should-you-look-for";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
