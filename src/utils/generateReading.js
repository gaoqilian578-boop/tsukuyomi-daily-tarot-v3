export function generateReading(userProfile, todayCard, cardPosition, situationText, currentActionText) {
  const nickname = userProfile?.nickname || "あなた";
  const sign = userProfile?.zodiacSign ? `${userProfile.zodiacSign}の感受性` : "今の感受性";
  const positionText = cardPosition === "逆位置" ? todayCard.reversed : todayCard.upright;
  const situation = situationText
    ? `あなたが書いてくれた「${situationText}」には、答えを急ぎたい気持ちと、傷つきたくない気持ちの両方が見えます。`
    : "今の状況がまだ言葉になりきっていなくても、カードは感情を整理する入口になります。";
  const action = currentActionText
    ? `特に「${currentActionText}」は、今すぐ動く前に一度温度を下げたい行動です。`
    : "今すぐ何かを決めるより、今日の心の温度を見てから動く方が穏やかです。";

  return {
    flowText: `${nickname}さんの今日のカードは「${todayCard.nameJa}」${cardPosition}です。${positionText} ${todayCard.flowText} ${situation}`,
    personOrSituationText: `${todayCard.personOrSituationText} 相手の気持ちを断定するより、連絡の温度、態度の一貫性、あなた自身の不安を分けて見てください。`,
    avoidText: `${action} ${todayCard.avoidText} 医療、法律、金融などの重大判断は占いだけで決めないでください。`,
    actionText: `${todayCard.actionText} ${sign}は夜に感情を深く受け取りやすいので、一呼吸置くことが今日の次の一手になります。`,
    messageText: `${nickname}さん、${todayCard.messageText}`
  };
}
