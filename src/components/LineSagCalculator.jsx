import { useEffect, useRef, useState } from "react";

export default function LineSagCalculator({ theme, onToggleTheme }) {
  const initialState = {
    orangeLine: "",
    orangeToPink: "",
    pinkLine: "",
    pinkToPurple: "",
    purpleLine: "",
  };

  const [values, setValues] = useState(initialState);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [losInput, setLosInput] = useState({ height1: "", height2: "", result: "" });

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Enter" && index < inputRefs.length - 1) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const calculateLOS = () => {
    const h1 = parseFloat(losInput.height1);
    const h2 = parseFloat(losInput.height2);
    if (!Number.isNaN(h1) && !Number.isNaN(h2)) {
      const avg = (h1 + h2) / 2;
      setLosInput((prev) => ({ ...prev, result: avg.toFixed(2) }));
      return avg;
    }
    setLosInput((prev) => ({ ...prev, result: "" }));
    return null;
  };

  const calculate = () => {
    const orange = parseFloat(values.orangeLine);
    const orangeToPink = parseFloat(values.orangeToPink);
    const pink = parseFloat(values.pinkLine);
    const pinkToPurple = parseFloat(values.pinkToPurple);
    const purple = parseFloat(values.purpleLine);

    // basic guard
    if ([orange, orangeToPink, pink, pinkToPurple, purple].some((n) => Number.isNaN(n))) {
      setResult(null);
      return;
    }

    const conductorLOS = orange - orangeToPink;
    const conductorSag = conductorLOS - pink;
    const commLOS = pink - pinkToPurple;
    const commSag = commLOS - purple;
    const commClearance = purple;

    setResult({ conductorLOS, conductorSag, commLOS, commSag, commClearance });
  };

  useEffect(() => {
    if (Object.values(values).every((v) => v !== "")) {
      calculate();
    } else {
      setResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  useEffect(() => {
    const calculatedLOS = calculateLOS();
    const orangeLine = parseFloat(values.orangeLine);

    if (!Number.isNaN(orangeLine) && calculatedLOS !== null) {
      setValues((prev) => ({
        ...prev,
        orangeToPink: (orangeLine - calculatedLOS).toFixed(2),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [losInput.height1, losInput.height2]);

  const resetForm = () => {
    setValues(initialState);
    setResult(null);
    setEditingIndex(null);
    setLosInput({ height1: "", height2: "", result: "" });
    inputRefs[0].current?.focus();
  };

  const getNextLabel = () => {
    const usedNumbers = history
      .map((h) => parseInt(String(h.label).slice(2, 4), 10))
      .filter((n) => !Number.isNaN(n));

    let n = 1;
    while (usedNumbers.includes(n)) n++;

    return `WL${String(n).padStart(2, "0")}-WL${String(n + 1).padStart(2, "0")}`;
  };

  const saveResult = () => {
    if (!result) return;

    const label = editingIndex !== null ? history[editingIndex].label : getNextLabel();
    const newEntry = { label, result: { ...result } };

    const updatedHistory =
      editingIndex !== null
        ? history.map((entry, i) => (i === editingIndex ? newEntry : entry))
        : [...history, newEntry];

    setHistory(updatedHistory);
    resetForm();
  };

  // NOTE: original code had a buggy dependency on current values.orangeLine when editing.
  // Here: we rebuild inputs from the saved result only (reversible math).
  const handleEdit = (index) => {
    const entry = history[index];
    const r = entry.result;

    // pick a reasonable orangeLine so the form is consistent:
    // orangeLine = conductorLOS + orangeToPink, but orangeToPink isn't stored.
    // We'll set orangeToPink = "" and let user fill it (or LOS calc fill it).
    setValues({
      orangeLine: "",          // user can enter, or you can set a default if you want
      orangeToPink: "",        // will be auto-filled if LOS inputs + orangeLine exist
      pinkLine: (r.conductorLOS - r.conductorSag).toFixed(2),
      pinkToPurple: (r.commLOS - r.commSag).toFixed(2),
      purpleLine: r.commClearance.toFixed(2),
    });

    setEditingIndex(index);
    inputRefs[0].current?.focus();
  };

  const deleteEntry = (index) => {
    const updated = [...history];
    updated.splice(index, 1);
    setHistory(updated);
    resetForm();
  };

  const exportToCSV = () => {
    const header = [
      "WL Label",
      "COMM LOS",
      "CONDUCTOR SAG",
      "CONDUCTOR LOS",
      "COMM SAG",
      "COMM CLEARANCE",
    ];

    const rows = history.map((entry) => [
      entry.label,
      entry.result.commLOS.toFixed(2),
      entry.result.conductorSag.toFixed(2),
      entry.result.conductorLOS.toFixed(2),
      entry.result.commSag.toFixed(2),
      entry.result.commClearance.toFixed(2),
    ]);

    const csvContent = [header, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "line_sag_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const measurementFields = [
    { name: "orangeLine", label: "Lowest Primary Cable" },
    { name: "orangeToPink", label: "Distance Secondary LOS" },
    { name: "pinkLine", label: "Lowest Secondary Cable" },
    { name: "pinkToPurple", label: "Distance to Comm LOS (From Secondary)" },
    { name: "purpleLine", label: "Comm Clearance" },
  ];

  const currentResults = result
    ? [
        { label: "COMM LOS", value: result.commLOS },
        { label: "CONDUCTOR SAG", value: result.conductorSag },
        { label: "CONDUCTOR LOS", value: result.conductorLOS },
        { label: "COMM SAG", value: result.commSag },
        { label: "COMM CLEARANCE", value: result.commClearance },
      ]
    : [];

  return (
    <div className="calc-shell">
      <header className="calc-header">
        <div className="header-top-row">
          <span className="header-chip">{editingIndex !== null ? "Editing Saved Span" : "Field Entry"}</span>
          <button
            type="button"
            onClick={onToggleTheme}
            className="theme-toggle"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
        <h1 className="calc-title">Line Sag Calculator</h1>
        <p className="calc-subtitle">
          Enter measured cable heights, review computed sag values, and keep a clean history for export.
        </p>
      </header>

      <div className="calc-grid">
        <section className="panel">
          <h2 className="section-title">Measurement Inputs</h2>
          <p className="section-copy">Use Enter to move between fields quickly.</p>

          <div className="field-grid">
            {measurementFields.map(({ name, label }, index) => (
              <label key={name} className="field-row">
                <span className="field-label">{label}</span>
                <input
                  ref={inputRefs[index]}
                  name={name}
                  type="number"
                  step="any"
                  value={values[name]}
                  onChange={handleChange}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="metric-input"
                  placeholder="0.00"
                />
              </label>
            ))}
          </div>

          <div className="btn-row">
            <button onClick={resetForm} className="btn btn-neutral">
              Reset
            </button>
            <button onClick={saveResult} disabled={!result} className="btn btn-save">
              Save
            </button>
          </div>

          {result && (
            <div className="results-block">
              <div className="results-grid">
                {currentResults.map((item) => (
                  <article key={item.label} className="result-tile">
                    <p className="result-label">{item.label}</p>
                    <p className="result-value">{item.value.toFixed(2)} m</p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="panel">
          <h2 className="section-title">LOS Helper</h2>
          <p className="section-copy">Average two attachment heights to estimate LOS quickly.</p>

          <div className="field-grid">
            <label className="field-row">
              <span className="field-label">Attachment Height 1</span>
              <input
                type="number"
                step="any"
                value={losInput.height1}
                onChange={(e) => setLosInput({ ...losInput, height1: e.target.value })}
                className="metric-input"
                placeholder="0.00"
              />
            </label>

            <label className="field-row">
              <span className="field-label">Attachment Height 2</span>
              <input
                type="number"
                step="any"
                value={losInput.height2}
                onChange={(e) => setLosInput({ ...losInput, height2: e.target.value })}
                className="metric-input"
                placeholder="0.00"
              />
            </label>
          </div>

          {losInput.result && <div className="los-preview">Calculated LOS: {losInput.result} m</div>}
        </section>
      </div>

      {history.length > 0 && (
        <section className="history-wrap">
          <div className="history-head">
            <h2 className="history-title">Saved History</h2>
            <button onClick={exportToCSV} className="btn-export">
              Export to CSV
            </button>
          </div>

          <ul className="history-list">
            {history.map((entry, i) => (
              <li key={`${entry.label}-${i}`} className="history-item">
                <p className="history-label">{entry.label}</p>
                <div className="history-metrics">
                  <span>COMM LOS: {entry.result.commLOS.toFixed(2)} m</span>
                  <span>CONDUCTOR SAG: {entry.result.conductorSag.toFixed(2)} m</span>
                  <span>CONDUCTOR LOS: {entry.result.conductorLOS.toFixed(2)} m</span>
                  <span>COMM SAG: {entry.result.commSag.toFixed(2)} m</span>
                  <span>COMM CLEARANCE: {entry.result.commClearance.toFixed(2)} m</span>
                </div>

                <div className="history-actions">
                  <button onClick={() => handleEdit(i)} className="btn-edit">
                    Edit
                  </button>
                  <button onClick={() => deleteEntry(i)} className="btn-delete">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
