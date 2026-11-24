// Which posts an article shows under "Similar Posts". Every post is described by the words in its
// title and tags (counted most) and in the opening of its text (counted a little); two posts are
// as similar as the words they share, rarer words counting for more ("saffron" says more than
// "skin"). The most similar six are shown, so each article gets its own set. Nothing is random: the
// same article always shows the same posts.

import { blogPosts, type BlogPost } from "./blog";
import { blogArticles } from "./blogArticles";

const STOP_WORDS = new Set(
  "a about after all also an and any are as at be been but by can do does for from get has have how if in into is it its just more most no not of on one or our out so than that the their them then there these they this to up use used using was we were what when which who why will with you your".split(
    " ",
  ),
);

// "serums" and "serum" are the same word.
const stem = (word: string) => (word.length > 3 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    .map(stem);
}

/** What a post is about: each word with how much it counts (3 = title or tag, 1 = opening text). */
function profile(post: BlogPost): Map<string, number> {
  const weights = new Map<string, number>();
  const add = (text: string, weight: number) => {
    for (const word of words(text)) weights.set(word, Math.max(weights.get(word) ?? 0, weight));
  };
  add(post.title, 3);
  for (const block of blogArticles[post.slug] ?? []) {
    if (block.type === "tags") for (const tag of block.items) add(tag, 3);
  }
  add(post.excerpt, 1);
  return weights;
}

const profiles = blogPosts.map(profile);

// In how many posts each word appears.
const postsWith = new Map<string, number>();
for (const weights of profiles) for (const word of weights.keys()) postsWith.set(word, (postsWith.get(word) ?? 0) + 1);
const rarity = (word: string) => Math.log(blogPosts.length / (postsWith.get(word) ?? 1));

function similarity(a: Map<string, number>, b: Map<string, number>): number {
  let score = 0;
  for (const [word, weightA] of a) {
    const weightB = b.get(word);
    if (weightB) score += rarity(word) * Math.min(weightA, weightB);
  }
  return score;
}

const cache = new Map<string, BlogPost[]>();

/** The posts most like this one (never the post itself), best match first. */
export function relatedPosts(slug: string, count = 6): BlogPost[] {
  const cached = cache.get(slug);
  if (cached) return cached;
  const at = blogPosts.findIndex((post) => post.slug === slug);
  if (at < 0) return [];
  const result = blogPosts
    .map((post, index) => ({ post, index, score: similarity(profiles[at], profiles[index]) }))
    .filter((item) => item.index !== at)
    // Equal scores: the post nearer in the blog list wins.
    .sort((x, y) => y.score - x.score || Math.abs(x.index - at) - Math.abs(y.index - at))
    .slice(0, count)
    .map((item) => item.post);
  cache.set(slug, result);
  return result;
}
