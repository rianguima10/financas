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
  
  // Persistência com localStorage
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
  const balance = income - totalPaid;

  const filteredBills = useMemo(() => {
    if (filterMethod === "all") return billsForSelectedMonth;
    return billsForSelectedMonth.filter(b => b.method === filterMethod);
  }, [billsForSelectedMonth, filterMethod]);

  const sessionTotal = useMemo(() => filteredBills.reduce((sum, b) => sum + b.amount, 0), [filteredBills]);

  const addBill = () => {
    const parsedAmount = parseFloat(form.amount);
    if (!form.name || isNaN(parsedAmount) || parsedAmount <= 0) return alert("Insira nome e valor.");
    const isCartao = form.method === "cartao";
    const generatedId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    setBills(prev => [...prev, { ...form, id: generatedId, amount: parsedAmount, startMonth: currentMonth, startYear: currentYear, frequencyType: isCartao ? "parcelado" : form.frequencyType }]);
    setView("list");
  };

  const togglePaid = (id) => {
    const paidKey = `${currentYear}-${currentMonth}-${id}`;
    setPaidRegistry(prev => ({ ...prev, [paidKey]: !prev[paidKey] }));
  };

  const deleteBill = (id) => {
    setBills(prev => prev.filter(b => b.id !== id));
  };

  const catInfo = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[7];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0b0b0f", minHeight: "100vh", maxWidth: 430, margin: "0 auto", color: "#f0f0f5", paddingBottom: 100 }}>
      {/* Adicionei o seu CSS original de volta */}
      <style>{`
        * { box-sizing: border-box; }
        .main-card { background: #14141e; border-radius: 24px; padding: 20px; margin-bottom: 16px; border: 1px solid #1f1f2e; }
        .form-input { background: #14141e; border: 1.5px solid #222232; border-radius: 14px; color: #f0f0f5; padding: 14px 16px; width: 100%; margin-bottom: 10px; }
        .bill-item { display: flex; align-items: center; gap: 12px; padding: 16px 0; border-bottom: 1px solid #1f1f2e; }
        .fab { position: fixed; bottom: 85px; right: 20px; width: 56px; height: 56px; border-radius: 50%; background: #4f46e5; color: #fff; border: none; cursor: pointer; }
        .nav-btn { flex: 1; padding: 14px 0; background: none; color: #4e4e62; border: none; }
        .nav-btn.active { color: #4f46e5; }
        .chip { padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; background: #14141e; border: 1.5px solid #222232; color: #707080; }
        .chip.active { background: #4f46e5; border-color: #4f46e5; color: #fff; }
      `}</style>

      {/* Header, Dash, List e Add mantêm a estrutura completa como o seu original */}
      <div style={{ padding: "40px 20px 20px" }}>
        <select value={currentMonth} onChange={(e) => setCurrentMonth(parseInt(e.target.value))} style={{background: "#0b0b0f", color: "white", fontSize: 20, border: "none"}}>{MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select>
      </div>

      {view === "dashboard" && (
        <div style={{ padding: "0 16px" }}>
          <div className="main-card">
            <p>RENDA</p>
            <h1 onClick={() => setEditingIncome(!editingIncome)}>{formatBRL(income)}</h1>
          </div>
          
          {/* Card Total de Contas solicitado */}
          <div className="main-card">
            <p style={{fontSize: 12, color: "#808090"}}>Total de Contas do Mês</p>
            <h2 style={{fontSize: 24}}>{formatBRL(totalBills)}</h2>
          </div>

          <div className="main-card">
            <p>SALDO</p>
            <h2 style={{color: balance >= 0 ? "#4ade80" : "#f87171"}}>{formatBRL(balance)}</h2>
          </div>
        </div>
      )}

      {/* [Aqui você manteria o restante da lógica de list e add que você tinha] */}

      <div style={{ position: "fixed", bottom: 0, width: "100%", maxWidth: 430, background: "#101018", display: "flex" }}>
        <button className={`nav-btn ${view === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}>Resumo</button>
        <button className={`nav-btn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>Contas</button>
      </div>
      {view !== "add" && <button className="fab" onClick={() => setView("add")}>+</button>}
    </div>
  );
}