import React, { useState, useEffect } from "react";

export default function App() {
  const HAND_SIZE = 8;

  const [deck, setDeck] = useState([]);
  const [hand, setHand] = useState([]);
  const [ascend1, setAscend1] = useState(1);
  const [ascend2, setAscend2] = useState(1);
  const [descend1, setDescend1] = useState(100);
  const [descend2, setDescend2] = useState(100);
  const [playedThisTurn, setPlayedThisTurn] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [history, setHistory] = useState([]);
  const [showDeck, setShowDeck] = useState(false);

  useEffect(() => {
    startNewGame();
  }, []);

  const shuffle = (array) => {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const startNewGame = () => {
    const cards = Array.from({ length: 98 }, (_, i) => i + 2);
    const shuffled = shuffle(cards);
    setDeck(shuffled.slice(HAND_SIZE));
    setHand(shuffled.slice(0, HAND_SIZE));
    setAscend1(1);
    setAscend2(1);
    setDescend1(100);
    setDescend2(100);
    setPlayedThisTurn(0);
    setGameOver(false);
    setMessage("");
    setShowSuggestion(false);
    setSuggestion("");
    setHistory([]);
  };

  const canPlayOnPile = (card, pileValue, isAsc) => {
    if (isAsc) {
      if (card > pileValue) return true;
      if (card === pileValue - 10) return true;
    } else {
      if (card < pileValue) return true;
      if (card === pileValue + 10) return true;
    }
    return false;
  };

  const playCard = (card, pile) => {
    if (gameOver) return;

    let valid = false;
    if (pile === "asc1") valid = canPlayOnPile(card, ascend1, true);
    else if (pile === "asc2") valid = canPlayOnPile(card, ascend2, true);
    else if (pile === "desc1") valid = canPlayOnPile(card, descend1, false);
    else if (pile === "desc2") valid = canPlayOnPile(card, descend2, false);

    if (!valid) {
      setMessage(`Cannot play ${card} on that pile`);
      return;
    }

    setHistory([
      ...history,
      { hand, deck, ascend1, ascend2, descend1, descend2, playedThisTurn },
    ]);

    if (pile === "asc1") setAscend1(card);
    else if (pile === "asc2") setAscend2(card);
    else if (pile === "desc1") setDescend1(card);
    else if (pile === "desc2") setDescend2(card);

    setHand(hand.filter((c) => c !== card));
    setPlayedThisTurn(playedThisTurn + 1);
    setMessage("");
  };

  const hasLegalMove = (currentHand, piles) => {
    return currentHand.some((card) => {
      return (
        canPlayOnPile(card, piles.ascend1, true) ||
        canPlayOnPile(card, piles.ascend2, true) ||
        canPlayOnPile(card, piles.descend1, false) ||
        canPlayOnPile(card, piles.descend2, false)
      );
    });
  };

  const endTurn = () => {
    if (playedThisTurn < 2) {
      setMessage("You must play at least 2 cards per turn.");
      return;
    }
    if (gameOver) return;

    const drawCount = Math.min(HAND_SIZE - hand.length, deck.length);
    const newHand = [...hand, ...deck.slice(0, drawCount)];
    const remainingDeck = deck.slice(drawCount);

    setHand(newHand);
    setDeck(remainingDeck);
    setPlayedThisTurn(0);

    if (newHand.length === 0 && remainingDeck.length === 0) {
      setGameOver(true);
      setMessage("🎉 You played all cards! You win!");
      return;
    }

    if (!hasLegalMove(newHand, { ascend1, ascend2, descend1, descend2 })) {
      setGameOver(true);
      setMessage("No legal moves left. Game Over.");
    }
  };

  const getBestMove = () => {
  const remainingCards = [...hand, ...deck];
  const totalRemaining = new Set(remainingCards);

  const evaluateMove = (card, pileValue, isAsc) => {
    let lower = isAsc ? pileValue + 1 : card + 1;
    let upper = isAsc ? card - 1 : pileValue - 1;
    let available = 0;

    for (let i = lower; i <= upper; i++) {
      if (totalRemaining.has(i)) available++;
    }
    return available;
  };

  const moves = [];
  hand.forEach((card) => {
    if (canPlayOnPile(card, ascend1, true)) {
      const bridges = evaluateMove(card, ascend1, true);
      moves.push({ card, pile: "asc1", bridges });
    }
    if (canPlayOnPile(card, ascend2, true)) {
      const bridges = evaluateMove(card, ascend2, true);
      moves.push({ card, pile: "asc2", bridges });
    }
    if (canPlayOnPile(card, descend1, false)) {
      const bridges = evaluateMove(card, descend1, false);
      moves.push({ card, pile: "desc1", bridges });
    }
    if (canPlayOnPile(card, descend2, false)) {
      const bridges = evaluateMove(card, descend2, false);
      moves.push({ card, pile: "desc2", bridges });
    }
  });

  if (moves.length === 0) return { text: "No legal moves available.", pile: null };

  moves.sort((a, b) => a.bridges - b.bridges);

  return { text: `Play ${moves[0].card} on `, pile: moves[0].pile };
};

  const undo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHand(last.hand);
    setDeck(last.deck);
    setAscend1(last.ascend1);
    setAscend2(last.ascend2);
    setDescend1(last.descend1);
    setDescend2(last.descend2);
    setPlayedThisTurn(last.playedThisTurn);
    setHistory(history.slice(0, -1));
    setMessage("");
  };

  const getPileArrow = (pile) => {
    if (pile === "asc1") return <span style={{ color: "blue" }}>↑</span>;
    if (pile === "asc2") return <span style={{ color: "red" }}>↑</span>;
    if (pile === "desc1") return <span style={{ color: "blue" }}>↓</span>;
    if (pile === "desc2") return <span style={{ color: "red" }}>↓</span>;
  };

  const isJump10Card = (card) => {
    // Check if card is 10 less than ascending piles (can jump backwards on ascending)
    if (card === ascend1 - 10 || card === ascend2 - 10) return true;
    
    // Check if card is 10 more than descending piles (can jump backwards on descending)
    if (card === descend1 + 10 || card === descend2 + 10) return true;
    
    // Check if card is 10 away from any other card in hand
    const otherHandCards = hand.filter((c) => c !== card);
    return otherHandCards.some((other) => Math.abs(card - other) === 10);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#eee", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "20px" }}>
        The Game - Solo Version
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <div style={{ background: "white", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", color: "blue" }}>↑</div>
          <div style={{ fontSize: "32px" }}>{ascend1}</div>
        </div>
        <div style={{ background: "white", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", color: "red" }}>↑</div>
          <div style={{ fontSize: "32px" }}>{ascend2}</div>
        </div>
        <div style={{ background: "white", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", color: "blue" }}>↓</div>
          <div style={{ fontSize: "32px" }}>{descend1}</div>
        </div>
        <div style={{ background: "white", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", color: "red" }}>↓</div>
          <div style={{ fontSize: "32px" }}>{descend2}</div>
        </div>
      </div>

      <h2 style={{ fontWeight: "bold", marginBottom: "10px" }}>Your Hand</h2>
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[...hand].sort((a, b) => a - b).map((card) => (
          <div
            key={card}
            style={{
              background: isJump10Card(card) ? "#ffffcc" : "white",
              padding: "10px",
              borderRadius: "6px",
              boxShadow: "0 0 4px rgba(0,0,0,0.3)",
              textAlign: "center",
              width: "60px",
            }}
          >
            <div style={{ fontSize: "18px", marginBottom: "5px" }}>{card}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <button style={{ color: "blue" }} onClick={() => playCard(card, "asc1")} disabled={gameOver}>↑</button>
              <button style={{ color: "red" }} onClick={() => playCard(card, "asc2")} disabled={gameOver}>↑</button>
              <button style={{ color: "blue" }} onClick={() => playCard(card, "desc1")} disabled={gameOver}>↓</button>
              <button style={{ color: "red" }} onClick={() => playCard(card, "desc2")} disabled={gameOver}>↓</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={endTurn} disabled={playedThisTurn < 2 || gameOver} style={{ marginRight: "5px" }}>End Turn</button>
        <button onClick={startNewGame} style={{ marginRight: "5px" }}>Restart</button>
        <button onClick={undo} disabled={history.length === 0} style={{ marginRight: "5px" }}>Undo</button>
        <button onClick={() => { setShowSuggestion(!showSuggestion); setSuggestion(getBestMove()); }} style={{ marginRight: "5px" }}>
          {showSuggestion ? "Hide Best Move" : "Show Best Move"}
        </button>
        <button onClick={() => setShowDeck(!showDeck)}>
          {showDeck ? "Hide Remaining Cards" : "Show Remaining Cards"}
        </button>
      </div>

      {showSuggestion && (
  <div style={{ marginBottom: "20px", fontWeight: "bold", fontSize: "18px" }}>
    {typeof suggestion === 'string' ? suggestion : (
      <span>
        {suggestion.text}
        {suggestion.pile && getPileArrow(suggestion.pile)}
      </span>
    )}
  </div>
)}

      {showDeck && (
        <div style={{ maxWidth: "500px", background: "white", padding: "10px", borderRadius: "6px", boxShadow: "0 0 4px rgba(0,0,0,0.3)", marginBottom: "20px" }}>
  <h3>Remaining Cards ({deck.length} left)</h3>
  <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "2px" }}>
    {Array.from({ length: 98 }, (_, i) => i + 2).map((card) => {
      const inDeck = deck.includes(card);
      return (
        <div key={card} style={{
          background: inDeck ? "#eee" : "#fdd",
          padding: "2px 4px",
          borderRadius: "4px",
          fontSize: "12px",
          textAlign: "center"
        }}>
          {card}
        </div>
      );
    })}
  </div>
</div>
      )}

      {message && (
        <div style={{ color: "red", fontWeight: "bold", marginTop: "10px" }}>
          {message}
        </div>
      )}
    </div>
  );
}
