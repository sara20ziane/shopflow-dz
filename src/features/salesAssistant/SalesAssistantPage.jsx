import { useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import SalesAssistantForm, { EMPTY_SALES_FORM } from "./SalesAssistantForm.jsx";
import GeneratedContentCard from "./GeneratedContentCard.jsx";
import CopyButton from "./CopyButton.jsx";
import { generateSalesContent } from "./salesContentGenerator.js";

export default function SalesAssistantPage({ user, onClose }) {
  const [form, setForm] = useState(EMPTY_SALES_FORM);
  const [outputs, setOutputs] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const objectionsText = useMemo(() => {
    if (!outputs?.objections) return "";
    return outputs.objections.map((item) => `${item.question}\n${item.answer}`).join("\n\n");
  }, [outputs]);

  const allText = useMemo(() => {
    if (!outputs) return "";
    return [outputs.description, outputs.whatsapp, outputs.socialPost, objectionsText].join("\n\n");
  }, [outputs, objectionsText]);

  function validate() {
    if (!form.productName.trim()) return "Ajoute le nom du produit ou service.";
    if (!form.category.trim()) return "Choisis la catégorie du commerce.";
    return "";
  }

  function generate(e) {
    e?.preventDefault?.();
    setMessage("");
    const error = validate();
    if (error) return setMessage(error);
    setLoading(true);
    setTimeout(() => {
      setOutputs(generateSalesContent(form));
      setMessage("Contenu généré. Tu peux copier, régénérer ou sauvegarder.");
      setLoading(false);
    }, 250);
  }

  async function saveGeneration() {
    if (!outputs) return setMessage("Génère d'abord un contenu.");
    try {
      setSaving(true);
      await addDoc(collection(db, "orders"), {
        recordType: "salesAssistantGeneration",
        userId: user.uid,
        productName: form.productName.trim(),
        category: form.category.trim(),
        formData: form,
        generatedOutputs: outputs,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setMessage("Génération sauvegardée.");
    } catch {
      setMessage("Impossible de sauvegarder pour le moment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="min-h-screen bg-[#F5F8FC] px-4 py-5 text-[#07142B]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600">Assistant IA</p>
            <h1 className="text-2xl font-black">Assistant de vente IA</h1>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-[#07142B] shadow-sm">
            Fermer
          </button>
        </div>

        {message && <div className="mb-4 rounded-2xl bg-cyan-50 p-3 text-sm font-bold text-[#07142B]">{message}</div>}

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <SalesAssistantForm form={form} setForm={setForm} onSubmit={generate} loading={loading} />

          <div className="space-y-4">
            {!outputs ? (
              <article className="rounded-[2rem] border border-dashed border-cyan-200 bg-white p-5 text-center shadow-xl">
                <h2 className="text-xl font-black">Résultats générés</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Les cartes apparaîtront ici : description produit, WhatsApp, post réseaux sociaux et objections clients.
                </p>
              </article>
            ) : (
              <>
                <GeneratedContentCard title="Description produit" text={outputs.description} onRegenerate={generate} onSave={saveGeneration} saving={saving} />
                <GeneratedContentCard title="Message WhatsApp" text={outputs.whatsapp} onRegenerate={generate} onSave={saveGeneration} saving={saving} />
                <GeneratedContentCard title="Post Instagram / Facebook" text={outputs.socialPost} onRegenerate={generate} onSave={saveGeneration} saving={saving} />
                <GeneratedContentCard title="Objections clients" text={objectionsText} onRegenerate={generate} onSave={saveGeneration} saving={saving}>
                  {outputs.objections.map((item) => (
                    <div key={item.question} className="mb-4 last:mb-0">
                      <p className="font-black text-[#07142B]">{item.question}</p>
                      <p className="mt-1 text-slate-700">{item.answer}</p>
                    </div>
                  ))}
                </GeneratedContentCard>

                <CopyButton text={allText} className="w-full border-none bg-gradient-to-r from-[#00E5FF] to-[#00C4B4] py-4 shadow-lg" />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
