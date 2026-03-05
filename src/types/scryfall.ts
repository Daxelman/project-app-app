export type ScryfallCard = {
  name: string;
  mana_cost: string;
  cmc: number;
  type_line: string;
  colors: string[];
  color_identity: string[];
  legalities: Record<string, string>;
};
