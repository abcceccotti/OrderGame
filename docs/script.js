const { useState, useEffect } = React;

function App() {
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
  const [hoveredPile, setHoveredPile] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

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
    setSelectedCard(null);
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
      setTimeout(() => setMessage(""), 3000);
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
    setSelectedCard(null);
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
      setTimeout(() => setMessage(""), 3000);
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
    if (pile === "asc1") return React.createElement("span", { style: { color: "#2D7D84" } }, "↑");
    if (pile === "asc2") return React.createElement("span", { style: { color: "#D17A6B" } }, "↑");
    if (pile === "desc1") return React.createElement("span", { style: { color: "#2D7D84" } }, "↓");
    if (pile === "desc2") return React.createElement("span", { style: { color: "#D17A6B" } }, "↓");
  };

  const isJump10Card = (card) => {
    if (card === ascend1 - 10 || card === ascend2 - 10) return true;
    if (card === descend1 + 10 || card === descend2 + 10) return true;
    const otherHandCards = hand.filter((c) => c !== card);
    return otherHandCards.some((other) => Math.abs(card - other) === 10);
  };

  const canPlayCardOnPile = (card, pile) => {
    if (pile === "asc1") return canPlayOnPile(card, ascend1, true);
    if (pile === "asc2") return canPlayOnPile(card, ascend2, true);
    if (pile === "desc1") return canPlayOnPile(card, descend1, false);
    if (pile === "desc2") return canPlayOnPile(card, descend2, false);
    return false;
  };

  const getPileStyle = (pile) => {
    const baseStyle = {
      background: "linear-gradient(135deg, #FFF8E1 0%, #F5E6D3 100%)",
      padding: "16px",
      borderRadius: "12px",
      textAlign: "center",
      boxShadow: "0 3px 8px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.1)",
      border: "2px solid transparent",
      transition: "all 0.3s ease",
      cursor: selectedCard ? "pointer" : "default",
      position: "relative",
      overflow: "hidden",
      minHeight: "80px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center"
    };

    // Only highlight if there's a selected card AND it can be played on this pile
    const canPlay = selectedCard && canPlayCardOnPile(selectedCard, pile);

    if (canPlay) {
  return {
    ...baseStyle,
    border: "2px solid #FF8F00",
    boxShadow: "0 4px 20px rgba(255, 143, 0, 0.4)",
    transform: "translateY(-2px)"
  };
}

if (hoveredPile === pile && canPlay) {
  return {
    ...baseStyle,
    border: "2px solid #F57C00",
    boxShadow: "0 6px 24px rgba(245, 124, 0, 0.5)",
    transform: "translateY(-4px)"
  };
}

    return baseStyle;
  };

  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #FF8A65 0%, #D84315 100%)",
      padding: "32px 20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      fontFamily: "'Nunito', 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
      position: "relative"
    },
    progressContainer: {
      marginBottom: "32px",
      textAlign: "center"
    },
    progressLabel: {
      color: "white",
      fontSize: "16px",
      fontWeight: "600",
      marginBottom: "12px",
      textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
      letterSpacing: "0.05em"
    },
    progressBarBg: {
      width: "300px",
      height: "20px",
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: "20px",
      overflow: "hidden",
      boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.2)",
      border: "2px solid rgba(255, 255, 255, 0.3)",
      margin: "0 auto"
    },
    progressBarFill: {
      height: "100%",
      background: "linear-gradient(90deg, #FF8F00 0%, #FFA726 50%, #FFB74D 100%)",
      borderRadius: "18px",
      transition: "width 0.5s ease",
      boxShadow: "0 0 10px rgba(255, 143, 0, 0.5)",
      position: "relative",
      overflow: "hidden"
    },
    titleWithArrows: {
  fontSize: "4rem",
fontWeight: "800",
  marginBottom: "32px",
  color: "white",
  textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
  letterSpacing: "0.2em",
  fontFamily: "'Nunito', 'Poppins', sans-serif",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px"
},
titleText: {
  display: "flex",
  margin: "0 15px"
},
titleLetter: {
  display: "inline-block",
  animation: "wiggle 1s ease-in-out infinite"
},
arrow: {
  fontSize: "3rem",
  fontWeight: "900",
  display: "inline-block",
  animation: "wiggle 1s ease-in-out infinite",
  textShadow: "0 0 2px currentColor, 0 0 4px currentColor",
  letterSpacing: "0.1em"
},
    pilesGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "6px",
      marginBottom: "48px",
      width: "100%",
      maxWidth: "280px"
    },
    pileArrow: {
  fontSize: "36px",
  marginBottom: "8px",
  fontWeight: "900",
  WebkitTextStroke: "2px currentColor",
  textShadow: "2px 0 0 currentColor, -2px 0 0 currentColor, 0 2px 0 currentColor, 0 -2px 0 currentColor"
},
    pileValue: {
  fontSize: "48px",
  fontWeight: "800",
  color: "#2E2E2E",
  letterSpacing: "0.02em"
},
    handTitle: {
      fontSize: "1.5rem",
      fontWeight: "600",
      marginBottom: "16px",
      color: "white",
      textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
      letterSpacing: "0.1em",
      display: "inline-block"
    },
    handContainer: {
      display: "flex",
      gap: "12px",
      marginBottom: "40px",
      flexWrap: "wrap",
      justifyContent: "center",
      maxWidth: "600px"
    },
    card: {
      background: "linear-gradient(135deg, #FFF8E1 0%, #F5E6D3 100%)",
      padding: "20px 16px",
      borderRadius: "16px",
      boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)",
      textAlign: "center",
      width: "80px",
      height: "80px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      transition: "all 0.3s ease",
      cursor: "pointer",
      border: "2px solid transparent",
      position: "relative",
      outline: "none"
    },
    cardHover: {
      transform: "translateY(-8px)",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)"
    },
    cardSelected: {
  background: "linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)",
  border: "2px solid #FF8F00",
  boxShadow: "0 8px 24px rgba(255, 143, 0, 0.4)",
  transform: "translateY(-4px)"
},
    cardJump10: {
      background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)"
    },
    cardNumber: {
  fontSize: "28px",
  fontWeight: "800",
  marginBottom: "8px",
  color: "#2E2E2E",
  letterSpacing: "0.02em"
},
    buttonContainer: {
      display: "flex",
      gap: "12px",
      marginBottom: "24px",
      flexWrap: "wrap",
      justifyContent: "center"
    },
    button: {
      padding: "12px 20px",
      borderRadius: "8px",
      border: "none",
      fontWeight: "600",
      fontSize: "14px",
      cursor: "pointer",
      transition: "all 0.3s ease",
      background: "linear-gradient(135deg, #EFEBE9 0%, #D7CCC8 100%)",
color: "#3E2723",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
    },
    buttonPrimary: {
  background: "linear-gradient(135deg, #D84315 0%, #BF360C 100%)",
  color: "white",
  boxShadow: "0 4px 12px rgba(216, 67, 21, 0.3)"
},
    buttonDisabled: {
      opacity: 0.5,
      cursor: "not-allowed"
    },
    suggestion: {
      marginBottom: "20px",
      fontWeight: "600",
      fontSize: "18px",
      color: "#1f2937",
      background: "linear-gradient(135deg, #FFF8E1 0%, #F5E6D3 100%)",
      padding: "12px 20px",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)"
    },
    deckContainer: {
      maxWidth: "600px",
      background: "rgba(255, 255, 255, 0.95)",
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
      marginBottom: "20px",
      backdropFilter: "blur(10px)"
    },
    deckGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(10, 1fr)",
      gap: "4px",
      marginTop: "12px"
    },
    deckCard: {
      padding: "4px 6px",
      borderRadius: "4px",
      fontSize: "12px",
      textAlign: "center",
      fontWeight: "500"
    },
    message: {
      color: "#EF4444",
      fontWeight: "600",
      marginTop: "16px",
      background: "rgba(255, 255, 255, 0.9)",
      padding: "12px 20px",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
    },
    gameInfo: {
      display: "flex",
      gap: "24px",
      marginBottom: "24px",
      color: "white",
      fontSize: "14px",
      fontWeight: "500"
    },
    infoItem: {
  background: "rgba(255, 255, 255, 0.15)",
  padding: "8px 16px",
  borderRadius: "20px",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.2)"
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.titleWithArrows}>
  <span style={styles.arrow} className="up-arrow teal">↑</span>
  <span style={styles.arrow} className="down-arrow coral">↓</span>
  <span style={styles.titleText}>
    <span style={styles.titleLetter}>O</span>
    <span style={styles.titleLetter}>r</span>
    <span style={styles.titleLetter}>d</span>
    <span style={styles.titleLetter}>e</span>
    <span style={styles.titleLetter}>r</span>
    <span style={styles.titleLetter}>!</span>
  </span>
  <span style={styles.arrow} className="up-arrow coral">↑</span>
  <span style={styles.arrow} className="down-arrow teal">↓</span>
