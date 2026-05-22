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
  { id: "cartao", label: "Cartão de Crédito", emoji: "💳" },
  { id: "boleto", label: "Boleto Bancário", emoji: "📄" },
  { id: "pix", label: "Pix / À Vista", emoji: "📱" },
];

const initialBills = [
  { id: 1, name: "Aluguel", amount: 1500, category: "moradia", paid: false, dueDate: "10", method: "boleto" },
  { id: 2, name: "Netflix", amount: 55.9, category: "assinatura", paid: true, method: "cartao", currentInstallment: 1, totalInstallments: 1 },
  { id: 3, name: "Smartphone", amount: 120, category: "outros", paid: false, method: "cartao", currentInstallment: 3, totalInstallments: 10 },
  { id: 4, name: "Mercado", amount: 800, category: "alimentacao", paid: false, dueDate: "05", method: "pix" },
];

export default function App() {
  const [income, setIncome] = useState(5000);
  const [bills, setBills] = useState(initialBills);
  const [view, setView] = useState("list"); 
  const [form, setForm] = useState({ name: "", amount: "", category: "outros", dueDate: "05", method: "cartao", currentInstallment: "1", totalInstallments: "1" });
  const [filterMethod, setFilterMethod] = useState("all");
  const [nextId, setNextId] = useState(10);

  // Vencimento geral da Fatura do Cartão de Crédito gerenciado dentro da categoria
  const [creditCardDueDate, setCreditCardDueDate] = useState("15");
  const [expandedMethod, setExpandedMethod] = useState(null);

  const totalPaid = bills.filter(b => b.paid).reduce((s, b) => s + b.amount, 0);
  const balance = income - totalPaid;

  const filteredBills = useMemo(() => {
    if (filterMethod === "all") return bills;
    return bills.filter(b => b.method === filterMethod);
  }, [bills, filterMethod]);

  const sessionTotal = useMemo(() => {
    return filteredBills.reduce((sum, b) => sum + b.amount, 0);
  }, [filteredBills]);

  const addBill = () => {
    if (!form.name || !form.amount) return;
    
    const isCartao = form.method === "cartao";

    setBills(prev => [...prev, { 
      id: nextId, 
      name: form.name, 
      amount: parseFloat(form.amount), 
      category: form.category, 
      dueDate: isCartao ? null : String(form.dueDate).padStart(2, "0"),
      method: form.method,
      currentInstallment: isCartao ? parseInt(form.currentInstallment || 1) : null,
      totalInstallments: isCartao ? parseInt(form.totalInstallments || 1) : null,
      paid: false 
    }]);
    setNextId(n => n + 1);
    setForm({ name: "", amount: "", category: "outros", dueDate: "05", method: "cartao", currentInstallment: "1", totalInstallments: "1" });
    setView("list");
  };

  const togglePaid = (id) => setBills(prev => prev.map(b => b.id === id ? { ...b, paid: !b.paid } : b));
  const deleteBill = (id) => setBills(prev => prev.filter(b => b.id !== id));
  const catInfo = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[7];
  const toggleExpand = (methodId) => setExpandedMethod(expandedMethod === methodId ? null : methodId);

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
        
        .tag-venc { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; padding: 6px 10px; border-radius: 10px; font-size: 10px; font-weight: 700; line-height: 1.2; text-transform: uppercase; width: 56px; text-align: center; }
        .tag-venc.pending { background: #221c1a; color: #f87171; border: 1px solid #451a1a; }
        .tag-venc.paid { background: #142d1a; color: #4ade80; border: 1px solid #14532d; }
        .tag-inner { font-size: 11px; font-weight: 700; display: block; margin-top: 1px; }

        .tag-detail { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #1c1c24; color: #888; }
        .tag-installment { display: inline-flex; background: #2a2a3d; color: #a78bfa; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; font-family: 'DM Mono', monospace; }
        
        .chip { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1.5px solid transparent; transition: all .2s; white-space: nowrap; }
        .chip.active { background: #6c63ff; border-color: #6c63ff; color: #fff; }
        .chip.inactive { background: #1e1e27; border-color: #2a2a35; color: #888; }
        
        .bill-item { display: flex; align-items: center; gap: 14px; padding: 16px 0; border-bottom: 1px solid #1c1c26; }
        .bill-item:last-child { border-bottom: none; }

        .accordion-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: #1f1f2e; border-radius: 12px; margin-bottom: 8px; cursor: pointer; transition: background 0.2s; border: 1px solid #2a2a3d; }
        
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

        .due-card-selector { display: flex; align-items: center; justify-content: space-between; background: #181822; padding: 10px 14px; border-radius: 10px; margin-bottom: 14px; border: 1px dashed #444366; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "54px 20px 16px", background: "linear-gradient(160deg, #15151f 0%, #0f0f13 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 20, fontWeight: 700 }}>Maio</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#666" }}>2026</span>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💰</div>
        </div>
        {view === "list" && <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 16 }}>Minhas Finanças</h1>}
      </div>

      {/* RESUMO / DASHBOARD */}
      {view === "dashboard" && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card">
            <p style={{ fontSize: 12, color: "#888" }}>Saldo Atual Livre</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: balance >= 0 ? "#4ade80" : "#f87171", marginTop: 2 }}>{formatBRL(balance)}</p>
          </div>
        </div>
      )}

      {/* LISTA DE CONTAS */}
      {view === "list" && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            <button className={`chip ${filterMethod === "all" ? "active" : "inactive"}`} onClick={() => setFilterMethod("all")}>
              Todas
            </button>
            {METHODS.map(m => (
              <button key={m.id} className={`chip ${filterMethod === m.id ? "active" : "inactive"}`} onClick={() => setFilterMethod(m.id)}>
                {m.label.split(" ")[0]}
              </button>
            ))}
          </div>

          <div className="card" style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#13131a", border: "1px solid #222230" }}>
            <span style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>Total visível:</span>
            <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{formatBRL(sessionTotal)}</span>
          </div>

          {filterMethod === "all" ? (
            <div>
              {METHODS.map(method => {
                const methodBills = bills.filter(b => b.method === method.id);
                const methodTotal = methodBills.reduce((s, b) => s + b.amount, 0);
                const isExpanded = expandedMethod === method.id;

                return (
                  <div key={method.id} style={{ marginBottom: 10 }}>
                    <div className="accordion-header" onClick={() => toggleExpand(method.id)} style={{ borderColor: isExpanded ? "#6c63ff" : "#2a2a3d" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 16 }}>{method.emoji}</span>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>{method.label}</span>
                        <span style={{ fontSize: 11, background: "#2a2a3d", padding: "2px 8px", borderRadius: 10, color: "#aaa" }}>
                          {methodBills.length}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, color: "#bbb" }}>
                          {formatBRL(methodTotal)}
                        </span>
                        <span style={{ fontSize: 12, color: "#6c63ff", fontWeight: "bold" }}>
                          {isExpanded ? "▲" : "▼"}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="card" style={{ borderRadius: "0px 0px 16px 16px", marginTop: -12, marginBottom: 12, borderTop: "none", background: "#13131a" }}>
                        
                        {/* Ajuste do Vencimento geral da Fatura dentro do Grupo Cartão de Crédito */}
                        {method.id === "cartao" && (
                          <div className="due-card-selector">
                            <span style={{ fontSize: 12, color: "#999", fontWeight: 500 }}>📅 Vencimento da Fatura:</span>
                            <select 
                              value={creditCardDueDate} 
                              onChange={(e) => setCreditCardDueDate(e.target.value)}
                              style={{ width: "auto", padding: "4px 8px", fontSize: 12, borderRadius: 8, height: "auto", background: "#222" }}
                            >
                              {Array.from({ length: 31 }, (_, i) => {
                                const d = String(i + 1).padStart(2, "0");
                                return <option key={d} value={d}>Dia {d}</option>;
                              })}
                            </select>
                          </div>
                        )}

                        {methodBills.length === 0 ? (
                          <p style={{ textAlign: "center", color: "#555", padding: "12px 0", fontSize: 13 }}>Nenhuma conta lançada aqui</p>
                        ) : (
                          methodBills.map(bill => {
                            const cat = catInfo(bill.category);
                            return (
                              <div key={bill.id} className="bill-item">
                                <div className={`tag-venc ${bill.paid ? "paid" : "pending"}`}>
                                  {bill.method === "cartao" ? "fatura" : "venc"}
                                  <span className="tag-inner">
                                    Dia {bill.method === "cartao" ? creditCardDueDate : bill.dueDate}
                                  </span>
                                </div>
                                <div style={{ flex: 1, paddingLeft: 4 }}>
                                  <p style={{ fontWeight: 600, fontSize: 14, textDecoration: bill.paid ? "line-through" : "none", color: bill.paid ? "#555" : "#f0f0f5" }}>
                                    {bill.name}
                                  </p>
                                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
                                    <span className="tag-detail">{cat.emoji} {cat.label}</span>
                                    {bill.method === "cartao" && bill.totalInstallments && (
                                      <span className="tag-installment">
                                        {bill.currentInstallment}/{bill.totalInstallments}x
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: 14, color: bill.paid ? "#4ade80" : "#f87171" }}>
                                  {formatBRL(bill.amount)}
                                </p>
                                <button className="toggle-btn" onClick={() => togglePaid(bill.id)} style={{ background: bill.paid ? "#14532d" : "#1c1c24", color: bill.paid ? "#4ade80" : "#444", border: bill.paid ? "none" : "1.5px solid #333" }}>
                                  {bill.paid ? "✓" : "○"}
                                </button>
                                <button className="del-btn" onClick={() => deleteBill(bill.id)}>✕</button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card">
              {filteredBills.length === 0 && (
                <p style={{ textAlign: "center", color: "#555", padding: "24px 0", fontSize: 14 }}>Nenhuma conta nesta sessão</p>
              )}
              {filteredBills.map(bill => {
                const cat = catInfo(bill.category);
                return (
                  <div key={bill.id} className="bill-item">
                    <div className={`tag-venc ${bill.paid ? "paid" : "pending"}`}>
                      {bill.method === "cartao" ? "fatura" : "venc"}
                      <span className="tag-inner">
                        Dia {bill.method === "cartao" ? creditCardDueDate : bill.dueDate}
                      </span>
                    </div>
                    <div style={{ flex: 1, paddingLeft: 4 }}>
                      <p style={{ fontWeight: 600, fontSize: 15, textDecoration: bill.paid ? "line-through" : "none", color: bill.paid ? "#555" : "#f0f0f5" }}>
                        {bill.name}
                      </p>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
                        <span className="tag-detail">{cat.emoji} {cat.label}</span>
                        {bill.method === "cartao" && bill.totalInstallments && (
                          <span className="tag-installment">
                            {bill.currentInstallment}/{bill.totalInstallments}x
                          </span>
                        )}
                      </div>
                    </div>
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
          )}
        </div>
      )}

      {/* COMPONENTE ADICIONAR CONTA */}
      {view === "add" && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Nova conta</p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Nome da conta</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Valor (R$)</label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Forma de Pagamento</label>
            <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value, currentInstallment: "1", totalInstallments: "1" }))}>
              {METHODS.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.label}</option>)}
            </select>
          </div>

          {/* Oculta data de vencimento e exibe Parcelas se for Cartão de Crédito */}
          {form.method === "cartao" ? (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Parcela Atual</label>
                <input type="number" min="1" value={form.currentInstallment} onChange={e => setForm(f => ({ ...f, currentInstallment: e.target.value }))} />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Total Parcelas</label>
                <input type="number" min="1" value={form.totalInstallments} onChange={e => setForm(f => ({ ...f, totalInstallments: e.target.value }))} />
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Dia do Vencimento</label>
              <select value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}>
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1).padStart(2, "0")}>Dia {String(i + 1).padStart(2, "0")}</option>
                ))}
              </select>
            </div>
          )}

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
