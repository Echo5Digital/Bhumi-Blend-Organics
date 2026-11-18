// A quiet cream placeholder for a part of a page whose data (the products, read from
// the backend) is still loading — only seen when that data isn't cached yet, e.g.
// right after an admin edit. Give it the height the real content will have.
export function PageSkeleton({ className = "h-[520px]" }: { className?: string }) {
  return <div aria-hidden="true" className={`bg-[#f7efd9] motion-safe:animate-pulse ${className}`} />;
}
