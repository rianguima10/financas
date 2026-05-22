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
  const [view, setView] = useState("dashboard"); 

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

  const totalBills = billsForSelectedMonth.reduce((s, b) => s + b.amount, 0);
  const totalPaid = billsForSelectedMonth.filter(b => b.paid).reduce((s, b) => s + b.amount, 0);
  const balance = income - totalPaid;

  const addBill = () => {
    const parsedAmount = parseFloat(form.amount);
    if (!form.name || isNaN(parsedAmount) || parsedAmount <= 0) return alert("Preencha corretamente.");
    const generatedId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    setBills(prev => [...prev, { ...form, id: generatedId, amount: parsedAmount, startMonth: currentMonth, startYear: currentYear }]);
    setForm({ name: "", amount: "", category: "outros", dueDate: "05", method: "cartao", frequencyType: "parcelado", currentInstallment: "1", totalInstallments: "1" });
    setView("list");
  };

  const togglePaid = (id) => {
    const paidKey = `${currentYear}-${currentMonth}-${id}`;
    setPaidRegistry(prev => ({ ...prev, [paidKey]: !prev[paidKey] }));
  };

  const deleteBill = (id) => setBills(prev => prev.filter(b => b.id !== id));

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0b0b0f", minHeight: "100vh", maxWidth: 430, margin: "0 auto", color: "#f0f0f5", paddingBottom: 100 }}>
      <style>{`
        .main-card { background: #14141e; border-radius: 24px; padding: 20px; margin-bottom: 16px; border: 1px solid #1f1f2e; }
        .form-input { background: #14141e; border: 1.5px solid #222232; border-radius: 14px; color: #f0f0f5; padding: 14px 16px; width: 100%; margin-bottom: 10px; }
        .bill-item { display: flex; align-items: center; gap: 12px; padding: 16px 0; border-bottom: 1px solid #1f1f2e; }
        .fab { position: fixed; bottom: 85px; right: 20px; width: 56px; height: 56px; border-radius: 50%; background: #4f46e5; color: #fff; border: none; cursor: pointer; }
        .nav-btn { flex: 1; padding: 14px 0; background: none; color: #4e4e62; border: none; }
        .nav-btn.active { color: #4f46e5; }
      `}</style>

      <div style={{ padding: "40px 20px 20px", display: "flex", gap: 10 }}>
        <select value={currentMonth} onChange={(e) => setCurrentMonth(parseInt(e.target.value))} style={{background:"#14141e", color:"#fff"}}>{MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select>
        <select value={currentYear} onChange={(e) => setCurrentYear(parseInt(e.target.value))} style={{background:"#14141e", color:"#fff"}}>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
      </div>

      {view === "dashboard" && (
        <div style={{ padding: "0 16px" }}>
          <div className="main-card">
            <p style={{fontSize: 12, color: "#a78bfa"}}>RENDA DISPONÍVEL</p>
            <p style={{fontSize: 32, fontWeight: 700}} onClick={() => setEditingIncome(!editingIncome)}>{formatBRL(income)}</p>
            {editingIncome && <input type="number" className="form-input" onChange={(e) => setIncome(parseFloat(e.target.value) || 0)} />}
          </div>
          <div className="main-card">
            <p style={{fontSize: 12, color: "#808090"}}>Total de Contas do Mês</p>
            <p style={{fontSize: 24, fontWeight: 700}}>{formatBRL(totalBills)}</p>
          </div>
          <div className="main-card">
            <p style={{fontSize: 12, color: "#808090"}}>Saldo Livre</p>
            <p style={{fontSize: 30, fontWeight: 700, color: balance >= 0 ? "#4ade80" : "#f87171"}}>{formatBRL(balance)}</p>
          </div>
        </div>
      )}

      {view === "list" && (
        <div style={{ padding: "0 16px" }}>
          {billsForSelectedMonth.map(bill => (
            <div key={bill.id} className="bill-item">
              <span style={{flex:1}}>{bill.name}</span>
              <span style={{fontWeight: 700}}>{formatBRL(bill.amount)}</span>
              <button onClick={() => togglePaid(bill.id)}>{bill.paid ? "✅" : "⭕"}</button>
              <button onClick={() => deleteBill(bill.id)}>❌</button>
            </div>
          ))}
        </div>
      )}

      {view === "add" && (
        <div style={{ padding: "0 16px" }}>
          <h2>Nova conta</h2>
          <input className="form-input" placeholder="Nome" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <input className="form-input" type="number" placeholder="Valor" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
          <button className="fab" style={{position: "relative", width: "100%", borderRadius: 14}} onClick={addBill}>Salvar</button>
        </div>
      )}

      <div style={{ position: "fixed", bottom: 0, width: "100%", maxWidth: 430, background: "#101018", display: "flex" }}>
        <button className={`nav-btn ${view === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}>Resumo</button>
        <button className={`nav-btn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>Contas</button>
      </div>
      {view !== "add" && <button className="fab" onClick={() => setView("add")}>+</button>}
    </div>
  );
}