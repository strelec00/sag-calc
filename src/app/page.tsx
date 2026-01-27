
'use client';
import { useEffect, useRef, useState } from 'react';
export default function LineSagCalculator() {
  const initialState = {
    orangeLine: '',
    orangeToPink: '',
    pinkLine: '',
    pinkToPurple: '',
    purpleLine: '',
  };
  const [values, setValues] = useState(initialState);
  const [result, setResult] = useState<null | {
    conductorLOS: number;
    conductorSag: number;
    commLOS: number;
    commSag: number;
    commClearance: number;
  }>(null);
  const [history, setHistory] = useState<{ label: string; result: any }[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [losInput, setLosInput] = useState({ height1: '', height2: '', result: '' });
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' && index < inputRefs.length - 1) {
      inputRefs[index + 1].current?.focus();
    }
  };
  const calculateLOS = () => {
    const h1 = parseFloat(losInput.height1);
    const h2 = parseFloat(losInput.height2);
    if (!isNaN(h1) && !isNaN(h2)) {
      const avg = (h1 + h2) / 2;
      setLosInput((prev) => ({ ...prev, result: avg.toFixed(2) }));
      return avg;
    }
    return null;
  };
  const calculate = () => {
    const orange = parseFloat(values.orangeLine);
    const orangeToPink = parseFloat(values.orangeToPink);
    const pink = parseFloat(values.pinkLine);
    const pinkToPurple = parseFloat(values.pinkToPurple);
    const purple = parseFloat(values.purpleLine);
    const conductorLOS = orange - orangeToPink;
    const conductorSag = conductorLOS - pink;
    const commLOS = pink - pinkToPurple;
    const commSag = commLOS - purple;
    const commClearance = purple;
    setResult({
      conductorLOS,
      conductorSag,
      commLOS,
      commSag,
      commClearance,
    });
  };
  useEffect(() => {
    if (Object.values(values).every((v) => v !== '')) {
      calculate();
    }
  }, [values]);
  useEffect(() => {
    const calculatedLOS = calculateLOS();
    const orangeLine = parseFloat(values.orangeLine);
    if (!isNaN(orangeLine) && calculatedLOS !== null) {
      setValues((prev) => ({
        ...prev,
        orangeToPink: (orangeLine - calculatedLOS).toFixed(2),
      }));
    }
  }, [losInput.height1, losInput.height2]);
  const resetForm = () => {
    setValues(initialState);
    setResult(null);
    setEditingIndex(null);
    inputRefs[0].current?.focus();
    setLosInput({ height1: '', height2: '', result: '' });
  };
  const getNextLabel = () => {
    const usedNumbers = history.map((h) => parseInt(h.label.slice(2, 4)));
    let n = 1;
    while (usedNumbers.includes(n)) n++;
    return `WL${String(n).padStart(2, '0')}-WL${String(n + 1).padStart(2, '0')}`;
  };
  const saveResult = () => {
    if (!result) return;
    const label = editingIndex !== null ? history[editingIndex].label : getNextLabel();
    const newEntry = {
      label,
      result: { ...result },
    };
    const updatedHistory = editingIndex !== null
      ? history.map((entry, i) => (i === editingIndex ? newEntry : entry))
      : [...history, newEntry];
    setHistory(updatedHistory);
    resetForm();
  };
  const handleEdit = (index: number) => {
    const entry = history[index];
    const orangeToPink = (
      parseFloat(values.orangeLine) -
      entry.result.conductorLOS
    ).toFixed(2);
    setValues({
      orangeLine: (entry.result.conductorLOS + entry.result.conductorSag + entry.result.commLOS + entry.result.commSag + entry.result.commClearance).toFixed(2), // estimated approximation for reuse
      orangeToPink: orangeToPink,
      pinkLine: (entry.result.conductorLOS - entry.result.conductorSag).toFixed(2),
      pinkToPurple: (entry.result.commLOS - entry.result.commSag).toFixed(2),
      purpleLine: entry.result.commClearance.toFixed(2),
    });
    setEditingIndex(index);
  };
  const deleteEntry = (index: number) => {
    const updated = [...history];
    updated.splice(index, 1);
    setHistory(updated);
    resetForm();
  };
  const exportToCSV = () => {
    const header = [
      'WL Label',
      'COMM LOS',
      'CONDUCTOR SAG',
      'CONDUCTOR LOS',
      'COMM SAG',
      'COMM CLEARANCE',
    ];
    const rows = history.map((entry) => [
      entry.label,
      entry.result.commLOS.toFixed(2),
      entry.result.conductorSag.toFixed(2),
      entry.result.conductorLOS.toFixed(2),
      entry.result.commSag.toFixed(2),
      entry.result.commClearance.toFixed(2),
    ]);
    const csvContent =
      [header, ...rows].map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'line_sag_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-xl">
      <h1 className="text-2xl font-bold text-center text-blue-700 dark:text-blue-300">
        Line Sag Calculator
      </h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          {[
            { name: 'orangeLine', label: 'Lowest Primary Cable' },
            { name: 'orangeToPink', label: 'Distance Secondary LOS' },
            { name: 'pinkLine', label: 'Lowest Secondary Cable' },
            { name: 'pinkToPurple', label: 'Distance to Comm LOS (From Secondary)' },
            { name: 'purpleLine', label: 'Comm Clearance' },
          ].map(({ name, label }, index) => (
            <input
              key={name}
              ref={inputRefs[index]}
              name={name}
              type="number"
              step="any"
              placeholder={label}
              value={values[name as keyof typeof values]}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg focus:ring focus:ring-blue-300 appearance-none"
            />
          ))}
          <div className="flex gap-2">
            <button
              onClick={resetForm}
              className="flex-1 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition"
            >
              Reset
            </button>
            <button
              onClick={saveResult}
              disabled={!result}
              className={`flex-1 py-2 rounded-lg transition ${
                result
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              Save
            </button>
          </div>
          {result && (
            <div className="mt-4 space-y-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm text-black dark:text-white">
              <div><strong>COMM LOS:</strong> {result.commLOS.toFixed(2)} m</div>
              <div><strong>CONDUCTOR SAG:</strong> {result.conductorSag.toFixed(2)} m</div>
              <div><strong>CONDUCTOR LOS:</strong> {result.conductorLOS.toFixed(2)} m</div>
              <div><strong>COMM SAG:</strong> {result.commSag.toFixed(2)} m</div>
              <div><strong>COMM CLEARANCE:</strong> {result.commClearance.toFixed(2)} m</div>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center text-purple-700 dark:text-purple-300">LOS Calculator</h2>
          <input
            type="number"
            step="any"
            placeholder="Attachment Height 1"
            value={losInput.height1}
            onChange={(e) => setLosInput({ ...losInput, height1: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg appearance-none"
          />
          <input
            type="number"
            step="any"
            placeholder="Attachment Height 2"
            value={losInput.height2}
            onChange={(e) => setLosInput({ ...losInput, height2: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg appearance-none"
          />
          {losInput.result && (
            <div className="text-sm text-black dark:text-white">
              <strong>CALCULATED LOS:</strong> {losInput.result} m
            </div>
          )}
        </div>
      </div>
      {history.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Saved History
            </h2>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              Export to CSV
            </button>
          </div>
          <ul className="space-y-3">
            {history.map((entry, i) => (
              <li
                key={i}
                className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-sm text-black dark:text-white"
              >
                <div className="font-bold mb-1">{entry.label}</div>
                <div>COMM LOS: {entry.result.commLOS.toFixed(2)} m</div>
                <div>CONDUCTOR SAG: {entry.result.conductorSag.toFixed(2)} m</div>
                <div>CONDUCTOR LOS: {entry.result.conductorLOS.toFixed(2)} m</div>
                <div>COMM SAG: {entry.result.commSag.toFixed(2)} m</div>
                <div>COMM CLEARANCE: {entry.result.commClearance.toFixed(2)} m</div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleEdit(i)}
                    className="text-xs px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteEntry(i)}
                    className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}