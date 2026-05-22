import { useState, useMemo } from "react";

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
  const [income, setIncome] = useState(5000);
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState("5000");
  const [bills, setBills] = useState(initialBills);
  const [view, setView] = useState("dashboard"); 
  const [filterMethod, setFilterMethod] = useState("all");
  const [creditCardDueDate, setCreditCardDueDate] = useState("15");

  const [paidRegistry, setPaidRegistry] = useState({ "2026-4-3": true });

  const [form, setForm] = useState({
    name: "", amount: "", category: "outros", dueDate: "05", method: "cartao", 
    frequencyType: "parcelado", currentInstallment: "1", totalInstallments: "1"
  });

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
      if (bill.paid) map[dayInt].hasPaid = true; else map[dayInt].hasPending = true;
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
    if (!form.name || isNaN(parsedAmount) || parsedAmount <= 0) return alert("Preencha corretamente.");
    const isCartao = form.method === "cartao";
    const generatedId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    setBills(prev => [...prev, { ...form, id: generatedId, amount: parsedAmount, startMonth: currentMonth, startYear: currentYear }]);
    setView("list");
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0b0b0f", minHeight: "100vh", maxWidth: 430, margin: "0 auto", color: "#f0f0f5", paddingBottom: 100 }}>
      <style>{`
        * { box-sizing: border-box; }
        .main-card { background: #14141e; border-radius: 24px; padding: 20px; margin-bottom: 16px; border: 1px solid #1f1f2e; }
        .nav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 14px 0; background: transparent; color: #4e4e62; border: none; }
        .nav-btn.active { color: #4f46e5; }
        .form-input { background: #14141e; border: 1.5px solid #222232; border-radius: 14px; color: #f0f0f5; padding: 14px; width: 100%; }
        .save-btn { width: 100%; padding: 16px; border-radius: 16px; background: #4f46e5; color: #fff; font-weight: 700; border: none; }
        .fab { position: fixed; bottom: 85px; right: 20px; width: 56px; height: 56px; border-radius: 50%; background: #4f46e5; color: #fff; display: flex; align-items: center; justify-content: center; z-index: 10; border: none; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "40px 20px 20px", display: "flex", justifyContent: "space-between" }}>
        <select value={currentMonth} onChange={(e) => setCurrentMonth(parseInt(e.target.value))} style={{ background: "transparent", border: "none", color: "#fff", fontSize: 20, fontWeight: 700 }}>
          {MONTHS.map(m => <option key={m.value} value={m.value} style={{background: "#14141e"}}>{m.label}</option>)}
        </select>
      </div>

      {view === "dashboard" && (
        <div style={{ padding: "0 16px" }}>
          {/* Card Renda */}
          <div className="main-card" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #14141e 100%)" }}>
            <p style={{ fontSize: 12, color: "#a78bfa" }}>Renda Disponível</p>
            <p style={{ fontSize: 32, fontWeight: 700 }}>{formatBRL(income)}</p>
          </div>

          {/* Cards Lado a Lado */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div className="main-card" style={{ flex: 1, marginBottom: 0, padding: 14 }}>
              <p style={{ fontSize: 10, color: "#808090" }}>Total Contas</p>
              <p style={{ fontSize: 18, fontWeight: 700 }}>{formatBRL(totalBills)}</p>
            </div>
            <div className="main-card" style={{ flex: 1, marginBottom: 0, padding: 14 }}>
              <p style={{ fontSize: 10, color: "#808090" }}>Saldo Livre</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: balance >= 0 ? "#4ade80" : "#f87171" }}>{formatBRL(balance)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav Inferior */}
      <div style={{ position: "fixed", bottom: 0, width: "100%", maxWidth: 430, background: "#101018", borderTop: "1px solid #1f1f32", display: "flex" }}>
        <button className={`nav-btn ${view === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}>Resumo</button>
        <button className={`nav-btn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>Contas</button>
      </div>

      {view !== "add" && <button className="fab" onClick={() => setView("add")}>+</button>}
    </div>
  );
}
