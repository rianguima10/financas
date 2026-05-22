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

const RECURRENCE = [
  { id: "mensal", label: "Mensal" },
  { id: "quinzenal", label: "Quinzenal" },
  { id: "semanal", label: "Semanal" },
  { id: "unica", label: "Única vez" },
];

const METHODS = [
  { id: "cartao", label: "Cartão", emoji: "💳" },
  { id: "boleto", label: "Boleto", emoji: "📄" },
  { id: "pix", label: "Pix", emoji: "📱" },
];

const initialBills = [
  { id: 1, name: "Aluguel", amount: 1500, category: "moradia", recurrence: "mensal", paid: false, dueDate: "10", method: "boleto" },
  { id: 2, name: "Netflix", amount: 55.9, category: "assinatura", recurrence: "mensal", paid: true, dueDate: "15", method: "cartao" },
  { id: 3, name: "Mercado", amount: 800, category: "alimentacao", recurrence: "mensal", paid: false, dueDate: "05", method: "pix" },
];

export default function App() {
  const [income, setIncome] = useState(5000);
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState("5000");
  const [bills, setBills] = useState(initialBills);
  const [view, setView] = useState("list"); 
  const [form, setForm] = useState({ name: "", amount: "", category: "outros", recurrence: "mensal", dueDate: "05", method: "cartao" });
  const [filterMethod, setFilterMethod] = useState("all");
  const [nextId, setNextId] = useState(10);

  // Dashboards
  const totalBills = bills.reduce((s, b) => s + b.amount, 0);
  const totalPaid = bills.filter(b => b.paid).reduce((s, b) => s + b.amount, 0);
  const balance = income - totalPaid;
  const pct = Math.min(100, Math.round((totalPaid / (totalBills || 1)) * 100));

  // Filtragem inteligente por método de pagamento ao clicar nas opções
  const filteredBills = useMemo(() => {
    if (filterMethod === "all") return bills;
    return bills.filter(b => b.method === filterMethod);
  }, [bills, filterMethod]);

  // Total dinâmico baseado na sessão ativa
  const sessionTotal = useMemo(() => {
    return filteredBills.reduce((sum, b) => sum + b.amount, 0);
  }, [filteredBills]);

  const addBill = () => {
    if (!form.name || !form.amount) return;
    setBills(prev => [...prev, { 
      id: nextId, 
      name: form.name, 
      amount: parseFloat(form.amount), 
      category: form.category, 
      recurrence: form.recurrence, 
      dueDate: String(form.dueDate).padStart(2, "0"),
      method: form.method,
      paid: false 
    }]);
    setNextId(n => n + 1);
    setForm({ name: "", amount: "", category: "outros", recurrence: "mensal", dueDate: "05", method: "cartao" });
    setView("list");
  };

  const togglePaid = (id) => setBills(prev => prev.map(b => b.id === id ? { ...b, paid: !b.paid } : b));
  const deleteBill = (id) => setBills(prev => prev.filter(b => b.id !== id));
  const catInfo = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[7];

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
        
        /* Estilos das tags laterais de vencimento */
        .tag-venc { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; padding: 6px 10px; border-radius: 10px; font-size: 10px; font-weight: 700; line-height: 1.2; text-transform: uppercase; width: 56px; text-align: center; }
        .tag-venc.pending { background: #221c1a; color: #f87171; border: 1px solid #451a1a; }
        .tag-venc.paid { background: #142d1a; color: #4ade80; border: 1px solid #14532d; }
        .tag-inner { font-size: 11px; font-weight: 700; display: block; margin-top: 1px; }

        .tag-detail { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #1c1c24; color: #888; }
        
        /* Opções de clique superiores superiores */
        .chip { padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s; border: none; }
        .chip.active { background: #6c63ff; color: #fff; }
        .chip.inactive { background: #1c1c24; color: #666; }
        
        .bill-item { display: flex; align-items: center; gap: 14px; padding: 16px 0; border-bottom: 1px solid #1c1c26; }
        .bill-item:last-child { border-bottom: none; }
        
        input[type=text], input[type=number], select {
          background: #1c1c24; border: 1.5px solid #2a2a38; border-radius: 12px;
          color: #f0f0f5; padding: 13px 16px; font-size: 15px; font-family: inherit; width: 100%;
        }
        
        .fab { position: fixed; bottom: 80px; right: 20px; width: 52px; height: 52px; border-radius: 50%; background: #6c63ff; color: #fff; font-size: 26px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px #6c63ff66; z-index: 10; }
        .nav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 12px 0; background: transparent; color: #555; font-size: 11px; font-weight: 600; }
        .nav-btn.active { color: #6c63ff; }
        .nav-btn svg { width: 22px; height: 22px; }
        
        .toggle-btn { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
        .del-btn { width: 32px; height: 32px; border-radius: 50%; background: #261616; color: #ef4444; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
        .save-btn { width: 100%; padding: 15px; border-radius: 14px; background: #6c63ff; color: #fff; font-size: 16px; font-weight: 700; margin-top: 8px; }
      `}</style>

      {/* Header Fixo com Seletores de Data */}
      <div style={{ padding: "54px 20px 16px", background: "linear-gradient(160deg, #15151f 0%, #0f0f13 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <select style={{ width: "auto", background: "transparent", border: "none", fontSize: 20, fontWeight: 700, color: "#fff", appearance: "none" }}>
              <option value="5">Maio</option>
            </select>
            <select style={{ width: "auto", background: "transparent", border: "none", fontSize: 20, fontWeight: 700, color: "#fff", appearance: "none" }}>
              <option value="2026">2026</option>
            </select>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💰</div>
        </div>
        {view === "list" && <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 16 }}>Minhas Finanças</h1>}
      </div>

      {/* RESUMO (DASHBOARD) */}
      {view === "dashboard" && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card" style={{ background: "linear-gradient(135deg,#1e1b4b,#2d1f6e)", border: "1px solid #3730a355" }}>
            <p style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Renda Disponível</p>
            {editingIncome ? (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input type="number" value={incomeInput} onChange={e => setIncomeInput(e.target.value)} style={{ flex: 1, fontSize: 24, fontWeight: 700, padding: "6px 12px" }} autoFocus />
                <button onClick={() => { setIncome(parseFloat(incomeInput) || 0); setEditingIncome(false); }} style={{ background: "#6c63ff", color: "#fff", borderRadius: 10, padding: "0 14px", fontWeight: 700 }}>OK</button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
                <p style={{ fontSize: 32, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{formatBRL(income)}</p>
                <button onClick={() => { setIncomeInput(String(income)); setEditingIncome(true); }} style={{ background: "#ffffff15", color: "#a78bfa", borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>editar</button>
              </div>
            )}
          </div>

          <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 12, color: "#888" }}>Saldo Atual Livre (Renda - Pagas)</p>
              <p style={{ fontSize: 28, fontWeight: 700, fontFamily: "'DM Mono',monospace", color: balance >= 0 ? "#4ade80" : "#f87171", marginTop: 2 }}>{formatBRL(balance)}</p>
            </div>
            <div style={{ fontSize: 40 }}>{balance >= 0 ? "😊" : "😰"}</div>
          </div>

          {/* Atalho Cards de Métodos no Painel Geral */}
          <div style={{ display: "flex", gap: 10 }}>
            {METHODS.map(m => {
              const totalM = bills.filter(b => b.method === m.id).reduce((s, b) => s + b.amount, 0);
              return (
                <div key={m.id} className="card" style={{ flex: 1, textAlign: "center", padding: "14px 8px", cursor: "pointer", border: "1px solid #222" }} onClick={() => { setFilterMethod(m.id); setView("list"); }}>
                  <p style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>{m.emoji} {m.label}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, marginTop: 6, fontFamily: "'DM Mono',monospace" }}>{formatBRL(totalM)}</p>
                </div>
              );
            })}
          </div>

          {/* Progresso Geral */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "#888" }}>Progresso de Contas Pagas</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>{pct}%</span>
            </div>
            <div style={{ background: "#2a2a35", borderRadius: 8, height: 8, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "#4ade80", borderRadius: 8, transition: "width .4s" }} />
            </div>
          </div>
        </div>
      )}

      {/* LISTAGEM DE CONTAS FILTRADA PELAS 3 OPÇÕES */}
      {view === "list" && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          
          {/* BOTÕES DE SELEÇÃO: TODAS | CARTÃO | BOLETO | PIX */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            <button className={`chip ${filterMethod === "all" ? "active" : "inactive"}`} onClick={() => setFilterMethod("all")}>
              Todas ({bills.length})
            </button>
            {METHODS.map(m => {
              const count = bills.filter(b => b.method === m.id).length;
              return (
                <button key={m.id} className={`chip ${filterMethod === m.id ? "active" : "inactive"}`} onClick={() => setFilterMethod(m.id)}>
                  {m.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Card Dinâmico: Exibe o Total da Sessão que está ativa */}
          <div className="card" style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#13131a", border: "1px solid #222230" }}>
            <span style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>Total nesta sessão:</span>
            <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: "#fff" }}>{formatBRL(sessionTotal)}</span>
          </div>

          {/* Lista de Contas Recalculada */}
          <div className="card">
            {filteredBills.length === 0 && (
              <p style={{ textAlign: "center", color: "#555", padding: "24px 0", fontSize: 14 }}>Nenhuma conta nesta sessão</p>
            )}
            {filteredBills.map(bill => {
              const cat = catInfo(bill.category);
              const meth = METHODS.find(m => m.id === bill.method);
              return (
                <div key={bill.id} className="bill-item">
                  
                  {/* Tag Lateral Estilizada (Venc / Fatura) */}
                  <div className={`tag-venc ${bill.paid ? "paid" : "pending"}`}>
                    {bill.method === "cartao" ? "fatura" : "venc"}
                    <span className="tag-inner">Dia {bill.dueDate}</span>
                  </div>

                  {/* Informações centrais */}
                  <div style={{ flex: 1, paddingLeft: 4 }}>
                    <p style={{ fontWeight: 600, fontSize: 15, textDecoration: bill.paid ? "line-through" : "none", color: bill.paid ? "#555" : "#f0f0f5" }}>
                      {bill.name}
                    </p>
                    <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      <span className="tag-detail">{cat.emoji} {cat.label}</span>
                      {filterMethod === "all" && (
                        <span className="tag-detail">{meth?.emoji} {meth?.label}</span>
                      )}
                    </div>
                  </div>

                  {/* Valor final */}
                  <p style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: 15, color: bill.paid ? "#4ade80" : "#f87171" }}>
                    {formatBRL(bill.amount)}
                  </p>

                  <button className="toggle-btn" onClick={() => togglePaid(bill.id)} style={{ background: bill.paid ? "#14532d" : "#1c1c24", color: bill.paid ? "#4ade80" : "#444", border: bill.paid ? "none" : "1.5px solid #333" }}>
                    {bill.paid ? "✓" : "○"}
                  </button>
                  <button className="del-btn" onClick={() => deleteBill(bill.id)}>✕</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* COMPONENTE ADICIONAR CONTA */}
      {view === "add" && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Nova conta</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Nome da conta</label>
            <input type="text" placeholder="Ex: Internet" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Valor (R$)</label>
            <input type="number" placeholder="0,00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Dia do Vencimento</label>
            <select value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}>
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i + 1} value={String(i + 1).padStart(2, "0")}>Dia {String(i + 1).padStart(2, "0")}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Forma de Pagamento (Sessão)</label>
            <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
              {METHODS.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.label}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Categoria</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </select>
          </div>

          <button className="save-btn" onClick={addBill}>Adicionar conta</button>
          <button onClick={() => setView("list")} style={{ background: "transparent", color: "#666", fontSize: 14, padding: "8px 0" }}>Cancelar</button>
        </div>
      )}

      {/* FAB */}
      {view !== "add" && <button className="fab" onClick={() => setView("add")}>+</button>}

      {/* Bottom Nav Bar */}
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
