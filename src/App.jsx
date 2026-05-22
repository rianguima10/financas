// App.jsx
import { useEffect, useMemo, useState } from "react";

const formatBRL = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

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
  { value: 0, label: "Janeiro" },
  { value: 1, label: "Fevereiro" },
  { value: 2, label: "Março" },
  { value: 3, label: "Abril" },
  { value: 4, label: "Maio" },
  { value: 5, label: "Junho" },
  { value: 6, label: "Julho" },
  { value: 7, label: "Agosto" },
  { value: 8, label: "Setembro" },
  { value: 9, label: "Outubro" },
  { value: 10, label: "Novembro" },
  { value: 11, label: "Dezembro" },
];

const YEARS = [2024, 2025, 2026, 2027, 2028];

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const initialBills = [
  {
    id: crypto.randomUUID(),
    name: "Mercado",
    amount: 800,
    category: "alimentacao",
    method: "pix",
    dueDate: "05",
    startMonth: 4,
    startYear: 2026,
    frequencyType: "mensal",
    paidMonths: {},
  },
];

export default function App() {
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const [income, setIncome] = useState(5000);
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState("5000");

  const [view, setView] = useState("dashboard");

  const [filterMethod, setFilterMethod] = useState("all");

  const [creditCardDueDate, setCreditCardDueDate] = useState("15");

  const [editingBill, setEditingBill] = useState(null);

  const [bills, setBills] = useState(initialBills);

  const [form, setForm] = useState({
    name: "",
    amount: "",
    category: "outros",
    dueDate: "05",
    method: "cartao",
    frequencyType: "parcelado",
    currentInstallment: "1",
    totalInstallments: "1",
  });

  // =========================
  // LOCAL STORAGE
  // =========================

  useEffect(() => {
    const savedBills = localStorage.getItem("fin_bills");
    const savedIncome = localStorage.getItem("fin_income");
    const savedDue = localStorage.getItem("fin_due");

    if (savedBills) setBills(JSON.parse(savedBills));
    if (savedIncome) setIncome(JSON.parse(savedIncome));
    if (savedDue) setCreditCardDueDate(savedDue);
  }, []);

  useEffect(() => {
    localStorage.setItem("fin_bills", JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem("fin_income", JSON.stringify(income));
  }, [income]);

  useEffect(() => {
    localStorage.setItem("fin_due", creditCardDueDate);
  }, [creditCardDueDate]);

  // =========================
  // HELPERS
  // =========================

  const monthKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

  const isBillPaid = (bill) => {
    return bill.paidMonths?.[monthKey] || false;
  };

  const togglePaid = (id) => {
    setBills((prev) =>
      prev.map((bill) => {
        if (bill.id !== id) return bill;

        const current = bill.paidMonths?.[monthKey];

        return {
          ...bill,
          paidMonths: {
            ...bill.paidMonths,
            [monthKey]: !current,
          },
        };
      })
    );
  };

  // =========================
  // BILLS MONTH
  // =========================

  const billsForSelectedMonth = useMemo(() => {
    return bills
      .map((bill) => {
        const monthsDiff =
          (currentYear - bill.startYear) * 12 +
          (currentMonth - bill.startMonth);

        if (monthsDiff < 0) return null;

        if (bill.frequencyType === "mensal") {
          return bill;
        }

        if (
          bill.frequencyType === "parcelado" &&
          bill.totalInstallments
        ) {
          const installment =
            bill.currentInstallment + monthsDiff;

          if (
            installment >= 1 &&
            installment <= bill.totalInstallments
          ) {
            return {
              ...bill,
              currentInstallment: installment,
            };
          }
        }

        if (
          bill.frequencyType === "unica" &&
          monthsDiff === 0
        ) {
          return bill;
        }

        return null;
      })
      .filter(Boolean);
  }, [bills, currentMonth, currentYear]);

  // =========================
  // CALENDAR
  // =========================

  const calendarDays = useMemo(() => {
    const firstDay = new Date(
      currentYear,
      currentMonth,
      1
    ).getDay();

    const totalDays = new Date(
      currentYear,
      currentMonth + 1,
      0
    ).getDate();

    const arr = [];

    for (let i = 0; i < firstDay; i++) {
      arr.push(null);
    }

    for (let d = 1; d <= totalDays; d++) {
      arr.push(d);
    }

    return arr;
  }, [currentMonth, currentYear]);

  const dayStatusMap = useMemo(() => {
    const map = {};

    billsForSelectedMonth.forEach((bill) => {
      const day =
        bill.method === "cartao"
          ? parseInt(creditCardDueDate)
          : parseInt(bill.dueDate);

      if (!map[day]) {
        map[day] = {
          hasPending: false,
          hasPaid: false,
        };
      }

      if (isBillPaid(bill)) {
        map[day].hasPaid = true;
      } else {
        map[day].hasPending = true;
      }
    });

    return map;
  }, [billsForSelectedMonth, monthKey, creditCardDueDate]);

  // =========================
  // TOTALS
  // =========================

  const totalBills = billsForSelectedMonth.reduce(
    (s, b) => s + b.amount,
    0
  );

  const totalPaid = billsForSelectedMonth
    .filter((b) => isBillPaid(b))
    .reduce((s, b) => s + b.amount, 0);

  const totalPending = totalBills - totalPaid;

  const balance = income - totalPaid;

  const methodTotals = useMemo(() => {
    return {
      cartao: billsForSelectedMonth
        .filter((b) => b.method === "cartao")
        .reduce((s, b) => s + b.amount, 0),

      boleto: billsForSelectedMonth
        .filter((b) => b.method === "boleto")
        .reduce((s, b) => s + b.amount, 0),

      pix: billsForSelectedMonth
        .filter((b) => b.method === "pix")
        .reduce((s, b) => s + b.amount, 0),
    };
  }, [billsForSelectedMonth]);

  const filteredBills =
    filterMethod === "all"
      ? billsForSelectedMonth
      : billsForSelectedMonth.filter(
          (b) => b.method === filterMethod
        );

  const sessionTotal = filteredBills.reduce(
    (s, b) => s + b.amount,
    0
  );

  // =========================
  // ADD / EDIT
  // =========================

  const resetForm = () => {
    setForm({
      name: "",
      amount: "",
      category: "outros",
      dueDate: "05",
      method: "cartao",
      frequencyType: "parcelado",
      currentInstallment: "1",
      totalInstallments: "1",
    });
  };

  const saveBill = () => {
    if (!form.name || !form.amount) return;

    const isCard = form.method === "cartao";

    const billData = {
      name: form.name,
      amount: parseFloat(form.amount),
      category: form.category,
      dueDate: isCard
        ? null
        : String(form.dueDate).padStart(2, "0"),
      method: form.method,
      frequencyType: isCard
        ? "parcelado"
        : form.frequencyType,
      currentInstallment: parseInt(
        form.currentInstallment || 1
      ),
      totalInstallments: parseInt(
        form.totalInstallments || 1
      ),
    };

    if (editingBill) {
      setBills((prev) =>
        prev.map((b) =>
          b.id === editingBill.id
            ? { ...b, ...billData }
            : b
        )
      );
    } else {
      setBills((prev) => [
        ...prev,
        {
          ...billData,
          id: crypto.randomUUID(),
          startMonth: currentMonth,
          startYear: currentYear,
          paidMonths: {},
        },
      ]);
    }

    resetForm();
    setEditingBill(null);
    setView("list");
  };

  const startEdit = (bill) => {
    setEditingBill(bill);

    setForm({
      name: bill.name,
      amount: String(bill.amount),
      category: bill.category,
      dueDate: bill.dueDate || "05",
      method: bill.method,
      frequencyType: bill.frequencyType,
      currentInstallment: String(
        bill.currentInstallment || 1
      ),
      totalInstallments: String(
        bill.totalInstallments || 1
      ),
    });

    setView("add");
  };

  const deleteBill = (id) => {
    setBills((prev) => prev.filter((b) => b.id !== id));
  };

  const catInfo = (id) =>
    CATEGORIES.find((c) => c.id === id);

  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: "#0b0b0f",
        minHeight: "100vh",
        maxWidth: 430,
        margin: "0 auto",
        color: "#f0f0f5",
        paddingBottom: 100,
      }}
    >
      <style>{`
        *{
          box-sizing:border-box;
        }

        body{
          margin:0;
        }

        input,select,button{
          font-family:inherit;
          border:none;
          outline:none;
        }

        .main-card{
          background:#14141e;
          border:1px solid #1f1f2e;
          border-radius:24px;
          padding:20px;
          margin-bottom:16px;
        }

        .form-input{
          width:100%;
          padding:14px;
          border-radius:14px;
          background:#1a1a26;
          color:white;
          border:1px solid #26263a;
        }

        .save-btn{
          width:100%;
          padding:16px;
          border-radius:16px;
          background:#4f46e5;
          color:white;
          font-weight:700;
        }

        .bill-item{
          display:flex;
          align-items:center;
          gap:12px;
          padding:16px 0;
          border-bottom:1px solid #1f1f2e;
        }

        .bill-item:last-child{
          border-bottom:none;
        }

        .chip{
          padding:8px 16px;
          border-radius:18px;
          cursor:pointer;
        }

        .chip.active{
          background:#4f46e5;
          color:white;
        }

        .chip.inactive{
          background:#181824;
          color:#888;
        }

        .cal-grid{
          display:grid;
          grid-template-columns:repeat(7,1fr);
          gap:6px;
        }

        .cal-week{
          text-align:center;
          font-size:11px;
          color:#666;
          font-weight:700;
        }

        .cal-day{
          height:38px;
          border-radius:12px;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#1a1a26;
          font-size:13px;
          font-weight:700;
        }

        .cal-day.empty{
          background:transparent;
        }

        .bill-paid{
          background:#112417;
          color:#4ade80;
        }

        .bill-pending{
          background:#2a1717;
          color:#f87171;
        }

        .bill-mixed{
          background:#2d2412;
          color:#fbbf24;
        }

      `}</style>

      {/* HEADER */}
      <div
        style={{
          padding: "40px 20px 20px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <select
            value={currentMonth}
            onChange={(e) =>
              setCurrentMonth(parseInt(e.target.value))
            }
            style={{
              background: "transparent",
              color: "white",
              fontWeight: 700,
              fontSize: 20,
            }}
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={currentYear}
            onChange={(e) =>
              setCurrentYear(parseInt(e.target.value))
            }
            style={{
              background: "transparent",
              color: "#777",
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: "#202034",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          💰
        </div>
      </div>

      {/* DASHBOARD */}
      {view === "dashboard" && (
        <div style={{ padding: "0 16px" }}>
          <div
            className="main-card"
            style={{
              background:
                "linear-gradient(135deg,#1e1b4b,#14141e)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: "#c4b5fd",
                }}
              >
                RENDA DISPONÍVEL
              </span>

              <button
                onClick={() => {
                  setEditingIncome(!editingIncome);
                  setIncomeInput(String(income));
                }}
                style={{
                  background: "#312e81",
                  color: "#ddd6fe",
                  padding: "5px 12px",
                  borderRadius: 12,
                }}
              >
                editar
              </button>
            </div>

            {editingIncome ? (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <input
                  className="form-input"
                  value={incomeInput}
                  type="number"
                  onChange={(e) =>
                    setIncomeInput(e.target.value)
                  }
                />

                <button
                  className="save-btn"
                  style={{ width: 120 }}
                  onClick={() => {
                    setIncome(parseFloat(incomeInput));
                    setEditingIncome(false);
                  }}
                >
                  Salvar
                </button>
              </div>
            ) : (
              <h1
                style={{
                  marginTop: 10,
                  fontSize: 34,
                }}
              >
                {formatBRL(income)}
              </h1>
            )}
          </div>

          <div className="main-card">
            <p style={{ color: "#888", fontSize: 12 }}>
              Saldo Atual Livre
            </p>

            <h1
              style={{
                marginTop: 6,
                color:
                  balance >= 0
                    ? "#4ade80"
                    : "#f87171",
              }}
            >
              {formatBRL(balance)}
            </h1>
          </div>

          {/* MÉTODOS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
            }}
          >
            <div className="main-card">
              <p style={{ color: "#f87171" }}>
                💳 Cartão
              </p>
              <h3>
                {formatBRL(methodTotals.cartao)}
              </h3>
            </div>

            <div className="main-card">
              <p style={{ color: "#4ade80" }}>
                📄 Boleto
              </p>
              <h3>
                {formatBRL(methodTotals.boleto)}
              </h3>
            </div>

            <div className="main-card">
              <p style={{ color: "#60a5fa" }}>📱 Pix</p>
              <h3>{formatBRL(methodTotals.pix)}</h3>
            </div>
          </div>

          {/* PROGRESSO */}
          <div className="main-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Progresso de Contas Pagas</span>

              <span style={{ color: "#4ade80" }}>
                {totalBills > 0
                  ? Math.round(
                      (totalPaid / totalBills) * 100
                    )
                  : 0}
                %
              </span>
            </div>

            <div
              style={{
                height: 8,
                background: "#222",
                borderRadius: 20,
                overflow: "hidden",
                marginTop: 10,
              }}
            >
              <div
                style={{
                  width: `${
                    totalBills > 0
                      ? (totalPaid / totalBills) * 100
                      : 0
                  }%`,
                  height: "100%",
                  background: "#4ade80",
                }}
              />
            </div>

            {/* CALENDÁRIO AGORA AQUI */}
            <div style={{ marginTop: 24 }}>
              <div className="cal-grid">
                {WEEKDAYS.map((w) => (
                  <div className="cal-week" key={w}>
                    {w}
                  </div>
                ))}

                {calendarDays.map((day, idx) => {
                  if (!day) {
                    return (
                      <div
                        key={idx}
                        className="cal-day empty"
                      />
                    );
                  }

                  const status = dayStatusMap[day];

                  let className = "cal-day";

                  if (status) {
                    if (
                      status.hasPaid &&
                      status.hasPending
                    ) {
                      className += " bill-mixed";
                    } else if (status.hasPending) {
                      className += " bill-pending";
                    } else if (status.hasPaid) {
                      className += " bill-paid";
                    }
                  }

                  return (
                    <div key={day} className={className}>
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LISTA */}
      {view === "list" && (
        <div style={{ padding: "0 16px" }}>
          <h1 style={{ marginBottom: 16 }}>
            Minhas Finanças
          </h1>

          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              marginBottom: 16,
            }}
          >
            <button
              className={`chip ${
                filterMethod === "all"
                  ? "active"
                  : "inactive"
              }`}
              onClick={() => setFilterMethod("all")}
            >
              Todas
            </button>

            {METHODS.map((m) => (
              <button
                key={m.id}
                className={`chip ${
                  filterMethod === m.id
                    ? "active"
                    : "inactive"
                }`}
                onClick={() =>
                  setFilterMethod(m.id)
                }
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>

          <div className="main-card">
            {filteredBills.map((bill) => {
              const cat = catInfo(bill.category);

              return (
                <div
                  key={bill.id}
                  className="bill-item"
                >
                  <div style={{ flex: 1 }}>
                    <h3>{bill.name}</h3>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <span>
                        {cat?.emoji} {cat?.label}
                      </span>

                      {bill.frequencyType ===
                        "mensal" && (
                        <span>🔄 Mensal</span>
                      )}

                      {bill.frequencyType ===
                        "parcelado" && (
                        <span>
                          🔢{" "}
                          {
                            bill.currentInstallment
                          }
                          /{bill.totalInstallments}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3>
                      {formatBRL(bill.amount)}
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        marginTop: 8,
                      }}
                    >
                      <button
                        onClick={() =>
                          togglePaid(bill.id)
                        }
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: isBillPaid(bill)
                            ? "#14532d"
                            : "#222",
                          color: "white",
                        }}
                      >
                        {isBillPaid(bill)
                          ? "✓"
                          : "○"}
                      </button>

                      <button
                        onClick={() =>
                          startEdit(bill)
                        }
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: "#312e81",
                          color: "white",
                        }}
                      >
                        ✏️
                      </button>

                      <button
                        onClick={() =>
                          deleteBill(bill.id)
                        }
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: "#451a1a",
                          color: "white",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="main-card">
            <p>Total da Sessão</p>
            <h2>{formatBRL(sessionTotal)}</h2>
          </div>
        </div>
      )}

      {/* ADD */}
      {view === "add" && (
        <div
          style={{
            padding: "0 16px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <h1>
            {editingBill
              ? "Editar Conta"
              : "Nova Conta"}
          </h1>

          <input
            className="form-input"
            placeholder="Nome"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
          />

          <input
            className="form-input"
            placeholder="Valor"
            type="number"
            value={form.amount}
            onChange={(e) =>
              setForm({
                ...form,
                amount: e.target.value,
              })
            }
          />

          <select
            className="form-input"
            value={form.method}
            onChange={(e) =>
              setForm({
                ...form,
                method: e.target.value,
              })
            }
          >
            {METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.emoji} {m.label}
              </option>
            ))}
          </select>

          <select
            className="form-input"
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value,
              })
            }
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>

          <button
            className="save-btn"
            onClick={saveBill}
          >
            {editingBill
              ? "Salvar Alterações"
              : "Adicionar Conta"}
          </button>

          <button
            onClick={() => {
              setView("list");
              setEditingBill(null);
              resetForm();
            }}
            style={{
              background: "transparent",
              color: "#888",
              padding: 10,
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* FAB */}
      {view !== "add" && (
        <button
          onClick={() => {
            setEditingBill(null);
            resetForm();
            setView("add");
          }}
          style={{
            position: "fixed",
            right: 24,
            bottom: 90,
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "#4f46e5",
            color: "white",
            fontSize: 32,
          }}
        >
          +
        </button>
      )}

      {/* NAV */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          width: "100%",
          maxWidth: 430,
          display: "flex",
          background: "#101018",
          borderTop: "1px solid #1f1f2e",
        }}
      >
        <button
          onClick={() => setView("dashboard")}
          style={{
            flex: 1,
            padding: 18,
            background: "transparent",
            color:
              view === "dashboard"
                ? "#4f46e5"
                : "#666",
          }}
        >
          Resumo
        </button>

        <button
          onClick={() => setView("list")}
          style={{
            flex: 1,
            padding: 18,
            background: "transparent",
            color:
              view === "list"
                ? "#4f46e5"
                : "#666",
          }}
        >
          Contas
        </button>
      </div>
    </div>
  );
}
