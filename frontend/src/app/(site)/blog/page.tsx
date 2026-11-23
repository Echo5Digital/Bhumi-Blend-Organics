import { BlogListPage, blogListMetadata } from "@/components/BlogList";

export const metadata = blogListMetadata(1);

export default function BlogPage() {
  return <BlogListPage page={1} />;
}
