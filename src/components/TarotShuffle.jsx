import React from "react";
import TarotCard from "./TarotCard.jsx";

export default function TarotShuffle() {
  return (
    <section className="shuffle-stage" aria-live="polite">
      <div className="shuffle-deck" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((item) => (
          <div className={`shuffle-card shuffle-card-${item}`} key={item}>
            <TarotCard back compact />
          </div>
        ))}
      </div>
      <p>月の流れを整えています…</p>
    </section>
  );
}
