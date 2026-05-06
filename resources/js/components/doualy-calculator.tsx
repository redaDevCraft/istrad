import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type Incoterm    = "FOB" | "CIF" | "EXW" | "DAP";
type Currency    = "DZD" | "USD" | "EUR" | "CNY" | "GBP" | "AED";
type ImporterType = "revendeur" | "fabricant" | "micro";

interface FormState {
  hsCode: string; productName: string; importerType: ImporterType;
  incoterm: Incoterm; currency: Currency; productValue: number;
  exchangeRate: number; freight: number; insurance: number;
  ddaRate: number; tvaRate: number; ticRate: number; dapsRate: number;
  hasSolidarity: boolean; hasTee: boolean; teRate: number;
  hasPrecompte: boolean; portFees: number; clearanceFees: number;
  bankFees: number; transportFees: number; storageFees: number;
  domiciliationFee: number; quantity: number; notes: string;
  isTic: boolean; isDaps: boolean; hasPpi: boolean; hasDomiciliation: boolean;
  hasConformity: boolean; hasReducedVat: boolean; isMicroImport: boolean;
}

interface Results {
  currency: string; cif: number; dda: number; tic: number; daps: number;
  solidarity: number; tee: number; precompte: number; tvaBase: number;
  tva: number; totalTaxes: number; operationalCosts: number;
  totalLandedCost: number; costPerUnit: number; effectiveTaxRate: number;
}

interface AlertItem { type: "error" | "warning" | "success"; text: string; }

