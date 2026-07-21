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
/*
So, here's a potential formula we could use:
from: https://www.tcgplayer.com/content/article/How-Many-Lands-Do-You-Need-in-Your-Deck-An-Updated-Analysis/
"= 99/60 * (19.59 + 1.90 * average mana value + 0.27) – 0.28 * number of cheap card draw or mana ramp spells - 1.35 

= 31.42 + 3.13 * average mana value of your spells – 0.28 * number of cheap card draw or mana ramp spells"

Getting Average Mana value from a deck shouldn't be too hard, 
what would be harder is trying to figure out what's cheap draw/mana ramp

*/
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
  const colorOrder: Record<ManaColor, number> = {
    W: 1,
    U: 2,
    B: 3,
    R: 4,
    G: 5,
  };
  return Array.from(identity).sort((a, b) => colorOrder[a] - colorOrder[b]);
}

function isLand(card: DeckCard): boolean {
  return card.data.type_line.includes("Land");
}

function countCards(
  deck: DeckCard[],
  predicate: (card: DeckCard) => boolean,
): number {
  return deck
    .filter(predicate)
    .reduce((total, card) => total + card.quantity, 0);
}
