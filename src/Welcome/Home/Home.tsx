import { useState } from "react";
import "./Home.css";

type CardEntry = {
  quantity: number;
  name: string;
};

type ScryfallCard = {
  name: string;
  mana_cost: string;
  cmc: number;
  type_line: string;
  colors: string[];
  color_identity: string[];
  legalities: Record<string, string>;
};

type ValidationResult = {
  found: (CardEntry & { data: ScryfallCard })[];
  notFound: CardEntry[];
};

function parseList(raw: string): CardEntry[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("//"))
    .map((line) => {
      const match = line.match(/^(\d+)x?\s+(.+)$/);
      if (!match) return null;
      return { quantity: parseInt(match[1]), name: match[2].trim() };
    })
    .filter((entry): entry is CardEntry => entry !== null);
}

async function validateWithScryfall(cards: CardEntry[]): Promise<ValidationResult> {
  const response = await fetch("https://api.scryfall.com/cards/collection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifiers: cards.map((c) => ({ name: c.name })),
    }),
  });

  const json = await response.json();

  const found = (json.data as ScryfallCard[]).map((scryfallCard) => {
    const entry = cards.find(
      (c) => c.name.toLowerCase() === scryfallCard.name.toLowerCase()
    ) ?? { quantity: 1, name: scryfallCard.name };
    return { ...entry, data: scryfallCard };
  });

  const notFound = (json.not_found as { name: string }[]).map((nf) => {
    const entry = cards.find((c) => c.name.toLowerCase() === nf.name.toLowerCase());
    return entry ?? { quantity: 0, name: nf.name };
  });

  return { found, notFound };
}

const Home = () => {
  const [inputList, setInputList] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setResult(null);
    const parsed = parseList(inputList);
    if (parsed.length === 0) {
      setError("No valid card entries found. Use the format: 4 Lightning Bolt");
      return;
    }
    setLoading(true);
    try {
      const validation = await validateWithScryfall(parsed);
      setResult(validation);
    } catch {
      setError("Failed to reach Scryfall. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div>
        <h1>Optimize Your Mana</h1>
        <p>
          Paste a list of your cards below, and I'll return what an optimized
          mana base looks like.
        </p>
      </div>
      <div>
        <textarea
          value={inputList}
          onChange={(e) => setInputList(e.target.value)}
          placeholder={"4 Lightning Bolt\n2 Counterspell\n1 Sol Ring"}
          rows={12}
        />
        <button type="button" onClick={handleSubmit} disabled={loading}>
          {loading ? "Checking cards..." : "Give Me Good Mana"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {result && (
        <div>
          <h2>Validated Cards ({result.found.length})</h2>
          <ul>
            {result.found.map((card) => (
              <li key={card.name}>
                {card.quantity}x {card.name} — {card.data.type_line} {card.data.mana_cost}
              </li>
            ))}
          </ul>

          {result.notFound.length > 0 && (
            <>
              <h2>Not Recognized ({result.notFound.length})</h2>
              <ul className="not-found-list">
                {result.notFound.map((card) => (
                  <li key={card.name}>{card.name}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
