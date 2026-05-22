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

export default function App() {
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const [income, setIncome] = useState(5000);

  const [incomeInput, setIncomeInput] = useState("5000");

  const [editingIncome, setEditingIncome] = useState(false);

  const [view, setView] = useState("dashboard");

  const [filterMethod, setFilterMethod] = useState("all");

  const [creditCardDueDate, setCreditCardDueDate] = useState("15");

  const [editingBill, setEditingBill] = useState(null);

  const [bills, setBills] = useState([]);

  const [form, setForm] = useState({
    name: "",
    amount: "",
    category: "outros",
    dueDate: "05",
    method: "cartao",
    frequencyType: "mensal",
    currentInstallment: "1",
    totalInstallments: "1",
  });

  // =========================
  // LOCAL STORAGE
  // =========================

  useEffect(() => {
    const savedBills = localStorage.getItem("bills");
    const savedIncome = localStorage.getItem("income");
    const savedDue = localStorage.getItem("creditDue");

    if (savedBills) {
      setBills(JSON.parse(savedBills));
    }

    if (savedIncome) {
      setIncome(JSON.parse(savedIncome));
    }

    if (savedDue) {
      setCreditCardDueDate(savedDue);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("bills", JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem("income", JSON.stringify(income));
  }, [income]);

  useEffect(() => {
    localStorage.setItem("creditDue", creditCardDueDate);
  }, [creditCardDueDate]);

  const monthKey = `${currentYear}-${String(currentMonth).padStart(
    2,
    "0"
  )}`;

  const isBillPaid = (bill) => {
    return bill.paidMonths?.[monthKey] || false;
  };

  const togglePaid = (id) => {
    setBills((prev) =>
      prev.map((bill) => {
        if (bill.id !== id) return bill;

        return {
          ...bill,
          paidMonths: {
            ...bill.paidMonths,
            [monthKey]: !isBillPaid(bill),
          },
        };
      })
    );
  };

  // =========================
  // CONTAS DO MÊS
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
          bill.frequencyType === "parcelado"
        ) {
          const currentInstallment =
            bill.currentInstallment +
            monthsDiff;

          if (
            currentInstallment >= 1 &&
            currentInstallment <=
              bill.totalInstallments
          ) {
            return {
              ...bill,
              currentInstallment,
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
  // CALENDÁRIO
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

    for (let i = 1; i <= totalDays; i++) {
      arr.push(i);
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
          hasPaid: false,
          hasPending: false,
        };
      }

      if (isBillPaid(bill)) {
        map[day].hasPaid = true;
      } else {
        map[day].hasPending = true;
      }
    });

    return map;
  }, [
    billsForSelectedMonth,
    currentMonth,
    currentYear,
    creditCardDueDate,
  ]);

  // =========================
  // TOTAIS
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

  const methodTotals = {
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

  const filteredBills =
    filterMethod === "all"
      ? billsForSelectedMonth
      : billsForSelectedMonth.filter(
          (b) => b.method === filterMethod
        );

  // =========================
  // ADICIONAR / EDITAR
  // =========================

  const resetForm = () => {
    setForm({
      name: "",
      amount: "",
      category: "outros",
      dueDate: "05",
      method: "cartao",
      frequencyType: "mensal",
      currentInstallment: "1",
      totalInstallments: "1",
    });
  };

  const saveBill = () => {
    if (!form.name || !form.amount)
      return;

    const data = {
      name: form.name,
      amount: parseFloat(form.amount),
      category: form.category,
      method: form.method,
      dueDate:
        form.method === "cartao"
          ? null
          : form.dueDate,
      frequencyType: form.frequencyType,
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
            ? { ...b, ...data }
            : b
        )
      );
    } else {
      setBills((prev) => [
        ...prev,
        {
          ...data,
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

  const deleteBill = (id) => {
    setBills((prev) =>
      prev.filter((b) => b.id !== id)
    );
  };

  const editBill = (bill) => {
    setEditingBill(bill);

    setForm({
      name: bill.name,
      amount: String(bill.amount),
      category: bill.category,
      dueDate: bill.dueDate || "05",
      method: bill.method,
      frequencyType: bill.frequencyType,
      currentInstallment: String(
        bill.currentInstallment
      ),
      totalInstallments: String(
        bill.totalInstallments
      ),
    });

    setView("add");
  };

  const catInfo = (id) =>
    CATEGORIES.find((c) => c.id === id);

  return (
    <div
      style={{
        background: "#0b0b0f",
        minHeight: "100vh",
        color: "white",
        fontFamily: "sans-serif",
        maxWidth: 430,
        margin: "0 auto",
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

        button,input,select{
          font-family:inherit;
          outline:none;
          border:none;
        }

        .main-card{
          background:#14141e;
          border-radius:24px;
          padding:20px;
          margin-bottom:16px;
          border:1px solid #1f1f2e;
        }

        .form-input{
          width:100%;
          padding:14px;
          border-radius:14px;
          background:#1c1c28;
          color:white;
          border:1px solid #2b2b3c;
        }

        .save-btn{
          width:100%;
          padding:16px;
          border-radius:16px;
          background:#4f46e5;
          color:white;
          font-weight:bold;
        }

        .chip{
          padding:8px 16px;
          border-radius:18px;
          cursor:pointer;
        }

        .chip.active{
          background:#4f46e5;
        }

        .chip.inactive{
          background:#1c1c28;
          color:#888;
        }

        .bill-item{
          display:flex;
          align-items:center;
          gap:12px;
          padding:16px 0;
          border-bottom:1px solid #222;
        }

        .cal-grid{
          display:grid;
          grid-template-columns:repeat(7,1fr);
          gap:6px;
        }

        .cal-day{
          height:38px;
          border-radius:10px;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#1c1c28;
        }

        .paid{
          background:#12301b;
          color:#4ade80;
        }

        .pending{
          background:#301212;
          color:#f87171;
        }

        .mixed{
          background:#33250f;
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
        <div
          style={{
            display: "flex",
            gap: 10,
          }}
        >
          <select
            value={currentMonth}
            onChange={(e) =>
              setCurrentMonth(
                parseInt(e.target.value)
              )
            }
            style={{
              background: "#14141e",
              color: "white",
              padding: "8px 12px",
              borderRadius: 12,
            }}
          >
            {MONTHS.map((m) => (
              <option
                key={m.value}
                value={m.value}
              >
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={currentYear}
            onChange={(e) =>
              setCurrentYear(
                parseInt(e.target.value)
              )
            }
            style={{
              background: "#14141e",
              color: "white",
              padding: "8px 12px",
              borderRadius: 12,
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
            background: "#1c1c28",
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
          <div className="main-card">
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
              }}
            >
              <span>Renda</span>

              <button
                onClick={() =>
                  setEditingIncome(
                    !editingIncome
                  )
                }
                style={{
                  background: "#4f46e5",
                  color: "white",
                  padding: "6px 12px",
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
                  type="number"
                  value={incomeInput}
                  onChange={(e) =>
                    setIncomeInput(
                      e.target.value
                    )
                  }
                />

                <button
                  className="save-btn"
                  style={{ width: 120 }}
                  onClick={() => {
                    setIncome(
                      parseFloat(
                        incomeInput
                      ) || 0
                    );

                    setEditingIncome(
                      false
                    );
                  }}
                >
                  Salvar
                </button>
              </div>
            ) : (
              <h1
                style={{
                  marginTop: 12,
                }}
              >
                {formatBRL(income)}
              </h1>
            )}
          </div>

          <div className="main-card">
            <p>Saldo Livre</p>

            <h1
              style={{
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
              gridTemplateColumns:
                "1fr 1fr 1fr",
              gap: 10,
            }}
          >
            <div className="main-card">
              <p>💳 Cartão</p>
              <h2>
                {formatBRL(
                  methodTotals.cartao
                )}
              </h2>
            </div>

            <div className="main-card">
              <p>📄 Boleto</p>
              <h2>
                {formatBRL(
                  methodTotals.boleto
                )}
              </h2>
            </div>

            <div className="main-card">
              <p>📱 Pix</p>
              <h2>
                {formatBRL(
                  methodTotals.pix
                )}
              </h2>
            </div>
          </div>

          {/* PROGRESSO */}
          <div className="main-card">
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
              }}
            >
              <span>
                Progresso de Contas
              </span>

              <span>
                {totalBills > 0
                  ? Math.round(
                      (totalPaid /
                        totalBills) *
                        100
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
                      ? (totalPaid /
                          totalBills) *
                        100
                      : 0
                  }%`,
                  background: "#4ade80",
                  height: "100%",
                }}
              />
            </div>

            {/* CALENDÁRIO */}
            <div
              style={{
                marginTop: 24,
              }}
            >
              <div className="cal-grid">
                {WEEKDAYS.map((w) => (
                  <div
                    key={w}
                    style={{
                      textAlign:
                        "center",
                      fontSize: 12,
                      color: "#777",
                    }}
                  >
                    {w}
                  </div>
                ))}

                {calendarDays.map(
                  (day, idx) => {
                    if (!day) {
                      return (
                        <div
                          key={idx}
                        />
                      );
                    }

                    const status =
                      dayStatusMap[
                        day
                      ];

                    let className =
                      "cal-day";

                    if (status) {
                      if (
                        status.hasPaid &&
                        status.hasPending
                      ) {
                        className +=
                          " mixed";
                      } else if (
                        status.hasPending
                      ) {
                        className +=
                          " pending";
                      } else if (
                        status.hasPaid
                      ) {
                        className +=
                          " paid";
                      }
                    }

                    return (
                      <div
                        key={day}
                        className={
                          className
                        }
                      >
                        {day}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