// ─────────────────────────────────────────────────────────────────────────────
// FX RATES
// ─────────────────────────────────────────────────────────────────────────────
const FX_RATES: Record<Currency, number> = {
  DZD: 1, USD: 135.5, EUR: 147.2, CNY: 18.7, GBP: 171.3, AED: 36.9,
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPUTATION
// ─────────────────────────────────────────────────────────────────────────────
function computeResults(f: FormState): { results: Results; alerts: AlertItem[] } {
  const rate   = f.currency === "DZD" ? 1 : f.exchangeRate || FX_RATES[f.currency];
  const base   = f.productValue * rate;
  const frtDzd = f.freight   * (f.currency === "DZD" ? 1 : rate);
  const insDzd = f.insurance * (f.currency === "DZD" ? 1 : rate);

  let cif = base;
  if (f.incoterm === "FOB" || f.incoterm === "EXW") cif = base + frtDzd + insDzd;

  const dda        = cif * (f.ddaRate / 100);
  const tic        = f.isTic  ? cif * (f.ticRate  / 100) : 0;
  const daps       = f.isDaps ? cif * (f.dapsRate / 100) : 0;
  const solidarity = f.hasSolidarity ? cif * 0.03 : 0;
  const tee        = f.hasTee ? cif * (f.teRate / 100) : 0;
  const tvaBase    = cif + dda + tic + daps + solidarity + tee;
  const tva        = tvaBase * (f.tvaRate / 100);

  let precompte = 0;
  if (f.isMicroImport)                                       precompte = (cif + dda) * 1.30 * 0.005;
  else if (f.hasPrecompte && f.importerType === "revendeur") precompte = tvaBase * 0.005;

  const totalTaxes       = dda + tic + daps + solidarity + tee + tva + precompte;
  const operationalCosts = f.portFees + f.clearanceFees + f.bankFees +
                           f.transportFees + f.storageFees + f.domiciliationFee;
  const totalLandedCost  = cif + totalTaxes + operationalCosts;
  const costPerUnit      = totalLandedCost / Math.max(1, f.quantity);
  const effectiveTaxRate = cif > 0 ? (totalTaxes / cif) * 100 : 0;

  const results: Results = {
    currency: f.currency, cif, dda, tic, daps, solidarity, tee,
    precompte, tvaBase, tva, totalTaxes, operationalCosts,
    totalLandedCost, costPerUnit, effectiveTaxRate,
  };

  const alerts: AlertItem[] = [];
  if (!f.hasPpi)           alerts.push({ type: "error",   text: "PPI manquant — blocage possible au dédouanement." });
  if (!f.hasDomiciliation) alerts.push({ type: "error",   text: "Domiciliation bancaire manquante — importation bloquée." });
  if (!f.hasConformity)    alerts.push({ type: "warning", text: "Certificat de conformité absent — inspection renforcée." });
  if (f.isTic  && f.ticRate  === 0) alerts.push({ type: "warning", text: "TIC activée mais taux à 0%." });
  if (f.isDaps && f.dapsRate === 0) alerts.push({ type: "warning", text: "DAPS activé mais taux à 0%." });
  if (f.hasReducedVat && f.tvaRate === 19) alerts.push({ type: "warning", text: "TVA réduite cochée mais taux à 19%." });
  if (f.hasSolidarity && f.importerType === "micro") alerts.push({ type: "warning", text: "CS exonérée (micro-import, LF 2026 Art. 143)." });
  if (f.isMicroImport && f.ddaRate !== 5) alerts.push({ type: "warning", text: "Micro-import : DDA réduit à 5% (LF 2026 Art. 143)." });
  if (alerts.length === 0) alerts.push({ type: "success", text: "Tous les contrôles validés — importation conforme." });

  return { results, alerts };
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────────────────────────────────────
const INIT: FormState = {
  hsCode: "", productName: "", importerType: "revendeur",
  incoterm: "FOB", currency: "USD", productValue: 10000,
  exchangeRate: FX_RATES["USD"], freight: 1200, insurance: 200,
  ddaRate: 15, tvaRate: 19, ticRate: 0, dapsRate: 0,
  hasSolidarity: true, hasTee: false, teRate: 0, hasPrecompte: false,
  portFees: 12000, clearanceFees: 10000, bankFees: 5000,
  transportFees: 8000, storageFees: 0, domiciliationFee: 3000,
  quantity: 100, notes: "",
  isTic: false, isDaps: false,
  hasPpi: true, hasDomiciliation: true, hasConformity: true,
  hasReducedVat: false, isMicroImport: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS / SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const fmt  = (n: number) => new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(n);
const fmtD = (n: number) => new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 2 }).format(n);

const inputCls =
  "w-full px-2.5 py-2 text-[13px] bg-[#f7f6f2] border border-[rgba(14,17,23,0.1)] rounded-[6px] " +
  "text-[#0e1117] outline-none transition-all focus:border-[#0d6e56] focus:bg-white placeholder:text-[#bbb]";

function Field({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#9b9fa8] mb-1">
        {label}{sub && <span className="normal-case tracking-normal font-normal text-[#ccc]"> · {sub}</span>}
      </label>
      {children}
    </div>
  );
}

function PillGroup<T extends string | number>({
  options, value, onChange,
}: { options: { v: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map(({ v, label }) => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
          className={`py-1.5 px-2.5 text-[11px] font-semibold rounded-[5px] border transition-all ${
            value === v
              ? "bg-[#0e1117] text-white border-[#0e1117]"
              : "bg-[#f0f0ed] text-[#6b7080] border-[rgba(14,17,23,0.1)] hover:border-[#0d6e56] hover:text-[#0d6e56]"
          }`}>
          {label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <label className={`flex items-center gap-1.5 text-[11px] cursor-pointer px-2.5 py-2 rounded-[6px] border transition-all select-none ${
      checked
        ? "border-[#0d6e56] bg-[#e0f4ed] text-[#0d6e56] font-semibold"
        : "border-[rgba(14,17,23,0.1)] bg-[#f7f6f2] text-[#6b7080] hover:border-[#0d6e56]"
    }`}>
      <input type="checkbox" className="w-3 h-3 accent-[#0d6e56]"
        checked={checked} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function AnimatedValue({ value, bold, large }: { value: string; bold?: boolean; large?: boolean }) {
  const [display, setDisplay] = useState(value);
  const [flash, setFlash]     = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setFlash(true), 0);
    const t2 = setTimeout(() => { setDisplay(value); setFlash(false); }, 80);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [value]);
  return (
    <span className={`font-['DM_Mono',monospace] transition-opacity duration-100 tabular-nums ${
      flash ? "opacity-30" : "opacity-100"
    } ${large ? "text-[20px] sm:text-[22px] font-bold tracking-tight" : bold ? "text-[13px] font-bold" : "text-[12px]"}`}>
      {display}
    </span>
  );
}

function SectionLabel({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 col-span-2 pt-3">
      <span className="text-[9px] font-bold uppercase tracking-[.14em] text-[#0d6e56] whitespace-nowrap">{title}</span>
      <div className="flex-1 h-px bg-[#e8e6e0]" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function DoualyCalculator() {
  const [form, setForm]   = useState<FormState>(INIT);
  const [tab, setTab]     = useState<"inputs" | "results">("inputs");

  const set = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(prev => ({ ...prev, [k]: v })), []);

  useEffect(() => {
    if (form.currency !== "DZD")
      setForm(prev => ({ ...prev, exchangeRate: FX_RATES[form.currency] }));
  }, [form.currency]);

  const { results, alerts } = computeResults(form);

  const taxRows: { label: string; value: string; highlight?: boolean }[] = [
    { label: "Valeur CIF",          value: `${fmt(results.cif)} DZD` },
    { label: `DDA ${form.ddaRate}%`, value: `${fmt(results.dda)} DZD` },
    ...(results.tic        > 0 ? [{ label: `TIC ${form.ticRate}%`,    value: `${fmt(results.tic)} DZD` }]        : []),
    ...(results.daps       > 0 ? [{ label: `DAPS ${form.dapsRate}%`,  value: `${fmt(results.daps)} DZD` }]       : []),
    ...(results.solidarity > 0 ? [{ label: "C.Sol. 3%",               value: `${fmt(results.solidarity)} DZD` }] : []),
    ...(results.tee        > 0 ? [{ label: `TEE ${form.teRate}%`,     value: `${fmt(results.tee)} DZD` }]        : []),
    { label: `TVA ${form.tvaRate}%`, value: `${fmt(results.tva)} DZD` },
    ...(results.precompte  > 0 ? [{ label: "Précompte",               value: `${fmt(results.precompte)} DZD` }]  : []),
    { label: "Frais op.",            value: `${fmt(results.operationalCosts)} DZD` },
    { label: "Sous-total taxes",     value: `${fmt(results.totalTaxes)} DZD`, highlight: true },
  ];

  // ── KPI strip (always visible) ────────────────────────────────────────────
  const KpiStrip = () => (
    <div className="grid grid-cols-2 border-b border-[#eeece8]">
      <div className="p-3 sm:p-4 border-r border-[#eeece8] bg-[#6b7280]">
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/70 mb-1">Coût total rendu</p>
        <div className="flex items-baseline gap-1">
          <AnimatedValue value={fmt(results.totalLandedCost)} large />
          <span className="text-[10px] text-white/60">DZD</span>
        </div>
      </div>
      <div className="p-3 sm:p-4 bg-[#0d6e56]">
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/70 mb-1">Coût / unité</p>
        <div className="flex items-baseline gap-1">
          <AnimatedValue value={fmt(results.costPerUnit)} large />
          <span className="text-[10px] text-white/60">DZD</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full font-['Sora',sans-serif]">

      {/* ── Mobile tab switcher ─────────────────────────────────────────── */}
      <div className="flex lg:hidden border border-[rgba(14,17,23,0.09)] rounded-[10px] overflow-hidden mb-3">
        {(["inputs", "results"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-[12px] font-semibold transition-all ${
              tab === t
                ? "bg-[#0e1117] text-white"
                : "bg-[#f7f6f2] text-[#6b7080] hover:bg-[#eeecea]"
            }`}>
            {t === "inputs" ? "⚙ Paramètres" : "📊 Résultats"}
          </button>
        ))}
      </div>

      {/* ── Desktop: side-by-side · Mobile: tabs ───────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-3 lg:gap-0 lg:border lg:border-[rgba(14,17,23,0.09)] lg:rounded-[16px] lg:overflow-hidden lg:shadow-sm">

        {/* ── INPUTS ─────────────────────────────────────────────────────── */}
        <div className={`
          w-full lg:w-[55%] bg-white
          border border-[rgba(14,17,23,0.09)] rounded-[12px] lg:rounded-none lg:border-0 lg:border-r lg:border-[#eeece8]
          ${tab === "results" ? "hidden lg:block" : "block"}
        `}>
          {/* Panel header */}
          <div className="px-4 py-3 border-b border-[#eeece8]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9b9fa8] flex items-center gap-2">
              <span className="text-[#0d6e56]">⚙</span> Paramètres d'importation
            </p>
          </div>

          <div className="px-4 py-3 overflow-y-auto max-h-[70vh] lg:max-h-none custom-scroll">
            {/* Importer type */}
            <div className="mb-3">
              <PillGroup<ImporterType>
                value={form.importerType}
                onChange={v => set("importerType", v)}
                options={[
                  { v: "revendeur", label: "Revendeur"    },
                  { v: "fabricant", label: "Fabricant"    },
                  { v: "micro",     label: "Micro-import" },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">

              {/* Identification */}
              <SectionLabel title="Identification" />
              <Field label="Code HS">
                <input className={inputCls} placeholder="8415.10.91.10"
                  value={form.hsCode} onChange={e => set("hsCode", e.target.value)} />
              </Field>
              <Field label="Désignation">
                <input className={inputCls} placeholder="Climatiseur, téléphone…"
                  value={form.productName} onChange={e => set("productName", e.target.value)} />
              </Field>

              {/* Valorisation */}
              <SectionLabel title="Valorisation" />
              <div className="col-span-2">
                <Field label="Incoterm">
                  <PillGroup<Incoterm>
                    value={form.incoterm} onChange={v => set("incoterm", v)}
                    options={[
                      { v: "FOB", label: "FOB" }, { v: "CIF", label: "CIF" },
                      { v: "EXW", label: "EXW" }, { v: "DAP", label: "DAP" },
                    ]}
                  />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="Devise">
                  <PillGroup<Currency>
                    value={form.currency} onChange={v => set("currency", v)}
                    options={[
                      { v: "USD", label: "USD" }, { v: "EUR", label: "EUR" },
                      { v: "DZD", label: "DZD" }, { v: "CNY", label: "CNY" },
                      { v: "GBP", label: "GBP" }, { v: "AED", label: "AED" },
                    ]}
                  />
                </Field>
              </div>
              <Field label="Valeur produit" sub={form.currency}>
                <input className={inputCls} type="number" value={form.productValue}
                  onChange={e => set("productValue", +e.target.value)} />
              </Field>
              <Field label="Taux → DZD" sub={form.currency !== "DZD" ? `réf. ${FX_RATES[form.currency]}` : "—"}>
                <input className={inputCls} type="number" step="0.01"
                  value={form.currency === "DZD" ? 1 : form.exchangeRate}
                  disabled={form.currency === "DZD"}
                  onChange={e => set("exchangeRate", +e.target.value)} />
              </Field>
              {(form.incoterm === "FOB" || form.incoterm === "EXW") && (
                <>
                  <Field label="Fret" sub={form.currency}>
                    <input className={inputCls} type="number" value={form.freight}
                      onChange={e => set("freight", +e.target.value)} />
                  </Field>
                  <Field label="Assurance" sub={form.currency}>
                    <input className={inputCls} type="number" value={form.insurance}
                      onChange={e => set("insurance", +e.target.value)} />
                  </Field>
                </>
              )}

              {/* Taxes douanières */}
              <SectionLabel title="Taxes douanières" />
              <div className="col-span-2">
                <Field label="DDA">
                  <PillGroup<number>
                    value={form.ddaRate} onChange={v => set("ddaRate", v)}
                    options={[
                      { v: 0, label: "0%" }, { v: 5, label: "5%" }, { v: 15, label: "15%" },
                      { v: 30, label: "30%" }, { v: 60, label: "60%" },
                    ]}
                  />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="TVA">
                  <PillGroup<number>
                    value={form.tvaRate} onChange={v => set("tvaRate", v)}
                    options={[
                      { v: 0, label: "Exo." }, { v: 9, label: "9%" }, { v: 19, label: "19%" },
                    ]}
                  />
                </Field>
              </div>
              <Field label="TIC %" sub="tabac/alcool/carburant">
                <input className={inputCls} type="number" step="0.5" value={form.ticRate}
                  onChange={e => set("ticRate", +e.target.value)} />
              </Field>
              <Field label="DAPS %" sub="arrêté ministériel">
                <input className={inputCls} type="number" step="1" value={form.dapsRate}
                  onChange={e => set("dapsRate", +e.target.value)} />
              </Field>

              {/* Taxes spéciales LF 2026 */}
              <SectionLabel title="Taxes spéciales LF 2026" />
              <div className="col-span-2 grid grid-cols-2 gap-1.5">
                <Toggle checked={form.isTic}         onChange={v => set("isTic", v)}         label="TIC" />
                <Toggle checked={form.isDaps}        onChange={v => set("isDaps", v)}        label="DAPS" />
                <Toggle checked={form.hasSolidarity} onChange={v => set("hasSolidarity", v)} label="Solidarité 3%" />
                <Toggle checked={form.hasTee}        onChange={v => set("hasTee", v)}        label="TEE énergie" />
                <Toggle checked={form.hasPrecompte}  onChange={v => set("hasPrecompte", v)}  label="Précompte" />
                <Toggle checked={form.isMicroImport} onChange={v => set("isMicroImport", v)} label="Micro-import" />
              </div>
              {form.hasTee && (
                <div className="col-span-2">
                  <Field label="Taux TEE %" sub="ex. 0.5–2%">
                    <input className={inputCls} type="number" step="0.5" value={form.teRate}
                      onChange={e => set("teRate", +e.target.value)} />
                  </Field>
                </div>
              )}

              {/* Frais opérationnels */}
              <SectionLabel title="Frais opérationnels (DZD)" />
              <Field label="Portuaires / manutention">
                <input className={inputCls} type="number" value={form.portFees}
                  onChange={e => set("portFees", +e.target.value)} />
              </Field>
              <Field label="Transitaire / dédouanement">
                <input className={inputCls} type="number" value={form.clearanceFees}
                  onChange={e => set("clearanceFees", +e.target.value)} />
              </Field>
              <Field label="Frais bancaires">
                <input className={inputCls} type="number" value={form.bankFees}
                  onChange={e => set("bankFees", +e.target.value)} />
              </Field>
              <Field label="Transport intérieur">
                <input className={inputCls} type="number" value={form.transportFees}
                  onChange={e => set("transportFees", +e.target.value)} />
              </Field>
              <Field label="Magasinage / surestarie">
                <input className={inputCls} type="number" value={form.storageFees}
                  onChange={e => set("storageFees", +e.target.value)} />
              </Field>
              <Field label="Domiciliation bancaire">
                <input className={inputCls} type="number" value={form.domiciliationFee}
                  onChange={e => set("domiciliationFee", +e.target.value)} />
              </Field>

              {/* Calcul unitaire */}
              <SectionLabel title="Calcul unitaire" />
              <Field label="Quantité">
                <input className={inputCls} type="number" min="1" value={form.quantity}
                  onChange={e => set("quantity", +e.target.value)} />
              </Field>
              <Field label="Référence / lot">
                <input className={inputCls} placeholder="N° commande…"
                  value={form.notes} onChange={e => set("notes", e.target.value)} />
              </Field>

              {/* Conformité */}
              <SectionLabel title="Conformité réglementaire" />
              <div className="col-span-2 grid grid-cols-2 gap-1.5 pb-2">
                <Toggle checked={form.hasPpi}           onChange={v => set("hasPpi", v)}           label="PPI validé" />
                <Toggle checked={form.hasDomiciliation} onChange={v => set("hasDomiciliation", v)} label="Domiciliation" />
                <Toggle checked={form.hasConformity}    onChange={v => set("hasConformity", v)}    label="Certificat CC" />
                <Toggle checked={form.hasReducedVat}    onChange={v => set("hasReducedVat", v)}    label="TVA réduite" />
              </div>
            </div>
          </div>
        </div>

        {/* ── RESULTS ────────────────────────────────────────────────────── */}
        <div className={`
          w-full lg:w-[45%] bg-[#fafaf8] flex flex-col
          border border-[rgba(14,17,23,0.09)] rounded-[12px] lg:rounded-none lg:border-0
          ${tab === "inputs" ? "hidden lg:flex" : "flex"}
        `}>
          {/* KPI cards */}
          <KpiStrip />

          {/* Secondary KPIs */}
          <div className="grid grid-cols-2 border-b border-[#eeece8]">
            <div className="p-3 border-r border-[#eeece8]">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#9b9fa8] mb-0.5">Total taxes</p>
              <AnimatedValue value={`${fmt(results.totalTaxes)} DZD`} bold />
            </div>
            <div className="p-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#9b9fa8] mb-0.5">Taux effectif</p>
              <AnimatedValue value={`${fmtD(results.effectiveTaxRate)} %`} bold />
            </div>
          </div>

          {/* Panel header */}
          <div className="px-4 py-2.5 border-b border-[#eeece8] flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#9b9fa8]">Décomposition</span>
            <span className="flex items-center gap-1 text-[9px] text-[#0d6e56] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0d6e56] animate-pulse inline-block" />
              Temps réel
            </span>
          </div>

          {/* Breakdown rows */}
          <div className="flex-1 overflow-y-auto custom-scroll px-3 py-2.5 space-y-1">
            {taxRows.map(({ label, value, highlight }) => (
              <div key={label} className={`flex justify-between items-center px-2.5 py-1.5 rounded-[5px] text-[12px] ${
                highlight ? "bg-[#e0f4ed] font-semibold" : "bg-[#f0efeb]"
              }`}>
                <span className={highlight ? "text-[#0d6e56]" : "text-[#6b7080]"}>{label}</span>
                <AnimatedValue value={value} />
              </div>
            ))}

            {/* Exchange rate */}
            <div className="flex justify-between items-center px-2.5 py-1.5 rounded-[5px] bg-[#f0efeb] text-[12px]">
              <span className="text-[#6b7080]">Devise</span>
              <span className="font-['DM_Mono',monospace] text-[11px] text-[#6b7080]">
                1 {form.currency} = {fmtD(form.currency === "DZD" ? 1 : form.exchangeRate)} DZD
              </span>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="flex flex-col gap-1 pt-2">
                {alerts.map((a, i) => (
                  <div key={i} className={`px-2.5 py-2 rounded-[6px] text-[11px] flex items-start gap-1.5 leading-relaxed border ${
                    a.type === "error"   ? "bg-[#fef2f2] text-[#9b2c2c] border-[#fecaca]" :
                    a.type === "warning" ? "bg-[#fffbeb] text-[#b5660a] border-[#fde68a]" :
                                          "bg-[#edf7f0] text-[#2d6a4f] border-[#bbf7d0]"
                  }`}>
                    <span className="mt-0.5 shrink-0 text-[10px]">
                      {a.type === "error" ? "🔴" : a.type === "warning" ? "🟡" : "🟢"}
                    </span>
                    {a.text}
                  </div>
                ))}
              </div>
            )}

            {/* Formulas mini-footer */}
            <div className="mt-2 pt-2 border-t border-[#e8e6e0]">
              <p className="text-[9px] text-[#c0bdb4] leading-loose font-['DM_Mono',monospace]">
                CIF = (FOB/EXW) ? val×fx + frt + ins : val<br />
                DDA = CIF × {form.ddaRate}% · TVA = base × {form.tvaRate}%<br />
                Total = CIF + taxes + frais opérationnels<br />
                Réf. JORADP N°88 · LF 2026 · Tarif DGD 2020
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollbar style */}
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #bbb; }
      `}</style>
    </div>
  );
}