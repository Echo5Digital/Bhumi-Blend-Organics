// Small gold line icons for the product page, drawn on a 24px grid. They use
// the text colour (stroke="currentColor"), so the parent sets the shade.

export function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function StarIcon({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2l3 6 6 .9-4.5 4.3 1 6.8L12 17l-5.5 3 1-6.8L3 8.9 9 8z" />
    </svg>
  );
}
