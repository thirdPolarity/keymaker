import { currentRoute, pageUrl } from "./paths";
import { useState, useEffect, useRef, type CSSProperties } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  Info,
  Minus,
  Moon,
  Plus,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  X,
} from "lucide-react";
import {
  generateGrouped,
  generateRandom,
  generateMemorable,
  type RandomSettings,
  type MemorableSettings,
} from "./generator";

type Mode = "grouped" | "random" | "memorable";
const modes: { id: Mode; name: string; short: string; description: string }[] =
  [
    {
      id: "grouped",
      name: "Grouped",
      short: "Grouped",
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
  { name: "Amber terminal", color: "#ffd09a", bg: "#27251f", dot: "#d29b57" },
  { name: "Classic DMG", color: "#d5e59c", bg: "#20281e", dot: "#8b9e59" },
  { name: "Cyan matrix", color: "#9ee1ec", bg: "#1a292d", dot: "#68a6b4" },
  { name: "Purple haze", color: "#dcc9ff", bg: "#272234", dot: "#a28aba" },
  { name: "Orange sunset", color: "#ffb79d", bg: "#2f211c", dot: "#c38062" },
  { name: "SNES", color: "#e1dcff", bg: "#252435", dot: "#8287b9" },
  { name: "Red alert", color: "#ffc5ca", bg: "#302124", dot: "#b76975" },
  { name: "Blue steel", color: "#b8d7fb", bg: "#202a36", dot: "#6d90b4" },
  { name: "Monochrome", color: "#e0e5e6", bg: "#24282b", dot: "#899295" },
];
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
      grouped: generateGrouped(20),
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
function PixelKey({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? "pixel-key small" : "pixel-key"}
      viewBox="0 0 48 32"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M2 2h20v8h24v8h-6v8h-8v-8H22v8H2V2zm7 7v10h6V9H9z"
      />
    </svg>
  );
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

export default function App() {
  const [passwords, setPasswords] = useState(initialPasswords);
  const passwordsRef = useRef(passwords);
  const [groupLength, setGroupLength] = useState(20);
  const [randomSettings, setRandomSettings] = useState(randomDefaults);
  const [memorableSettings, setMemorableSettings] = useState(memorableDefaults);
  const [activeMode, setActiveMode] = useState<Mode>("random");
  const [paletteIndex, setPaletteIndex] = useState(() =>
    Math.max(
      0,
      palettes.findIndex(
        (p) => p.name === readPreference("keymaker.palette", "Amber terminal"),
      ),
    ),
  );
  const [dark, setDark] = useState(
    () =>
      currentRoute() === "/obsidian" ||
      readPreference("keymaker.finish", "titanium") === "obsidian",
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [pendingSettings, setPendingSettings] = useState<Record<Mode, boolean>>(
    { grouped: false, random: false, memorable: false },
  );
  const copiedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const infoDialog = useRef<HTMLDialogElement>(null);
  const palette = palettes[paletteIndex];
  const active = modes.find((m) => m.id === activeMode)!;
  useEffect(() => {
    document.documentElement.dataset.finish = dark ? "obsidian" : "titanium";
    try {
      localStorage.setItem("keymaker.finish", dark ? "obsidian" : "titanium");
    } catch {
      /* Preferences are optional. */
    }
  }, [dark]);
  useEffect(() => {
    try {
      localStorage.setItem("keymaker.palette", palette.name);
    } catch {
      /* Generation works without storage. */
    }
  }, [palette.name]);
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
  const routeExists = ["/", "/studio", "/obsidian", "/index.html"].includes(
    currentRoute(),
  );
  if (!routeExists)
    return (
      <main className="not-found">
        <PixelKey />
        <h1>This key doesn’t fit.</h1>
        <p>There’s no page at this address.</p>
        <a href={pageUrl("/")}>
          Back to Keymaker <ArrowUpRight size={18} />
        </a>
      </main>
    );
  return (
    <div
      className="app-shell"
      style={
        { "--phosphor": palette.color, "--screen": palette.bg } as CSSProperties
      }
    >
      <header className="site-header">
        <a href={pageUrl("/")} className="brand" aria-label="Keymaker home">
          <PixelKey small />
          <span>keymaker</span>
        </a>
        <div className="header-right">
          <button
            className="finish-button"
            type="button"
            aria-label={
              dark ? "Switch to titanium finish" : "Switch to obsidian finish"
            }
            onClick={() => setDark((v) => !v)}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
            <span>{dark ? "Obsidian" : "Titanium"}</span>
          </button>
        </div>
      </header>
      <main>
        <div className="intro">
          <h1>Passwords, made your way.</h1>
          <p className="intro-guidance">Readable groups, random characters, or a phrase of unrelated words. Choose a style, adjust it, and copy.</p>
        </div>
        <section className="instrument" aria-label="Password generator">
          <div className="instrument-top">
            <div className="device-label">
              <span className="device-dot" />
              <span>KEYMAKER</span>
            </div>
            <div className="vents" aria-hidden="true">
              {Array.from({ length: 9 }, (_, i) => (
                <i key={i} />
              ))}
            </div>
            <span className="screw" aria-hidden="true" />
          </div>
          <div className="instrument-body">
            <div className="output-bank">
              <div className="screen-bezel">
                <div className="screen">
                  <div className="screen-header">
                    <span>
                      <span className="screen-led" />
                      {passwords.random
                        ? "READY TO COPY"
                        : "GENERATOR UNAVAILABLE"}
                    </span>
                    <PixelKey small />
                  </div>
                  {modes.map((mode) => (
                    <article
                      key={mode.id}
                      className={`password-row ${activeMode === mode.id ? "is-active" : ""}`}
                      aria-labelledby={`${mode.id}-name`}
                    >
                      <div className="password-row-heading">
                        <button
                          type="button"
                          id={`${mode.id}-name`}
                          className="mode-label"
                          aria-label={`Configure ${mode.name}`}
                          aria-pressed={activeMode === mode.id}
                          onClick={() => {
                            setActiveMode(mode.id);
                            setSettingsOpen(true);
                          }}
                        >
                          <span className="mode-indicator" />
                          {mode.name}
                          <SlidersHorizontal size={12} />
                        </button>
                        <span className="password-meta">
                          {mode.id === "memorable"
                            ? "PASSPHRASE"
                            : mode.id === "grouped"
                              ? "SAFARI-STYLE"
                              : "MIXED CHARACTERS"}
                        </span>
                      </div>
                      <div className="password-value-row">
                        <div
                          key={`${mode.id}-${revision}`}
                          className={`password-value ${mode.id === "memorable" ? "words-value" : mode.id === "random" ? "random-value" : ""}`}
                          data-testid={`password-${mode.id}`}
                          role="textbox"
                          aria-readonly="true"
                          aria-multiline="true"
                          tabIndex={0}
                          onFocus={(e) => selectContents(e.currentTarget)}
                          aria-label={`${mode.name} password`}
                        >
                          <PasswordText value={passwords[mode.id] || "—"} wrapAtSeparators={mode.id !== "random"} />
                        </div>
                        <div className="row-actions">
                          <button
                            className="screen-button regenerate"
                            type="button"
                            aria-label={`Regenerate ${mode.name} password`}
                            onClick={() => generate(mode.id)}
                          >
                            <RefreshCw size={16} />
                          </button>
                          <button
                            className={`screen-button copy-button ${copied === mode.id ? "copied" : ""}`}
                            type="button"
                            disabled={!passwords[mode.id]}
                            aria-label={`Copy ${mode.name} password`}
                            onClick={() => copy(mode.id)}
                          >
                            {copied === mode.id ? (
                              <Check size={16} />
                            ) : (
                              <Copy size={16} />
                            )}
                            <span>
                              {copied === mode.id ? "Copied" : "Copy"}
                            </span>
                          </button>
                        </div>
                      </div>
                      {copyError === mode.id && (
                        <div className="copy-recovery">
                          <span>Clipboard blocked.</span>
                          <button
                            type="button"
                            onClick={() => {
                              const element =
                                document.querySelector<HTMLElement>(
                                  `[data-testid="password-${mode.id}"]`,
                                )!;
                              element.focus();
                              selectContents(element);
                              setMessage(
                                "Password selected. Use your keyboard or browser menu to copy.",
                              );
                            }}
                          >
                            Select password text
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
              <div className="transport">
                <button
                  type="button"
                  className="generate-button"
                  onClick={() => generate()}
                >
                  <RefreshCw size={19} />
                  <span>Generate all</span>
                  <span className="button-grooves" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                </button>
              </div>
            </div>
            <aside
              className={`control-bank ${settingsOpen ? "is-open" : ""}`}
              aria-label="Password settings"
            >
              <button
                type="button"
                className="mobile-settings"
                aria-expanded={settingsOpen}
                onClick={() => setSettingsOpen((v) => !v)}
              >
                <span>
                  <SlidersHorizontal size={17} />
                  Fine tune
                </span>
                <ChevronDown size={16} />
              </button>
              <div className="control-content">
                <div className="control-heading">
                  <SlidersHorizontal size={15} />
                  <h2>Fine tune</h2>
                  <span className="screw small-screw" aria-hidden="true" />
                </div>
                <div
                  className="mode-selector"
                  role="group"
                  aria-label="Choose settings to edit"
                >
                  {modes.map((mode) => (
                    <button
                      type="button"
                      key={mode.id}
                      aria-pressed={mode.id === activeMode}
                      onClick={() => setActiveMode(mode.id)}
                    >
                      {mode.short}
                    </button>
                  ))}
                </div>
                <div className="active-settings" key={activeMode}>
                  <p className="settings-description">{active.description}</p>
                  {activeMode === "grouped" && (
                    <>
                      <Quantity
                        label="Length"
                        value={groupLength}
                        min={8}
                        max={32}
                        unit="characters"
                        onChange={(n) => {
                          setGroupLength(n);
                          setPendingSettings((s) => ({ ...s, grouped: true }));
                        }}
                      />
                      <p className="setting-hint">
                        Four-character groups, without lookalike letters or
                        numbers.
                      </p>
                    </>
                  )}
                  {activeMode === "random" && (
                    <>
                      <Quantity
                        label="Length"
                        value={randomSettings.length}
                        min={8}
                        max={64}
                        unit="characters"
                        onChange={(length) => editRandom({ length })}
                      />
                      <div className="toggle-group character-toggles">
                        {(
                          [
                            "uppercase",
                            "lowercase",
                            "numbers",
                            "symbols",
                          ] as const
                        ).map((key, i) => (
                          <Toggle
                            key={key}
                            label={
                              ["Uppercase", "Lowercase", "Numbers", "Symbols"][
                                i
                              ]
                            }
                            checked={randomSettings[key]}
                            disabled={chosenGroups === 1 && randomSettings[key]}
                            onChange={(value) => editRandom({ [key]: value })}
                          />
                        ))}
                      </div>
                      <Toggle
                        label="Skip lookalikes"
                        hint="Il1 · O0o"
                        checked={randomSettings.excludeSimilar}
                        onChange={(excludeSimilar) =>
                          editRandom({ excludeSimilar })
                        }
                      />
                    </>
                  )}
                  {activeMode === "memorable" && (
                    <>
                      <Quantity
                        label="Words"
                        value={memorableSettings.words}
                        min={3}
                        max={8}
                        unit="per phrase"
                        onChange={(words) => editMemorable({ words })}
                      />
                      <div className="toggle-group">
                        <Toggle
                          label="Add a number"
                          checked={memorableSettings.addNumber}
                          onChange={(addNumber) => editMemorable({ addNumber })}
                        />
                        <Toggle
                          label="Add a symbol"
                          checked={memorableSettings.addSymbol}
                          onChange={(addSymbol) => editMemorable({ addSymbol })}
                        />
                      </div>
                      <label className="separator-label">
                        Separator
                        <select
                          aria-label="Separator"
                          value={memorableSettings.separator}
                          onChange={(e) =>
                            editMemorable({ separator: e.target.value })
                          }
                        >
                          <option value="-">Hyphen —</option>
                          <option value="_">Underscore _</option>
                          <option value=".">Period .</option>
                          <option value=" ">Space</option>
                          <option value="">None</option>
                        </select>
                      </label>
                      <p className="setting-hint">
                        Six or more words recommended.
                      </p>
                    </>
                  )}
                  <button
                    type="button"
                    className={`apply-button ${pendingSettings[activeMode] ? "pending" : ""}`}
                    onClick={() => generate(activeMode)}
                  >
                    {pendingSettings[activeMode]
                      ? "Apply & generate"
                      : `Generate ${active.short.toLowerCase()}`}
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
            </aside>
          </div>
          <div className="instrument-bottom">
            <span className="screw" aria-hidden="true" />
            <div className="palette-controls">
              <span className="palette-label">DISPLAY</span>
              <div className="swatches" role="group" aria-label="Display color">
                {palettes.map((p, i) => (
                  <button
                    type="button"
                    key={p.name}
                    aria-label={p.name}
                    aria-pressed={i === paletteIndex}
                    title={p.name}
                    onClick={() => setPaletteIndex(i)}
                    style={{ "--swatch": p.dot } as CSSProperties}
                  >
                    <span />
                  </button>
                ))}
              </div>
              <span className="palette-name">{palette.name}</span>
            </div>
            <details className="mobile-palette">
              <summary>
                <span>Display color</span>
                <span>
                  <i style={{ background: palette.dot }} />
                  {palette.name}
                  <ChevronDown size={14} />
                </span>
              </summary>
              <div
                className="palette-menu"
                role="group"
                aria-label="Display color"
              >
                {palettes.map((p, i) => (
                  <button
                    type="button"
                    key={p.name}
                    aria-label={p.name}
                    aria-pressed={i === paletteIndex}
                    onClick={(e) => {
                      setPaletteIndex(i);
                      e.currentTarget.closest("details")!.open = false;
                    }}
                  >
                    <i style={{ background: p.dot }} />
                    <span>{p.name}</span>
                    {i === paletteIndex && <Check size={12} />}
                  </button>
                ))}
              </div>
            </details>
            <span className="screw" aria-hidden="true" />
          </div>
        </section>
        {error && (
          <div className="error-message" role="alert">
            <Info size={18} />
            <span>{error}</span>
            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => setError("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="below-device">
          <a className="dream-link" href={pageUrl("/dream")}>Dream theme</a>
          <a className="dream-link" href={pageUrl("/horizon")}>Horizon theme</a>
          <a className="dream-link" href={pageUrl("/phosphor")}>Phosphor theme</a>
          <button type="button" onClick={() => setShowInfo(true)}>
            <Info size={14} />
            About Keymaker
          </button>
        </div>
      </main>

      <span className="sr-only" role="status" aria-live="polite">
        {message}
      </span>
      <dialog
        aria-labelledby="privacy-title"
        ref={infoDialog}
        className="privacy-dialog"
        onCancel={() => setShowInfo(false)}
        onClick={(e) => {
          if (e.target === infoDialog.current) setShowInfo(false);
        }}
      >
        <div className="dialog-heading">
          <ShieldCheck size={24} />
          <button
            type="button"
            aria-label="Close privacy note"
            onClick={() => setShowInfo(false)}
          >
            <X size={20} />
          </button>
        </div>
        <h2 id="privacy-title">About Keymaker</h2>
        <p>
          Your display color and finish are remembered. Passwords aren’t saved.
        </p>
        <p>Copying places a password on your system clipboard.</p>
        <div className="privacy-source">
          Randomness from Web Crypto. Passphrase words from{" "}
          <a href="https://www.eff.org/dice" target="_blank" rel="noreferrer">
            EFF’s wordlist <ArrowUpRight size={12} />
          </a>
          .
        </div>
        <button
          type="button"
          className="dialog-done"
          onClick={() => setShowInfo(false)}
        >
          Got it
        </button>
      </dialog>
    </div>
  );
}
