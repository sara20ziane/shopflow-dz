import CopyButton from "./CopyButton.jsx";

export default function GeneratedContentCard({ title, text, children, onRegenerate, onSave, saving }) {
  const copyText = text || (Array.isArray(children) ? children.join("\n") : "");

  return (
    <article className="rounded-[1.8rem] border border-slate-100 bg-white p-4 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-black text-[#07142B]">{title}</h3>
        <CopyButton text={copyText} />
      </div>

      <div className="mt-3 whitespace-pre-line rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
        {children || text}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={onRegenerate} className="rounded-2xl bg-cyan-50 px-3 py-3 text-xs font-black text-cyan-700">
          Régénérer
        </button>
        <button type="button" onClick={onSave} disabled={saving} className="rounded-2xl bg-[#07142B] px-3 py-3 text-xs font-black text-white disabled:opacity-60">
          {saving ? "..." : "Sauvegarder"}
        </button>
      </div>
    </article>
  );
}
