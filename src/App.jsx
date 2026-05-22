import { useState, useMemo, useEffect } from "react";

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

const PAYMENT_METHODS = [
  { id: "credito", label: "Cartão de Crédito", emoji: "💳", color: "#f87171", bg: "#2a1a1a" },
  { id: "boleto", label: "Boleto", emoji: "📄", color: "#34d399", bg: "#122a1e" },
  { id: "pix", label: "Pix", emoji: "📱", color: "#60a5fa", bg: "#121f3a" },
];

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const YEARS = ["2026", "2027", "2028"];

export default function App() {
  const [currentMonth, setCurrentMonth] = useState(() => MONTHS[new Date().getMonth()]);
  const [currentYear, setCurrentYear] = useState(() => String(new Date().getFullYear()));

  // Controle de Visualização das Contas: "menu" mostra as 3 opções, ou o ID da sessão ("credito", "boleto", "pix")
  const [activeSession, setActiveSession] = useState("menu");

  const [globalBills, setGlobalBills] = useState(() => {
    const saved = localStorage.getItem("financas_global_v3");
    if (saved) return JSON.parse(saved);
    return [
      { id: "1", baseId: "1", name: "Aluguel", amount: 1500, category: "moradia", recurrence: "mensal", paymentMethod: "boleto", dueDate: "10", month: "Maio", year: "2026", paid: false },
      { id: "2", baseId: "2", name: "Netflix", amount: 55.9, category: "assinatura", recurrence: "mensal", paymentMethod: "credito", dueDate: "15", month: "Maio", year: "2026", paid: true },
      { id: "3", baseId: "3", name: "Mercado", amount: 800, category: "alimentacao", recurrence: "unica", paymentMethod: "pix", dueDate: "05", month: "Maio", year: "2026", paid: false },
    ];
  });

  const [incomes, setIncomes] = useState(() => {
    const saved = localStorage.getItem("financas_incomes_v3");
    return saved ? JSON.parse(saved) : { "Maio_2026": 5000 };
  });

  useEffect(() => {
    localStorage.setItem("financas_global_v3", JSON.stringify(globalBills));
  }, [globalBills]);

  useEffect(() => {
    localStorage.setItem("financas_incomes_v3", JSON.stringify(incomes));
  }, [incomes]);

  const currentIncomeKey = `${currentMonth}_${currentYear}`;
  const income = incomes[currentIncomeKey] ?? 5000;

  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState(String(income));
  const [view, setView] = useState("dashboard"); // dashboard | list | add
  
  const [form, setForm] = useState({
    name: "",
    amount: "",
    category: "outros",
    paymentMethod: "boleto",
    dueDate: "",
    installments: "1"
  });

  const [editingBillId, setEditingBillId] = useState(null);
  const [editingAmountValue, setEditingAmountValue] = useState("");

  // --- PROCESSAMENTO DAS CONTAS DO MÊS ---
  const billsForCurrentMonth = useMemo(() => {
    const currentMonthIdx = MONTHS.indexOf(currentMonth);
    const currentYearNum = parseInt(currentYear);

    const directBills = globalBills.filter(b => b.month === currentMonth && b.year === currentYear);
    const recurringBills = [];

    globalBills.forEach(b => {
      if (b.recurrence === "mensal") {
        const bMonthIdx = MONTHS.indexOf(b.month);
        const bYearNum = parseInt(b.year);

        if (bYearNum < currentYearNum || (bYearNum === currentYearNum && bMonthIdx < currentMonthIdx)) {
          const hasOverride = directBills.some(d => d.baseId === b.baseId);
          if (!hasOverride) {
            recurringBills.push({
              ...b,
              id: `rec_${b.baseId}_${currentIncomeKey}`,
              month: currentMonth,
              year: currentYear,
              paid: false
            });
          }
        }
      }
    });

    return [...directBills, ...recurringBills].sort((a, b) => (parseInt(a.dueDate) || 0) - (parseInt(b.dueDate) || 0));
  }, [globalBills, currentMonth, currentYear, currentIncomeKey]);

  // Filtragem da sessão selecionada no menu
  const filteredBills = useMemo(() => {
    return billsForCurrentMonth.filter(b => b.paymentMethod === activeSession);
  }, [billsForCurrentMonth, activeSession]);

  // --- TOTAIS ---
  const totalBills = useMemo(() => billsForCurrentMonth.reduce((s, b) => s + b.amount, 0), [billsForCurrentMonth]);
  const totalPaid = useMemo(() => billsForCurrentMonth.filter(b => b.paid).reduce((s, b) => s + b.amount, 0), [billsForCurrentMonth]);
  const balance = income - totalPaid;
  const pct = income > 0 ? Math.min(100, Math.round((totalPaid / income) * 100)) : 0;

  const sumCreditCard = useMemo(() => billsForCurrentMonth.filter(b => b.paymentMethod === "credito").reduce((s, b) => s + b.amount, 0), [billsForCurrentMonth]);
  const sumBoleto = useMemo(() => billsForCurrentMonth.filter(b => b.paymentMethod === "boleto").reduce((s, b) => s + b.amount, 0), [billsForCurrentMonth]);
  const sumPix = useMemo(() => billsForCurrentMonth.filter(b => b.paymentMethod === "pix").reduce((s, b) => s + b.amount, 0), [billsForCurrentMonth]);

  const getSessionTotal = (id) => {
    if (id === "credito") return sumCreditCard;
    if (id === "boleto") return sumBoleto;
    return sumPix;
  };

  // --- FUNÇÕES DE MANIPULAÇÃO ---
  const addBill = () => {
    if (!form.name || !form.amount) return;

    const baseId = String(Date.now());
    const totalInstallments = parseInt(form.installments) || 1;
    const amountPerInstallment = parseFloat(form.amount);

    if (form.paymentMethod === "credito" && totalInstallments > 1) {
      const newInstallments = [];
      let startMonthIdx = MONTHS.indexOf(currentMonth);
      let startYearNum = parseInt(currentYear);

      for (let i = 0; i < totalInstallments; i++) {
        newInstallments.push({
          id: `${baseId}_p${i}`,
          baseId: `${baseId}_p${i}`,
          name: `${form.name} (${i + 1}/${totalInstallments})`,
          amount: amountPerInstallment,
          category: form.category,
          recurrence: "unica",
          paymentMethod: "credito",
          dueDate: form.dueDate || "1",
          month: MONTHS[startMonthIdx],
          year: String(startYearNum),
          paid: false
        });

        startMonthIdx++;
        if (startMonthIdx > 11) {
          startMonthIdx = 0;
          startYearNum++;
        }
      }
      setGlobalBills(prev => [...prev, ...newInstallments]);
    } else {
      const newBill = {
        id: baseId,
        baseId: baseId,
        name: form.name,
        amount: amountPerInstallment,
        category: form.category,
        recurrence: form.paymentMethod === "credito" ? "unica" : "mensal",
        paymentMethod: form.paymentMethod,
        dueDate: form.dueDate || "1",
        month: currentMonth,
        year: currentYear,
        paid: false
      };
      setGlobalBills(prev => [...prev, newBill]);
    }

    setForm({ name: "", amount: "", category: "outros", paymentMethod: "boleto", dueDate: "", installments: "1" });
    setActiveSession(form.paymentMethod);
    setView("list");
  };

  const togglePaid = (bill) => {
    if (String(bill.id).startsWith("rec_")) {
      const materialized = { ...bill, id: String(Date.now()), paid: true };
      setGlobalBills(prev => [...prev, materialized]);
    } else {
      setGlobalBills(prev => prev.map(b => b.id === bill.id ? { ...b, paid: !b.paid } : b));
    }
  };

  const deleteBill = (bill) => {
    if (String(bill.id).startsWith("rec_")) {
      const blockBill = { ...bill, id: String(Date.now()), amount: 0, name: `${bill.name} (Removido)`, month: currentMonth, year: currentYear, baseId: bill.baseId };
      setGlobalBills(prev => [...prev, blockBill]);
    } else {
      setGlobalBills(prev => prev.filter(b => b.id !== bill.id));
    }
  };

  const saveInlineAmount = (bill) => {
    const newVal = parseFloat(editingAmountValue);
    if (isNaN(newVal) || newVal < 0) {
      setEditingBillId(null);
      return;
    }
    if (String(bill.id).startsWith("rec_")) {
      const overrideBill = { ...bill, id: String(Date.now()), amount: newVal, paid: bill.paid };
      setGlobalBills(prev => [...prev, overrideBill]);
    } else {
      setGlobalBills(prev => prev.map(b => b.id === bill.id ? { ...b, amount: newVal } : b));
    }
    setEditingBillId(null);
  };

  const catInfo = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[7];
  const barColor = pct < 60 ? "#4ade80" : pct < 85 ? "#fbbf24" : "#f87171";

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif", background: "#0f0f13", minHeight: "100vh", maxWidth: 430, margin: "0 auto", color: "#f0f0f5", paddingBottom: 90, position: "relative"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, select { outline: none; }
        button { cursor: pointer; border: none; }
        .card { background: #18181f; border-radius: 20px; padding: 18px; }
        .menu-row { display: flex; align-items: center; justify-content: space-between; padding: 20px; border-radius: 16px; background: #18181f; border: 1px solid #232330; transition: transform 0.2s, background 0.2s; cursor: pointer; margin-bottom: 12px; }
        .menu-row:active { transform: scale(0.98); background: #1f1f29; }
        .tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; }
        .bill-item { display: flex; align-items: center; gap: 10px; padding: 14px 0; border-bottom: 1px solid #1e1e28; }
        .bill-item:last-child { border-bottom: none; }
        input[type=text], input[type=number], select {
          background: #22222d; border: 1.5px solid #2e2e3d; border-radius: 12px; color: #f0f0f5; padding: 12px 14px; font-size: 15px; font-family: inherit; width: 100%;
        }
        input[type=text]:focus, input[type=number]:focus, select:focus { border-color: #6c63ff; }
        .fab { position: fixed; bottom: 80px; right: 20px; width: 52px; height: 52px; border-radius: 50%; background: #6c63ff; color: #fff; font-size: 26px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px #6c63ff66; z-index: 10; }
        .nav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 10px 0; background: transparent; color: #666; font-size: 10px; font-weight: 600; }
        .nav-btn.active { color: #6c63ff; }
        .nav-btn svg { width: 22px; height: 22px; }
        .toggle-btn { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
        .del-btn { width: 28px; height: 28px; border-radius: 50%; background: #2a1a1a; color: #f87171; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
        .save-btn { width: 100%; padding: 14px; border-radius: 14px; background: #6c63ff; color: #fff; font-size: 16px; font-weight: 700; margin-top: 8px; }
        .select-month-year { background: #18181f; border: none; color: #fff; font-size: 14px; font-weight: 700; padding: 4px 8px; border-radius: 8px; cursor: pointer; }
        .back-btn { background: #222230; color: #aaa; padding: 8px 14px; border-radius: 10px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 10px; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "45px 20px 16px", background: "linear-gradient(160deg, #15151f 0%, #0f0f13 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <select className="select-month-year" value={currentMonth} onChange={e => setCurrentMonth(e.target.value)}>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="select-month-year" value={currentYear} onChange={e => setCurrentYear(e.target.value)}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center" }}>💰</div>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 10 }}>Minhas Finanças</h1>
      </div>

      {/* DASHBOARD (RESUMO) */}
      {view === "dashboard" && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Card Renda */}
          <div className="card" style={{ background: "linear-gradient(135deg,#1e1b4b,#2d1f6e)", border: "1px solid #3730a355" }}>
            <p style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Renda Disponível</p>
            {editingIncome ? (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input type="number" value={incomeInput} onChange={e => setIncomeInput(e.target.value)} style={{ flex: 1, fontSize: 22, fontWeight: 700, padding: "6px 12px" }} autoFocus />
                <button onClick={() => {
                  const val = parseFloat(incomeInput) || 0;
                  setIncomes(prev => ({ ...prev, [currentIncomeKey]: val }));
                  setEditingIncome(false);
                }} style={{ background: "#6c63ff", color: "#fff", borderRadius: 10, padding: "0 14px", fontWeight: 700 }}>OK</button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
                <p style={{ fontSize: 30, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{formatBRL(income)}</p>
                <button onClick={() => { setIncomeInput(String(income)); setEditingIncome(true); }}
                  style={{ background: "#ffffff15", color: "#a78bfa", borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>editar</button>
              </div>
            )}
          </div>

          {/* Saldo Livre */}
          <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderLeft: `6px solid ${balance >= 0 ? "#4ade80" : "#f87171"}` }}>
            <div>
              <p style={{ fontSize: 12, color: "#888" }}>Saldo Atual Livre (Renda - Pagas)</p>
              <p style={{ fontSize: 26, fontWeight: 700, fontFamily: "'DM Mono',monospace", color: balance >= 0 ? "#4ade80" : "#f87171", marginTop: 2 }}>{formatBRL(balance)}</p>
            </div>
            <div style={{ fontSize: 32 }}>{balance >= 0 ? "😊" : "😰"}</div>
          </div>

          {/* Atalhos Rápidos para as Sessões */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {PAYMENT_METHODS.map(m => (
              <div key={m.id} className="card" style={{ padding: 12, textAlign: "center", background: m.bg + "44", border: `1px solid ${m.color}22`, cursor: "pointer" }} onClick={() => { setActiveSession(m.id); setView("list"); }}>
                <p style={{ fontSize: 11, color: m.color, fontWeight: 600 }}>{m.emoji} {m.label.split(" ")[0]}</p>
                <p style={{ fontSize: 13, fontWeight: 700, marginTop: 4, fontFamily: "'DM Mono'" }}>{formatBRL(getSessionTotal(m.id))}</p>
              </div>
            ))}
          </div>

          {/* Barra de Progresso */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: "#888" }}>Progresso de Contas Pagas</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>{pct}%</span>
            </div>
            <div style={{ background: "#2a2a35", borderRadius: 8, height: 8, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 8, transition: "width .4s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, gap: 6 }}>
              {[
                { label: "Total Mês", val: totalBills, col: "#ccc" },
                { label: "Total Pago", val: totalPaid, col: "#4ade80" },
                { label: "Pendente", val: totalBills - totalPaid, col: "#fbbf24" },
              ].map(item => (
                <div key={item.label} style={{ flex: 1, background: "#22222d", borderRadius: 12, padding: "8px 6px", textAlign: "center" }}>
                  <p style={{ fontSize: 9, color: "#666", marginBottom: 2 }}>{item.label}</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: item.col, fontFamily: "'DM Mono',monospace" }}>{formatBRL(item.val)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TELA DE CONTAS (ORGANIZAÇÃO POR APENAS 3 OPÇÕES SELECIONÁVEIS) */}
      {view === "list" && (
        <div style={{ padding: "0 16px" }}>
          
          {/* MENU INICIAL DAS 3 OPÇÕES */}
          {activeSession === "menu" ? (
            <div>
              <p style={{ fontSize: 13, color: "#888", fontWeight: 600, marginBottom: 12 }}>Selecione uma sessão para ver as contas:</p>
              
              {PAYMENT_METHODS.map(method => {
                const count = billsForCurrentMonth.filter(b => b.paymentMethod === method.id).length;
                return (
                  <div key={method.id} className="menu-row" onClick={() => setActiveSession(method.id)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 24, background: method.bg, width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyCcontent: "center", justifyContent: "center" }}>
                        {method.emoji}
                      </span>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 15, color: "#fff" }}>{method.label}</p>
                        <p style={{ fontSize: 12, color: "#666" }}>{count} {count === 1 ? "conta lançada" : "contas lançadas"}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontFamily: "'DM Mono'", fontWeight: 700, fontSize: 15, color: method.color }}>
                        {formatBRL(getSessionTotal(method.id))}
                      </p>
                      <span style={{ fontSize: 11, color: "#444" }}>Ver contas →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            
            /* CONTEÚDO INTERNO DE CADA SESSÃO CLICADA */
            <div>
              <button className="back-btn" onClick={() => setActiveSession("menu")}>
                ← Voltar para as 3 Sessões
              </button>

              <div style={{ background: "#14141c", padding: "12px 16px", borderRadius: 14, display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #222", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "#aaa" }}>
                  Sessão: <b>{PAYMENT_METHODS.find(p=>p.id === activeSession)?.label}</b>
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "'DM Mono'", color: PAYMENT_METHODS.find(p=>p.id === activeSession)?.color }}>
                  {formatBRL(getSessionTotal(activeSession))}
                </span>
              </div>

              <div className="card">
                {filteredBills.length === 0 && (
                  <p style={{ textAlign: "center", color: "#555", padding: "20px 0" }}>Nenhuma conta registrada nesta sessão.</p>
                )}
                
                {filteredBills.map(bill => {
                  const cat = catInfo(bill.category);
                  const isEditing = editingBillId === bill.id;

                  return (
                    <div key={bill.id} className="bill-item" style={{ opacity: bill.amount === 0 ? 0.3 : 1 }}>
                      {bill.amount > 0 && (
                        <>
                          {/* Emblema de Vencimento Dinâmico */}
                          <div style={{ background: bill.paid ? "#14532d" : "#22222d", color: bill.paid ? "#4ade80" : "#fbbf24", borderRadius: 10, padding: "4px 6px", fontSize: 10, fontWeight: 700, textAlign: "center", minWidth: 46 }}>
                            <span style={{ fontSize: 8, display: "block", color: "#777" }}>{bill.paymentMethod === "credito" ? "FATURA" : "VENC"}</span>
                            Dia {bill.dueDate}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, marginLeft: 4 }}>
                            <p style={{ fontWeight: 600, fontSize: 14, textDecoration: bill.paid ? "line-through" : "none", color: bill.paid ? "#555" : "#f0f0f5" }}>
                              {bill.name}
                            </p>
                            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                              <span className="tag" style={{ background: "#222", color: "#888" }}>{cat.emoji} {cat.label}</span>
                              {bill.recurrence === "mensal" && <span className="tag" style={{ background: "#1e1b4b", color: "#818cf8" }}>🔄 Mensal</span>}
                            </div>
                          </div>

                          {/* Valor com clique para Edição rápida */}
                          <div style={{ textAlign: "right" }}>
                            {isEditing ? (
                              <input
                                type="number"
                                value={editingAmountValue}
                                onChange={e => setEditingAmountValue(e.target.value)}
                                onBlur={() => saveInlineAmount(bill)}
                                onKeyDown={e => e.key === 'Enter' && saveInlineAmount(bill)}
                                style={{ width: 75, padding: "4px", fontSize: 12, textAlign: "right" }}
                                autoFocus
                              />
                            ) : (
                              <p 
                                onClick={() => { setEditingBillId(bill.id); setEditingAmountValue(String(bill.amount)); }}
                                style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: 14, color: bill.paid ? "#4ade80" : "#f87171", cursor: "pointer", borderBottom: "1px dashed #444" }}
                                title="Toque para mudar o valor"
                              >
                                {formatBRL(bill.amount)}
                              </p>
                            )}
                          </div>

                          <button className="toggle-btn" onClick={() => togglePaid(bill)}
                            style={{ background: bill.paid ? "#14532d" : "#1e1e2e", color: bill.paid ? "#4ade80" : "#555", marginLeft: 4 }}>
                            {bill.paid ? "✓" : "○"}
                          </button>

                          <button className="del-btn" onClick={() => deleteBill(bill)}>✕</button>
                        </>
                      )}
                      {bill.amount === 0 && <p style={{ fontSize: 12, color: "#444", fontStyle: "italic" }}>{bill.name} removido este mês</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CADASTRAR NOVA CONTA */}
      {view === "add" && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Nova conta para {currentMonth}/{currentYear}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Nome da conta</label>
            <input type="text" placeholder="Ex: Parcela Celular" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Valor (R$)</label>
              <input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            
            {form.paymentMethod === "credito" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Nº de Parcelas</label>
                <input type="number" min="1" max="72" placeholder="Ex: 7" value={form.installments} onChange={e => setForm(f => ({ ...f, installments: e.target.value }))} />
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Forma de Pagamento (Sessão)</label>
            <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value, installments: e.target.value === "credito" ? "1" : form.installments }))}>
              {PAYMENT_METHODS.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.label}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>
              {form.paymentMethod === "credito" ? "Dia de Vencimento da Fatura" : "Dia de Vencimento"}
            </label>
            <input type="number" min="1" max="31" placeholder="Ex: 10" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Categoria</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </select>
          </div>

          <button className="save-btn" onClick={addBill}>Adicionar conta</button>
          <button onClick={() => { setView("list"); setActiveSession("menu"); }} style={{ background: "transparent", color: "#666", fontSize: 14, padding: "8px 0" }}>Cancelar</button>
        </div>
      )}

      {/* Botão Flutuante + */}
      {view !== "add" && (
        <button className="fab" onClick={() => setView("add")}>+</button>
      )}

      {/* Menu Inferior */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#14141c", borderTop: "1px solid #1e1e28", display: "flex", zIndex: 20 }}>
        {[
          { id: "dashboard", label: "Resumo", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/></svg> },
          { id: "list", label: "Contas", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg> },
        ].map(tab => (
          <button key={tab.id} className={`nav-btn ${view === tab.id || (view === "add" && tab.id === "list") ? "active" : ""}`} 
            onClick={() => { 
              setView(tab.id); 
              if(tab.id === "list") setActiveSession("menu"); 
            }}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
