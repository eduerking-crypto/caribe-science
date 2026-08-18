export type BadgeTone = "ocean" | "reef" | "sun" | "sand" | "coral" | "gray";

export const ARTICLE_TONE: Record<string, BadgeTone> = {
  research_article: "ocean",
  review_article: "sun",
  short_communication: "coral",
  methods_article: "reef",
  data_paper: "sand",
  perspective: "gray",
  commentary: "gray",
  correspondence: "gray",
};