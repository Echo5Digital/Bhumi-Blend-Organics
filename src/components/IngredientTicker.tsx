// Gold ticker of ingredient names that scrolls right-to-left forever.
// Colours, type and spacing are copied from the live site's `.marquee` block.
const ingredients = [
  "Aloe Vera",
  "Turmeric",
  "Rose Water",
  "Neem",
  "Coconut Oil",
  "Shea Butter",
  "Tea Tree",
  "Amla",
  "Hibiscus",
  "Tulsi",
  "Sandalwood",
  "Saffron",
];

// The track is two identical groups and slides left by exactly one group
// (-50%), then restarts — which looks seamless. Each group repeats the list
// REPEATS times so it is wider than any screen (the live site repeats it once,
// which leaves a brief blank gap on wide screens at the end of each loop).
const REPEATS = 3;

// The live ticker takes 25s to travel one copy of the list. A group here is
// REPEATS copies long, so scale the duration to keep the same scroll speed.
const DURATION_SECONDS = 25 * REPEATS;

export function IngredientTicker() {
  const group = (groupIndex: number) => (
    <div className="flex shrink-0" aria-hidden={groupIndex > 0 || undefined}>
      {Array.from({ length: REPEATS }, (_, copy) =>
        ingredients.map((name) => (
          <span
            key={`${copy}-${name}`}
            // Only the very first copy is exposed to screen readers.
            aria-hidden={groupIndex > 0 || copy > 0 || undefined}
            // 20px each side + 5px (the space between spans on the live site).
            className="mr-[25px] ml-5 font-system text-[18px] leading-[1.6] font-medium text-white"
          >
            {name} ✦
          </span>
        )),
      )}
    </div>
  );

  return (
    <div
      aria-label="Our natural ingredients"
      className="overflow-hidden bg-[#c9891a] py-5 whitespace-nowrap"
    >
      <div
        // The animation is set inline (not in the stylesheet) so it can't be
        // lost to a stale CSS build. `marquee` keyframes live in globals.css.
        className="marquee-track flex w-max"
        style={{ animation: `marquee ${DURATION_SECONDS}s linear infinite` }}
      >
        {group(0)}
        {group(1)}
      </div>
    </div>
  );
}
