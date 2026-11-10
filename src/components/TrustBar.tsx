// Beige strip under the banner. Colours, sizes and spacing copied from the
// live site's `.topbar-premium` block.
const items = [
  {
    label: "100% ORGANIC",
    path: "M12 2C8 7 6 10 6 14a6 6 0 0012 0c0-4-2-7-6-12z",
  },
  {
    label: "CERTIFIED NATURAL",
    path: "M12 2l3 6 6 .9-4.5 4.3 1 6.8L12 17l-5.5 3 1-6.8L3 8.9 9 8z",
  },
  {
    label: "FREE SHIPPING ₹499+",
    path: "M3 6h13v8H3zM16 10h3l2 2v2h-5zM5 18a2 2 0 110-4 2 2 0 010 4zm12 0a2 2 0 110-4 2 2 0 010 4z",
  },
  {
    label: "EASY RETURNS",
    path: "M12 6V3L8 7l4 4V8c2.8 0 5 2.2 5 5a5 5 0 01-9.9 1H5a7 7 0 0014 0c0-3.9-3.1-7-7-7z",
  },
];

export function TrustBar() {
  return (
    <div className="border-y border-[#d2c6b2] bg-[#e6dccb] py-2.5">
      {/* Phones (<768px): items scroll sideways and the dividers are hidden. */}
      <div className="mx-auto flex max-w-[1200px] items-center justify-center gap-[25px] max-[767px]:justify-start max-[767px]:overflow-x-auto max-[767px]:px-2.5 max-[767px]:[scrollbar-width:none]">
        {items.map((item, index) => (
          <div key={item.label} className="contents">
            {index > 0 && (
              <div
                aria-hidden="true"
                className="h-[18px] w-px bg-[#cbbfae] max-[767px]:hidden"
              />
            )}
            <div className="group flex items-center gap-2 font-system text-[13px] leading-[1.6] font-medium tracking-[1px] whitespace-nowrap text-[#6b5b3e] hover:text-black">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4 fill-[#c9891a] group-hover:fill-black"
              >
                <path d={item.path} />
              </svg>
              <span>{item.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
