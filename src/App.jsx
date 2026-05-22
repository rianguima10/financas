import { useState, useMemo } from "react";

const formatBRL = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

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
  { id: 1, name: "Mercado", amount: 800, category: "alimentacao", paid: false, dueDate: "05", method: "pix", startMonth: 4, startYear: 2026, frequencyType: "mensal" },
  { id: 2, name: "Aluguel", amount: 1500, category: "moradia", paid: false, dueDate: "10", method: "boleto", startMonth: 4, startYear: 2026, frequencyType: "mensal" },
  { id: 3, name: "Netflix", amount: 55.9, category: "assinatura", paid: true, method: "cartao", startMonth: 4, startYear: 2026, frequencyType: "parcelado", currentInstallment: 1, totalInstallments: 1 },
];

export default function App() {
  const [currentMonth, setCurrentMonth] = useState(4); // Maio
  const [currentYear, setCurrentYear] = useState(2026);
  
  const [income, setIncome] = useState(5000);
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState("5000");
  const [bills, setBills] = useState(initialBills);
  const [view, setView] = useState("dashboard"); // Iniciando na tela de Resumo (Início)
  const [filterMethod, setFilterMethod] = useState("all");
  const [nextId, setNextId] = useState(4);
  const [creditCardDueDate, setCreditCardDueDate] = useState("15");

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

  // Processa as contas elegíveis para o mês selecionado
  const billsForSelectedMonth = useMemo(() => {
    return bills.map(bill => {
      const monthsDiff = (currentYear - bill.startYear) * 12 + (currentMonth - bill.startMonth);
      if (monthsDiff < 0) return null;

      if (bill.frequencyType === "mensal") {
        return bill;
      }

      if (bill.frequencyType === "parcelado" && bill.totalInstallments) {
        const calculatedInstallment = bill.currentInstallment + monthsDiff;
        if (calculatedInstallment >= 1 && calculatedInstallment <= bill.totalInstallments) {
          return { ...bill, currentInstallment: calculatedInstallment };
        }
      } 
      
      if (bill.frequencyType === "unica" && monthsDiff === 0) {
        return bill;
      }

      return null;
    }).filter(Boolean);
  }, [bills, currentMonth, currentYear]);

  // Gera a matriz de dias do calendário para o mês corrente
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const daysArray = [];
    // Espaços em branco antes do dia 1
    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push(null);
    }
    // Dias do mês
    for (let day = 1; day <= totalDays; day++) {
      daysArray.push(day);
    }
    return daysArray;
  }, [currentMonth, currentYear]);

  // Mapeia o status das contas por dia para colorir o calendário
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

  const sessionTotal = useMemo(() => {
    return filteredBills.reduce((sum, b) => sum + b.amount, 0);
  }, [filteredBills]);

  const methodTotals = useMemo(() => {
    return {
      cartao: billsForSelectedMonth.filter(b => b.method === "cartao").reduce((s, b) => s + b.amount, 0),
      boleto: billsForSelectedMonth.filter(b => b.method === "boleto").reduce((s, b) => s + b.amount, 0),
      pix: billsForSelectedMonth.filter(b => b.method === "pix").reduce((s, b) => s + b.amount, 0),
    };
  }, [billsForSelectedMonth]);

  const addBill = () => {
    if (!form.name || !form.amount) return;
    
    const isCartao = form.method === "cartao";
    const actualFrequency = isCartao ? "parcelado" : form.frequencyType;

    setBills(prev => [...prev, { 
      id: nextId, 
      name: form.name, 
      amount: parseFloat(form.amount), 
      category: form.category, 
      dueDate: isCartao ? null : String(form.dueDate).padStart(2, "0"),
      method: form.method,
      startMonth: currentMonth,
      startYear: currentYear,
      frequencyType: actualFrequency,
      currentInstallment: actualFrequency === "parcelado" ? parseInt(form.currentInstallment || 1) : null,
      totalInstallments: actualFrequency === "parcelado" ? parseInt(form.totalInstallments || 1) : null,
      paid: false 
    }]);

    setNextId(n => n + 1);
    setForm({ name: "", amount: "", category: "outros", dueDate: "05", method: "cartao", frequencyType: "parcelado", currentInstallment: "1", totalInstallments: "1" });
    setView("list");
  };

  const togglePaid = (id) => setBills(prev => prev.map(b => b.id === id ? { ...b, paid: !b.paid } : b));
  const deleteBill = (id) => setBills(prev => prev.filter(b => b.id !== id));
  const catInfo = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[7];

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: "#0b0b0f",
      minHeight: "100vh",
      maxWidth: 430,
      margin: "0 auto",
      color: "#f0f0f5",
      paddingBottom: 100,
      position: "relative",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, select { outline: none; background: transparent; border: none; color: inherit; font-family: inherit; }
        
        .select-clean { font-size: 20px; font-weight: 700; color: #fff; cursor: pointer; appearance: none; -webkit-appearance: none; padding-right: 4px; }
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
        .bill-item:last-child { border-bottom: none; }
        
        .form-input { background: #14141e; border: 1.5px solid #222232; border-radius: 14px; color: #f0f0f5; padding: 14px 16px; font-size: 15px; width: 100%; }
        .form-input:focus { border-color: #4f46e5; }
        
        .fab { position: fixed; bottom: 85px; right: 20px; width: 56px; height: 56px; border-radius: 50%; background: #4f46e5; color: #fff; font-size: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(79, 70, 229, 0.4); z-index: 10; border: none; }
        
        .nav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 0; background: transparent; color: #4e4e62; font-size: 11px; font-weight: 600; border: none; }
        .nav-btn.active { color: #4f46e5; }
        .nav-btn svg { width: 22px; height: 22px; }
        
        .toggle-btn { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; border: none; }
        .del-btn { width: 34px; height: 34px; border-radius: 50%; background: #221616; color: #f87171; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; border: none; }
        .save-btn { width: 100%; padding: 16px; border-radius: 16px; background: #4f46e5; color: #fff; font-size: 16px; font-weight: 700; margin-top: 10px; border: none; }
        .config-card-due { display: flex; align-items: center; justify-content: space-between; background: #1a1a26; padding: 12px 16px; border-radius: 16px; margin-bottom: 12px; border: 1px dashed #3a3a52; }
        
        /* Estilos Novos do Calendário Mensal */
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-top: 14px; text-align: center; }
        .cal-weekday { font-size: 11px; font-weight: 700; color: #4e4e62; padding-bottom: 4px; }
        .cal-day { font-size: 13px; font-weight: 600; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 10px; color: #a0a0b0; background: #14141e; border: 1px solid transparent; }
        .cal-day.empty { background: transparent; }
        .cal-day.bill-pending { background: #221616; color: #f87171; border-color: #3d1d1d; font-weight: 700; }
        .cal-day.bill-paid { background: #112417; color: #4ade80; border-color: #163d22; font-weight: 700; }
      `}</style>

      {/* Top Header Contendo os Seletores de Data */}
      <div style={{ padding: "40px 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select className="select-clean" value={currentMonth} onChange={(e) => setCurrentMonth(parseInt(e.target.value))}>
            {MONTHS.map(m => <option key={m.value} value={m.value} style={{background: "#14141e"}}>{m.label}</option>)}
          </select>
          <select className="select-clean gray" value={currentYear} onChange={(e) => setCurrentYear(parseInt(e.target.value))}>
            {YEARS.map(y => <option key={y} value={y} style={{background: "#14141e"}}>{y}</option>)}
          </select>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#222235", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
          💰
        </div>
      </div>

      {/* CALENDÁRIO MENSAL EM GRADE VISUAL */}
      <div style={{ padding: "0 16px 16px 16px" }}>
        <div className="main-card" style={{ padding: "14px 14px 18px 14px", marginBottom: 8 }}>
          <div className="cal-grid">
            {WEEKDAYS.map((w, i) => <div key={i} className="cal-weekday">{w}</div>)}
            {calendarDays.map((day, idx) => {
              if (day === null) return <div key={`e-${idx}`} className="cal-day empty" />;
              
              const status = dayStatusMap[day];
              let dayClass = "cal-day";
              
              if (status) {
                // Se houver qualquer conta pendente no dia, prevalece o vermelho
                dayClass += status.hasPending ? " bill-pending" : " bill-paid";
              }

              return (
                <div key={day} className={dayClass}>
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* TELA DE RESUMO (TELA INICIAL DO APP) */}
      {view === "dashboard" && (
        <div style={{ padding: "0 16px" }}>
          <div className="main-card" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #14141e 100%)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Renda Disponível</p>
              <button onClick={() => { setEditingIncome(!editingIncome); setIncomeInput(String(income)); }} style={{ background: "#2e2a5e", color: "#c084fc", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, border: "none" }}>
                {editingIncome ? "Cancelar" : "editar"}
              </button>
            </div>
            {editingIncome ? (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input type="number" className="form-input" value={incomeInput} onChange={e => setIncomeInput(e.target.value)} style={{ padding: "8px 12px", fontSize: 16 }} />
                <button onClick={() => { setIncome(parseFloat(incomeInput) || 0); setEditingIncome(false); }} style={{ background: "#4f46e5", padding: "0 16px", borderRadius: 12, fontWeight: "bold", border: "none" }}>Salvar</button>
              </div>
            ) : (
              <p style={{ fontSize: 32, fontWeight: 700, fontFamily: "'DM Mono', monospace", marginTop: 4 }}>{formatBRL(income)}</p>
            )}
          </div>

          <div className="main-card">
            <p style={{ fontSize: 12, color: "#808090", fontWeight: 600 }}>Saldo Atual Livre (Renda − Pagas)</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              <p style={{ fontSize: 30, fontWeight: 700, color: balance >= 0 ? "#4ade80" : "#f87171", fontFamily: "'DM Mono', monospace" }}>{formatBRL(balance)}</p>
              <span style={{ fontSize: 28 }}>😊</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div className="main-card" style={{ flex: 1, marginBottom: 0, padding: 14, border: "1px solid #3d1d1d" }}>
              <p style={{ fontSize: 11, color: "#f87171", fontWeight: 600 }}>💳 Cartão</p>
              <p style={{ fontSize: 16, fontWeight: 700, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>{formatBRL(methodTotals.cartao)}</p>
            </div>
            <div className="main-card" style={{ flex: 1, marginBottom: 0, padding: 14, border: "1px solid #163d22" }}>
              <p style={{ fontSize: 11, color: "#34d399", fontWeight: 600 }}>📄 Boleto</p>
              <p style={{ fontSize: 16, fontWeight: 700, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>{formatBRL(methodTotals.boleto)}</p>
            </div>
            <div className="main-card" style={{ flex: 1, marginBottom: 0, padding: 14, border: "1px solid #1e294b" }}>
              <p style={{ fontSize: 11, color: "#60a5fa", fontWeight: 600 }}>📱 Pix</p>
              <p style={{ fontSize: 16, fontWeight: 700, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>{formatBRL(methodTotals.pix)}</p>
            </div>
          </div>

          <div className="main-card">
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#808090", fontWeight: 600 }}>
              <span>Progresso de Contas Pagas</span>
              <span style={{ color: "#4ade80" }}>{totalBills > 0 ? Math.round((totalPaid / totalBills) * 100) : 0}%</span>
            </div>
            <div style={{ width: "100%", height: 6, background: "#1f1f2e", borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
              <div style={{ width: `${totalBills > 0 ? (totalPaid / totalBills) * 100 : 0}%`, height: "100%", background: "#4ade80", transition: "width 0.3s" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16, paddingTop: 8, borderTop: "1px solid #1f1f2e", textAlign: "center" }}>
              <div>
                <p style={{ fontSize: 10, color: "#666", fontWeight: 600 }}>Total Mês</p>
                <p style={{ fontSize: 12, fontWeight: 700, marginTop: 2, color: "#aaa" }}>{formatBRL(totalBills)}</p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: "#666", fontWeight: 600 }}>Total Pago</p>
                <p style={{ fontSize: 12, fontWeight: 700, marginTop: 2, color: "#4ade80" }}>{formatBRL(totalPaid)}</p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: "#666", fontWeight: 600 }}>Pendente</p>
                <p style={{ fontSize: 12, fontWeight: 700, marginTop: 2, color: "#fbbf24" }}>{formatBRL(totalPending)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TELA DE LISTAGEM */}
      {view === "list" && (
        <div style={{ padding: "0 16px" }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 16 }}>Minhas Finanças</h1>

          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12 }}>
            <button className={`chip ${filterMethod === "all" ? "active" : "inactive"}`} onClick={() => setFilterMethod("all")}>
              Todas ({billsForSelectedMonth.length})
            </button>
            {METHODS.map(m => (
              <button key={m.id} className={`chip ${filterMethod === m.id ? "active" : "inactive"}`} onClick={() => setFilterMethod(m.id)}>
                {m.emoji} {m.label} ({billsForSelectedMonth.filter(b => b.method === m.id).length})
              </button>
            ))}
          </div>

          {filterMethod === "cartao" && (
            <div className="config-card-due">
              <span style={{ fontSize: 13, color: "#a0a0b0", fontWeight: 500 }}>📅 Dia do Vencimento da Fatura:</span>
              <select value={creditCardDueDate} onChange={(e) => setCreditCardDueDate(e.target.value)} style={{ width: "auto", padding: "6px 12px", fontSize: 13, borderRadius: 10, background: "#1c1c28" }}>
                {Array.from({ length: 31 }, (_, i) => {
                  const d = String(i + 1).padStart(2, "0");
                  return <option key={d} value={d}>Dia {d}</option>;
                })}
              </select>
            </div>
          )}

          <div className="main-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px" }}>
            <span style={{ fontSize: 13, color: "#808090", fontWeight: 500 }}>Total nesta sessão:</span>
            <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{formatBRL(sessionTotal)}</span>
          </div>

          <div className="main-card" style={{ padding: "4px 20px" }}>
            {filteredBills.length === 0 ? (
              <p style={{ textAlign: "center", color: "#505060", padding: "30px 0", fontSize: 14 }}>Nenhuma conta para este mês.</p>
            ) : (
              filteredBills.map(bill => {
                const cat = catInfo(bill.category);
                const isCartao = bill.method === "cartao";
                return (
                  <div key={bill.id} className="bill-item">
                    <div className={`tag-venc ${bill.paid ? "paid" : (isCartao ? "fatura" : "pending")}`}>
                      {isCartao ? "Fatura" : "Venc"}
                      <span className="tag-inner">Dia {isCartao ? creditCardDueDate : bill.dueDate}</span>
                    </div>

                    <div style={{ flex: 1, paddingLeft: 4 }}>
                      <p style={{ fontWeight: 600, fontSize: 15, textDecoration: bill.paid ? "line-through" : "none", color: bill.paid ? "#505060" : "#f0f0f5" }}>{bill.name}</p>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
                        <span className="sub-tag">{cat.emoji} {cat.label}</span>
                        {bill.frequencyType === "parcelado" && bill.totalInstallments && (
                          <span className="sub-tag info">{bill.currentInstallment}/{bill.totalInstallments}x</span>
                        )}
                        {bill.frequencyType === "mensal" && (
                          <span className="sub-tag" style={{ background: "#112417", color: "#4ade80" }}>🔄 Mensal</span>
                        )}
                      </div>
                    </div>

                    <p style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 15, color: bill.paid ? "#4ade80" : "#f87171", marginRight: 4 }}>{formatBRL(bill.amount)}</p>
                    <button className="toggle-btn" onClick={() => togglePaid(bill.id)} style={{ background: bill.paid ? "#11381e" : "#14141e", color: bill.paid ? "#4ade80" : "#303040", border: bill.paid ? "none" : "1.5px solid #222235" }}>{bill.paid ? "✓" : "○"}</button>
                    <button className="del-btn" onClick={() => deleteBill(bill.id)}>✕</button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TELA DE FORMULÁRIO */}
      {view === "add" && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Nova conta</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#808090", fontWeight: 600 }}>Nome da conta</label>
            <input type="text" className="form-input" placeholder="Ex: Internet" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#808090", fontWeight: 600 }}>Valor (R$)</label>
            <input type="number" className="form-input" placeholder="0,00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#808090", fontWeight: 600 }}>Forma de Pagamento</label>
            <select className="form-input" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value, frequencyType: e.target.value === "cartao" ? "parcelado" : "unica" }))}>
              {METHODS.map(m => <option key={m.id} value={m.id} style={{background: "#14141e"}}>{m.emoji} {m.label}</option>)}
            </select>
          </div>

          {form.method !== "cartao" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#808090", fontWeight: 600 }}>Frequência da Conta</label>
              <select className="form-input" value={form.frequencyType} onChange={e => setForm(f => ({ ...f, frequencyType: e.target.value }))}>
                <option value="unica" style={{background: "#14141e"}}>☝️ Única</option>
                <option value="mensal" style={{background: "#14141e"}}>🔄 Mensal (Todos os meses)</option>
                <option value="parcelado" style={{background: "#14141e"}}>🔢 Parcelada</option>
              </select>
            </div>
          )}

          {(form.method === "cartao" || form.frequencyType === "parcelado") ? (
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, color: "#808090", fontWeight: 600 }}>Parcela Atual</label>
                <input type="number" className="form-input" min="1" value={form.currentInstallment} onChange={e => setForm(f => ({ ...f, currentInstallment: e.target.value }))} />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, color: "#808090", fontWeight: 600 }}>Total Parcelas</label>
                <input type="number" className="form-input" min="1" value={form.totalInstallments} onChange={e => setForm(f => ({ ...f, totalInstallments: e.target.value }))} />
              </div>
            </div>
          ) : null}

          {form.method !== "cartao" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#808090", fontWeight: 600 }}>Dia do Vencimento</label>
              <select className="form-input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}>
                {Array.from({ length: 31 }, (_, i) => {
                  const d = String(i + 1).padStart(2, "0");
                  return <option key={d} value={d} style={{background: "#14141e"}}>Dia {d}</option>;
                })}
              </select>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#808090", fontWeight: 600 }}>Categoria</label>
            <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id} style={{background: "#14141e"}}>{c.emoji} {c.label}</option>)}
            </select>
          </div>

          <button className="save-btn" onClick={addBill}>Adicionar conta</button>
          <button onClick={() => setView("list")} style={{ background: "transparent", color: "#606070", fontSize: 14, padding: "8px 0", fontWeight: 500, border: "none" }}>Cancelar</button>
        </div>
      )}

      {view !== "add" && <button className="fab" onClick={() => setView("add")}>+</button>}

      {/* Menu de Navegação Inferior */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#101018", borderTop: "1px solid #1f1f32", display: "flex", zIndex: 20 }}>
        {[
          { id: "dashboard", label: "Resumo", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg> },
          { id: "list", label: "Contas", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg> },
        ].map(tab => (
          <button key={tab.id} className={`nav-btn ${view === tab.id || (view === "add" && tab.id === "list") ? "active" : ""}`} onClick={() => setView(tab.id)}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
