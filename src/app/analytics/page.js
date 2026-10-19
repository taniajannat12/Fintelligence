"use client";

import AppNavigation from "@/components/AppNavigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Wallet,
  ChartNoAxesCombined,
  PiggyBank,
  Target,
  RefreshCw,
} from "lucide-react";

const STORAGE_KEY = "fintelligence-transactions-v1";
const API_URL = "http://127.0.0.1:8000/analyze";

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

const MUTED = "text-[#6B6885] dark:text-[#A9A5C7]";
const GOOD = "text-[#0F7A5F] dark:text-[#6FE3C0]";
const BAD = "text-[#C2263A] dark:text-[#FF8A93]";

const CATEGORY_COLORS = [
  "#E8505B",
  "#7C6BEA",
  "#2FBF9B",
  "#F2B33D",
  "#4A90E2",
  "#F27BB0",
  "#8D8AA8",
];

function getAmount(transaction) {
  const amount = Number(transaction?.amount);
  return Number.isFinite(amount) ? amount : 0;
}

function getType(transaction) {
  return String(transaction?.type || "").toLowerCase().trim();
}

function money(amount) {
  return `৳${Number(amount || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export default function AnalyticsPage() {
  const [transactions, setTransactions] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [transactionsLoaded, setTransactionsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setTransactions(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
      setAnalysisError("Could not load saved transactions.");
    } finally {
      setTransactionsLoaded(true);
    }
  }, []);

  const analyzeData = useCallback(async (data) => {
    if (data.length === 0) {
      setAnalysis(null);
      setAnalysisError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setAnalysisError("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactions: data,
        }),
      });

      if (!response.ok) {
        let message = `Backend error (${response.status})`;

        try {
          const errorData = await response.json();
          if (errorData.detail) {
            message =
              typeof errorData.detail === "string"
                ? errorData.detail
                : JSON.stringify(errorData.detail);
          }
        } catch {
     
        }

        throw new Error(message);
      }

      const result = await response.json();

      if (
        typeof result.total_income !== "number" ||
        typeof result.total_expenses !== "number"
      ) {
        throw new Error("Unexpected response from the Python API.");
      }

      setAnalysis(result);
      setAnalysisError("");
    } catch (error) {
      console.error("Python analysis failed:", error);
      setAnalysis(null);
      setAnalysisError(
        error instanceof TypeError
          ? "Could not connect to Python. Make sure FastAPI is running on port 8000."
          : error.message || "Python analysis failed. Please retry."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (transactionsLoaded) {
      analyzeData(transactions);
    }
  }, [transactionsLoaded, transactions, analyzeData]);

  const income = useMemo(
    () =>
      transactions
        .filter((t) => getType(t) === "income")
        .reduce((sum, t) => sum + getAmount(t), 0),
    [transactions]
  );

  const expenses = useMemo(
    () =>
      transactions
        .filter((t) =>
          ["expense", "expenses"].includes(getType(t))
        )
        .reduce((sum, t) => sum + getAmount(t), 0),
    [transactions]
  );

  const balance = income - expenses;

  const categoryData = useMemo(() => {
    const totals = {};

    transactions
      .filter((t) =>
        ["expense", "expenses"].includes(getType(t))
      )
      .forEach((t) => {
        const category = String(t.category || "Other");
        totals[category] = (totals[category] || 0) + getAmount(t);
      });

    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  const maxCategory = Math.max(
    ...categoryData.map((item) => item[1]),
    1
  );

  const totalIncome = analysis?.total_income ?? income;
  const totalExpenses = analysis?.total_expenses ?? expenses;
  const netBalance = analysis?.savings ?? balance;

  const savingsRate =
    analysis?.savings_rate ??
    (income > 0 ? (balance / income) * 100 : 0);

  const topCategory =
    analysis?.top_expense_category ??
    categoryData[0]?.[0] ??
    "None";

  async function retryAnalysis() {
    await analyzeData(transactions);
  }

  return (
    <main className="min-h-screen bg-[#F5F3FA] px-5 py-8 text-[#1E1B3A] dark:bg-[#15132A] dark:text-[#F1EFFB] md:px-8">
      <AppNavigation />

      <div className="mx-auto max-w-7xl">
        <header className="mb-9 flex items-center gap-4">
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
              Analytics
            </h1>
            <p className={`mt-1 text-sm ${MUTED}`}>
              Understand your income and spending.
            </p>
          </div>
        </header>
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5 [&>*]:break-inside-avoid">

          <section className={`${TILE_BASE} ${TONES.lilac}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold">Python Financial Analysis</p>
                <p className={`mt-1 text-sm ${MUTED}`}>
                  Powered by FastAPI, Pandas and NumPy
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  loading
                    ? "bg-[#F2B33D]/30 text-[#8A5A00] dark:text-[#F2B33D]"
                    : analysis
                      ? "bg-[#2FBF9B]/25 text-[#0F7A5F] dark:text-[#6FE3C0]"
                      : analysisError
                        ? "bg-[#E8505B]/20 text-[#B3202C] dark:text-[#FF8A93]"
                        : "bg-black/10 text-[#6B6885] dark:bg-white/10 dark:text-[#A9A5C7]"
                }`}
              >
                {loading
                  ? "Analyzing..."
                  : analysis
                    ? "Analysis Ready"
                    : analysisError
                      ? "Connection Error"
                      : transactions.length === 0
                        ? "No Transactions"
                        : "Waiting for Data"}
              </span>
            </div>

            {analysisError && (
              <div className="mt-4">
                <p className={`text-sm font-medium ${BAD}`}>{analysisError}</p>
                <button
                  onClick={retryAnalysis}
                  disabled={loading || !transactionsLoaded || transactions.length === 0}
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#E60023] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    size={15}
                    className={loading ? "animate-spin" : ""}
                  />
                  Retry Connection
                </button>
              </div>
            )}

            {!analysisError && transactionsLoaded && transactions.length === 0 && (
              <p className={`mt-4 text-sm ${MUTED}`}>
                Add transactions first to see your financial analysis.
              </p>
            )}
          </section>

          <SummaryCard
            tone="mint"
            title="Total Income"
            amount={money(totalIncome)}
            icon={<TrendingUp size={20} />}
            color={GOOD}
          />

          <SummaryCard
            tone="sky"
            title="Total Expenses"
            amount={money(totalExpenses)}
            icon={<TrendingDown size={20} />}
            color={BAD}
          />

          <SummaryCard
            tone="peach"
            title="Net Balance"
            amount={money(netBalance)}
            icon={<Wallet size={20} />}
            color={netBalance >= 0 ? GOOD : BAD}
          />

          <div className={`${TILE_BASE} ${TONES.butter}`}>
            <div className="flex items-center gap-3">
              <IconBubble>
                <PiggyBank size={21} />
              </IconBubble>
              <div>
                <p className={`text-sm ${MUTED}`}>Savings Rate</p>
                <h2 className="mt-1 text-3xl font-extrabold tracking-tight">
                  {income > 0 || analysis
                    ? `${Number(savingsRate).toFixed(2)}%`
                    : "—"}
                </h2>
              </div>
            </div>
            <p className={`mt-4 text-sm ${MUTED}`}>
              Percentage of income remaining after expenses.
            </p>
          </div>

          <div className={`${TILE_BASE} ${TONES.surface}`}>
            <div className="flex items-center gap-3">
              <IconBubble>
                <Target size={21} />
              </IconBubble>
              <div>
                <p className={`text-sm ${MUTED}`}>
                  Highest Expense Category
                </p>
                <h2 className="mt-1 break-words text-2xl font-extrabold tracking-tight">
                  {topCategory}
                </h2>
              </div>
            </div>
            <p className={`mt-4 text-sm ${MUTED}`}>
              Category with the highest total spending.
            </p>
          </div>

          <div className={`${TILE_BASE} ${TONES.surface}`}>
            <div className="mb-6 flex items-center gap-3">
              <IconBubble>
                <ChartNoAxesCombined size={21} />
              </IconBubble>
              <div>
                <h2 className="font-bold">Income vs Expenses</h2>
                <p className={`text-sm ${MUTED}`}>
                  Based on your saved transactions
                </p>
              </div>
            </div>

            {income === 0 && expenses === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-6">
                <Bar
                  label="Income"
                  amount={income}
                  max={Math.max(income, expenses, 1)}
                  color="bg-[#2FBF9B]"
                />
                <Bar
                  label="Expenses"
                  amount={expenses}
                  max={Math.max(income, expenses, 1)}
                  color="bg-[#E8505B]"
                />
              </div>
            )}
          </div>

          <div className={`${TILE_BASE} ${TONES.surface}`}>
            <h2 className="mb-1 font-bold">Expenses by Category</h2>
            <p className={`mb-6 text-sm ${MUTED}`}>
              Where your money goes
            </p>

            {categoryData.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-5">
                {categoryData.map(([category, amount], index) => (
                  <div key={category}>
                    <div className="mb-2 flex justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{
                            background:
                              CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                          }}
                        />
                        <span className="truncate">{category}</span>
                      </span>
                      <span className="font-semibold">{money(amount)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            (amount / maxCategory) * 100,
                            100
                          )}%`,
                          background:
                            CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className={`mt-3 text-xs ${MUTED}`}>
          Transaction records are stored in your browser. Python analyzes
          the data through FastAPI; no database is used.
        </p>
      </div>
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

function SummaryCard({ tone, title, amount, icon, color }) {
  return (
    <div className={`${TILE_BASE} ${TONES[tone]}`}>
      <div className="flex items-center justify-between">
        <p className={`text-sm font-medium ${MUTED}`}>{title}</p>
        <span className={color}>{icon}</span>
      </div>
      <h2 className={`mt-5 text-3xl font-extrabold tracking-tight ${color}`}>
        {amount}
      </h2>
    </div>
  );
}

function Bar({ label, amount, max, color }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold">{money(amount)}</span>
      </div>
      <div className="h-3.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{
            width: `${Math.min((amount / max) * 100, 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className={`rounded-2xl border border-dashed border-[#CFC9E6] py-12 text-center text-sm dark:border-[#34305A] ${MUTED}`}>
      No data yet. Add transactions first.
      <div className="mt-4">
        <Link
          href="/transactions"
          className="font-semibold text-[#E60023] hover:underline"
        >
          Go to Transactions
        </Link>
      </div>
    </div>
  );
}