</h1>
      
{/* Progress Bar */}
      <div style={styles.progressContainer}>
        <div style={styles.progressLabel}>
          Cards Remaining: {hand.length + deck.length}/98
        </div>
        <div style={styles.progressBarBg}>
          <div 
            style={{
              ...styles.progressBarFill,
              width: `${((98 - hand.length - deck.length) / 98) * 100}%`
            }}
          />
        </div>
      </div>

        <div style={styles.pilesGrid}>
          {[
            { pile: "asc1", value: ascend1, color: "#00695C", arrow: "↑" },
{ pile: "asc2", value: ascend2, color: "#BF360C", arrow: "↑" },
{ pile: "desc1", value: descend1, color: "#00695C", arrow: "↓" },
{ pile: "desc2", value: descend2, color: "#BF360C", arrow: "↓" }
          ].map(({ pile, value, color, arrow }) => (
            <div
              key={pile}
              style={getPileStyle(pile)}
              onClick={() => selectedCard && playCard(selectedCard, pile)}
              onMouseEnter={() => setHoveredPile(pile)}
              onMouseLeave={() => setHoveredPile(null)}
            >
              <div style={{ ...styles.pileArrow, color }}>{arrow}</div>
              <div style={styles.pileValue}>{value}</div>
            </div>
          ))}
        </div>

        <div style={styles.handContainer}>
          {[...hand].sort((a, b) => a - b).map((card) => {
            const isSelected = selectedCard === card;
            const isJump10 = isJump10Card(card);
            
            return (
              <div
                key={card}
                style={{
                  ...styles.card,
                  ...(isJump10 ? styles.cardJump10 : {}),
                  ...(isSelected ? styles.cardSelected : {})
                }}
                onClick={() => setSelectedCard(isSelected ? null : card)}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    Object.assign(e.target.style, styles.cardHover);
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = styles.card.boxShadow;
                  }
                }}
              >
                <div style={styles.cardNumber}>{card}</div>
                {isJump10 && (
                  <div style={{ fontSize: "9px", color: "#D97706", fontWeight: "600" }}>
                    JUMP 10!
                  </div>
                )}
              </div>
            );
          })}
        </div>

      <div style={styles.buttonContainer}>
        <button
          onClick={endTurn}
          disabled={playedThisTurn < 2 || gameOver}
          style={{
            ...styles.button,
            ...styles.buttonPrimary,
            ...(playedThisTurn < 2 || gameOver ? styles.buttonDisabled : {})
          }}
        >
          End Turn
        </button>
        <button onClick={startNewGame} style={styles.button}>
          New Game
        </button>
        <button
          onClick={undo}
          disabled={history.length === 0}
          style={{
            ...styles.button,
            ...(history.length === 0 ? styles.buttonDisabled : {})
          }}
        >
          Undo
        </button>
        <button
          onClick={() => {
            setShowSuggestion(!showSuggestion);
            setSuggestion(getBestMove());
          }}
          style={styles.button}
        >
          {showSuggestion ? "Hide Hint" : "Show Hint"}
        </button>
        <button onClick={() => setShowDeck(!showDeck)} style={styles.button}>
          {showDeck ? "Hide Deck" : "Show Deck"}
        </button>
      </div>

      {showSuggestion && (
        <div style={styles.suggestion}>
          {typeof suggestion === 'string' ? suggestion : (
            <span>
              {suggestion.text}
              {suggestion.pile && getPileArrow(suggestion.pile)}
            </span>
          )}
        </div>
      )}

      {showDeck && (
        <div style={styles.deckContainer}>
          <div style={styles.deckGrid}>
            {Array.from({ length: 98 }, (_, i) => i + 2).map((card) => {
              const inDeck = deck.includes(card);
              return (
                <div
                  key={card}
                  style={{
                    ...styles.deckCard,
                    background: inDeck ? "#E5E7EB" : "#FECACA",
                    color: inDeck ? "#374151" : "#991B1B"
                  }}
                >
                  {card}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {message && <div style={styles.message}>{message}</div>}
    </div>
  );
}

// Render the app
ReactDOM.render(React.createElement(App), document.getElementById('root'));

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes wiggle {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-3deg); }
    75% { transform: rotate(3deg); }
  }
  
  .up-arrow.teal { color: #2D7D84 !important; animation-delay: 0.2s; }
  .up-arrow.coral { color: #D17A6B !important; animation-delay: 0.6s; }
  .down-arrow.teal { color: #2D7D84 !important; animation-delay: 0.4s; }
  .down-arrow.coral { color: #D17A6B !important; animation-delay: 0.8s; }
  
  .titleLetter:nth-child(1) { animation-delay: 0s; }
  .titleLetter:nth-child(2) { animation-delay: 0.1s; }
  .titleLetter:nth-child(3) { animation-delay: 0.2s; }
  .titleLetter:nth-child(4) { animation-delay: 0.3s; }
  .titleLetter:nth-child(5) { animation-delay: 0.4s; }
  .titleLetter:nth-child(6) { animation-delay: 0.5s; }
`;
document.head.appendChild(style);