import type { ScryfallCard } from "../types/scryfall";

export type ManaColor = "W" | "U" | "B" | "R" | "G";

export type ManaBreakdown = {
  colorIdentity: ManaColor[];
  landCount: number;
  nonLandCount: number;
  basicsNeeded: Partial<Record<ManaColor, number>>;
};

export type DeckCard = {
  quantity: number;
  name: string;
  data: ScryfallCard;
};

export function optimizeMana(deck: DeckCard[]): ManaBreakdown {
  const colorIdentity = getDeckColorIdentity(deck);

  //TODO: factor in color pips

  const landCount = countCards(deck, isLand);
  const nonLandCount = countCards(deck, (card) => !isLand(card));

  //TODO: calculate basicsNeeded once the mana-base formula is worked out
  const basicsNeeded: ManaBreakdown["basicsNeeded"] = {};

  return { colorIdentity, landCount, nonLandCount, basicsNeeded };
}

function getDeckColorIdentity(deck: DeckCard[]): ManaColor[] {
  // Use a Set to store unique color characters
  const identity = new Set<ManaColor>();

  deck.forEach((card) => {
    card.data.color_identity.forEach((color) =>
      identity.add(color as ManaColor),
    );
  });

  // Convert Set to sorted array for standard formatting (WUBRG)
  const colorOrder: Record<ManaColor, number> = { W: 1, U: 2, B: 3, R: 4, G: 5 };
  return Array.from(identity).sort((a, b) => colorOrder[a] - colorOrder[b]);
}

function isLand(card: DeckCard): boolean {
  return card.data.type_line.includes("Land");
}

function countCards(
  deck: DeckCard[],
  predicate: (card: DeckCard) => boolean,
): number {
  return deck.filter(predicate).reduce((total, card) => total + card.quantity, 0);
}
