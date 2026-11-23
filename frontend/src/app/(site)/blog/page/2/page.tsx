import { BlogListPage, blogListMetadata } from "@/components/BlogList";

export const metadata = blogListMetadata(2);

export default function BlogPage2() {
  return <BlogListPage page={2} />;
}
