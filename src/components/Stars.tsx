// Five gold stars, filled up to `rating`. Shared by the product cards that show
// the live site's star rating.
export function Stars({ rating }: { rating: number }) {
  return (
    <span
      role="img"
      aria-label={`Rated ${rating} out of 5`}
      className="mt-1.5 flex gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 ${n <= rating ? "fill-[#C89B3C]" : "fill-[#e6dcc5]"}`}
        >
          <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8L12 2.5z" />
        </svg>
      ))}
    </span>
  );
}
