import { BlogListPage, blogListMetadata } from "@/components/BlogList";

export const metadata = blogListMetadata(4);

export default function BlogPage4() {
  return <BlogListPage page={4} />;
}
