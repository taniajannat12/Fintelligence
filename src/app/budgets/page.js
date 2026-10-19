"use client";

import AppNavigation from "@/components/AppNavigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Target,
  Trash2,
  Wallet,
  X,
  AlertTriangle,
} from "lucide-react";

const TRANSACTIONS_KEY = "fintelligence-transactions-v1";
const BUDGETS_KEY = "fintelligence-budgets-v1";
const SETTINGS_KEY = "fintelligence-settings-v1";

const categories = [
  "Food",
  "Transport",
  "Education",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Other",
];

const currencySymbols = {
  BDT: "৳",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

const TILE_BASE =
  "rounded-[28px] p-6 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1E1B3A]/10";

const TONES = {
  surface:
    "bg-white ring-1 ring-[#E4E0F0] dark:bg-[#201D3D] dark:ring-[#34305A]",
  peach: "bg-[#FFE3D6] dark:bg-[#4A2E33]",
  mint: "bg-[#D5F3E6] dark:bg-[#1F4437]",
  sky: "bg-[#D8EAFE] dark:bg-[#1F3555]",
  lilac: "bg-[#E6DDFB] dark:bg-[#3A2F66]",
  butter: "bg-[#FFF1C2] dark:bg-[#4A4122]",
};

const OK_TONES = ["mint", "sky", "lilac", "surface"];

const MUTED = "text-[#6B6885] dark:text-[#A9A5C7]";
const GOOD = "text-[#0F7A5F] dark:text-[#6FE3C0]";
const BAD = "text-[#C2263A] dark:text-[#FF8A93]";
const WARN = "text-[#8A5A00] dark:text-[#F2B33D]";

const FIELD =
  "w-full rounded-2xl border border-[#E4E0F0] bg-white px-4 py-3 outline-none focus:border-[#E60023] dark:border-[#34305A] dark:bg-[#15132A]";

export default function BudgetsPage() {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [settings, setSettings] = useState({
    currency: "BDT",
    monthlyBudget: "10000",
    notifications: true,
  });
  const [loaded, setLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    category: "Food",
    amount: "",
  });

  useEffect(() => {
    try {
      const savedTransactions = localStorage.getItem(TRANSACTIONS_KEY);
      const savedBudgets = localStorage.getItem(BUDGETS_KEY);
      const savedSettings = localStorage.getItem(SETTINGS_KEY);

      if (savedTransactions) {
        const parsed = JSON.parse(savedTransactions);
        if (Array.isArray(parsed)) setTransactions(parsed);
      }

      if (savedBudgets) {
        const parsed = JSON.parse(savedBudgets);
        if (Array.isArray(parsed)) setBudgets(parsed);
      }

      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed && typeof parsed === "object") {
          setSettings((previous) => ({
            ...previous,
            ...parsed,
          }));
        }
      }
    } catch (error) {
      console.error("Could not load saved data:", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
      } catch (error) {
        console.error("Could not save budgets:", error);
      }
    }
  }, [budgets, loaded]);

  const currencySymbol =
    currencySymbols[settings.currency] || "৳";

  const money = (amount) =>
    `${currencySymbol}${Number(amount || 0).toLocaleString("en-BD", {
      maximumFractionDigits: 2,
    })}`;

  const spending = useMemo(() => {
    const totals = {};

    transactions
      .filter(
        (transaction) =>
          String(transaction.type || "").toLowerCase() === "expense" ||
          String(transaction.type || "").toLowerCase() === "expenses"
      )
      .forEach((transaction) => {
        const category = transaction.category || "Other";
        const amount = Number(transaction.amount || 0);

        if (Number.isFinite(amount) && amount > 0) {
          totals[category] = (totals[category] || 0) + amount;
        }
      });

    return totals;
  }, [transactions]);

  const totalBudget = budgets.reduce(
    (sum, budget) => sum + Number(budget.amount || 0),
    0
  );

  const totalSpent = Object.values(spending).reduce(
    (sum, amount) => sum + amount,
    0
  );

  const monthlyBudget = Math.max(
    0,
    Number(settings.monthlyBudget) || 0
  );

  const monthlyRemaining = monthlyBudget - totalSpent;
  const monthlyPercent =
    monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;

  function addBudget(event) {
    event.preventDefault();

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) return;

    setBudgets((previous) => {
      const existing = previous.find(
        (budget) => budget.category === form.category
      );

      if (existing) {
        return previous.map((budget) =>
          budget.category === form.category
            ? { ...budget, amount }
            : budget
        );
      }

      return [
        ...previous,
        {
          id: `${Date.now()}-${form.category}`,
          category: form.category,
          amount,
        },
      ];
    });

    setForm({ category: "Food", amount: "" });
    setShowModal(false);
  }

  function deleteBudget(id) {
    if (confirm("Delete this budget?")) {
      setBudgets((previous) =>
        previous.filter((budget) => budget.id !== id)
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F3FA] px-5 py-8 text-[#1E1B3A] dark:bg-[#15132A] dark:text-[#F1EFFB] md:px-8">
      <AppNavigation />

      <div className="mx-auto max-w-7xl">
        <header className="mb-9 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              aria-label="Back to dashboard"
              className="rounded-full bg-white p-3 text-[#1E1B3A] shadow-sm ring-1 ring-[#E4E0F0] transition hover:scale-105 hover:shadow-md dark:bg-[#201D3D] dark:text-[#F1EFFB] dark:ring-[#34305A]"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <p className="text-sm font-bold tracking-wide text-[#E60023]">FINTELLIGENCE</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
                Budgets & Goals
              </h1>
              <p className={`mt-1 text-sm ${MUTED}`}>
                Set spending limits and track your progress.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-full bg-[#E60023] px-6 py-3 font-bold text-white shadow-sm transition hover:brightness-110"
          >
            <Plus size={18} />
            Set Budget
          </button>
        </header>

        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5 [&>*]:break-inside-avoid">
      
          <section className={`${TILE_BASE} ${TONES.peach}`}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className={`text-sm font-medium ${MUTED}`}>
                  Monthly Spending Limit
                </p>
                <h2 className="mt-1 text-3xl font-extrabold tracking-tight">
                  {money(monthlyBudget)}
                </h2>
              </div>

              <IconBubble>
                <Wallet size={22} />
              </IconBubble>
            </div>

            <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
              <span className={MUTED}>
                Spent: {money(totalSpent)}
              </span>
              <span
                className={`font-semibold ${
                  monthlyRemaining < 0 ? BAD : GOOD
                }`}
              >
                {monthlyRemaining < 0
                  ? `Over budget: ${money(Math.abs(monthlyRemaining))}`
                  : `Remaining: ${money(monthlyRemaining)}`}
              </span>
            </div>

            <div className="h-3.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className={`h-full rounded-full transition-all ${
                  monthlyRemaining < 0
                    ? "bg-[#E8505B]"
                    : "bg-[#2FBF9B]"
                }`}
                style={{
                  width: `${Math.min(monthlyPercent, 100)}%`,
                }}
              />
            </div>

            <p className={`mt-2 text-xs ${MUTED}`}>
              {Math.round(monthlyPercent)}% of your monthly limit used.
              Change this limit in Settings.
            </p>

            {settings.notifications && monthlyRemaining < 0 && (
              <div
                role="status"
                className={`mt-4 flex items-start gap-2 rounded-2xl bg-white/70 p-3 text-sm font-medium dark:bg-white/10 ${BAD}`}
              >
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <p>
                  Your monthly spending limit has been exceeded by{" "}
                  {money(Math.abs(monthlyRemaining))}.
                </p>
              </div>
            )}
          </section>

          <SummaryCard
            tone="mint"
            title="Total Category Budget"
            amount={money(totalBudget)}
            icon={<Wallet />}
          />

          <SummaryCard
            tone="sky"
            title="Total Expenses"
            amount={money(totalSpent)}
            icon={<Target />}
          />

          <SummaryCard
            tone="butter"
            title="Category Budget Remaining"
            amount={money(totalBudget - budgets.reduce(
              (sum, budget) =>
                sum + Math.min(
                  spending[budget.category] || 0,
                  Number(budget.amount) || 0
                ),
              0
            ))}
            icon={<Target />}
          />
        </div>

        <section className="mt-4">
          <h2 className="mb-1 text-xl font-extrabold tracking-tight">
            Category Budgets
          </h2>
          <p className={`mb-6 text-sm ${MUTED}`}>
            Your spending compared with each category limit.
          </p>

          {!loaded ? (
            <p className={`py-10 text-center ${MUTED}`}>
              Loading...
            </p>
          ) : budgets.length === 0 ? (
            <div className={`${TILE_BASE} ${TONES.surface} py-12 text-center`}>
              <Target
                className={`mx-auto mb-3 ${MUTED}`}
                size={36}
              />
              <p className="font-bold">No budgets yet</p>
              <p className={`mt-2 text-sm ${MUTED}`}>
                Set a category budget to start tracking your spending.
              </p>

              <button
                onClick={() => setShowModal(true)}
                className="mt-5 rounded-full bg-[#E60023] px-6 py-3 font-bold text-white transition hover:brightness-110"
              >
                <Plus size={16} className="mr-1 inline" />
                Set your first budget
              </button>
            </div>
          ) : (
            <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5 [&>*]:break-inside-avoid">
              {budgets.map((budget, index) => {
                const spent = spending[budget.category] || 0;
                const limit = Number(budget.amount) || 0;
                const percent = limit > 0 ? (spent / limit) * 100 : 0;
                const exceeded = spent > limit;
                const nearLimit = percent >= 80 && !exceeded;

                const tone = exceeded
                  ? "peach"
                  : nearLimit
                    ? "butter"
                    : OK_TONES[index % OK_TONES.length];

                return (
                  <div
                    key={budget.id}
                    className={`${TILE_BASE} ${TONES[tone]}`}
                  >
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold">
                          {budget.category}
                        </h3>
                        <p className={`mt-1 text-sm ${MUTED}`}>
                          {money(spent)} spent of {money(limit)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-lg font-extrabold ${
                            exceeded
                              ? BAD
                              : nearLimit
                                ? WARN
                                : GOOD
                          }`}
                        >
                          {Math.round(percent)}%
                        </span>

                        <button
                          onClick={() => deleteBudget(budget.id)}
                          className={`rounded-full bg-white/70 p-2 transition hover:scale-105 dark:bg-white/10 ${BAD}`}
                          aria-label={`Delete ${budget.category} budget`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                      <div
                        className={`h-full rounded-full transition-all ${
                          exceeded
                            ? "bg-[#E8505B]"
                            : nearLimit
                              ? "bg-[#F2B33D]"
                              : "bg-[#2FBF9B]"
                        }`}
                        style={{
                          width: `${Math.min(percent, 100)}%`,
                        }}
                      />
                    </div>

                    {settings.notifications && exceeded && (
                      <p
                        role="status"
                        className={`mt-3 flex items-center gap-2 text-sm font-medium ${BAD}`}
                      >
                        <AlertTriangle size={16} />
                        Over budget by {money(spent - limit)}.
                      </p>
                    )}

                    {settings.notifications && nearLimit && (
                      <p className={`mt-3 text-sm font-medium ${WARN}`}>
                        You have used at least 80% of this budget.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <p className={`mt-5 text-xs ${MUTED}`}>
          Budgets and transactions are stored locally in this browser.
          Currency changes update the display symbol only; they do not
          convert existing amounts.
        </p>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1B3A]/60 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl dark:bg-[#201D3D]">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-extrabold tracking-tight">
                Set Category Budget
              </h2>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-full bg-[#F5F3FA] p-2 transition hover:scale-105 dark:bg-white/10"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={addBudget} className="space-y-4">
              <div>
                <label
                  htmlFor="budgetCategory"
                  className="mb-2 block text-sm font-semibold"
                >
                  Category
                </label>

                <select
                  id="budgetCategory"
                  value={form.category}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      category: event.target.value,
                    })
                  }
                  className={FIELD}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="budgetAmount"
                  className="mb-2 block text-sm font-semibold"
                >
                  Monthly Limit ({currencySymbol})
                </label>

                <input
                  id="budgetAmount"
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      amount: event.target.value,
                    })
                  }
                  placeholder="e.g. 5000"
                  className={FIELD}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-[#E60023] py-3 font-bold text-white transition hover:brightness-110"
              >
                Save Budget
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function IconBubble({ children }) {
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/70 text-[#1E1B3A] shadow-sm dark:bg-white/10 dark:text-[#F1EFFB]">
      {children}
    </span>
  );
}

function SummaryCard({ tone, title, amount, icon }) {
  return (
    <div className={`${TILE_BASE} ${TONES[tone]}`}>
      <div className="flex items-center justify-between">
        <p className={`text-sm font-medium ${MUTED}`}>{title}</p>
        <IconBubble>{icon}</IconBubble>
      </div>
      <h2 className="mt-4 text-3xl font-extrabold tracking-tight">{amount}</h2>
    </div>
  );
}