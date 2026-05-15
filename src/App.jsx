import React, { useEffect, useMemo, useState } from "react";
import TarotChooser from "./components/TarotChooser.jsx";
import TarotReveal from "./components/TarotReveal.jsx";
import TarotShuffle from "./components/TarotShuffle.jsx";
import { tarotCards } from "./data/tarotCards.js";
import { isSupabaseConfigured, supabase } from "./lib/supabase.js";
import { generateReading } from "./utils/generateReading.js";

const ZODIAC_SIGNS = ["牡羊座", "牡牛座", "双子座", "蟹座", "獅子座", "乙女座", "天秤座", "蠍座", "射手座", "山羊座", "水瓶座", "魚座"];
const STORAGE = { profiles: "tsukuyomi-daily-tarot-v3-profiles", currentUserId: "tsukuyomi-daily-tarot-v3-current-user", draws: "tsukuyomi-daily-tarot-v3-draws", streaks: "tsukuyomi-daily-tarot-v3-streaks" };
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const yesterdayOf = (text) => { const d = new Date(`${text}T00:00:00`); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const id = (prefix) => crypto?.randomUUID ? crypto.randomUUID() : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const cardOptions = () => [...tarotCards].sort(() => Math.random() - 0.5).slice(0, 3).map((card) => ({ card, position: Math.random() > 0.5 ? "正位置" : "逆位置" }));
const resolveCard = (draw) => tarotCards.find((card) => card.id === draw?.cardId || card.nameJa === draw?.cardName) || tarotCards[0];

async function signUp(profile, password) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signUp({ email: profile.email, password, options: { data: { nickname: profile.nickname } } });
    if (error) throw error;
    const saved = { ...profile, userId: data.user?.id, createdAt: new Date().toISOString() };
    await supabase.from("profiles").upsert(saved);
    return saved;
  }
  const profiles = read(STORAGE.profiles, []);
  if (profiles.some((item) => item.email === profile.email)) throw new Error("このメールアドレスはすでに登録されています。ログインしてください。");
  const saved = { ...profile, userId: id("user"), createdAt: new Date().toISOString() };
  write(STORAGE.profiles, [...profiles, saved]);
  write(STORAGE.currentUserId, saved.userId);
  return saved;
}
async function signIn(email, password) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: profile } = await supabase.from("profiles").select("*").eq("userId", data.user.id).single();
    return profile;
  }
  const profile = read(STORAGE.profiles, []).find((item) => item.email === email);
  if (!profile || !password) throw new Error("ログイン情報を確認してください。");
  write(STORAGE.currentUserId, profile.userId);
  return profile;
}
async function fetchDraws(userId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from("tarot_draws").select("*").eq("userId", userId).order("date", { ascending: false });
    if (error) throw error;
    return data || [];
  }
  return read(STORAGE.draws, []).filter((draw) => draw.userId === userId).sort((a, b) => b.date.localeCompare(a.date));
}
async function saveDraw(draw) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("tarot_draws").insert(draw);
    if (error) throw error;
    return;
  }
  write(STORAGE.draws, [...read(STORAGE.draws, []), draw]);
}
async function getStreak(userId) {
  const empty = { userId, currentStreak: 0, lastDrawDate: "", totalDraws: 0, threeDayOfferShown: false, offerClicked: false };
  if (isSupabaseConfigured) {
    const { data } = await supabase.from("streaks").select("*").eq("userId", userId).single();
    return data || empty;
  }
  return read(STORAGE.streaks, []).find((item) => item.userId === userId) || empty;
}
async function saveStreak(streak) {
  if (isSupabaseConfigured) { await supabase.from("streaks").upsert(streak); return; }
  write(STORAGE.streaks, [...read(STORAGE.streaks, []).filter((item) => item.userId !== streak.userId), streak]);
}
async function markOfferClicked(userId) { const streak = await getStreak(userId); await saveStreak({ ...streak, offerClicked: true }); }

