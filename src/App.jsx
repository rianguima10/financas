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
  
  // Estados com persistência no localStorage
  const [income, setIncome] = useState(() => parseFloat(localStorage.getItem("income")) || 5000);
  const [bills, setBills] = useState(() => JSON.parse(localStorage.getItem("bills")) || initialBills);
  const [paidRegistry, setPaidRegistry] = useState(() => JSON.parse(localStorage.getItem("paidRegistry")) || { "2026-4-3": true });
  const [creditCardDueDate, setCreditCardDueDate] = useState(() => localStorage.getItem("creditCardDueDate") || "15");
  
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState("5000");
  const [view, setView] = useState("dashboard"); 
  const [filterMethod, setFilterMethod] = useState("all");

  const [form, setForm] = useState({
    name: "",
    amount: "",
    category: "outros",
    dueDate: "05",
    method: "cartao",
    frequencyType: "parcelado",
    currentInstallment: "1",
    totalInstallments: "1"
  });

  // Efeitos para salvar no localStorage
  useEffect(() => localStorage.setItem("income", income), [income]);
  useEffect(() => localStorage.setItem("bills", JSON.stringify(bills)), [bills]);
  useEffect(() => localStorage.setItem("paidRegistry", JSON.stringify(paidRegistry)), [paidRegistry]);
  useEffect(() => localStorage.setItem("creditCardDueDate", creditCardDueDate), [creditCardDueDate]);

  const billsForSelectedMonth = useMemo(() => {
    return bills.map(bill => {
      const monthsDiff = (currentYear - bill.startYear) * 12 + (currentMonth - bill.startMonth);
      if (monthsDiff < 0) return null;

      const paidKey = `${currentYear}-${currentMonth}-${bill.id}`;
      const isPaid = !!paidRegistry[paidKey];

      if (bill.frequencyType === "mensal") {
        return { ...bill, paid: isPaid };
      }

      if (bill.frequencyType === "parcelado" && bill.totalInstallments) {
        const calculatedInstallment = Number(bill.currentInstallment) + monthsDiff;
        if (calculatedInstallment >= 1 && calculatedInstallment <= bill.totalInstallments) {
          return { ...bill, currentInstallment: calculatedInstallment, paid: isPaid };
        }
      } 
      
      if (bill.frequencyType === "unica" && monthsDiff === 0) {
        return { ...bill, paid: isPaid };
      }

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

      if (!map[dayInt]) {
        map[dayInt] = { hasPending: false, hasPaid: false };
      }
      if (bill.paid) {
        map[dayInt].hasPaid = true;
      } else {
        map[dayInt].hasPending = true;
      }
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

  const methodTotals = useMemo(() => {
    return {
      cartao: billsForSelectedMonth.filter(b => b.method === "cartao").reduce((s, b) => s + b.amount, 0),
      boleto: billsForSelectedMonth.filter(b => b.method === "boleto").reduce((s, b) => s + b.amount, 0),
      pix: billsForSelectedMonth.filter(b => b.method === "pix").reduce((s, b) => s + b.amount, 0),
    };
  }, [billsForSelectedMonth]);

  const addBill = () => {
    const parsedAmount = parseFloat(form.amount);
    if (!form.name || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Por favor, insira um nome e um valor válido.");
      return;
    }
    
    const isCartao = form.method === "cartao";
    const actualFrequency = isCartao ? "parcelado" : form.frequencyType;
    const generatedId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());

    setBills(prev => [...prev, { 
      id: generatedId, 
      name: form.name, 
      amount: parsedAmount, 
      category: form.category, 
      dueDate: isCartao ? null : String(form.dueDate).padStart(2, "0"),
      method: form.method,
      startMonth: currentMonth,
      startYear: currentYear,
      frequencyType: actualFrequency,
      currentInstallment: actualFrequency === "parcelado" ? parseInt(form.currentInstallment || 1) : null,
      totalInstallments: actualFrequency === "parcelado" ? parseInt(form.totalInstallments || 1) : null
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
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0b0b0f", minHeight: "100vh", maxWidth: 430, margin: "0 auto", color: "#f0f0f5", paddingBottom: 100 }}>
      {/* Estilos e restante do seu JSX (mantido igual) */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, select { outline: none; background: transparent; border: none; color: inherit; font-family: inherit; }
        .select-clean { font-size: 20px; font-weight: 700; color: #fff; cursor: pointer; appearance: none; padding-right: 4px; }
        .select-clean.gray { color: #666; }
        .main-card { background: #14141e; border-radius: 24px; padding: 20px; margin-bottom: 16px; border: 1px solid #1f1f2e; }
        .tag-venc { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; padding: 6px 10px; border-radius: 12px; font-size: 9px; font-weight: 700; line-height: 1.2; text-transform: uppercase; width: 58px; text-align: center; }
        .tag-venc.pending { background: #221616; color: #f87171; border: 1px solid #3d1d1d; }
        .tag-venc.paid { background: #112417; color: #4ade80; border: 1px solid #163d22; }
        .tag-venc.fatura { background: #161b2c; color: #60a5fa; border: 1px solid #1e294b; }
        .tag-inner { font-size: 11px; font-weight: 700; display: block; margin-top: 1px; }
        .sub-tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #1c1c28; color: #a0a0b0; }
        .sub-tag.info { background: #1e1b4b; color: #a78bfa; }
        .chip { padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1.5px solid transparent; transition: all .2s; white-space: nowrap; display: flex; align-items: center; gap: 6px; background: transparent; }
        .chip.active { background: #4f46e5; border-color: #4f46e5; color: #fff; }
        .chip.inactive { background: #14141e; border-color: #222232; color: #707080; }
        .bill-item { display: flex; align-items: center; gap: 12px; padding: 16px 0; border-bottom: 1px solid #1f1f2e; }
        .form-input { background: #14141e; border: 1.5px solid #222232; border-radius: 14px; color: #f0f0f5; padding: 14px 16px; font-size: 15px; width: 100%; }
        .fab { position: fixed; bottom: 85px; right: 20px; width: 56px; height: 56px; border-radius: 50%; background: #4f46e5; color: #fff; font-size: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(79, 70, 229, 0.4); z-index: 10; border: none; }
        .nav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 0; background: transparent; color: #4e4e62; font-size: 11px; font-weight: 600; border: none; }
        .nav-btn.active { color: #4f46e5; }
        .toggle-btn { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; border: none; cursor: pointer; }
        .del-btn { width: 34px; height: 34px; border-radius: 50%; background: #221616; color: #f87171; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; border: none; cursor: pointer; }
        .save-btn { width: 100%; padding: 16px; border-radius: 16px; background: #4f46e5; color: #fff; font-size: 16px; font-weight: 700; margin-top: 10px; border: none; cursor: pointer; }
        .config-card-due { display: flex; align-items: center; justify-content: space-between; background: #1a1a26; padding: 12px 16px; border-radius: 16px; margin-bottom: 12px; border: 1px dashed #3a3a52; }
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-top: 14px; text-align: center; }
        .cal-day { font-size: 13px; font-weight: 600; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 10px; color: #a0a0b0; background: #14141e; }
        .cal-day.bill-pending { background: #221616; color: #f87171; border: 1px solid #3d1d1d; }
        .cal-day.bill-paid { background: #112417; color: #4ade80; border: 1px solid #163d22; }
      `}</style>
      
      {/* (O restante do seu JSX permanece igual ao que você enviou, apenas certifique-se de que ele esteja contido neste componente App atualizado) */}
      
      {/* ... [Código visual do App mantido] ... */}
      
    </div>
  );
}