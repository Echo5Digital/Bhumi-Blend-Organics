import { BlogListPage, blogListMetadata } from "@/components/BlogList";

export const metadata = blogListMetadata(3);

export default function BlogPage3() {
  return <BlogListPage page={3} />;
}