export default function App() {
  const [page, setPage] = useState("lp");
  const [profile, setProfile] = useState(null);
  const [draws, setDraws] = useState([]);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function boot() {
      if (!isSupabaseConfigured) {
        const userId = read(STORAGE.currentUserId, null);
        const storedProfile = read(STORAGE.profiles, []).find((item) => item.userId === userId);
        if (storedProfile) await refresh(storedProfile);
      }
      setLoading(false);
    }
    boot();
  }, []);

  async function refresh(nextProfile = profile) {
    if (!nextProfile) return;
    setProfile(nextProfile);
    setDraws(await fetchDraws(nextProfile.userId));
    setStreak(await getStreak(nextProfile.userId));
    setPage("tarot");
  }
  function logout() { write(STORAGE.currentUserId, null); setProfile(null); setDraws([]); setStreak(null); setPage("lp"); }
  const todayDraw = useMemo(() => draws.find((draw) => draw.date === today()), [draws]);
  if (loading) return <Shell><p className="loading">月を読み込んでいます...</p></Shell>;

  return <Shell><TopNav profile={profile} page={page} setPage={setPage} logout={logout} />{!profile && page === "lp" && <Landing onRegister={() => setPage("register")} onLogin={() => setPage("login")} />}{!profile && page === "register" && <RegisterPage onSubmit={refresh} onLogin={() => setPage("login")} />}{!profile && page === "login" && <LoginPage onSubmit={refresh} onRegister={() => setPage("register")} />}{profile && page === "tarot" && <TarotPage profile={profile} todayDraw={todayDraw} streak={streak} onSaved={refresh} />}{profile && page === "history" && <HistoryPage draws={draws} />}</Shell>;
}

