import type { CustomCardEntry } from "./types";

/** Adds a card to the "Add card" picker in the dashboard editor. */
export function registerCustomCard(card: Omit<CustomCardEntry, "type"> & { type: string }) {
  window.customCards = window.customCards || [];
  window.customCards.push({
    preview: true,
    documentationURL: "https://github.com/SenorFungi/senorfungi-cards",
    ...card,
  });
}
