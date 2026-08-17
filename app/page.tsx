"use client";

import { FormEvent, useEffect, useState } from "react";

type ItemId = "tea" | "garden" | "playlist" | "note" | "photo" | "coupon" | "joke" | "bedtime" | "sunshine" | "snack";
type CustomFields = Record<string, string>;
type PackedItem = { id: ItemId; fields: CustomFields; flowers?: string[] };
type ParcelData = { recipient: string; sender: string; message: string; items: PackedItem[] };
type Screen = "create" | "share" | "recipient";

const GOODIES: Array<{ id: ItemId; name: string; image: string; alt: string; color: string; invitation: string }> = [
  { id: "tea", name: "A cup of tea", image: "/cutouts/tea.png", alt: "A ceramic cup of tea", color: "butter", invitation: "Choose their brew" },
  { id: "garden", name: "Flower garden", image: "/cutouts/flower-rose.png", alt: "A clipped white rose", color: "leaf", invitation: "Pick every flower" },
  { id: "playlist", name: "Tiny playlist", image: "/cutouts/cassette.png", alt: "A vintage cassette tape", color: "blue", invitation: "Add a listening link" },
  { id: "note", name: "Comfort note", image: "/cutouts/typewriter.png", alt: "A vintage typewriter", color: "berry", invitation: "Write every word" },
  { id: "photo", name: "Photo memory", image: "/cutouts/camera.png", alt: "A digital camera", color: "blue", invitation: "Add an image link" },
  { id: "coupon", name: "A little coupon", image: "/cutouts/ticket.png", alt: "A vintage paper ticket", color: "berry", invitation: "Write the offer" },
  { id: "joke", name: "Your best joke", image: "/cutouts/book.png", alt: "An open vintage book", color: "leaf", invitation: "Set up the punchline" },
  { id: "bedtime", name: "Sleepy wish", image: "/cutouts/pillow.png", alt: "A soft white pillow", color: "blue", invitation: "Write a bedtime wish" },
  { id: "sunshine", name: "Pocket sunshine", image: "/cutouts/sunflower.png", alt: "A bright sunflower", color: "butter", invitation: "Add some encouragement" },
  { id: "snack", name: "Imaginary snack", image: "/cutouts/cookie.png", alt: "A chocolate chip cookie", color: "leaf", invitation: "Choose their treat" },
];

const FLOWERS = [
  { id: "rose", name: "Rose", image: "/cutouts/flower-rose.png" },
  { id: "lily", name: "Lily", image: "/cutouts/flower-lily.png" },
  { id: "daffodil", name: "Daffodil", image: "/cutouts/flower-daffodil.png" },
  { id: "tulip", name: "Tulip", image: "/cutouts/flower-tulip.png" },
  { id: "sunflower", name: "Sunflower", image: "/cutouts/flower-sunflower.png" },
  { id: "lavender", name: "Lavender", image: "/cutouts/flower-lavender.png" },
];

const DEFAULTS: Record<ItemId, Omit<PackedItem, "id">> = {
  tea: { fields: { teaType: "Chamomile", customTea: "", brewNote: "Steep slowly and take one quiet minute." } },
  garden: { fields: { gardenNote: "A tiny garden that blooms whenever you need it." }, flowers: ["rose", "lily", "daffodil"] },
  playlist: { fields: { title: "Songs for a softer day", url: "", reason: "Press play whenever you need a little company." } },
  note: { fields: { heading: "For the wobbly moments", body: "You are doing better than you think." } },
  photo: { fields: { photoUrl: "", caption: "A moment worth keeping close." } },
  coupon: { fields: { title: "One very long hug", details: "Redeem whenever required. No questions asked.", expiry: "Never expires" } },
  joke: { fields: { setup: "What did one wall say to the other wall?", punchline: "I’ll meet you at the corner." } },
  bedtime: { fields: { wish: "May your pillow be cool and tomorrow feel lighter." } },
  sunshine: { fields: { message: "Keep this little patch of brightness for later." } },
  snack: { fields: { snackName: "Chocolate-chip cookie", snackNote: "Emergency snack energy, delivered imaginatively." } },
};

const EMPTY_PARCEL: ParcelData = { recipient: "", sender: "", message: "", items: [] };

function cloneDefault(id: ItemId): PackedItem {
  const original = DEFAULTS[id];
  return { id, fields: { ...original.fields }, flowers: original.flowers ? [...original.flowers] : undefined };
}

function isItemId(value: unknown): value is ItemId {
  return typeof value === "string" && GOODIES.some((item) => item.id === value);
}

function safeUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function encodeParcel(parcel: ParcelData) {
  const bytes = new TextEncoder().encode(JSON.stringify(parcel));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeParcel(value: string): ParcelData {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Partial<ParcelData> & { items?: unknown[] };
  const items: PackedItem[] = [];
  if (Array.isArray(parsed.items)) {
    parsed.items.forEach((entry) => {
      if (typeof entry === "string" && isItemId(entry)) {
        items.push(cloneDefault(entry));
        return;
      }
      if (!entry || typeof entry !== "object") return;
      const candidate = entry as { id?: unknown; fields?: unknown; flowers?: unknown };
      if (!isItemId(candidate.id)) return;
      const fields: CustomFields = {};
      if (candidate.fields && typeof candidate.fields === "object") {
        Object.entries(candidate.fields).slice(0, 10).forEach(([key, fieldValue]) => {
          if (typeof fieldValue === "string") fields[key.slice(0, 30)] = fieldValue.slice(0, 600);
        });
      }
      const flowers = Array.isArray(candidate.flowers)
        ? candidate.flowers.filter((flower): flower is string => typeof flower === "string" && FLOWERS.some((option) => option.id === flower)).slice(0, FLOWERS.length)
        : undefined;
      items.push({ id: candidate.id, fields: { ...DEFAULTS[candidate.id].fields, ...fields }, flowers });
    });
  }
  return {
    recipient: String(parsed.recipient || "Friend").slice(0, 40),
    sender: String(parsed.sender || "Someone who cares").slice(0, 40),
    message: String(parsed.message || "").slice(0, 280),
    items: items.slice(0, GOODIES.length),
  };
}

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="Pocket Parcel home">
      <span className="brand-mark" aria-hidden="true">PP</span>
      <span>Pocket Parcel</span>
    </a>
  );
}

function ParcelFace({ recipient, sender }: { recipient: string; sender: string }) {
  return (
    <div className="parcel-preview">
      <span className="airmail-stripe" aria-hidden="true" />
      <span className="tape tape-left" aria-hidden="true" />
      <span className="tape tape-right" aria-hidden="true" />
      <div className="parcel-stamp" aria-hidden="true"><span>GOOD</span><strong>POST</strong><small>JUST BECAUSE</small></div>
      <div className="address-card" aria-label={`Parcel for ${recipient || "someone lovely"}, from ${sender || "you"}`}>
        <span className="address-label">FOR</span>
        <span className="address-value">{recipient || "someone lovely"}</span>
        <span className="address-rule" />
        <span className="address-label">FROM</span>
        <span className="address-value">{sender || "you"}</span>
      </div>
      <p className="parcel-note">Packed in the tiny-but-mighty department</p>
    </div>
  );
}

function Field({ label, value, onChange, placeholder = "", type = "text", maxLength = 400 }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; maxLength?: number }) {
  return (
    <label className="modal-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} />
    </label>
  );
}

