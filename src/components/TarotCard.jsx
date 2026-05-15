import React from "react";

export default function TarotCard({ card, position, back = false, compact = false, selected = false }) {
  const className = ["tarot-card", back ? "is-back" : "is-face", compact ? "compact" : "", selected ? "selected" : ""].filter(Boolean).join(" ");

  if (back) {
    return (
      <div className={className} aria-label="カード裏面">
        <div className="tarot-card-inner">
          <span className="card-orbit" />
          <span className="card-moon" />
          <strong>月読</strong>
          <small>tsukuyomi tarot</small>
        </div>
      </div>
    );
  }

  return (
    <div className={className} aria-label={`${card.nameJa} ${position || ""}`}>
      <div className="tarot-card-inner">
        <span className="card-number">{card.number}</span>
        <span className="card-symbol-moon" />
        <strong>{card.nameJa}</strong>
        <p>{card.symbol}</p>
        {position && <small>{position}</small>}
      </div>
    </div>
  );
}
