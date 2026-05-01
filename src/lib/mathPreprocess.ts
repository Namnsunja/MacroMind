/**
 * Preprocesses markdown content to normalize LaTeX math delimiters.
 * Converts \(...\) → $...$ and \[...\] → $$...$$ so remark-math can parse them.
 */
export function preprocessMath(content: string): string {
  if (!content) return content;

  return content
    // Display math: \[...\] → $$...$$  (must come before inline)
    .replace(/\\\[([\s\S]*?)\\\]/g, (_match, inner) => `$$${inner}$$`)
    // Inline math: \(...\) → $...$
    .replace(/\\\(([\s\S]*?)\\\)/g, (_match, inner) => `$${inner}$`);
}
