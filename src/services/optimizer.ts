export function optimizeMana(deck: any): any {
  var manaBreakdown = {};
  //first, grab the color identity
  var colorIdentity: string[] = getDeckColorIdentity(deck);

  //TODO: factor in color pips

  //grab the number of non land cards in the deck
  var nonLandNumber: number = filterLandsFromDeck(deck);

  //40 is the base, we go up or down based on how many non
  // land cards they have in their deck
  if (nonLandNumber > 60) {
    //some genius formula here.
  }

  return manaBreakdown;
}

function getDeckColorIdentity(deck: any[]): string[] {
  // Use a Set to store unique color characters
  const identity = new Set<string>();

  deck.forEach((card: any) => {
    // 1. Check Color Identity directly from API (scryfall uses colorIdentity)
    if (card.colorIdentity) {
      card.colorIdentity.forEach((color: any) => identity.add(color));
    }

    // 2. Handle double-faced cards (check back face if necessary)
    if (card.card_faces) {
      card.card_faces.forEach((face: any) => {
        if (face.colorIdentity) {
          face.colorIdentity.forEach((color: any) => identity.add(color));
        }
      });
    }
  });

  // Convert Set to sorted array for standard formatting (WUBRG)
  const colorOrder: Record<string, number> = { W: 1, U: 2, B: 3, R: 4, G: 5 };
  return Array.from(identity).sort((a, b) => colorOrder[a] - colorOrder[b]);
}

function getAverageManaValue(deck: any[]): number {
  var avg = 0;
  var cmcs: number[] = [];
  deck.forEach((card) => {
    cmcs.push(card.data.cmc);
  });

  const sum = cmcs.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0,
  );

  return sum / 100;
}

function filterLandsFromDeck(deck: any): number {
  var lands = [];
  deck.forEach((card: any) => {
    if (card.quantity > 1) lands.push(card);
  });

  return 100 - lands.length;
}
