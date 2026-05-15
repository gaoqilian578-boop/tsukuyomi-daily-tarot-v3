import React from "react";
import TarotCard from "./TarotCard.jsx";

export default function TarotReveal({ card, position }) {
  return (
    <section className="reveal-stage">
      <p>今日のカード</p>
      <TarotCard card={card} position={position} />
      <div className="reveal-caption">
        <strong>{card.nameJa}</strong>
        <span>{position}</span>
      </div>
    </section>
  );
}
