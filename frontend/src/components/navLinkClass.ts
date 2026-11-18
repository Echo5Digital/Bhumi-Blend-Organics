// Shared look for every top-level navbar item (plain links and the Category
// dropdown trigger). From 1024px up the metrics are copied from bhumiblend.com:
// 18px, normal weight, uppercase, 0.5px tracking, 12px/20px padding, 40px
// line-height in a 40px box. Between 768px and 1023px there isn't room for six
// items at that size, so they are compacted (16px text, 10px side padding).
export const navLinkClass =
  "block h-10 px-2.5 pt-3 font-system text-[16px] font-normal uppercase leading-10 tracking-[0.5px] text-black transition-colors duration-300 hover:text-[#C89B3C] lg:px-5 lg:text-[18px]";
