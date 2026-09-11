import { currentRoute, pageUrl } from "../paths";
import { useEffect, useRef, useState } from "react";
import { generateGrouped, generateRandom, generateMemorable } from "../generator";

type Mode = "grouped" | "random" | "memorable";
const modes: { id: Mode; label: string }[] = [
  { id: "grouped", label: "Safari-style" },
  { id: "random", label: "Random" },
  { id: "memorable", label: "Word-based" },
];
function generate(mode: Mode) {
  if (mode === "grouped") return generateGrouped(16);
  if (mode === "random") return generateRandom({ length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeSimilar: true });
  return generateMemorable({ words: 6, addNumber: false, addSymbol: false, separator: "-" });
}
function allValues() { return { grouped: generate("grouped"), random: generate("random"), memorable: generate("memorable") }; }
function selectedWithin(element: HTMLElement) {
  const selection = window.getSelection();
  return !!selection && !selection.isCollapsed && element.contains(selection.anchorNode) && element.contains(selection.focusNode);
}

export default function App() {
  const [initial] = useState(() => {
    try { return { values: allValues(), error: "" }; }
    catch { return { values: { grouped: "", random: "", memorable: "" }, error: "Password generation is unavailable. Try opening Keymaker in a current browser." }; }
  });
  const [values, setValues] = useState(initial.values);
  const valuesRef = useRef(values);
  const [error, setError] = useState(initial.error);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState<Mode | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [manualValue, setManualValue] = useState("");
  const help = useRef<HTMLDialogElement>(null), manual = useRef<HTMLDialogElement>(null);
  const pending = useRef<Partial<Record<Mode, ReturnType<typeof setTimeout>>>>({});
  const copying = useRef(new Set<Mode>());
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  function update(next: typeof values) {
    valuesRef.current = next; setValues(next); setCopied(null); setError("");
  }
  function refresh(mode: Mode) {
    if (pending.current[mode]) clearTimeout(pending.current[mode]);
    try {
      update({ ...valuesRef.current, [mode]: generate(mode) });
      setMessage(`New ${modes.find(item => item.id === mode)!.label.toLowerCase()} password generated.`);
    } catch { setError("Generation is unavailable. Your current values are unchanged."); }
  }
  function refreshAll() {
    Object.values(pending.current).forEach(clearTimeout);
    try { update(allValues()); setMessage("Three new passwords generated."); }
    catch { setError("Generation is unavailable. Your current values are unchanged."); }
  }
  function selectValue(element: HTMLElement) {
    const range = document.createRange(); range.selectNodeContents(element);
    const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
  }
  async function copy(mode: Mode, button: HTMLButtonElement) {
    if (pending.current[mode]) clearTimeout(pending.current[mode]);
    const value = valuesRef.current[mode];
    if (!value || copying.current.has(mode)) return;
    copying.current.add(mode);
    try {
      await navigator.clipboard.writeText(value);
      if (valuesRef.current[mode] !== value) { setCopied(null); setMessage("The previous value was copied. The displayed value is newer."); return; }
      setCopied(mode); setMessage("Copied to clipboard.");
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(null), 1600);
    } catch {
      opener.current = button; setManualValue(value);
    } finally { copying.current.delete(mode); }
  }
  useEffect(() => {
    const dialog = help.current;
    if (helpOpen && dialog && !dialog.open) dialog.showModal();
    else if (!helpOpen && dialog?.open) dialog.close();
  }, [helpOpen]);
  useEffect(() => {
    const dialog = manual.current;
    if (manualValue && dialog && !dialog.open) {
      dialog.showModal(); const field = dialog.querySelector("textarea")!; field.focus(); field.select();
    } else if (!manualValue && dialog?.open) { dialog.close(); opener.current?.focus(); }
  }, [manualValue]);
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || document.querySelector("dialog[open]") || (event.target as HTMLElement).closest("input,textarea,[contenteditable=true]")) return;
      if (event.key === "?") { event.preventDefault(); setHelpOpen(true); }
      if (event.key.toLowerCase() === "r" && (event.target as HTMLElement).closest(".phosphor-stack")) { event.preventDefault(); refreshAll(); }
    }
    document.addEventListener("keydown", keydown);
    const timers = pending.current;
    return () => { document.removeEventListener("keydown", keydown); Object.values(timers).forEach(clearTimeout); if (copyTimer.current) clearTimeout(copyTimer.current); };
  }, []);

  if (!["/phosphor", "/phosphor/"].includes(currentRoute())) return <main className="phosphor-missing"><h1>Page not found</h1><a href={pageUrl("/phosphor")}>Back to Phosphor</a></main>;
  return <div className="phosphor-shell">
    <main className="phosphor-main" aria-label="Password generator">
      <h1 className="sr-only">Keymaker Phosphor</h1>
      <p id="phosphor-usage" className="sr-only">Click or press Enter to generate. Double-click or drag to select the text. Copy copies the displayed value.</p>
      <div className="phosphor-stack">
        {modes.map(mode => <section className="phosphor-card" key={mode.id} data-kind={mode.id} aria-labelledby={`phosphor-${mode.id}`}>
          <h2 className="card-title" id={`phosphor-${mode.id}`}>{mode.label}</h2>
          <div className="well">
            <button className="value-button" type="button" aria-label={`Generate ${mode.label} password`} aria-describedby={`value-${mode.id} phosphor-usage`} title="Click to regenerate. Double-click or drag to select." disabled={!values[mode.id]}
              onPointerDown={event => { if (event.detail > 1 && pending.current[mode.id]) clearTimeout(pending.current[mode.id]); }}
              onClick={event => {
                const text = event.currentTarget.querySelector<HTMLElement>(".value-text")!;
                if (pending.current[mode.id]) clearTimeout(pending.current[mode.id]);
                if (event.detail === 0) { refresh(mode.id); return; }
                if (event.detail > 1 || selectedWithin(text)) return;
                pending.current[mode.id] = setTimeout(() => { if (!selectedWithin(text)) refresh(mode.id); }, 300);
              }}
              onDoubleClick={event => { if (pending.current[mode.id]) clearTimeout(pending.current[mode.id]); selectValue(event.currentTarget.querySelector<HTMLElement>(".value-text")!); }}>
              <span className="value-text" id={`value-${mode.id}`} data-testid={`password-${mode.id}`}>{!values[mode.id] ? "Unavailable" : mode.id === "grouped" ? <><span className="grouped-half">{values.grouped.slice(0,10)}</span><wbr/><span className="grouped-half">{values.grouped.slice(10)}</span></> : values[mode.id]}</span>
            </button>
            <button className={`copy-button ${copied === mode.id ? "is-copied" : ""}`} type="button" aria-label={`Copy ${mode.label} password`} disabled={!values[mode.id]} onClick={event => void copy(mode.id, event.currentTarget)}>{copied === mode.id ? "DONE" : "COPY"}</button>
          </div>
          <span className="edge-light" aria-hidden="true" />
        </section>)}
      </div>
      {error && <p className="phosphor-error" role="alert">{error} <button type="button" onClick={refreshAll}>Try again</button></p>}
      <p className="phosphor-hint">Click a value to regenerate</p>
      <footer className="phosphor-footer">
        <nav aria-label="Design"><a href={pageUrl("/")}>Studio</a><a href={pageUrl("/dream")}>Dream</a><a href={pageUrl("/horizon")}>Horizon</a><span aria-current="page">Phosphor</span></nav>
        <button type="button" onClick={() => setHelpOpen(true)}>Help <kbd>?</kbd></button>
      </footer>
    </main>
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{message}</div>
    <dialog ref={help} aria-labelledby="phosphor-help-title" onCancel={() => setHelpOpen(false)}>
      <h2 id="phosphor-help-title">Using Phosphor</h2>
      <p>Click a value to generate another. Double-click or drag across it to select the text. Copy copies exactly what is displayed.</p>
      <p>Use Tab to move between controls. While a generator is focused, R refreshes all three. Escape closes this panel.</p>
      <p>Values are generated in your browser and aren't saved. Word-based passwords use six independently selected words.</p>
      <button type="button" onClick={() => setHelpOpen(false)}>Close</button>
    </dialog>
    <dialog ref={manual} aria-labelledby="phosphor-manual-title" onCancel={() => setManualValue("")}>
      <h2 id="phosphor-manual-title">Copy manually</h2>
      <p>The browser blocked automatic copying. The full value is selected below. Press Command+C on Mac or Ctrl+C on Windows.</p>
      <textarea readOnly spellCheck={false} autoComplete="off" aria-label="Password to copy" value={manualValue} />
      <button type="button" onClick={() => setManualValue("")}>Close</button>
    </dialog>
  </div>;
}
