import { useState } from "react";

export default function CopyButton({ text, className = "" }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button type="button" onClick={copy} className={`rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-[#07142B] ${className}`}>
      {copied ? "Copié" : "Copier"}
    </button>
  );
}
