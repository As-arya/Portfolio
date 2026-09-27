// Section starts include their top padding, so the highlight follows visible content.
export function activeSection(
  sections: { id: string; top: number }[],
  line: number,
) {
  return sections.findLast((section) => section.top <= line)?.id ?? "home";
}