function Area({ label, value, onChange, placeholder = "", maxLength = 600 }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; maxLength?: number }) {
  return (
    <label className="modal-field">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} rows={4} />
    </label>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("create");
  const [parcel, setParcel] = useState<ParcelData>(EMPTY_PARCEL);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [opened, setOpened] = useState(false);
  const [opening, setOpening] = useState(false);
  const [warning, setWarning] = useState("");
  const [customising, setCustomising] = useState<ItemId | null>(null);
  const [draft, setDraft] = useState<PackedItem | null>(null);
  const [modalWarning, setModalWarning] = useState("");

  useEffect(() => {
    const loadFromHash = () => {
      const prefix = "#parcel=";
      if (!window.location.hash.startsWith(prefix)) return;
      try {
        const decoded = decodeParcel(window.location.hash.slice(prefix.length));
        if (!decoded.items.length) throw new Error("Empty parcel");
        setParcel(decoded);
        setScreen("recipient");
        setOpened(false);
        setOpening(false);
      } catch {
        window.history.replaceState(null, "", window.location.pathname);
        setScreen("create");
        setWarning("That parcel link looks a little crumpled. You can make a fresh one below.");
      }
    };
    loadFromHash();
    window.addEventListener("hashchange", loadFromHash);
    return () => window.removeEventListener("hashchange", loadFromHash);
  }, []);

  useEffect(() => {
    document.body.style.overflow = customising ? "hidden" : "";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCustomising(null);
        setDraft(null);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [customising]);

  const updateField = (field: "recipient" | "sender" | "message", value: string) => {
    setParcel((current) => ({ ...current, [field]: value }));
    setWarning("");
  };

  const openCustomizer = (id: ItemId) => {
    const existing = parcel.items.find((item) => item.id === id);
    setDraft(existing ? { ...existing, fields: { ...existing.fields }, flowers: existing.flowers ? [...existing.flowers] : undefined } : cloneDefault(id));
    setCustomising(id);
    setModalWarning("");
  };

  const updateDraft = (key: string, value: string) => {
    setDraft((current) => current ? { ...current, fields: { ...current.fields, [key]: value } } : current);
    setModalWarning("");
  };

  const toggleFlower = (id: string) => {
    setDraft((current) => {
      if (!current) return current;
      const flowers = current.flowers || [];
      return { ...current, flowers: flowers.includes(id) ? flowers.filter((flower) => flower !== id) : [...flowers, id] };
    });
    setModalWarning("");
  };

  const validateDraft = (item: PackedItem) => {
    if (item.id === "garden" && !item.flowers?.length) return "Pick at least one flower for the garden.";
    if (item.id === "playlist" && !safeUrl(item.fields.url)) return "Add a complete playlist link beginning with http:// or https://.";
    if (item.id === "photo" && item.fields.photoUrl && !safeUrl(item.fields.photoUrl)) return "The photo link needs to begin with http:// or https://.";
    if (item.id === "coupon" && !item.fields.title.trim()) return "Write what the coupon is for.";
    if (item.id === "joke" && (!item.fields.setup.trim() || !item.fields.punchline.trim())) return "Your joke needs both a setup and a punchline.";
    if (item.id === "note" && !item.fields.body.trim()) return "Write a few words for the comfort note.";
    return "";
  };

  const saveDraft = () => {
    if (!draft) return;
    const issue = validateDraft(draft);
    if (issue) {
      setModalWarning(issue);
      return;
    }
    setParcel((current) => ({
      ...current,
      items: [...current.items.filter((item) => item.id !== draft.id), draft].sort((a, b) => GOODIES.findIndex((item) => item.id === a.id) - GOODIES.findIndex((item) => item.id === b.id)),
    }));
    setCustomising(null);
    setDraft(null);
    setWarning("");
  };

  const removeItem = (id: ItemId) => {
    setParcel((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) }));
  };

  const packParcel = (event: FormEvent) => {
    event.preventDefault();
    if (!parcel.recipient.trim() || !parcel.sender.trim()) {
      setWarning("Add a for and from name so your parcel knows where it’s going.");
      return;
    }
    if (!parcel.items.length) {
      setWarning("Choose and customise at least one good thing to tuck inside.");
      return;
    }
    const cleanParcel = { ...parcel, recipient: parcel.recipient.trim(), sender: parcel.sender.trim(), message: parcel.message.trim() };
    const url = `${window.location.origin}${window.location.pathname}#parcel=${encodeParcel(cleanParcel)}`;
    setParcel(cleanParcel);
    setShareUrl(url);
    setScreen("share");
    setCopied(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const field = document.getElementById("share-link") as HTMLInputElement | null;
      field?.select();
      document.execCommand("copy");
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2400);
  };

  const unwrap = () => {
    if (opening || opened) return;
    setOpening(true);
    window.setTimeout(() => {
      setOpening(false);
      setOpened(true);
    }, 920);
  };

  const makeAnother = () => {
    window.history.replaceState(null, "", window.location.pathname);
    setParcel(EMPTY_PARCEL);
    setOpened(false);
    setOpening(false);
    setScreen("create");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderCustomFields = () => {
    if (!draft) return null;
    if (draft.id === "tea") return (
      <>
        <label className="modal-field"><span>Which tea?</span>
          <select value={draft.fields.teaType} onChange={(event) => updateDraft("teaType", event.target.value)}>
            <option>Chamomile</option><option>Green tea</option><option>Peppermint</option><option>Earl Grey</option><option>English breakfast</option><option>Ginger and lemon</option><option>Something else</option>
          </select>
        </label>
        {draft.fields.teaType === "Something else" && <Field label="Name your tea" value={draft.fields.customTea} onChange={(value) => updateDraft("customTea", value)} placeholder="Rose and vanilla" />}
        <Area label="A note to serve with it" value={draft.fields.brewNote} onChange={(value) => updateDraft("brewNote", value)} />
      </>
    );
    if (draft.id === "garden") return (
      <>
        <fieldset className="flower-picker"><legend>Pick as many flowers as you like</legend>
          <div className="flower-grid">
            {FLOWERS.map((flower) => {
              const selected = draft.flowers?.includes(flower.id);
              return <button type="button" className={`flower-choice ${selected ? "selected" : ""}`} aria-pressed={selected} onClick={() => toggleFlower(flower.id)} key={flower.id}><img src={flower.image} alt="" /><span>{flower.name}</span></button>;
            })}
          </div>
        </fieldset>
        <Area label="A note for the garden" value={draft.fields.gardenNote} onChange={(value) => updateDraft("gardenNote", value)} />
      </>
    );
    if (draft.id === "playlist") return (
      <>
        <Field label="Playlist title" value={draft.fields.title} onChange={(value) => updateDraft("title", value)} />
        <Field label="Playlist link" value={draft.fields.url} onChange={(value) => updateDraft("url", value)} placeholder="https://open.spotify.com/…" type="url" />
        <Area label="Why these songs?" value={draft.fields.reason} onChange={(value) => updateDraft("reason", value)} />
      </>
    );
    if (draft.id === "note") return (
      <>
        <Field label="Note heading" value={draft.fields.heading} onChange={(value) => updateDraft("heading", value)} />
        <Area label="Write your note" value={draft.fields.body} onChange={(value) => updateDraft("body", value)} />
      </>
    );
    if (draft.id === "photo") return (
      <>
        <Field label="Public image link (optional)" value={draft.fields.photoUrl} onChange={(value) => updateDraft("photoUrl", value)} placeholder="https://example.com/our-photo.jpg" type="url" />
        <p className="field-help">Use a direct public image link so it can travel inside the parcel. No image is uploaded here.</p>
        <Area label="Photo caption" value={draft.fields.caption} onChange={(value) => updateDraft("caption", value)} />
      </>
    );
    if (draft.id === "coupon") return (
      <>
        <Field label="Coupon for…" value={draft.fields.title} onChange={(value) => updateDraft("title", value)} placeholder="One homemade dinner" />
        <Area label="The lovely fine print" value={draft.fields.details} onChange={(value) => updateDraft("details", value)} />
        <Field label="Expires" value={draft.fields.expiry} onChange={(value) => updateDraft("expiry", value)} placeholder="Never" />
      </>
    );
    if (draft.id === "joke") return (
      <>
        <Area label="The setup" value={draft.fields.setup} onChange={(value) => updateDraft("setup", value)} />
        <Area label="The punchline" value={draft.fields.punchline} onChange={(value) => updateDraft("punchline", value)} />
      </>
    );
    if (draft.id === "bedtime") return <Area label="Your sleepy wish" value={draft.fields.wish} onChange={(value) => updateDraft("wish", value)} />;
    if (draft.id === "sunshine") return <Area label="Your pocket-sized encouragement" value={draft.fields.message} onChange={(value) => updateDraft("message", value)} />;
    return (
      <>
        <Field label="What snack?" value={draft.fields.snackName} onChange={(value) => updateDraft("snackName", value)} placeholder="Cinnamon bun" />
        <Area label="Snack note" value={draft.fields.snackNote} onChange={(value) => updateDraft("snackNote", value)} />
      </>
    );
  };

  const renderPackedContent = (item: PackedItem) => {
    if (item.id === "tea") {
      const tea = item.fields.teaType === "Something else" ? item.fields.customTea : item.fields.teaType;
      return <><h2>{tea || "Special"} tea</h2><p>{item.fields.brewNote}</p></>;
    }
    if (item.id === "garden") return (
      <><h2>Your flower garden</h2><div className="recipient-garden">{(item.flowers || []).map((flowerId) => { const flower = FLOWERS.find((option) => option.id === flowerId); return flower ? <img src={flower.image} alt={flower.name} title={flower.name} key={flower.id} /> : null; })}</div><p>{item.fields.gardenNote}</p></>
    );
    if (item.id === "playlist") return <><h2>{item.fields.title}</h2><p>{item.fields.reason}</p><a className="item-link" href={safeUrl(item.fields.url)} target="_blank" rel="noreferrer">Open the playlist</a></>;
    if (item.id === "note") return <><h2>{item.fields.heading}</h2><p>{item.fields.body}</p></>;
    if (item.id === "photo") return <><h2>A photo for your pocket</h2>{safeUrl(item.fields.photoUrl) && <img className="shared-photo" src={safeUrl(item.fields.photoUrl)} alt={item.fields.caption || "A shared memory"} />}<p>{item.fields.caption}</p></>;
    if (item.id === "coupon") return <div className="coupon-content"><span className="coupon-kicker">This coupon is good for</span><h2>{item.fields.title}</h2><p>{item.fields.details}</p><small>Expires: {item.fields.expiry || "Never"}</small></div>;
    if (item.id === "joke") return <><h2>{item.fields.setup}</h2><p className="punchline">{item.fields.punchline}</p></>;
    if (item.id === "bedtime") return <><h2>A sleepy wish</h2><p>{item.fields.wish}</p></>;
    if (item.id === "sunshine") return <><h2>Pocket sunshine</h2><p>{item.fields.message}</p></>;
    return <><h2>{item.fields.snackName}</h2><p>{item.fields.snackNote}</p></>;
  };

  if (screen === "recipient") {
    return (
      <main className={`recipient-shell ${opened ? "is-open" : ""}`} id="top">
        <header className="recipient-header"><Brand /><span className="tiny-stamp">special delivery</span></header>
        {!opened ? (
          <section className="unwrap-stage" aria-labelledby="delivery-title">
            <div className="delivery-copy"><p className="eyebrow">Knock knock, tiny post</p><h1 id="delivery-title">Something found<br />its way to <em>{parcel.recipient}.</em></h1><p>A pocket parcel from {parcel.sender} is waiting for you.</p></div>
            <button className={`unwrap-button ${opening ? "opening" : ""}`} type="button" onClick={unwrap} aria-label={`Unwrap parcel from ${parcel.sender}`}>
              <span className="flap flap-top" aria-hidden="true" /><span className="flap flap-bottom" aria-hidden="true" /><ParcelFace recipient={parcel.recipient} sender={parcel.sender} /><span className="unwrap-prompt">{opening ? "opening…" : "tap to unwrap"}</span>
            </button>
          </section>
        ) : (
          <section className="reveal-stage" aria-labelledby="reveal-title">
            <p className="eyebrow">Parcel opened, good things escaped</p><h1 id="reveal-title">For you, <em>{parcel.recipient}.</em></h1>
            {parcel.message && <blockquote className="message-card"><span className="tape message-tape" aria-hidden="true" /><p>“{parcel.message}”</p><footer>From {parcel.sender}</footer></blockquote>}
            <div className="goodies-reveal" aria-label="Your parcel goodies">
              {parcel.items.map((packed, index) => {
                const goodie = GOODIES.find((item) => item.id === packed.id)!;
                return <article className={`reveal-card ${goodie.color} ${packed.id}`} key={packed.id} style={{ animationDelay: `${index * 110}ms` }}><div className="reveal-image-wrap"><img src={goodie.image} alt={goodie.alt} /></div><div className="reveal-copy">{renderPackedContent(packed)}</div></article>;
              })}
            </div>
            <button className="secondary-button make-own" type="button" onClick={makeAnother}>Make your own pocket parcel</button>
          </section>
        )}
      </main>
    );
  }

  if (screen === "share") {
    return (
      <main className="share-shell" id="top">
        <header className="brand-row"><Brand /><span className="tiny-stamp">ready to roam</span></header>
        <section className="share-layout" aria-labelledby="share-title">
          <div className="share-copy"><p className="eyebrow">Sealed with excellent intentions</p><h1 id="share-title">Your parcel is<br /><em>ready to go.</em></h1><p>Send this little link to {parcel.recipient}. Every custom detail travels inside it.</p>
            <div className="share-field-wrap"><label htmlFor="share-link">Your shareable parcel link</label><div className="share-field"><input id="share-link" readOnly value={shareUrl} onFocus={(event) => event.currentTarget.select()} /><button type="button" onClick={copyLink}>{copied ? "Copied!" : "Copy link"}</button></div><p className={`copy-status ${copied ? "show" : ""}`} aria-live="polite">Copied. Go make someone’s day.</p></div>
            <div className="share-actions"><a className="primary-button" href={shareUrl}>Preview their parcel</a><button className="text-button" type="button" onClick={() => setScreen("create")}>Edit parcel</button></div>
          </div>
          <div className="share-parcel-wrap"><div className="seal-badge" aria-hidden="true">ready!</div><ParcelFace recipient={parcel.recipient} sender={parcel.sender} /><p className="contents-line">{parcel.items.length} customised {parcel.items.length === 1 ? "goodie" : "goodies"} tucked inside</p></div>
        </section>
      </main>
    );
  }

  return (
    <main className="maker-shell" id="top">
      <header className="brand-row"><Brand /><span className="tiny-stamp">made with a little heart</span></header>
      <section className="intro"><p className="eyebrow">A small something, sent softly</p><h1>Pack a little<br /><em>brightness.</em></h1><p className="intro-copy">Choose every detail: the tea, the joke, the flowers, the playlist and more. Then send it all with one free link.</p></section>

      <form onSubmit={packParcel} noValidate>
        <section className="parcel-workbench" aria-labelledby="address-title">
          <div className="parcel-editor"><span className="airmail-stripe" aria-hidden="true" /><span className="tape tape-left" aria-hidden="true" /><span className="tape tape-right" aria-hidden="true" /><div className="parcel-stamp" aria-hidden="true"><span>GOOD</span><strong>POST</strong><small>JUST BECAUSE</small></div>
            <div className="address-card"><label htmlFor="recipient">FOR</label><input id="recipient" value={parcel.recipient} onChange={(event) => updateField("recipient", event.target.value)} placeholder="someone lovely" autoComplete="off" maxLength={40} required /><span className="address-rule" /><label htmlFor="sender">FROM</label><input id="sender" value={parcel.sender} onChange={(event) => updateField("sender", event.target.value)} placeholder="you" autoComplete="off" maxLength={40} required /></div><p className="parcel-note">Packed in the tiny-but-mighty department</p>
          </div>
          <div className="message-panel"><p className="eyebrow">Step one: address it</p><h2 id="address-title">Who’s this little parcel for?</h2><label htmlFor="message">A note to tuck under the flap <span>(optional)</span></label><textarea id="message" value={parcel.message} onChange={(event) => updateField("message", event.target.value)} placeholder="A few words from your heart…" maxLength={280} rows={5} /><div className="character-count">{parcel.message.length}/280</div></div>
        </section>

        <section className="items-section" aria-labelledby="items-title">
          <div className="items-heading"><div><p className="eyebrow">Step two: make every bit theirs</p><h2 id="items-title">Open a goodie to customise it</h2></div><p className="selected-count" aria-live="polite"><strong>{parcel.items.length}</strong> packed</p></div>
          <div className="items-grid">
            {GOODIES.map((goodie) => {
              const selected = parcel.items.some((item) => item.id === goodie.id);
              return (
                <article className={`goodie-card ${goodie.color} ${selected ? "selected" : ""}`} key={goodie.id}>
                  <button className="goodie-open" type="button" onClick={() => openCustomizer(goodie.id)} aria-label={`${selected ? "Customise" : "Add"} ${goodie.name}`}><span className="cutout-stage"><img src={goodie.image} alt={goodie.alt} /></span><span className="goodie-name">{goodie.name}</span><span className="goodie-action">{selected ? "Customised. Open again" : goodie.invitation}</span></button>
                  {selected && <button className="remove-goodie" type="button" onClick={() => removeItem(goodie.id)} aria-label={`Remove ${goodie.name}`}>remove</button>}
                </article>
              );
            })}
          </div>
        </section>

        <section className="packing-bar" aria-label="Finish your parcel"><div><p className="eyebrow">Step three: send some softness</p><h2>Happy with everything inside?</h2></div><div className="pack-actions"><p className={`form-warning ${warning ? "show" : ""}`} role="alert">{warning}</p><button className="primary-button pack-button" type="submit">Pack parcel</button></div></section>
      </form>
      <footer className="site-footer"><span>Pocket Parcel</span><span>Hand-packed on the internet</span><span>No postage. No paywall. Just care.</span></footer>

      {customising && draft && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setCustomising(null); setDraft(null); } }}>
          <section className="custom-modal" role="dialog" aria-modal="true" aria-labelledby="custom-title">
            <button className="modal-close" type="button" onClick={() => { setCustomising(null); setDraft(null); }} aria-label="Close customisation">close</button>
            <div className="modal-heading"><img src={GOODIES.find((item) => item.id === customising)!.image} alt="" /><div><p className="eyebrow">Make it personal</p><h2 id="custom-title">Customise {GOODIES.find((item) => item.id === customising)!.name.toLowerCase()}</h2></div></div>
            <div className="modal-fields">{renderCustomFields()}</div>
            <p className={`modal-warning ${modalWarning ? "show" : ""}`} role="alert">{modalWarning}</p>
            <div className="modal-actions"><button className="primary-button" type="button" onClick={saveDraft}>Tuck it inside</button><button className="text-button" type="button" onClick={() => { setCustomising(null); setDraft(null); }}>Cancel</button></div>
          </section>
        </div>
      )}
    </main>
  );
}
