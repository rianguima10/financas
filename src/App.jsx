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

const RECURRENCE = [
  { id: "mensal", label: "Mensal" },
  { id: "quinzenal", label: "Quinzenal" },
  { id: "semanal", label: "Semanal" },
  { id: "unica", label: "Única vez" },
];

const PAYMENT_METHODS = [
  { id: "boleto", label: "Boleto", emoji: "📄" },
  { id: "pix", label: "Pix", emoji: "📱" },
  { id: "credito", label: "Cartão de Crédito", emoji: "💳" },
];

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const YEARS = ["2026", "2027", "2028"];

export default function App() {
  // Estado para controle do Mês e Ano selecionados
  const [currentMonth, setCurrentMonth] = useState(() => {
    return MONTHS[new Date().getMonth()];
  });
  const [currentYear, setCurrentYear] = useState(() => {
    return String(new Date().getFullYear());
  });

  // Chave única para salvar os dados isolados por mês/ano no LocalStorage
  const storageKey = useMemo(() => `financas_data_${currentMonth}_${currentYear}`, [currentMonth, currentYear]);

  // Carrega ou inicializa a renda e as contas do mês selecionado
  const [income, setIncome] = useState(5000);
  const [bills, setBills] = useState([]);

  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setIncome(parsed.income ?? 5000);
      setBills(parsed.bills ?? []);
    } else {
      setIncome(5000);
      setBills([]);
    }
  }, [storageKey]);

  // Salva automaticamente sempre que houver alteração na renda ou contas daquele mês específico
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify({ income, bills }));
    }
  }, [income, bills, storageKey]);

  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState(String(income));
  const [view, setView] = useState("dashboard"); // dashboard | add | list
  const [form, setForm] = useState({ name: "", amount: "", category: "outros", recurrence: "mensal", paymentMethod: "boleto", dueDate: "" });
  const [filterCat, setFilterCat] = useState("all");
  const [editingBillId, setEditingBillId] = useState(null);
  const [editingAmountValue, setEditingAmountValue] = useState("");

  // Cálculos matemáticos baseados nas suas novas regras:
  const totalBills = useMemo(() => bills.reduce((s, b) => s + b.amount, 0), [bills]);
  
  // Total pago (tudo que está marcado como pago)
  const totalPaid = useMemo(() => bills.filter(b => b.paid).reduce((s, b) => s + b.amount, 0), [bills]);
  
  // Total pendente
  const totalPending = useMemo(() => bills.filter(b => !b.paid).reduce((s, b) => s + b.amount, 0), [bills]);
  
  // Saldo livre: SÓ reduz quando a conta for marcada como PAGA
  const balance = income - totalPaid;
  
  const pct = income > 0 ? Math.min(100, Math.round((totalPaid / income) * 100)) : 0;

  // Soma de todas as contas que estão na seção do Cartão de Crédito
  const totalCreditCard = useMemo(() => {
    return bills.filter(b => b.paymentMethod === "credito").reduce((s, b) => s + b.amount, 0);
  }, [bills]);

  const filteredBills = useMemo(() => {
    const sorted = [...bills].sort((a, b) => (parseInt(a.dueDate) || 0) - (parseInt(b.dueDate) || 0));
    return filterCat === "all" ? sorted : sorted.filter(b => b.category === filterCat);
  }, [bills, filterCat]);

  const addBill = () => {
    if (!form.name || !form.amount) return;
    
    const newBill = {
      id: Date.now(),
      name: form.name,
      amount: parseFloat(form.amount),
      category: form.category,
      recurrence: form.recurrence,
      paymentMethod: form.paymentMethod,
      dueDate: form.dueDate || "1", // Padrão dia 1 se não preenchido
      paid: false
    };

    setBills(prev => [...prev, newBill]);
    setForm({ name: "", amount: "", category: "outros", recurrence: "mensal", paymentMethod: "boleto", dueDate: "" });
    setView("list");
  };

  const togglePaid = (id) => setBills(prev => prev.map(b => b.id === id ? { ...b, paid: !b.paid } : b));
  const deleteBill = (id) => setBills(prev => prev.filter(b => b.id !== id));
  
  // Função para salvar a edição rápida de valor direto na lista
  const saveNewAmount = (id) => {
    const val = parseFloat(editingAmountValue);
    if (!isNaN(val) && val >= 0) {
      setBills(prev => prev.map(b => b.id === id ? { ...b, amount: val } : b));
    }
    setEditingBillId(null);
  };

  const catInfo = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[7];
  const payInfo = (id) => PAYMENT_METHODS.find(p => p.id === id) || PAYMENT_METHODS[0];
  const barColor = pct < 60 ? "#4ade80" : pct < 85 ? "#fbbf24" : "#f87171";

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: "#0f0f13",
      minHeight: "100vh",
      maxWidth: 430,
      margin: "0 auto",
      color: "#f0f0f5",
      paddingBottom: 90,
      position: "relative",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, select { outline: none; }
        button { cursor: pointer; border: none; }
        .card { background: #18181f; border-radius: 20px; padding: 18px; }
        .tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; }
        .chip { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1.5px solid transparent; transition: all .2s; }
        .chip.active { background: #6c63ff; border-color: #6c63ff; color: #fff; }
        .chip.inactive { background: transparent; border-color: #2a2a35; color: #888; }
        .bill-item { display: flex; align-items: center; gap: 10px; padding: 12px 0; border-bottom: 1px solid #1e1e28; }
        .bill-item:last-child { border-bottom: none; }
        input[type=text], input[type=number], select {
          background: #22222d; border: 1.5px solid #2e2e3d; border-radius: 12px;
          color: #f0f0f5; padding: 11px 14px; font-size: 15px; font-family: inherit; width: 100%;
        }
        input[type=text]:focus, input[type=number]:focus, select:focus { border-color: #6c63ff; }
        select option { background: #22222d; }
        .fab { position: fixed; bottom: 80px; right: 20px; width: 52px; height: 52px; border-radius: 50%; background: #6c63ff; color: #fff; font-size: 26px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px #6c63ff66; z-index: 10; }
        .nav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 10px 0; background: transparent; color: #666; font-size: 10px; font-weight: 600; }
        .nav-btn.active { color: #6c63ff; }
        .nav-btn svg { width: 22px; height: 22px; }
        .toggle-btn { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
        .del-btn { width: 28px; height: 28px; border-radius: 50%; background: #2a1a1a; color: #f87171; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
        .save-btn { width: 100%; padding: 14px; border-radius: 14px; background: #6c63ff; color: #fff; font-size: 16px; font-weight: 700; margin-top: 8px; }
        .select-month-year { background: #18181f; border: none; color: #fff; font-size: 14px; font-weight: 700; width: auto; padding: 4px 8px; border-radius: 8px; cursor: pointer; }
      `}</style>

      {/* Header com seletores de Mês e Ano */}
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
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#a78bfa)", display: "flex", alignItems: "center", justifyCenter: "center", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>💰</div>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 10 }}>Minhas Finanças</h1>
      </div>

      {/* DASHBOARD */}
      {view === "dashboard" && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Renda mensal */}
          <div className="card" style={{ background: "linear-gradient(135deg,#1e1b4b,#2d1f6e)", border: "1px solid #3730a355" }}>
            <p style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Renda Disponível</p>
            {editingIncome ? (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input type="number" value={incomeInput} onChange={e => setIncomeInput(e.target.value)} style={{ flex: 1, fontSize: 22, fontWeight: 700, padding: "6px 12px" }} autoFocus />
                <button onClick={() => { setIncome(parseFloat(incomeInput) || 0); setEditingIncome(false); }}
                  style={{ background: "#6c63ff", color: "#fff", borderRadius: 10, padding: "0 14px", fontWeight: 700, fontSize: 14 }}>OK</button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
                <p style={{ fontSize: 30, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{formatBRL(income)}</p>
                <button onClick={() => { setIncomeInput(String(income)); setEditingIncome(true); }}
                  style={{ background: "#ffffff15", color: "#a78bfa", borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>editar</button>
              </div>
            )}
          </div>

          {/* Saldo Livre (SÓ desconta as pagas) */}
          <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderLeft: `6px solid ${balance >= 0 ? "#4ade80" : "#f87171"}` }}>
            <div>
              <p style={{ fontSize: 12, color: "#888" }}>Saldo Atual Livre (Renda - Pagas)</p>
              <p style={{ fontSize: 26, fontWeight: 700, fontFamily: "'DM Mono',monospace", color: balance >= 0 ? "#4ade80" : "#f87171", marginTop: 2 }}>{formatBRL(balance)}</p>
            </div>
            <div style={{ fontSize: 32 }}>{balance >= 0 ? "😊" : "😰"}</div>
          </div>

          {/* Fatura do Cartão de Crédito (Soma separada de tudo no cartão) */}
          <div className="card" style={{ background: "#1c1212", border: "1px solid #ef444422" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 12, color: "#f87171", fontWeight: 600 }}>💳 Total no Cartão de Crédito</p>
                <p style={{ fontSize: 24, fontWeight: 700, fontFamily: "'DM Mono',monospace", color: "#f87171", marginTop: 4 }}>{formatBRL(totalCreditCard)}</p>
              </div>
              <span style={{ fontSize: 11, background: "#ef444415", color: "#f87171", padding: "4px 8px", borderRadius: 8, fontWeight: 600 }}>Previsão Fatura</span>
            </div>
          </div>

          {/* Barra de Progresso de Gastos Pagos */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: "#888" }}>Progresso Pago do Mês</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>{pct}%</span>
            </div>
            <div style={{ background: "#2a2a35", borderRadius: 8, height: 8, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 8, transition: "width .4s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, gap: 6 }}>
              {[
                { label: "Planejado", val: totalBills, col: "#ccc" },
                { label: "Pago (✓)", val: totalPaid, col: "#4ade80" },
                { label: "Pendente (○)", val: totalPending, col: "#fbbf24" },
              ].map(item => (
                <div key={item.label} style={{ flex: 1, background: "#22222d", borderRadius: 12, padding: "8px 6px", textAlign: "center" }}>
                  <p style={{ fontSize: 9, color: "#666", marginBottom: 2 }}>{item.label}</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: item.col, fontFamily: "'DM Mono',monospace" }}>{formatBRL(item.val)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo por categoria */}
          <div className="card">
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#888" }}>Por categoria</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CATEGORIES.map(cat => {
                const total = bills.filter(b => b.category === cat.id).reduce((s, b) => s + b.amount, 0);
                if (!total) return null;
                const w = income > 0 ? Math.round((total / income) * 100) : 0;
                return (
                  <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 16, width: 24 }}>{cat.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: "#ccc" }}>{cat.label}</span>
                        <span style={{ fontSize: 12, fontFamily: "'DM Mono',monospace", color: "#aaa" }}>{formatBRL(total)}</span>
                      </div>
                      <div style={{ background: "#2a2a35", borderRadius: 4, height: 5 }}>
                        <div style={{ width: `${w}%`, height: "100%", background: "#6c63ff", borderRadius: 4 }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* LISTA DE CONTAS */}
      {view === "list" && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Filtros rápidos */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            <button className={`chip ${filterCat === "all" ? "active" : "inactive"}`} onClick={() => setFilterCat("all")}>Todas</button>
            {CATEGORIES.filter(c => bills.some(b => b.category === c.id)).map(c => (
              <button key={c.id} className={`chip ${filterCat === c.id ? "active" : "inactive"}`} onClick={() => setFilterCat(c.id)}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          <div className="card">
            {filteredBills.length === 0 && (
              <p style={{ textAlign: "center", color: "#555", padding: "20px 0" }}>Nenhuma conta lançada para este mês.</p>
            )}
            {filteredBills.map(bill => {
              const cat = catInfo(bill.category);
              const pay = payInfo(bill.paymentMethod);
              const isEditing = editingBillId === bill.id;

              return (
                <div key={bill.id} className="bill-item">
                  {/* Indicador Dia do Vencimento */}
                  <div style={{ background: bill.paid ? "#14532d" : "#22222d", color: bill.paid ? "#4ade80" : "#fbbf24", borderRadius: 10, padding: "6px 8px", fontSize: 11, fontWeight: 700, textAlign: "center", minWidth: 42 }}>
                    <span style={{ fontSize: 9, display: "block", color: "#666" }}>VENC</span>
                    Dia {bill.dueDate}
                  </div>

                  {/* Detalhes da Conta */}
                  <div style={{ flex: 1, marginLeft: 4 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, textDecoration: bill.paid ? "line-through" : "none", color: bill.paid ? "#555" : "#f0f0f5" }}>
                      {bill.name}
                    </p>
                    <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                      <span className="tag" style={{ background: "#1e1e2e", color: "#888" }}>{cat.emoji} {cat.label}</span>
                      <span className="tag" style={{ background: bill.paymentMethod === "credito" ? "#3b0712" : "#1e1e2e", color: bill.paymentMethod === "credito" ? "#f87171" : "#a78bfa" }}>
                        {pay.emoji} {pay.label}
                      </span>
                    </div>
                  </div>

                  {/* Valor (Clique para editar se for variável) */}
                  <div style={{ textAlign: "right" }}>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editingAmountValue}
                        onChange={e => setEditingAmountValue(e.target.value)}
                        onBlur={() => saveNewAmount(bill.id)}
                        onKeyDown={e => e.key === 'Enter' && saveNewAmount(bill.id)}
                        style={{ width: 75, padding: "4px", fontSize: 12, textAlign: "right" }}
                        autoFocus
                      />
                    ) : (
                      <p 
                        onClick={() => { setEditingBillId(bill.id); setEditingAmountValue(String(bill.amount)); }}
                        style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: 14, color: bill.paid ? "#4ade80" : "#f87171", cursor: "pointer", borderBottom: "1px dashed #444" }}
                        title="Clique para editar o valor"
                      >
                        {formatBRL(bill.amount)}
                      </p>
                    )}
                  </div>

                  {/* Marcar como pago */}
                  <button className="toggle-btn" onClick={() => togglePaid(bill.id)}
                    style={{ background: bill.paid ? "#14532d" : "#1e1e2e", color: bill.paid ? "#4ade80" : "#555", marginLeft: 4 }}>
                    {bill.paid ? "✓" : "○"}
                  </button>

                  {/* Excluir */}
                  <button className="del-btn" onClick={() => deleteBill(bill.id)}>✕</button>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: "#555", textAlign: "center" }}>💡 Dica: Toque no valor de uma conta para ajustá-lo caso venha diferente neste mês!</p>
        </div>
      )}

      {/* TELA: ADICIONAR CONTA */}
      {view === "add" && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Nova conta em {currentMonth}/{currentYear}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Nome da conta</label>
            <input type="text" placeholder="Ex: Conta de Água" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <div style={{ display: "flex", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", display: "flex" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Valor estimado (R$)</label>
              <input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Dia de Vencimento</label>
              <input type="number" min="1" max="31" placeholder="Ex: 10" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Forma de Pagamento</label>
            <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
              {PAYMENT_METHODS.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.label}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Categoria</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Recorrência</label>
            <select value={form.recurrence} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))}>
              {RECURRENCE.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>

          <button className="save-btn" onClick={addBill}>Adicionar conta</button>
          <button onClick={() => setView("list")} style={{ background: "transparent", color: "#666", fontSize: 14, padding: "8px 0" }}>Cancelar</button>
        </div>
      )}

      {/* Botão FAB flutuante de atalho */}
      {view !== "add" && (
        <button className="fab" onClick={() => setView("add")}>+</button>
      )}

      {/* Menu Inferior Estilo iOS */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#14141c", borderTop: "1px solid #1e1e28", display: "flex", zIndex: 20 }}>
        {[
          { id: "dashboard", label: "Resumo", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/></svg> },
          { id: "list", label: "Contas", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg> },
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
