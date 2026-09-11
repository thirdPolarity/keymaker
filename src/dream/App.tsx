import { currentRoute, pageUrl } from "../paths";
import { useState, useEffect, useRef, type CSSProperties } from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  Info,
  Minus,
  Moon,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Pause,
  Play,
  Sun,
  X,
} from "lucide-react";
import {
  generateGrouped,
  generateRandom,
  generateMemorable,
  type RandomSettings,
  type MemorableSettings,
} from "../generator";

import { Cube } from "./Cube";

type Mode = "grouped" | "random" | "memorable";
const modes: { id: Mode; name: string; short: string; description: string }[] =
  [
    {
      id: "grouped",
      name: "Safari-style",
      short: "Safari-style",
      description: "Safari-style groups. Easy to read and type.",
    },
    {
      id: "random",
      name: "Random",
      short: "Random",
      description: "A mix of letters, numbers & symbols.",
    },
    {
      id: "memorable",
      name: "Memorable",
      short: "Memorable",
      description: "Unrelated words. One memorable phrase.",
    },
  ];
const palettes = [
  { name: "Classic DMG", paper: "#dce8ce", ink: "#304c27", accent: "#9bb479", dark: "#1d2b20", glow: "#d7e8b9", dot: "#98b283" },
  { name: "Amber terminal", paper: "#f4e5b7", ink: "#64430d", accent: "#dfc27c", dark: "#2d2517", glow: "#f4d99c", dot: "#dcb16c" },
  { name: "Cyan matrix", paper: "#d0e8e8", ink: "#20545c", accent: "#86c8cd", dark: "#162c31", glow: "#b2e3e6", dot: "#78b9c4" },
  { name: "Purple haze", paper: "#dfd7f3", ink: "#53357d", accent: "#b49ade", dark: "#251c3b", glow: "#dfccf5", dot: "#a890cf" },
  { name: "Orange sunset", paper: "#f1ddce", ink: "#743b20", accent: "#dca484", dark: "#34231d", glow: "#f5c9a6", dot: "#d29876" },
  { name: "SNES", paper: "#e7daef", ink: "#54216c", accent: "#c4a9d5", dark: "#281b34", glow: "#e9cef5", dot: "#b99acb" },
  { name: "Red alert", paper: "#efd7d8", ink: "#752c38", accent: "#d9a0a6", dark: "#311e26", glow: "#f4c6cd", dot: "#c68892" },
  { name: "Blue steel", paper: "#d9e4f0", ink: "#2c4b75", accent: "#9cb8db", dark: "#1c293c", glow: "#c4dbf6", dot: "#86a6ce" },
  { name: "Monochrome", paper: "#e5e5e4", ink: "#3d3d47", accent: "#b6b6be", dark: "#24242c", glow: "#e2e2ea", dot: "#a1a1ac" },
];
const dreamPalettes = palettes.map(palette => ({
  ...palette,
  ...({
    "Amber terminal": { paper: "#eee3cc", ink: "#674814", accent: "#c1a269", dark: "#211c14", glow: "#e8c787", dot: "#c6a66d" },
    "Cyan matrix": { paper: "#dce8e6", ink: "#285961", accent: "#a0c4c3", dark: "#14272c", glow: "#b8dfe1", dot: "#79abb1" },
    "Blue steel": { paper: "#dfe4e9", ink: "#354e66", accent: "#a9bbc9", dot: "#849aaf" },
    "Purple haze": { dark: "#221a32", glow: "#d9c7ee" },
    "Orange sunset": { dark: "#261c19", glow: "#edbb97" },
    "Monochrome": { dark: "#1c1e21", glow: "#dcdee1" },
  } as Record<string, Partial<typeof palette>>)[palette.name],
}));
const randomDefaults: RandomSettings = {
  length: 20,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeSimilar: true,
};
const memorableDefaults: MemorableSettings = {
  words: 6,
  addNumber: false,
  addSymbol: false,
  separator: "-",
};
function initialPasswords() {
  try {
    return {
      grouped: generateGrouped(16),
      random: generateRandom(randomDefaults),
      memorable: generateMemorable(memorableDefaults),
    };
  } catch {
    return { grouped: "", random: "", memorable: "" };
  }
}
function readPreference(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}
function Toggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className={`toggle-row ${disabled ? "is-disabled" : ""}`}>
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle-track" aria-hidden="true" />
    </label>
  );
}
function Quantity({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (n: number) => void;
}) {
  return (
    <div className="quantity">
      <div className="setting-label">
        <label htmlFor="quantity">{label}</label>
        <span>{unit}</span>
      </div>
      <div className="quantity-control">
        <button
          type="button"
          className="step-button"
          aria-label={`Decrease ${label.toLowerCase()}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        >
          <Minus size={16} />
        </button>
        <output htmlFor="quantity">{String(value).padStart(2, "0")}</output>
        <button
          type="button"
          className="step-button"
          aria-label={`Increase ${label.toLowerCase()}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          <Plus size={16} />
        </button>
      </div>
      <input
        id="quantity"
        aria-label={label}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="range-labels">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
function PasswordText({ value, wrapAtSeparators }: { value: string; wrapAtSeparators: boolean }) {
  return (
    <>
      {[...value].map((char, i) => (
        <span
          key={i}
          className={
            /\d/.test(char)
              ? "digit"
              : /[^a-zA-Z0-9]/.test(char)
                ? "symbol"
                : undefined
          }
        >
          {char}
          {wrapAtSeparators && /[-_. ]/.test(char) && <wbr />}
        </span>
      ))}
    </>
  );
}
function selectContents(element: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

export default function App({ variant = "dream" }: { variant?: "dream" | "horizon" }) {
  const horizon = variant === "horizon";
  const preferencePrefix = `keymaker.${variant}`;
  const [passwords, setPasswords] = useState(initialPasswords);
  const passwordsRef = useRef(passwords);
  const [groupLength, setGroupLength] = useState(16);
  const [randomSettings, setRandomSettings] = useState(randomDefaults);
  const [memorableSettings, setMemorableSettings] = useState(memorableDefaults);
  const [activeMode, setActiveMode] = useState<Mode>("random");
  const [paletteIndex, setPaletteIndex] = useState(() =>
    Math.max(
      0,
      palettes.findIndex(
        (p) => p.name === readPreference(`${preferencePrefix}.palette`, "SNES"),
      ),
    ),
  );
  const [dark, setDark] = useState(
    () =>
      currentRoute() === "/obsidian" ||
      readPreference(`${preferencePrefix}.mode`, horizon ? "dark" : "light") === "dark",
  );
  const [copied, setCopied] = useState<Mode | null>(null);
  const [message, setMessage] = useState("");
  const [copyError, setCopyError] = useState<Mode | null>(null);
  const [error, setError] = useState(() =>
    passwords.random
      ? ""
      : "Password generation is unavailable. Open Keymaker in a current browser and try again.",
  );
  const [revision, setRevision] = useState(0);
  const [cubePaused, setCubePaused] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [pendingSettings, setPendingSettings] = useState<Record<Mode, boolean>>(
    { grouped: false, random: false, memorable: false },
  );
  const copiedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const infoDialog = useRef<HTMLDialogElement>(null);
  const settingsDialog = useRef<HTMLDialogElement>(null);
  const activePalettes = horizon ? palettes : dreamPalettes;
  const palette = activePalettes[paletteIndex];
  const active = modes.find((m) => m.id === activeMode)!;
  useEffect(() => {
    document.documentElement.dataset.mode = dark ? "dark" : "light";
    try {
      localStorage.setItem(`${preferencePrefix}.mode`, dark ? "dark" : "light");
    } catch {
      /* Preferences are optional. */
    }
  }, [dark, preferencePrefix]);
  useEffect(() => {
    try {
      localStorage.setItem(`${preferencePrefix}.palette`, palette.name);
    } catch {
      /* Generation works without storage. */
    }
  }, [palette.name, preferencePrefix]);
  useEffect(
    () => () => {
      if (copiedTimeout.current) clearTimeout(copiedTimeout.current);
    },
    [],
  );
  useEffect(() => {
    if (showInfo) infoDialog.current?.showModal();
    else infoDialog.current?.close();
  }, [showInfo]);
  useEffect(() => {
    if (settingsOpen) settingsDialog.current?.showModal();
    else settingsDialog.current?.close();
  }, [settingsOpen]);
  function generate(mode?: Mode) {
    try {
      const next = { ...passwords };
      if (!mode || mode === "grouped")
        next.grouped = generateGrouped(groupLength);
      if (!mode || mode === "random")
        next.random = generateRandom(randomSettings);
      if (!mode || mode === "memorable")
        next.memorable = generateMemorable(memorableSettings);
      passwordsRef.current = next;
      setPasswords(next);
      setCopied(null);
      setCopyError(null);
      setError("");
      setRevision((v) => v + 1);
      setPendingSettings((s) =>
        mode
          ? { ...s, [mode]: false }
          : { grouped: false, random: false, memorable: false },
      );
      setMessage(
        mode
          ? `${modes.find((m) => m.id === mode)!.name} password generated.`
          : "Three new passwords generated.",
      );
    } catch {
      setError(
        "Couldn’t generate a password. Check your settings and try again.",
      );
    }
  }
  async function copy(mode: Mode) {
    const value = passwordsRef.current[mode];
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      if (passwordsRef.current[mode] !== value) {
        setCopied(null);
        setMessage("The previous value was copied. The displayed value is newer.");
        return;
      }
      if (copiedTimeout.current) clearTimeout(copiedTimeout.current);
      setCopied(mode);
      setCopyError(null);
      setError("");
      setMessage(`${modes.find((m) => m.id === mode)!.name} password copied.`);
      copiedTimeout.current = setTimeout(() => setCopied(null), 2200);
    } catch {
      setCopyError(mode);
      setError(
        "Clipboard access is blocked. Select the password text and copy it manually.",
      );
      setCopied(null);
    }
  }
  function editRandom(next: Partial<RandomSettings>) {
    setRandomSettings((s) => ({ ...s, ...next }));
    setPendingSettings((s) => ({ ...s, random: true }));
  }
  function editMemorable(next: Partial<MemorableSettings>) {
    setMemorableSettings((s) => ({ ...s, ...next }));
    setPendingSettings((s) => ({ ...s, memorable: true }));
  }
  const chosenGroups = (
    ["uppercase", "lowercase", "numbers", "symbols"] as const
  ).filter((k) => randomSettings[k]).length;
  const routeExists = ["/", "/obsidian", "/index.html", "/dream", "/dream/", "/horizon", "/horizon/"].includes(
    currentRoute(),
  );
  if (!routeExists) return (
    <main className="not-found">
      <h1>Page not found</h1>
      <a href={pageUrl("/")}>Back to Keymaker <ArrowUpRight size={18} /></a>
    </main>
  );
  return (
    <div className={`dream-shell ${horizon ? "horizon-shell" : ""} ${dark ? "is-dark" : ""}`} style={{
      "--paper": dark ? (horizon ? "#20122f" : palette.dark) : palette.paper,
      "--ink": dark ? palette.glow : palette.ink,
      "--accent": palette.accent,
      "--solid-ink": palette.ink,
      "--solid-paper": palette.paper,
    } as CSSProperties}>
      {horizon && <nav className="horizon-navigation" aria-label="Design"><a href={pageUrl("/")}>Studio</a><a href={pageUrl("/dream")}>Dream</a><span aria-current="page">Horizon</span></nav>}
      <main className="dream-content">
        {horizon && <div className="horizon-inner-frame" aria-hidden="true"/>}
        {horizon && <div className="panel-topline" aria-hidden="true"><span>KEYMAKER</span><span className="panel-signal"><i/><i/><i/><i/></span></div>}
        <header className="dream-header">
          <div className="wordmark"><h1>Keymaker</h1></div>
          <button className="mode-button" type="button"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setDark(v => !v)}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>
        {horizon && <p className="horizon-intro">Three ways to make your next password.</p>}
        <div className="palette-bar">
          <div className="swatches" role="group" aria-label="Color theme">
            {activePalettes.map((p, i) => <button key={p.name} type="button"
              aria-label={p.name} aria-pressed={i === paletteIndex} title={p.name}
              onClick={() => setPaletteIndex(i)} style={{"--swatch":p.dot} as CSSProperties}>
              <span>{i === paletteIndex && <Check size={12} strokeWidth={3} />}</span>
            </button>)}
          </div>
          <span className="theme-name">{palette.name}</span>
        </div>
        <section className="passwords" aria-label="Password generator">
          {modes.map(mode => <article className="password-group" key={mode.id} aria-labelledby={`label-${mode.id}`}>
            <h2 id={`label-${mode.id}`}>{mode.name}</h2>
            <div className="password-frame">
              <div key={`${mode.id}-${revision}`} className={`password-value ${mode.id === "random" ? "random-value" : ""} ${passwords[mode.id].length > 40 ? "long-value" : ""}`}
                role="textbox" aria-readonly="true" aria-label={`${mode.name} password`}
                tabIndex={0} data-testid={`password-${mode.id}`}
                onFocus={e => selectContents(e.currentTarget)}>
                <PasswordText value={passwords[mode.id] || "—"} wrapAtSeparators={mode.id !== "random"} />
              </div>
            </div>
            <div className="password-actions">
              <button className="action-button generate-action" type="button" aria-label={`Generate ${mode.name} password`} onClick={() => generate(mode.id)}>
                <RefreshCw size={16} /><span>Generate</span>
              </button>
              <button className={`action-button copy-action ${copied === mode.id ? "copied" : ""}`} type="button"
                aria-label={`Copy ${mode.name} password`} disabled={!passwords[mode.id]} onClick={() => copy(mode.id)}>
                {copied === mode.id ? <Check size={17} /> : <Copy size={16} />}<span>{copied === mode.id ? "Copied" : "Copy"}</span>
              </button>
            </div>
            {copyError === mode.id && <div className="copy-recovery" role="alert">
              <span>Clipboard blocked.</span>
              <button type="button" onClick={() => {
                const el = document.querySelector<HTMLElement>(`[data-testid="password-${mode.id}"]`)!;
                el.focus(); selectContents(el);
                setMessage("Password selected. Use your keyboard or browser menu to copy.");
              }}>Select password text</button>
            </div>}
          </article>)}
        </section>
        {error && !copyError && <div className="error-message" role="alert"><Info size={18}/><span>{error}</span>
          <button type="button" aria-label="Dismiss message" onClick={() => setError("")}><X size={18}/></button>
        </div>}
        <div className="settings-launch"><button className="settings-button" type="button" onClick={() => setSettingsOpen(true)}>
          <SlidersHorizontal size={18}/><span>Settings</span>
        </button></div>
        {!horizon ? <Cube /> : <div className={`cube-scene ${cubePaused ? "is-paused" : ""}`}>
          <div className="cube-space" aria-hidden="true"><div className="cube">
            {[0,1,2,3,4,5].map(i => <div key={i} className={`cube-face face-${i}`} />)}
          </div></div>
          <button className="cube-pause" type="button" aria-label={cubePaused ? "Resume cube animation" : "Pause cube animation"}
            onClick={() => setCubePaused(v=>!v)}>{cubePaused ? <Play size={17}/> : <Pause size={17}/>}</button>
        </div>}
        <footer>{!horizon && <><a className="about-button" href={pageUrl("/")}>Studio theme</a><a className="about-button" href={pageUrl("/horizon")}>Horizon theme</a></>}<a className="about-button" href={pageUrl("/phosphor")}>Phosphor theme</a><button type="button" className="about-button" onClick={() => setShowInfo(true)}>About Keymaker</button></footer>
      </main>
      <span className="sr-only" role="status" aria-live="polite">{message}</span>
      <dialog className="settings-dialog" ref={settingsDialog} aria-labelledby="settings-title" onCancel={() => setSettingsOpen(false)}>
        <div className="dialog-heading"><h2 id="settings-title">Settings</h2><button type="button" aria-label="Close settings" onClick={() => setSettingsOpen(false)}><X size={20}/></button></div>
        <div className="mode-selector" role="group" aria-label="Choose settings to edit">
          {modes.map(mode => <button type="button" key={mode.id} aria-pressed={mode.id === activeMode} onClick={() => setActiveMode(mode.id)}>{mode.short}</button>)}
        </div>
        <div className="active-settings" key={activeMode}>
          {activeMode === "grouped" && <>
            <Quantity label="Length" value={groupLength} min={8} max={32} unit="characters" onChange={n => {setGroupLength(n);setPendingSettings(s=>({...s,grouped:true}));}}/>
            <p className="setting-hint">Four-character groups. Lookalike characters excluded.</p>
          </>}
          {activeMode === "random" && <>
            <Quantity label="Length" value={randomSettings.length} min={8} max={64} unit="characters" onChange={length=>editRandom({length})}/>
            <div className="toggle-group">{(["uppercase","lowercase","numbers","symbols"] as const).map((key,i) => <Toggle key={key}
              label={["Uppercase","Lowercase","Numbers","Symbols"][i]} checked={randomSettings[key]}
              disabled={chosenGroups === 1 && randomSettings[key]} onChange={value=>editRandom({[key]:value})}/>)}</div>
            <Toggle label="Skip lookalikes" hint="Il1 · O0o" checked={randomSettings.excludeSimilar} onChange={excludeSimilar=>editRandom({excludeSimilar})}/>
          </>}
          {activeMode === "memorable" && <>
            <Quantity label="Words" value={memorableSettings.words} min={3} max={8} unit="per phrase" onChange={words=>editMemorable({words})}/>
            <div className="toggle-group">
              <Toggle label="Add a number" checked={memorableSettings.addNumber} onChange={addNumber=>editMemorable({addNumber})}/>
              <Toggle label="Add a symbol" checked={memorableSettings.addSymbol} onChange={addSymbol=>editMemorable({addSymbol})}/>
            </div>
            <label className="separator-label">Separator<select aria-label="Separator" value={memorableSettings.separator} onChange={e=>editMemorable({separator:e.target.value})}>
              <option value="-">Hyphen —</option><option value="_">Underscore _</option><option value=".">Period .</option><option value=" ">Space</option><option value="">None</option>
            </select></label>
            <p className="setting-hint">Six or more words recommended.</p>
          </>}
          <button type="button" className={`apply-button ${pendingSettings[activeMode] ? "pending" : ""}`} onClick={()=>generate(activeMode)}>
            {pendingSettings[activeMode] ? "Apply & generate" : `Generate ${active.short.toLowerCase()}`}<RefreshCw size={16}/>
          </button>
          <span className="sr-only" role="status" aria-live="polite">{settingsOpen ? message : ""}</span>
        </div>
      </dialog>
      <dialog className="info-dialog" ref={infoDialog} aria-labelledby="info-title" onCancel={() => setShowInfo(false)}>
        <div className="dialog-heading"><h2 id="info-title">About Keymaker</h2><button type="button" aria-label="Close About Keymaker" onClick={()=>setShowInfo(false)}><X size={20}/></button></div>
        <p>Your color theme is remembered. Passwords aren’t saved.</p>
        <p>Copying places a password on your system clipboard.</p>
        <p>Passphrase words from <a href="https://www.eff.org/dice" target="_blank" rel="noreferrer">EFF’s wordlist <ArrowUpRight size={12}/></a>.</p>
      </dialog>
    </div>
  );
}
