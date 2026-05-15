import React from "react";
import TarotCard from "./TarotCard.jsx";

export default function TarotChooser({ options, selectedId, disabled, isRevealing, onChoose }) {
  return (
    <section className="chooser-stage" aria-live="polite">
      <p className="chooser-title">{isRevealing ? "選んだカードを開いています…" : "気になる1枚を選んでください"}</p>
      <div className="chooser-row">
        {options.map((option, index) => {
          const selected = selectedId === option.card.id;
          return (
            <button
              className={`choice-card choice-card-${index + 1} ${selected ? "selected" : ""}`}
              key={option.card.id}
              type="button"
              disabled={disabled || Boolean(selectedId)}
              onClick={() => onChoose(option)}
              aria-label={`${index + 1}枚目のカードを選ぶ`}
            >
              <span className="flip-shell">
                <span className="flip-side flip-back"><TarotCard back compact selected={selected} /></span>
                <span className="flip-side flip-front"><TarotCard card={option.card} position={option.position} compact selected={selected} /></span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