function Shell({ children }) { return <main className="app"><div className="moon-glow" /><div className="stars-bg" />{children}</main>; }
function TopNav({ profile, page, setPage, logout }) { return <nav className="top-nav"><button className="brand" onClick={() => setPage(profile ? "tarot" : "lp")}>月読</button><div>{profile ? <><button className={page === "tarot" ? "active" : ""} onClick={() => setPage("tarot")}>今日</button><button className={page === "history" ? "active" : ""} onClick={() => setPage("history")}>履歴</button><button onClick={logout}>ログアウト</button></> : <><button className={page === "login" ? "active" : ""} onClick={() => setPage("login")}>ログイン</button><button className={page === "register" ? "active" : ""} onClick={() => setPage("register")}>登録</button></>}</div></nav>; }
function Landing({ onRegister, onLogin }) { return <section className="hero"><p className="eyebrow">月読 ─ tsukuyomi ─</p><h1>月読｜今日のタロット</h1><p className="lead">1日1回だけ、今の状況と言葉をカードに預ける。恋愛、不安、復縁、仕事、人間関係を静かに整理する夜のタロットです。</p><div className="hero-note">自由記入の状況文、星座、今日のカードを組み合わせて、今の流れと次の一手をやさしく言語化します。</div><div className="button-row"><button className="primary-button" onClick={onRegister}>今日の月を開く</button><button className="ghost-button" onClick={onLogin}>ログイン</button></div>{!isSupabaseConfigured && <p className="dev-note">現在はSupabase未接続のため、localStorageで仮保存しています。</p>}</section>; }
function RegisterPage({ onSubmit, onLogin }) {
  const [form, setForm] = useState({ nickname: "", email: "", password: "", birthday: "", gender: "", zodiacSign: "", situationText: "", birthTime: "", partnerBirthday: "", partnerZodiacSign: "", lastContactDate: "", currentActionText: "", lineRegistered: false });
  const [error, setError] = useState("");
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  async function submit(event) { event.preventDefault(); setError(""); try { const required = ["nickname", "email", "password", "birthday", "gender", "zodiacSign", "situationText"]; if (required.some((field) => !form[field])) throw new Error("必須項目を入力してください。"); const { password, ...profileData } = form; onSubmit(await signUp(profileData, password)); } catch (err) { setError(err.message); } }
  return <section className="panel"><PageTitle title="登録" subtitle="今日のカードを、あなたの状況に合わせて読むための情報です。" /><form className="form-grid" onSubmit={submit}><TextInput label="ニックネーム" value={form.nickname} onChange={(v) => update("nickname", v)} required /><TextInput label="メールアドレス" type="email" value={form.email} onChange={(v) => update("email", v)} required /><TextInput label="パスワード" type="password" value={form.password} onChange={(v) => update("password", v)} required /><TextInput label="生年月日" type="date" value={form.birthday} onChange={(v) => update("birthday", v)} required /><SelectInput label="性別" value={form.gender} onChange={(v) => update("gender", v)} options={["女性", "男性", "その他", "回答しない"]} required /><SelectInput label="星座" value={form.zodiacSign} onChange={(v) => update("zodiacSign", v)} options={ZODIAC_SIGNS} required /><TextareaInput label="今の状況を、できるだけ具体的に書いてください。" help="恋愛、復縁、片思い、既読スルー、音信不通、仕事、人間関係、自分の気持ちなど、今いちばん占ってほしいことを書いてください。" value={form.situationText} onChange={(v) => update("situationText", v)} placeholder={"例：\n彼から3日返信がありません。\n元彼と復縁したいけど、2ヶ月連絡していません。\n曖昧な関係が半年続いていて、彼の本音が分かりません。\n仕事で今後の方向性に迷っています。\n人間関係で距離を置くべきか悩んでいます。"} required /><TextInput label="出生時間（任意）" type="time" value={form.birthTime} onChange={(v) => update("birthTime", v)} /><TextInput label="彼の生年月日（任意）" type="date" value={form.partnerBirthday} onChange={(v) => update("partnerBirthday", v)} /><SelectInput label="彼の星座（任意）" value={form.partnerZodiacSign} onChange={(v) => update("partnerZodiacSign", v)} options={ZODIAC_SIGNS} /><TextInput label="最後に連絡した日（任意）" type="date" value={form.lastContactDate} onChange={(v) => update("lastContactDate", v)} /><TextareaInput label="今、しようとしている行動があれば書いてください。" value={form.currentActionText} onChange={(v) => update("currentActionText", v)} placeholder={"例：\n追いLINEしようか迷っています。\n元彼に久しぶりに連絡しようか迷っています。\n彼のSNSを見に行きそうです。"} /><label className="checkbox-row"><input type="checkbox" checked={form.lineRegistered} onChange={(e) => update("lineRegistered", e.target.checked)} />LINE登録済み</label>{error && <p className="error">{error}</p>}<button className="primary-button" type="submit">登録してカードを引く</button></form><button className="text-button" onClick={onLogin}>登録済みの方はこちら</button></section>;
}
function LoginPage({ onSubmit, onRegister }) { const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); async function submit(event) { event.preventDefault(); setError(""); try { onSubmit(await signIn(email, password)); } catch (err) { setError(err.message); } } return <section className="panel compact"><PageTitle title="ログイン" subtitle="メールアドレスとパスワードで、今日の月を開きます。" /><form className="form-grid" onSubmit={submit}><TextInput label="メールアドレス" type="email" value={email} onChange={setEmail} required /><TextInput label="パスワード" type="password" value={password} onChange={setPassword} required />{error && <p className="error">{error}</p>}<button className="primary-button" type="submit">ログイン</button></form><button className="text-button" onClick={onRegister}>はじめての方は登録へ</button></section>; }
function TarotPage({ profile, todayDraw, streak, onSaved }) {
  const [draw, setDraw] = useState(todayDraw); const [drawState, setDrawState] = useState(todayDraw ? "revealed" : "idle"); const [options, setOptions] = useState([]); const [selected, setSelected] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { setDraw(todayDraw); setDrawState(todayDraw ? "revealed" : "idle"); }, [todayDraw]);
  function startShuffle() { if (draw || busy) return; setError(""); setSelected(null); setOptions([]); setDrawState("shuffling"); window.setTimeout(() => { setOptions(cardOptions()); setDrawState("choosing"); }, 2800); }
  async function chooseCard(option) { if (draw || busy || selected) return; setBusy(true); setSelected(option); setDrawState("revealing"); setError(""); try { const { card, position } = option; const reading = generateReading(profile, card, position, profile.situationText, profile.currentActionText); const date = today(); const savedDraw = { id: id("draw"), userId: profile.userId, date, cardId: card.id, cardName: card.nameJa, position, situationText: profile.situationText, currentActionText: profile.currentActionText, ...reading, createdAt: new Date().toISOString() }; await new Promise((resolve) => window.setTimeout(resolve, 1100)); await saveDraw(savedDraw); const current = await getStreak(profile.userId); const nextStreak = current.lastDrawDate === yesterdayOf(date) ? current.currentStreak + 1 : current.lastDrawDate === date ? current.currentStreak : 1; await saveStreak({ userId: profile.userId, currentStreak: nextStreak, lastDrawDate: date, totalDraws: current.totalDraws + 1, threeDayOfferShown: current.threeDayOfferShown || nextStreak >= 3, offerClicked: current.offerClicked || false }); setDraw(savedDraw); setDrawState("revealed"); await onSaved(profile); } catch (err) { setError(err.message); setDrawState("choosing"); setSelected(null); } finally { setBusy(false); } }
  return <section className="tarot-layout"><div className="daily-panel" data-draw-state={drawState}><PageTitle title="今日のタロット" subtitle={`${profile.nickname}さん、今日のカードは1日1回だけ引けます。`} /><div className="moon-card"><span>☾</span><p>{draw ? "今日はもうカードを引いています。\nまた明日の夜、月が変わる頃に来てください。" : "今の状況を胸に置いて、月の裏側に伏せたカードを選んでください。"}</p></div>{!draw && drawState === "idle" && <button className="primary-button" onClick={startShuffle}>今夜のカードを引く</button>}{!draw && drawState === "shuffling" && <TarotShuffle />}{!draw && (drawState === "choosing" || drawState === "revealing") && <TarotChooser options={options} selectedId={selected?.card.id} disabled={busy || drawState === "revealing"} isRevealing={drawState === "revealing"} onChoose={chooseCard} />}{error && <p className="error">{error}</p>}</div>{draw && <ResultPage draw={draw} streak={streak} userId={profile.userId} />}</section>;
}
function ResultPage({ draw, streak, userId }) { const card = resolveCard(draw); const showOffer = (streak?.currentStreak || 0) >= 3; return <article className="result-panel"><TarotReveal card={card} position={draw.position} /><ReadingBlock title="今の流れ" text={draw.flowText} /><ReadingBlock title="相手や状況の見え方" text={draw.personOrSituationText} /><ReadingBlock title="今やらない方がいいこと" text={draw.avoidText} /><ReadingBlock title="今日の次の一手" text={draw.actionText} /><ReadingBlock title="月読メッセージ" text={draw.messageText} highlight /><section className="notice"><h2>注意文</h2><p>この占いは、入力内容とカードの象徴をもとに、今の感情や状況を整理するためのものです。</p><p>未来や相手の気持ちを断定するものではありません。</p></section>{showOffer && <ThreeDayOffer userId={userId} />}</article>; }
function ThreeDayOffer({ userId }) { return <section className="offer-card"><h2>3日連続で、あなたは自分の流れを見つめに来てくれました。</h2><p>ここまで来た人は、ただカードの意味を知りたいだけではなく、本当は「今どう動けばいいか」を知りたい状態かもしれません。</p><p>カードだけでは見えない部分があります。</p><p>あなたの命式。相手との相性。今の関係の流れ。送るべき言葉。待つべき時間。</p><p>ここから先は、個別鑑定で静かに整理できます。</p><a href="https://lin.ee/tzVCsKH" target="_blank" rel="noreferrer" onClick={() => markOfferClicked(userId)}>個別鑑定で整理する</a></section>; }
function HistoryPage({ draws }) { return <section className="panel"><PageTitle title="履歴" subtitle="過去に引いたカードと、今日の次の一手を見返せます。" /><div className="history-list">{draws.length === 0 && <p className="empty">まだ履歴はありません。</p>}{draws.map((draw) => <article className="history-item" key={draw.id}><span>{draw.date}</span><strong>{draw.cardName} / {draw.position}</strong><p>{draw.actionText}</p></article>)}</div></section>; }
function PageTitle({ title, subtitle }) { return <header className="page-title"><p className="eyebrow">月読 ─ 今日のタロット ─</p><h1>{title}</h1><p>{subtitle}</p></header>; }
function ReadingBlock({ title, text, highlight = false }) { return <section className={highlight ? "reading-block highlight" : "reading-block"}><h2>{title}</h2><p>{text}</p></section>; }
function TextInput({ label, value, onChange, type = "text", required = false }) { return <label className="field"><span>{label}{required && <b>必須</b>}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} /></label>; }
function SelectInput({ label, value, onChange, options, required = false }) { return <label className="field"><span>{label}{required && <b>必須</b>}</span><select value={value} onChange={(e) => onChange(e.target.value)} required={required}><option value="">選択してください</option>{options.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>; }
function TextareaInput({ label, value, onChange, help, placeholder, required = false }) { return <label className="field full"><span>{label}{required && <b>必須</b>}</span>{help && <small>{help}</small>}<textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} /></label>; }
