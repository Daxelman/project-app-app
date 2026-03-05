import { useState } from "react";
import "./Home.css";
import { lookupCards } from "../../services/cardLookup";
import type { ScryfallCard } from "../../types/scryfall";

type CardEntry = {
  quantity: number;
  name: string;
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

const Home = () => {
  const [inputList, setInputList] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
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
      const { found, notFound } = await lookupCards(
        parsed.map((c) => c.name),
        setLoadingStatus,
      );
      setResult({
        found: found.map(({ name, data }) => ({
          ...(parsed.find(
            (c) => c.name.toLowerCase() === name.toLowerCase(),
          ) ?? { quantity: 1, name }),
          data,
        })),
        notFound: notFound.map((name) => ({ quantity: 0, name })),
      });
    } catch {
      setError(
        "Failed to load card data. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
      setLoadingStatus("");
    }
  };

  return (
    <div>
      <div>
        <h1>Optimize Your Mana</h1>
        <p>
          Paste you deck below, hit the button, and we'll try and give you an
          optimized mana base.
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
          {loading ? loadingStatus || "Checking cards..." : "Give Me Good Mana"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {result && (
        <div>
          <h2>Validated Cards ({result.found.length})</h2>
          <ul>
            {result.found.map((card) => (
              <li key={card.name}>
                {card.quantity}x {card.name} — {card.data.type_line}{" "}
                {card.data.mana_cost}
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
