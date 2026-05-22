import { useState, useMemo, useEffect } from "react";

const formatBRL = (value) => {
  if (isNaN(value)) value = 0;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const CATEGORIES = [
  { id: "moradia", label: "Moradia", emoji: "🏠" },
  { id: "alimentacao", label: "Alimentação", emoji: "🍽️" },
  { id: "transporte", label: "Transporte", emoji: "🚗" },
  { id: "saude", label: "Saúde", emoji: "💊" },
  { id: "lazer", label: "Lazer", emoji: "🎮" },
  { id: "assinatura", label: "Assinatura", emoji: "📱" },
  { id: "educacao", label: "Educação", emoji: "📚" },
  { id: "outros", label: "Outros", emoji: "📦" },
];

const METHODS = [
  { id: "cartao", label: "Cartão", emoji: "💳" },
  { id: "boleto", label: "Boleto", emoji: "📄" },
  { id: "pix", label: "Pix", emoji: "📱" },
];

const MONTHS = [
  { value: 0, label: "Janeiro" }, { value: 1, label: "Fevereiro" },
  { value: 2, label: "Março" }, { value: 3, label: "Abril" },
  { value: 4, label: "Maio" }, { value: 5, label: "Junho" },
  { value: 6, label: "Julho" }, { value: 7, label: "Agosto" },
  { value: 8, label: "Setembro" }, { value: 9, label: "Outubro" },
  { value: 10, label: "Novembro" }, { value: 11, label: "Dezembro" }
];

const YEARS = [2024, 2025, 2026, 2027, 2028];
const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

const initialBills = [
  { id: "1", name: "Mercado", amount: 800, category: "alimentacao", dueDate: "05", method: "pix", startMonth: 4, startYear: 2026, frequencyType: "mensal" },
  { id: "2", name: "Aluguel", amount: 1500, category: "moradia", dueDate: "10", method: "boleto", startMonth: 4, startYear: 2026, frequencyType: "mensal" },
  { id: "3", name: "Netflix", amount: 55.9, category: "assinatura", method: "cartao", startMonth: 4, startYear: 2026, frequencyType: "parcelado", currentInstallment: 1, totalInstallments: 1 },
];

export default function App() {
  const [currentMonth, setCurrentMonth] = useState(4);
  const [currentYear, setCurrentYear] = useState(2026);
  
  const [income, setIncome] = useState(() => parseFloat(localStorage.getItem("income")) || 5000);
  const [bills, setBills] = useState(() => JSON.parse(localStorage.getItem("bills")) || initialBills);
  const [paidRegistry, setPaidRegistry] = useState(() => JSON.parse(localStorage.getItem("paidRegistry")) || { "2026-4-3": true });
  const [creditCardDueDate, setCreditCardDueDate] = useState(() => localStorage.getItem("ccDueDate") || "15");

  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState("5000");
  const [view, setView] = useState("dashboard"); 
  const [filterMethod, setFilterMethod] = useState("all");

  const [form, setForm] = useState({
    name: "", amount: "", category: "outros", dueDate: "05", method: "cartao", frequencyType: "parcelado", currentInstallment: "1", totalInstallments: "1"
  });

  useEffect(() => {
    localStorage.setItem("income", income);
    localStorage.setItem("bills", JSON.stringify(bills));
    localStorage.setItem("paidRegistry", JSON.stringify(paidRegistry));
    localStorage.setItem("ccDueDate", creditCardDueDate);
  }, [income, bills, paidRegistry, creditCardDueDate]);

  const billsForSelectedMonth = useMemo(() => {
    return bills.map(bill => {
      const monthsDiff = (currentYear - bill.startYear) * 12 + (currentMonth - bill.startMonth);
      if (monthsDiff < 0) return null;
      const paidKey = `${currentYear}-${currentMonth}-${bill.id}`;
      const isPaid = !!paidRegistry[paidKey];

      if (bill.frequencyType === "mensal") return { ...bill, paid: isPaid };
      if (bill.frequencyType === "parcelado" && bill.totalInstallments) {
        const calculatedInstallment = Number(bill.currentInstallment) + monthsDiff;
        if (calculatedInstallment >= 1 && calculatedInstallment <= bill.totalInstallments) {
          return { ...bill, currentInstallment: calculatedInstallment, paid: isPaid };
        }
      } 
      if (bill.frequencyType === "unica" && monthsDiff === 0) return { ...bill, paid: isPaid };
      return null;
    }).filter(Boolean);
  }, [bills, currentMonth, currentYear, paidRegistry]);

  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysArray = [];
    for (let i = 0; i < firstDayIndex; i++) daysArray.push(null);
    for (let day = 1; day <= totalDays; day++) daysArray.push(day);
    return daysArray;
  }, [currentMonth, currentYear]);

  const dayStatusMap = useMemo(() => {
    const map = {};
    billsForSelectedMonth.forEach(bill => {
      const dayStr = bill.method === "cartao" ? creditCardDueDate : bill.dueDate;
      const dayInt = parseInt(dayStr);
      if (!dayInt) return;
      if (!map[dayInt]) map[dayInt] = { hasPending: false, hasPaid: false };
      bill.paid ? (map[dayInt].hasPaid = true) : (map[dayInt].hasPending = true);
    });
    return map;
  }, [billsForSelectedMonth, creditCardDueDate]);

  const totalBills = billsForSelectedMonth.reduce((s, b) => s + b.amount, 0);
  const totalPaid = billsForSelectedMonth.filter(b => b.paid).reduce((s, b) => s + b.amount, 0);
  const totalPending = totalBills - totalPaid;
  const balance = income - totalPaid;

  const filteredBills = useMemo(() => {
    if (filterMethod === "all") return billsForSelectedMonth;
    return billsForSelectedMonth.filter(b => b.method === filterMethod);
  }, [billsForSelectedMonth, filterMethod]);

  const sessionTotal = useMemo(() => filteredBills.reduce((sum, b) => sum + b.amount, 0), [filteredBills]);

  const methodTotals = useMemo(() => ({
    cartao: billsForSelectedMonth.filter(b => b.method === "cartao").reduce((s, b) => s + b.amount, 0),
    boleto: billsForSelectedMonth.filter(b => b.method === "boleto").reduce((s, b) => s + b.amount, 0),
    pix: billsForSelectedMonth.filter(b => b.method === "pix").reduce((s, b) => s + b.amount, 0),
  }), [billsForSelectedMonth]);

  const addBill = () => {
    const parsedAmount = parseFloat(form.amount);
    if (!form.name || isNaN(parsedAmount) || parsedAmount <= 0) return alert("Insira nome e valor válidos.");
    const isCartao = form.method === "cartao";
    const generatedId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    setBills(prev => [...prev, { 
      id: generatedId, name: form.name, amount: parsedAmount, category: form.category, 
      dueDate: isCartao ? null : String(form.dueDate).padStart(2, "0"), method: form.method, 
      startMonth: currentMonth, startYear: currentYear, frequencyType: isCartao ? "parcelado" : form.frequencyType, 
      currentInstallment: 1, totalInstallments: parseInt(form.totalInstallments || 1)
    }]);
    setForm({ name: "", amount: "", category: "outros", dueDate: "05", method: "cartao", frequencyType: "parcelado", currentInstallment: "1", totalInstallments: "1" });
    setView("list");
  };

  const togglePaid = (id) => {
    const paidKey = `${currentYear}-${currentMonth}-${id}`;
    setPaidRegistry(prev => ({ ...prev, [paidKey]: !prev[paidKey] }));
  };

  const deleteBill = (id) => {
    setBills(prev => prev.filter(b => b.id !== id));
    setPaidRegistry(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => { if (key.endsWith(`-${id}`)) delete updated[key]; });
      return updated;
    });
  };

  const catInfo = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[7];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0b0b0f", minHeight: "100vh", maxWidth: 430, margin: "0 auto", color: "#f0f0f5", paddingBottom: 100, position: "relative" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, select { outline: none; background: transparent; border: none; color: inherit; font-family: inherit; }
        .select-clean { font-size: 20px; font-weight: 700; color: #fff; cursor: pointer; appearance: none; padding-right: 4px; }
        .main-card { background: #14141e; border-radius: 24px; padding: 20px; margin-bottom: 16px; border: 1px solid #1f1f2e; }
        .tag-venc { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; padding: 6px 10px; border-radius: 12px; font-size: 9px; font-weight: 700; width: 58px; text-align: center; }
        .tag-venc.pending { background: #221616; color: #f87171; border: 1px solid #3d1d1d; }
        .tag-venc.paid { background: #112417; color: #4ade80; border: 1px solid #163d22; }
        .tag-venc.fatura { background: #161b2c; color: #60a5fa; border: 1px solid #1e294b; }
        .tag-inner { font-size: 11px; font-weight: 700; display: block; margin-top: 1px; }
        .sub-tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #1c1c28; color: #a0a0b0; }
        .sub-tag.info { background: #1e1b4b; color: #a78bfa; }
        .chip { padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1.5px solid transparent; background: transparent; }
        .chip.active { background: #4f46e5; border-color: #4f46e5; color: #fff; }
        .chip.inactive { background: #14141e; border-color: #222232; color: #707080; }
        .bill-item { display: flex; align-items: center; gap: 12px; padding: 16px 0; border-bottom: 1px solid #1f1f2e; }
        .form-input { background: #14141e; border: 1.5px solid #222232; border-radius: 14px; color: #f0f0f5; padding: 14px 16px; font-size: 15px; width: 100%; }
        .fab { position: fixed; bottom: 85px; right: 20px; width: 56px; height: 56px; border-radius: 50%; background: #4f46e5; color: #fff; font-size: 28px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; }
        .nav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 14px 0; background: transparent; color: #4e4e62; border: none; }
        .nav-btn.active { color: #4f46e5; }
        .toggle-btn { width: 34px; height: 34px; border-radius: 50%; border: none; cursor: pointer; }
        .del-btn { width: 34px; height: 34px; border-radius: 50%; background: #221616; color: #f87171; border: none; cursor: pointer; }
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-top: 14px; text-align: center; }
        .cal-day { font-size: 13px; font-weight: 600; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 10px; background: #14141e; }
        .cal-day.bill-pending { background: #221616; color: #f87171; }
        .cal-day.bill-paid { background: #112417; color: #4ade80; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "40px 20px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <select className="select-clean" value={currentMonth} onChange={(e) => setCurrentMonth(parseInt(e.target.value))}>
            {MONTHS.map(m => <option key={m.value} value={m.value} style={{background: "#14141e"}}>{m.label}</option>)}
          </select>
          <select className="select-clean" style={{ color: "#666" }} value={currentYear} onChange={(e) => setCurrentYear(parseInt(e.target.value))}>
            {YEARS.map(y => <option key={y} value={y} style={{background: "#14141e"}}>{y}</option>)}
          </select>
        </div>
      </div>

      {view === "dashboard" && (
        <div style={{ padding: "0 16px" }}>
          <div className="main-card" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #14141e 100%)" }}>
            <p style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600 }}>RENDA DISPONÍVEL</p>
            {editingIncome ? (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input type="number" className="form-input" value={incomeInput} onChange={e => setIncomeInput(e.target.value)} />
                <button onClick={() => { setIncome(parseFloat(incomeInput) || 0); setEditingIncome(false); }} style={{ background: "#4f46e5", padding: "0 16px", borderRadius: 12, color: "#fff", border: "none" }}>OK</button>
              </div>
            ) : <p style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }} onClick={() => {setEditingIncome(true); setIncomeInput(String(income))}}>{formatBRL(income)}</p>}
          </div>

          <div className="main-card">
            <p style={{ fontSize: 12, color: "#808090" }}>Saldo Atual Livre</p>
            <p style={{ fontSize: 30, fontWeight: 700, color: balance >= 0 ? "#4ade80" : "#f87171" }}>{formatBRL(balance)}</p>
          </div>

          {/* NOVO CARD TOTAL */}
          <div className="main-card" style={{ padding: "14px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 12, color: "#808090", fontWeight: 600 }}>Total de Contas do Mês</p>
              <p style={{ fontSize: 18, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{formatBRL(totalBills)}</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            {METHODS.map(m => (
              <div key={m.id} className="main-card" style={{ flex: 1, padding: 14, marginBottom: 0 }}>
                <p style={{ fontSize: 10, color: "#808090" }}>{m.label}</p>
                <p style={{ fontSize: 14, fontWeight: 700 }}>{formatBRL(methodTotals[m.id])}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "list" && (
        <div style={{ padding: "0 16px" }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 16 }}>Minhas Contas</h1>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
            <button className={`chip ${filterMethod === "all" ? "active" : "inactive"}`} onClick={() => setFilterMethod("all")}>Todas</button>
            {METHODS.map(m => <button key={m.id} className={`chip ${filterMethod === m.id ? "active" : "inactive"}`} onClick={() => setFilterMethod(m.id)}>{m.emoji} {m.label}</button>)}
          </div>
          <div className="main-card" style={{ padding: "4px 20px" }}>
            {filteredBills.map(bill => (
              <div key={bill.id} className="bill-item">
                <div className={`tag-venc ${bill.paid ? "paid" : (bill.method === "cartao" ? "fatura" : "pending")}`}>
                  {bill.method === "cartao" ? "Fatura" : "Venc"}
                  <span className="tag-inner">{bill.method === "cartao" ? creditCardDueDate : bill.dueDate}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, textDecoration: bill.paid ? "line-through" : "none" }}>{bill.name}</p>
                </div>
                <p style={{ fontWeight: 700, color: bill.paid ? "#4ade80" : "#f87171" }}>{formatBRL(bill.amount)}</p>
                <button className="toggle-btn" onClick={() => togglePaid(bill.id)} style={{ background: bill.paid ? "#11381e" : "#14141e" }}>{bill.paid ? "✓" : "○"}</button>
                <button className="del-btn" onClick={() => deleteBill(bill.id)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "add" && (
        <div style={{ padding: "0 16px" }}>
          <h2 style={{ marginBottom: 16 }}>Nova conta</h2>
          <input className="form-input" placeholder="Nome" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{marginBottom: 10}} />
          <input className="form-input" type="number" placeholder="Valor" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={{marginBottom: 10}} />
          <button className="fab" style={{ position: "relative", width: "100%", borderRadius: 14 }} onClick={addBill}>Salvar</button>
        </div>
      )}

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#101018", borderTop: "1px solid #1f1f32", display: "flex", zIndex: 20 }}>
        <button className={`nav-btn ${view === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}>Resumo</button>
        <button className={`nav-btn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>Contas</button>
      </div>
      {view !== "add" && <button className="fab" onClick={() => setView("add")}>+</button>}
    </div>
  );
}
