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

const initialBills = [
  { id: 1, name: "Mercado", amount: 800, category: "alimentacao", paid: false, dueDate: "05", method: "pix" },
  { id: 2, name: "Aluguel", amount: 1500, category: "moradia", paid: false, dueDate: "10", method: "boleto" },
  { id: 3, name: "Netflix", amount: 55.9, category: "assinatura", paid: true, method: "cartao", currentInstallment: 1, totalInstallments: 1 },
];

export default function App() {
  const [income, setIncome] = useState(5000);
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState("5000");
  const [bills, setBills] = useState(initialBills);
  const [view, setView] = useState("list"); 
  const [filterMethod, setFilterMethod] = useState("all");
  const [nextId, setNextId] = useState(10);

  // Vencimento geral da Fatura do Cartão de Crédito
  const [creditCardDueDate, setCreditCardDueDate] = useState("15");

  // Estado do formulário de cadastro
  const [form, setForm] = useState({
    name: "",
    amount: "",
    category: "outros",
    dueDate: "05",
    method: "cartao",
    currentInstallment: "1",
    totalInstallments: "1"
  });

  const totalBills = bills.reduce((s, b) => s + b.amount, 0);
  const totalPaid = bills.filter(b => b.paid).reduce((s, b) => s + b.amount, 0);
  const totalPending = totalBills - totalPaid;
  const balance = income - totalPaid;

  const filteredBills = useMemo(() => {
    if (filterMethod === "all") return bills;
    return bills.filter(b => b.method === filterMethod);
  }, [bills, filterMethod]);

  const sessionTotal = useMemo(() => {
    return filteredBills.reduce((sum, b) => sum + b.amount, 0);
  }, [filteredBills]);

  // Totais por método para os cards do dashboard
  const methodTotals = useMemo(() => {
    return {
      cartao: bills.filter(b => b.method === "cartao").reduce((s, b) => s + b.amount, 0),
      boleto: bills.filter(b => b.method === "boleto").reduce((s, b) => s + b.amount, 0),
      pix: bills.filter(b => b.method === "pix").reduce((s, b) => s + b.amount, 0),
    };
  }, [bills]);

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

  const handleSaveIncome = () => {
    const val = parseFloat(incomeInput);
    if (!isNaN(val)) setIncome(val);
    setEditingIncome(false);
  };

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
        input, select { outline: none; }
        button { cursor: pointer; border: none; }
        
        .main-card { background: #14141e; border-radius: 24px; padding: 20px; margin-bottom: 16px; border: 1px solid #1f1f2e; }
        
        .tag-venc { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; padding: 6px 10px; border-radius: 12px; font-size: 9px; font-weight: 700; line-height: 1.2; text-transform: uppercase; width: 58px; text-align: center; }
        .tag-venc.pending { background: #221616; color: #f87171; border: 1px solid #3d1d1d; }
        .tag-venc.paid { background: #112417; color: #4ade80; border: 1px solid #163d22; }
        .tag-venc.fatura { background: #161b2c; color: #60a5fa; border: 1px solid #1e294b; }
        .tag-inner { font-size: 11px; font-weight: 700; display: block; margin-top: 1px; }

        .sub-tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #1c1c28; color: #a0a0b0; }
        .sub-tag.info { background: #1e1b4b; color: #a78bfa; }
        
        .chip { padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1.5px solid transparent; transition: all .2s; white-space: nowrap; display: flex; align-items: center; gap: 6px; }
        .chip.active { background: #4f46e5; border-color: #4f46e5; color: #fff; }
        .chip.inactive { background: #14141e; border-color: #222232; color: #707080; }
        
        .bill-item { display: flex; align-items: center; gap: 12px; padding: 16px 0; border-bottom: 1px solid #1f1f2e; }
        .bill-item:last-child { border-bottom: none; }
        
        input[type=text], input[type=number], select {
          background: #14141e; border: 1.5px solid #222232; border-radius: 14px;
          color: #f0f0f5; padding: 14px 16px; font-size: 15px; font-family: inherit; width: 100%;
        }
        input[type=text]:focus, input[type=number]:focus, select:focus { border-color: #4f46e5; }
        
        .fab { position: fixed; bottom: 85px; right: 20px; width: 56px; height: 56px; border-radius: 50%; background: #4f46e5; color: #fff; font-size: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(79, 70, 229, 0.4); z-index: 10; }
        
        .nav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 0; background: transparent; color: #4e4e62; font-size: 11px; font-weight: 600; }
        .nav-btn.active { color: #4f46e5; }
        .nav-btn svg { width: 22px; height: 22px; }
        
        .toggle-btn { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
        .del-btn { width: 34px; height: 34px; border-radius: 50%; background: #221616; color: #f87171; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
        .save-btn { width: 100%; padding: 16px; border-radius: 16px; background: #4f46e5; color: #fff; font-size: 16px; font-weight: 700; margin-top: 10px; }

        .config-card-due { display: flex; align-items: center; justify-content: space-between; background: #1a1a26; padding: 12px 16px; border-radius: 16px; margin-bottom: 12px; border: 1px dashed #3a3a52; }
      `}</style>

      {/* Top Header Selector */}
      <div style={{ padding: "40px 20px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select style={{ background: "transparent", border: "none", width: "auto", padding: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>
            <option value="05">Maio</option>
          </select>
          <select style={{ background: "transparent", border: "none", width: "auto", padding: 0, fontSize: 18, fontWeight: 700, color: "#666" }}>
            <option value="2026">2026</option>
          </select>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#222235", display: "flex", alignItems: "center", justify-content: "center", fontSize: 16 }}>💰</div>
      </div>

      {/* TELA DE RESUMO (DASHBOARD) */}
      {view === "dashboard" && (
        <div style={{ padding: "0 16px" }}>
          <div className="main-card" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #14141e 100%)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Renda Disponível</p>
              <button onClick={() => { setEditingIncome(!editingIncome); setIncomeInput(String(income)); }} style={{ background: "#2e2a5e", color: "#c084fc", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                {editingIncome ? "Cancelar" : "editar"}
              </button>
            </div>
            {editingIncome ? (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input type="number" value={incomeInput} onChange={e => setIncomeInput(e.target.value)} style={{ padding: "8px 12px", fontSize: 16 }} />
                <button onClick={handleSaveIncome} style={{ background: "#4f46e5", padding: "0 16px", borderRadius: 12, fontWeight: "bold" }}>Salvar</button>
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

          {/* Grid de métodos de pagamento idêntico ao original */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div className="main-card" style={{ flex: 1, marginBottom: 0, padding: 14 }}>
              <p style={{ fontSize: 11, color: "#f87171", fontWeight: 600 }}>💳 Cartão</p>
              <p style={{ fontSize: 16, fontWeight: 700, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>{formatBRL(methodTotals.cartao)}</p>
            </div>
            <div className="main-card" style={{ flex: 1, marginBottom: 0, padding: 14 }}>
              <p style={{ fontSize: 11, color: "#34d399", fontWeight: 600 }}>📄 Boleto</p>
              <p style={{ fontSize: 16, fontWeight: 700, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>{formatBRL(methodTotals.boleto)}</p>
            </div>
            <div className="main-card" style={{ flex: 1, marginBottom: 0, padding: 14 }}>
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16, pt: 8, borderTop: "1px solid #1f1f2e", textAlign: "center" }}>
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

      {/* TELA DE LISTAGEM DE CONTAS */}
      {view === "list" && (
        <div style={{ padding: "0 16px" }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 16 }}>Minhas Finanças</h1>

          {/* Filtros horizontais em Chips */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12 }}>
            <button className={`chip ${filterMethod === "all" ? "active" : "inactive"}`} onClick={() => setFilterMethod("all")}>
              Todas ({bills.length})
            </button>
            {METHODS.map(m => (
              <button key={m.id} className={`chip ${filterMethod === m.id ? "active" : "inactive"}`} onClick={() => setFilterMethod(m.id)}>
                {m.emoji} {m.label} ({bills.filter(b => b.method === m.id).length})
              </button>
            ))}
          </div>

          {/* Novo Ajuste: Opção de definir o dia do vencimento do cartão quando selecionada a categoria cartão */}
          {filterMethod === "cartao" && (
            <div className="config-card-due">
              <span style={{ fontSize: 13, color: "#a0a0b0", fontWeight: 500 }}>📅 Dia do Vencimento da Fatura:</span>
              <select 
                value={creditCardDueDate} 
                onChange={(e) => setCreditCardDueDate(e.target.value)}
                style={{ width: "auto", padding: "6px 12px", fontSize: 13, borderRadius: 10, height: "auto", background: "#1c1c28" }}
              >
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

          {/* Card com a lista real de contas */}
          <div className="main-card" style={{ padding: "4px 20px" }}>
            {filteredBills.length === 0 ? (
              <p style={{ textAlign: "center", color: "#505060", padding: "30px 0", fontSize: 14 }}>Nenhuma conta lançada aqui.</p>
            ) : (
              filteredBills.map(bill => {
                const cat = catInfo(bill.category);
                const isCartao = bill.method === "cartao";
                return (
                  <div key={bill.id} className="bill-item">
                    
                    {/* Badge lateral inteligente de vencimento */}
                    <div className={`tag-venc ${bill.paid ? "paid" : (isCartao ? "fatura" : "pending")}`}>
                      {isCartao ? "Fatura" : "Venc"}
                      <span className="tag-inner">
                        Dia {isCartao ? creditCardDueDate : bill.dueDate}
                      </span>
                    </div>

                    {/* Detalhes da Conta */}
                    <div style={{ flex: 1, paddingLeft: 4 }}>
                      <p style={{ fontWeight: 600, fontSize: 15, textDecoration: bill.paid ? "line-through" : "none", color: bill.paid ? "#505060" : "#f0f0f5" }}>
                        {bill.name}
                      </p>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
                        <span className="sub-tag">{cat.emoji} {cat.label}</span>
                        {isCartao && bill.totalInstallments && (
                          <span className="sub-tag info">
                            {bill.currentInstallment}/{bill.totalInstallments}x
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Preço e Ações */}
                    <p style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 15, color: bill.paid ? "#4ade80" : "#f87171", marginRight: 4 }}>
                      {formatBRL(bill.amount)}
                    </p>
                    
                    <button className="toggle-btn" onClick={() => togglePaid(bill.id)} style={{ background: bill.paid ? "#11381e" : "#14141e", color: bill.paid ? "#4ade80" : "#303040", border: bill.paid ? "none" : "1.5px solid #222235" }}>
                      {bill.paid ? "✓" : "○"}
                    </button>
                    
                    <button className="del-btn" onClick={() => deleteBill(bill.id)}>✕</button>
                  </div>
                );
              })
            )}
          </div>
          <p style={{ textAlign: "center", color: "#505060", fontSize: 11, marginTop: 10 }}>💡 Dica: Dê um toque em cima do valor da conta para modificá-la rapidamente!</p>
        </div>
      )}

      {/* FORMULÁRIO COMPLETO PARA ADICIONAR CONTA */}
      {view === "add" && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Nova conta</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#808090", fontWeight: 600 }}>Nome da conta</label>
            <input type="text" placeholder="Ex: Aluguel" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#808090", fontWeight: 600 }}>Valor (R$)</label>
            <input type="number" placeholder="0,00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#808090", fontWeight: 600 }}>Forma de Pagamento</label>
            <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value, currentInstallment: "1", totalInstallments: "1" }))}>
              {METHODS.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.label}</option>)}
            </select>
          </div>

          {/* Condicional Inteligente: Se for Cartão, remove data e adiciona parcelas */}
          {form.method === "cartao" ? (
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, color: "#808090", fontWeight: 600 }}>Parcela Atual</label>
                <input type="number" min="1" value={form.currentInstallment} onChange={e => setForm(f => ({ ...f, currentInstallment: e.target.value }))} />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, color: "#808090", fontWeight: 600 }}>Total Parcelas</label>
                <input type="number" min="1" value={form.totalInstallments} onChange={e => setForm(f => ({ ...f, totalInstallments: e.target.value }))} />
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "#808090", fontWeight: 600 }}>Dia do Vencimento</label>
              <select value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}>
                {Array.from({ length: 31 }, (_, i) => {
                  const d = String(i + 1).padStart(2, "0");
                  return <option key={d} value={d}>Dia {d}</option>;
                })}
              </select>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#808090", fontWeight: 600 }}>Categoria</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </select>
          </div>

          <button className="save-btn" onClick={addBill}>Adicionar conta</button>
          <button onClick={() => setView("list")} style={{ background: "transparent", color: "#606070", fontSize: 14, padding: "8px 0", fontWeight: 500 }}>Cancelar</button>
        </div>
      )}

      {/* Botão de Ação Flutuante (FAB) */}
      {view !== "add" && <button className="fab" onClick={() => setView("add")}>+</button>}

      {/* Menu de Navegação Inferior Flutuante (Fixo) */}
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
