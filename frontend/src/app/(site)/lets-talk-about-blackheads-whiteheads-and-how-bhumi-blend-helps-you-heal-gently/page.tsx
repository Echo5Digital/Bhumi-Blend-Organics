import { BlogArticlePage, blogArticleMetadata } from "@/components/BlogArticle";

const slug = "lets-talk-about-blackheads-whiteheads-and-how-bhumi-blend-helps-you-heal-gently";

export const metadata = blogArticleMetadata(slug);

export default function Page() {
  return <BlogArticlePage slug={slug} />;
}
