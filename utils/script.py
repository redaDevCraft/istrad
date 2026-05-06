tsx_content = '''import { useState, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface FormState {
  hsCode: string;
  productName: string;
  incoterm: "FOB" | "CIF";
  currency: "DZD" | "USD" | "EUR";
  productValue: number;
  exchangeRate: number;
  freight: number;
  insurance: number;
  ddaRate: number;
  tvaRate: number;
  ticRate: number;
  dapsRate: number;
  portFees: number;
  clearanceFees: number;
  bankFees: number;
  transportFees: number;
  quantity: number;
  notes: string;
  isTic: boolean;
  isDaps: boolean;
  hasReducedVat: boolean;
  hasPpi: boolean;
  hasDomiciliation: boolean;
  hasConformity: boolean;
}

interface Results {
  currency: string;
  cif: number;
  dda: number;
  tic: number;
  daps: number;
  tvaBase: number;
  tva: number;
  operationalCosts: number;
  totalLandedCost: number;
  costPerUnit: number;
}

interface Alert {
  type: "error" | "warning" | "success";
  text: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 2 }).format(n);

const initialForm: FormState = {
  hsCode: "",
  productName: "",
  incoterm: "FOB",
  currency: "DZD",
  productValue: 100000,
  exchangeRate: 1,
  freight: 15000,
  insurance: 2000,
  ddaRate: 15,
  tvaRate: 19,
  ticRate: 0,
  dapsRate: 0,
  portFees: 12000,
  clearanceFees: 10000,
  bankFees: 5000,
  transportFees: 8000,
  quantity: 100,
  notes: "",
  isTic: false,
  isDaps: false,
  hasReducedVat: false,
  hasPpi: true,
  hasDomiciliation: true,
  hasConformity: true,
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function IstradCalculator() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [results, setResults] = useState<Results | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const set = (field: keyof FormState, value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const calculate = useCallback(() => {
    const {
      incoterm, productValue, freight, insurance, exchangeRate,
      ddaRate, tvaRate, ticRate, dapsRate,
      portFees, clearanceFees, bankFees, transportFees,
      quantity, currency, isTic, isDaps, hasReducedVat,
      hasPpi, hasDomiciliation, hasConformity,
    } = form;

    const base = productValue * exchangeRate;
    const frtDzd = freight * exchangeRate;
    const insDzd = insurance * exchangeRate;

    const cif = incoterm === "FOB" ? base + frtDzd + insDzd : base;
    const dda = cif * (ddaRate / 100);
    const tic = isTic ? cif * (ticRate / 100) : 0;
    const daps = isDaps ? cif * (dapsRate / 100) : 0;
    const tvaBase = cif + dda + tic + daps;
    const tva = tvaBase * (tvaRate / 100);
    const operationalCosts = portFees + clearanceFees + bankFees + transportFees;
    const totalLandedCost = cif + dda + tic + daps + tva + operationalCosts;
    const costPerUnit = totalLandedCost / Math.max(1, quantity);

    setResults({ currency, cif, dda, tic, daps, tvaBase, tva, operationalCosts, totalLandedCost, costPerUnit });

    const a: Alert[] = [];
    if (!hasPpi) a.push({ type: "error", text: "Erreur de conformité : PPI manquant." });
    if (!hasDomiciliation) a.push({ type: "error", text: "Blocage : domiciliation bancaire non effectuée." });
    if (!hasConformity) a.push({ type: "warning", text: "Avertissement : certificat de conformité manquant." });
    if (isTic && ticRate === 0) a.push({ type: "warning", text: "La TIC est cochée mais le taux est à 0%." });
    if (isDaps && dapsRate === 0) a.push({ type: "warning", text: "Le DAPS est coché mais le taux est à 0%." });
    if (hasReducedVat && tvaRate === 19) a.push({ type: "warning", text: "TVA réduite cochée, mais le taux TVA est encore à 19%." });
    if (a.length === 0) a.push({ type: "success", text: "Contrôles de base validés pour ce MVP." });
    setAlerts(a);
  }, [form]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold mb-1">Istrad — Calculateur de coût rendu</h1>
        <p className="text-gray-500 mb-6 text-sm">
          Calcul du coût total importé en Algérie · DDA, TVA, TIC, DAPS, frais annexes
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ── Left panel: Inputs ─────────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Entrées</h2>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Code HS">
                <input className={input} placeholder="Ex : 847130"
                  value={form.hsCode} onChange={(e) => set("hsCode", e.target.value)} />
              </Field>
              <Field label="Nom du produit">
                <input className={input} placeholder="Ordinateur, câble..."
                  value={form.productName} onChange={(e) => set("productName", e.target.value)} />
              </Field>

              <Field label="Incoterm">
                <select className={input} value={form.incoterm}
                  onChange={(e) => set("incoterm", e.target.value as "FOB" | "CIF")}>
                  <option>FOB</option>
                  <option>CIF</option>
                </select>
              </Field>
              <Field label="Devise">
                <select className={input} value={form.currency}
                  onChange={(e) => set("currency", e.target.value as FormState["currency"])}>
                  <option>DZD</option><option>USD</option><option>EUR</option>
                </select>
              </Field>

              <Field label="Valeur produit">
                <input className={input} type="number" value={form.productValue}
                  onChange={(e) => set("productValue", +e.target.value)} />
              </Field>
              <Field label="Taux de change → DZD">
                <input className={input} type="number" value={form.exchangeRate}
                  onChange={(e) => set("exchangeRate", +e.target.value)} />
              </Field>

              <Field label="Fret">
                <input className={input} type="number" value={form.freight}
                  onChange={(e) => set("freight", +e.target.value)} />
              </Field>
              <Field label="Assurance">
                <input className={input} type="number" value={form.insurance}
                  onChange={(e) => set("insurance", +e.target.value)} />
              </Field>

              <Field label="Taux DDA (%)">
                <select className={input} value={form.ddaRate}
                  onChange={(e) => set("ddaRate", +e.target.value)}>
                  {[0, 5, 15, 30, 60].map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Taux TVA (%)">
                <select className={input} value={form.tvaRate}
                  onChange={(e) => set("tvaRate", +e.target.value)}>
                  {[0, 9, 19].map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>

              <Field label="Taux TIC (%)">
                <input className={input} type="number" value={form.ticRate}
                  onChange={(e) => set("ticRate", +e.target.value)} />
              </Field>
              <Field label="Taux DAPS (%)">
                <input className={input} type="number" value={form.dapsRate}
                  onChange={(e) => set("dapsRate", +e.target.value)} />
              </Field>

              <Field label="Frais portuaires (DZD)">
                <input className={input} type="number" value={form.portFees}
                  onChange={(e) => set("portFees", +e.target.value)} />
              </Field>
              <Field label="Frais de dédouanement (DZD)">
                <input className={input} type="number" value={form.clearanceFees}
                  onChange={(e) => set("clearanceFees", +e.target.value)} />
              </Field>

              <Field label="Frais bancaires (DZD)">
                <input className={input} type="number" value={form.bankFees}
                  onChange={(e) => set("bankFees", +e.target.value)} />
              </Field>
              <Field label="Transport intérieur (DZD)">
                <input className={input} type="number" value={form.transportFees}
                  onChange={(e) => set("transportFees", +e.target.value)} />
              </Field>

              <Field label="Quantité">
                <input className={input} type="number" value={form.quantity}
                  onChange={(e) => set("quantity", +e.target.value)} />
              </Field>
              <Field label="Notes">
                <input className={input} placeholder="Optionnel"
                  value={form.notes} onChange={(e) => set("notes", e.target.value)} />
              </Field>

              {/* Conditions — full width */}
              <div className="col-span-2">
                <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Conditions</p>
                <div className="grid gap-2">
                  {([
                    ["isTic", "Produit soumis à la TIC"],
                    ["isDaps", "Produit soumis au DAPS"],
                    ["hasReducedVat", "TVA réduite / spéciale applicable"],
                    ["hasPpi", "PPI disponible"],
                    ["hasDomiciliation", "Domiciliation bancaire effectuée"],
                    ["hasConformity", "Certificat de conformité disponible"],
                  ] as [keyof FormState, string][]).map(([id, label]) => (
                    <label key={id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 accent-teal-700"
                        checked={form[id] as boolean}
                        onChange={(e) => set(id, e.target.checked)} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="col-span-2 mt-1">
                <button
                  onClick={calculate}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Calculer
                </button>
              </div>
            </div>
          </div>

          {/* ── Right panel: Results ───────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Résultats</h2>

            {results ? (
              <>
                <div className="grid gap-2">
                  {([
                    ["Devise d\'entrée", results.currency],
                    ["Valeur en douane / CIF", `${fmt(results.cif)} DZD`],
                    ["DDA", `${fmt(results.dda)} DZD`],
                    ["TIC", `${fmt(results.tic)} DZD`],
                    ["DAPS", `${fmt(results.daps)} DZD`],
                    ["Base TVA", `${fmt(results.tvaBase)} DZD`],
                    ["TVA", `${fmt(results.tva)} DZD`],
                    ["Coûts opérationnels", `${fmt(results.operationalCosts)} DZD`],
                    ["Coût total rendu", `${fmt(results.totalLandedCost)} DZD`],
                    ["Coût unitaire", `${fmt(results.costPerUnit)} DZD`],
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center px-3 py-2 border border-gray-100 rounded-xl bg-gray-50 text-sm">
                      <span className="text-gray-600">{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-2">
                  {alerts.map((a, i) => (
                    <div key={i} className={`px-3 py-2 rounded-xl text-sm border ${
                      a.type === "error" ? "bg-red-50 text-red-800 border-red-200" :
                      a.type === "warning" ? "bg-amber-50 text-amber-800 border-amber-200" :
                      "bg-green-50 text-green-800 border-green-200"
                    }`}>
                      {a.type === "error" ? "🔴" : a.type === "warning" ? "🟡" : "🟢"} {a.text}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-sm">Renseignez les champs et cliquez sur Calculer.</p>
            )}
          </div>
        </div>

        {/* Formulas */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mt-4">
          <h2 className="text-lg font-semibold mb-3">Formules utilisées</h2>
          <pre className="bg-[#0b1020] text-blue-100 text-xs p-4 rounded-xl overflow-auto leading-relaxed">{`CIF      = (incoterm === "FOB") ? (valeur + fret + assurance) : valeur
DDA      = CIF × taux_DDA
TIC      = (isTic) ? CIF × taux_TIC : 0
DAPS     = (isDaps) ? CIF × taux_DAPS : 0
Base TVA = CIF + DDA + TIC + DAPS
TVA      = Base_TVA × taux_TVA
Coûts op.= frais_portuaires + dédouanement + frais_bancaires + transport_intérieur
Total    = CIF + DDA + TIC + DAPS + TVA + Coûts_op.
Unitaire = Total / quantité`}</pre>
        </div>
      </div>
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────
const input = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
'''

with open("/home/user/output/IstradCalculator.tsx", "w") as f:
    f.write(tsx_content)

print("TSX file written.")