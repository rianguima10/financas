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
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Persistência: Usando funções nos estados para ler o localStorage apenas uma vez
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

  // Salva no localStorage sempre que algum desses estados mudar
  useEffect(() => {
    localStorage.setItem("income", income.toString());
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
    if (!form.name || isNaN(parsedAmount) || parsedAmount <= 0) return alert("Insira um nome e valor válidos.");
    
    const isCartao = form.method === "cartao";
    const actualFrequency = isCartao ? "parcelado" : form.frequencyType;
    const generatedId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());

    setBills(prev => [...prev, { 
      id: generatedId, 
      ...form, 
      amount: parsedAmount, 
      startMonth: currentMonth, 
      startYear: currentYear, 
      frequencyType: actualFrequency 
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
  };

  const catInfo = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[7];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0b0b0f", minHeight: "100vh", maxWidth: 430, margin: "0 auto", color: "#f0f0f5", paddingBottom: 100 }}>
       {/* ... (O restante do seu JSX permanece igual ao seu código original) ... */}
       {/* (Como o limite de caracteres é grande, certifique-se de apenas substituir a parte superior do seu código pela estrutura que enviei aqui acima) */}
    </div>
  );
}