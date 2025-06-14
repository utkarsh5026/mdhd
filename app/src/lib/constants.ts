export const COLORS = [
  // Blues & Teals
  "#8BBEE8", // Powder Blue
  "#4A6FA5", // Steel Blue
  "#B5C7ED", // Periwinkle
  "#5BA4CF", // Cerulean
  "#7393B3", // Dusty Blue
  "#B0C4DE", // Arctic Blue
  "#5F9EA0", // Teal
  "#8FD8C5", // Seafoam

  // Greens
  "#94B49F", // Sage
  "#9ED2BE", // Mint
  "#2D8A6F", // Emerald
  "#708238", // Olive
  "#2A7A4F", // Pine
  "#8A9A5B", // Moss

  // Purples & Pinks
  "#A689E1", // Lavender
  "#C3A6E1", // Mauve
  "#9D7FBD", // Amethyst
  "#C8A2C8", // Lilac
  "#8E4585", // Plum
  "#D4A5A5", // Dusty Rose
  "#B29FD7", // Orchid

  // Warm Neutrals & Browns
  "#E8DACB", // Sand
  "#B8A99A", // Taupe
  "#D3A18C", // Terracotta
  "#C19A6B", // Camel
  "#8D6E63", // Hickory
  "#BE7F51", // Cinnamon
  "#6F4E37", // Mocha

  // Soft Accents
  "#F0A287", // Coral
  "#DFBC7A", // Amber
  "#FFDAB9", // Peach
  "#FBCEB1", // Apricot
  "#D4B95E", // Mustard
  "#B7410E", // Rust

  // Muted Base Colors
  "#36404A", // Charcoal
  "#64748B", // Slate
  "#E6E6E6", // Pearl
  "#474B4E", // Graphite
  "#C0C5C1", // Silver Sage
  "#848884", // Smoke
] as const;

export const getRandomColors = (count: number) => {
  const idxSet = new Set<number>();

  while (idxSet.size < count) {
    const idx = Math.floor(Math.random() * COLORS.length);
    idxSet.add(idx);
  }

  return Array.from(idxSet).map((idx) => COLORS[idx]);
};
