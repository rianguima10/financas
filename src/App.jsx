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

const initialBills = [
  { id: 1, name: "Aluguel", amount: 1500, category: "moradia", recurrence: "mensal", paid: false },
  { id: 2, name: "Netflix", amount: 55.9, category: "assinatura", recurrence: "mensal", paid: true },
  { id: 3, name: "Mercado", amount: 800, category: "alimentacao", recurrence: "mensal", paid: false },
];

export default function App() {
  // Inicialização puxando do LocalStorage do iPhone
  const [income, setIncome] = useState(() => {
    const saved = localStorage.getItem("financas_income");
    return saved ? parseFloat(saved) : 5000;
  });
  
  const [bills, setBills] = useState(() => {
    const saved = localStorage.getItem("financas_bills");
    return saved ? JSON.parse(saved) : initialBills;
  });

  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState(String(income));
  const [view, setView] = useState("dashboard"); 
  const [form, setForm] = useState({ name: "", amount: "", category: "outros", recurrence: "mensal" });
  const [filterCat, setFilterCat] = useState("all");

  // Identifica o mês e ano atual automaticamente para separar os gastos
  const currentMonthYear = useMemo(() => {
    return new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }, []);

  // Monitora alterações e salva no celular automaticamente
  useEffect(() => {
    localStorage.setItem("financas_income", income);
  }, [income]);

  useEffect(() => {
    localStorage.setItem("financas_bills", JSON.stringify(bills));
  }, [bills]);

  const totalBills = useMemo(() => bills.reduce((s, b) => s + b.amount, 0), [bills]);
  const totalPaid = useMemo(() => bills.reduce((s, b) => b.paid ? s + b.amount : s, 0), [bills]);
  const totalPending = useMemo(() => totalBills - totalPaid, [totalBills, totalPaid]);
  const balance = income - totalBills;
  const pct = income > 0 ? Math.min(100, Math.round((totalBills / income) * 100)) : 0;

  const filteredBills = useMemo(() => {
    return filterCat === "all" ? bills : bills.filter(b => b.category === filterCat);
  }, [bills, filterCat]);

  const categoryTotals = useMemo(() => {
    return CATEGORIES.map(cat => {
      const total = bills.filter(b => b.category === cat.id).reduce((s, b) => s + b.amount, 0);
      const w = income > 0 ? Math.round((total / income) * 100) : 0;
      return { ...cat, total, w };
    }).filter(c => c.total > 0);
  }, [bills, income]);

  const addBill = () => {
    if (!form.name || !form.amount) return;
    
    const newBill = {
      id: Date.now(), // ID único garantido
      name: form.name,
      amount: parseFloat(form.amount),
      category: form.category,
      recurrence: form.recurrence,
      paid: false
    };

    setBills(prev => [...prev, newBill]);
    setForm({ name: "", amount: "", category: "outros", recurrence: "mensal" });
    setView("list");
  };

  const togglePaid = (id) => setBills(prev => prev.map(b => b.id === id ? { ...b, paid: !b.paid } : b));
  const deleteBill = (id) => setBills(prev => prev.filter(b => b.id !== id));
  const catInfo = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[7];
  const barColor = pct < 60 ? "#4ade80" : pct < 85 ? "#fbbf24" : "#f87171";

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      background: "#0f0f13",
      minHeight: "100vh",
      maxWidth: 430,
      margin: "0 auto",
      color: "#f0f0f5",
      paddingBottom: 90,
      position: "relative",
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, select { outline: none; -webkit-appearance: none; }
        button { cursor: pointer; border: none; }
        .card { background: #18181f; border-radius: 20px; padding: 18px; }
        .tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .chip { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1.5px solid transparent; transition: all .2s; white-space: nowrap; }
        .chip.active { background: #6c63ff; border-color: #6c63ff; color: #fff; }
        .chip.inactive { background: transparent; border-color: #2a2a35; color: #888; }
        .bill-item { display: flex; align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1px solid #1e1e28; }
        .bill-item:last-child { border-bottom: none; }
        input[type=text], input[type=number], select {
          background: #22222d; border: 1.5px solid #2e2e3d; border-radius: 12px;
          color: #f0f0f5; padding: 13px 16px; font-size: 15px; font-family: inherit; width: 100%;
          transition: border .2s;
        }
        input[type=text]:focus, input[type=number]:focus, select:focus { border-color: #6c63ff; }
        select option { background: #22222d; }
        .fab { position: fixed; bottom: 80px; left: 50%; transform: translateX(130px); width: 52px; height: 52px; border-radius: 50%; background: #6c63ff; color: #fff; font-size: 26px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px #6c63ff66; z-index: 10; }
        .nav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 10px 0; background: transparent; color: #666; font-size: 10px; font-weight: 600; }
        .nav-btn.active { color: #6c63ff; }
        .nav-btn svg { width: 22px; height: 22px; }
        .toggle-btn { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
        .del-btn { width: 28px; height: 28px; border-radius: 50%; background: #2a1a1a; color: #f87171; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
        .save-btn { width: 100%; padding: 15px; border-radius: 14px; background: #6c63ff; color: #fff; font-size: 16px; font-weight: 700; margin-top: 8px; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "54px 20px 16px", background: "linear-gradient(160deg, #15151f 0%, #0f0f13 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: 12, color: "#666", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, textTransform: 'capitalize' }}>{currentMonthYear}</p>
            <h1 style={{ fontSize: 26, fontWeight: 700, marginTop: 2 }}>Minhas Finanças</h1>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#a78bfa)", display: "flex", alignItems: "center", justifyCenter: "center", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>💰</div>
        </div>
      </div>

      {/* DASHBOARD */}
      {view === "dashboard" && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Renda */}
          <div className="card" style={{ background: "linear-gradient(135deg,#1e1b4b,#2d1f6e)", border: "1px solid #3730a355" }}>
            <p style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Renda mensal</p>
            {editingIncome ? (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input type="number" value={incomeInput} onChange={e => setIncomeInput(e.target.value)} style={{ flex: 1, fontSize: 24, fontWeight: 700, padding: "6px 12px" }} autoFocus />
                <button onClick={() => { setIncome(parseFloat(incomeInput) || 0); setEditingIncome(false); }}
                  style={{ background: "#6c63ff", color: "#fff", borderRadius: 10, padding: "0 14px", fontWeight: 700, fontSize: 14 }}>OK</button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
                <p style={{ fontSize: 32, fontWeight: 700 }}>{formatBRL(income)}</p>
                <button onClick={() => { setIncomeInput(String(income)); setEditingIncome(true); }}
                  style={{ background: "#ffffff15", color: "#a78bfa", borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>editar</button>
              </div>
            )}
          </div>

          {/* Gráfico de Barras */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "#888" }}>Comprometido</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: barColor }}>{pct}%</span>
            </div>
            <div style={{ background: "#2a2a35", borderRadius: 8, height: 10, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 8, transition: "width .4s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, gap: 8 }}>
              {[
                { label: "Total contas", val: totalBills, col: "#f87171" },
                { label: "Pagas", val: totalPaid, col: "#4ade80" },
                { label: "A pagar", val: totalPending, col: "#fbbf24" },
              ].map(item => (
                <div key={item.label} style={{ flex: 1, background: "#22222d", borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
                  <p style={{ fontSize: 10, color: "#666", marginBottom: 4 }}>{item.label}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: item.col }}>{formatBRL(item.val)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Saldo Livre */}
          <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 12, color: "#888" }}>Saldo livre</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: balance >= 0 ? "#4ade80" : "#f87171", marginTop: 2 }}>{formatBRL(balance)}</p>
            </div>
            <div style={{ fontSize: 40 }}>{balance >= 0 ? "😊" : "😰"}</div>
          </div>

          {/* Categorias */}
          <div className="card">
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#888" }}>Por categoria</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {categoryTotals.map(cat => (
                <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16, width: 24 }}>{cat.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#ccc" }}>{cat.label}</span>
                      <span style={{ fontSize: 12, color: "#aaa" }}>{formatBRL(cat.total)}</span>
                    </div>
                    <div style={{ background: "#2a2a35", borderRadius: 4, height: 5 }}>
                      <div style={{ width: `${cat.w}%`, height: "100%", background: "#6c63ff", borderRadius: 4 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LISTA DE CONTAS */}
      {view === "list" && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>
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
              <p style={{ textAlign: "center", color: "#555", padding: "20px 0" }}>Nenhuma conta ainda</p>
            )}
            {filteredBills.map(bill => {
              const cat = catInfo(bill.category);
              return (
                <div key={bill.id} className="bill-item">
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: bill.paid ? "#0a2a1a" : "#1e1e2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {cat.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 15, textDecoration: bill.paid ? "line-through" : "none", color: bill.paid ? "#555" : "#f0f0f5" }}>{bill.name}</p>
                    <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                      <span className="tag" style={{ background: "#1e1e2e", color: "#888" }}>{RECURRENCE.find(r => r.id === bill.recurrence)?.label}</span>
                    </div>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: bill.paid ? "#4ade80" : "#f87171", marginRight: 8 }}>{formatBRL(bill.amount)}</p>
                  <button className="toggle-btn" onClick={() => togglePaid(bill.id)}
                    style={{ background: bill.paid ? "#14532d" : "#1e1e2e", color: bill.paid ? "#4ade80" : "#555" }}>
                    {bill.paid ? "✓" : "○"}
                  </button>
                  <button className="del-btn" onClick={() => deleteBill(bill.id)}>✕</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ADICIONAR CONTA */}
      {view === "add" && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Nova conta</p>
          <input type="text" placeholder="Nome da conta" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input type="number" placeholder="Valor (R$)" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
          </select>
          <select value={form.recurrence} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))}>
            {RECURRENCE.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          <button className="save-btn" onClick={addBill}>Adicionar conta</button>
          <button onClick={() => setView("list")} style={{ background: "transparent", color: "#666", fontSize: 14, padding: "8px 0" }}>Cancelar</button>
        </div>
      )}

      {/* Botão FAB flutuante */}
      {view !== "add" && <button className="fab" onClick={() => setView("add")}>+</button>}

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
