import localforage from "localforage";
import type { ScryfallCard } from "../types/scryfall";

// Claude says I can migrate to backend API by replacing the body of `lookupCards`
// with a fetch() call to your own endpoint, and deleting everything else here.
// TODO: the above, in the future

const store = localforage.createInstance({
  name: "mana-optimizer",
  storeName: "cards",
});

const CARD_MAP_KEY = "card-map";
const META_KEY = "cache-meta";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

type CardMap = Record<string, ScryfallCard>;
type CacheMeta = { downloadedAt: number };

async function isStale(): Promise<boolean> {
  const meta = await store.getItem<CacheMeta>(META_KEY);
  return !meta || Date.now() - meta.downloadedAt > TTL_MS;
}

async function populate(onProgress: (status: string) => void): Promise<void> {
  onProgress("Fetching card database info...");
  const metaRes = await fetch(
    "https://api.scryfall.com/bulk-data/oracle-cards",
  );
  const { download_uri } = await metaRes.json();

  onProgress("Downloading card database (one-time setup, ~70MB)...");
  const dataRes = await fetch(download_uri);
  const rawCards: ScryfallCard[] = await dataRes.json();

  onProgress("Indexing cards...");
  const cardMap: CardMap = {};
  for (const card of rawCards) {
    cardMap[card.name.toLowerCase()] = {
      name: card.name,
      mana_cost: card.mana_cost,
      cmc: card.cmc,
      type_line: card.type_line,
      colors: card.colors,
      color_identity: card.color_identity,
      legalities: card.legalities,
    };
  }

  await store.setItem(CARD_MAP_KEY, cardMap);
  await store.setItem(META_KEY, { downloadedAt: Date.now() } as CacheMeta);
}

export type LookupResult = {
  found: { name: string; data: ScryfallCard }[];
  notFound: string[];
};

export async function lookupCards(
  names: string[],
  onProgress: (status: string) => void,
): Promise<LookupResult> {
  if (await isStale()) {
    await populate(onProgress);
  }

  const cardMap = (await store.getItem<CardMap>(CARD_MAP_KEY)) ?? {};
  const found: LookupResult["found"] = [];
  const notFound: string[] = [];

  for (const name of names) {
    const card = cardMap[name.toLowerCase()];
    if (card) {
      found.push({ name, data: card });
    } else {
      notFound.push(name);
    }
  }

  return { found, notFound };
}
