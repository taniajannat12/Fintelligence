"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  Receipt,
  ChartNoAxesCombined,
  PiggyBank,
  Bot,
  Settings,
  Plus,
  ArrowRight,
  CircleDollarSign,
} from "lucide-react";

const STORAGE_TRANSACTIONS = "fintelligence-transactions-v1";
const STORAGE_BUDGETS = "fintelligence-budgets-v1";
const STORAGE_SETTINGS = "fintelligence-settings-v1";

const navItems = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: Receipt },
  { label: "Analytics", href: "/analytics", icon: ChartNoAxesCombined },
  { label: "Budgets", href: "/budgets", icon: PiggyBank },
  { label: "AI Assistant", href: "/ai-assistant", icon: Bot },
  { label: "Settings", href: "/settings", icon: Settings },
];

const categories = [
  { name: "Food", color: "#E8505B" },
  { name: "Transport", color: "#4A90E2" },
  { name: "Bills", color: "#7C6BEA" },
  { name: "Shopping", color: "#F2B33D" },
  { name: "Education", color: "#2FBF9B" },
  { name: "Entertainment", color: "#F27BB0" },
  { name: "Health", color: "#14B8A6" },
  { name: "Other", color: "#8D8AA8" },
];

const CURRENCY_SYMBOLS = {
  BDT: "৳",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

const TILE_BASE =
  "rounded-[28px] p-5 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1E1B3A]/10 md:p-6";

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
const LINE = "border-[#EEEAF7] dark:border-[#2A2650]";
const LINK = "font-bold text-[#E60023] hover:underline";

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createInitialTransactions(today) {
  const date = formatLocalDate(today);

  return [
    {
      id: "demo-1",
      title: "Monthly Salary",
      category: "Salary",
      type: "income",
      amount: 45000,
      date,
    },
    {
      id: "demo-2",
      title: "Grocery Shopping",
      category: "Food",
      type: "expense",
      amount: 2500,
      date,
    },
    {
      id: "demo-3",
      title: "Internet Bill",
      category: "Bills",
      type: "expense",
      amount: 1000,
      date,
    },
    {
      id: "demo-4",
      title: "Freelance Work",
      category: "Freelance",
      type: "income",
      amount: 8000,
      date,
    },
    {
      id: "demo-5",
      title: "Transport",
      category: "Transport",
      type: "expense",
      amount: 600,
      date,
    },
  ];
}

function isIncome(transaction) {
  return String(transaction?.type || "").toLowerCase() === "income";
}

function isExpense(transaction) {
  const type = String(transaction?.type || "").toLowerCase();
  return type === "expense" || type === "expenses";
}

function money(amount, currency = "BDT") {
  const symbol = CURRENCY_SYMBOLS[currency] || CURRENCY_SYMBOLS.BDT;

  return `${symbol}${Number(amount || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;
}

function getMonthTransactions(transactions, currentDate) {
  if (!currentDate) return [];

  const now = new Date(`${currentDate}T12:00:00`);

  return transactions.filter((transaction) => {
    if (!transaction?.date) return false;

    const date = new Date(`${transaction.date}T12:00:00`);

    return (
      !Number.isNaN(date.getTime()) &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  });
}

function getWeeklyData(transactions, currentDate) {
  if (!currentDate) return [];

  const today = new Date(`${currentDate}T12:00:00`);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    const dateString = formatLocalDate(date);

    const dayTransactions = transactions.filter(
      (item) => item?.date === dateString
    );

    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      income: dayTransactions
        .filter(isIncome)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
      expense: dayTransactions
        .filter(isExpense)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    };
  });
}

function readStoredArray(key) {
  try {
    const value = localStorage.getItem(key);

    if (!value) return [];

    const parsed = JSON.parse(value);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);

  const [settings, setSettings] = useState({
    name: "",
    displayName: "",
    currency: "BDT",
    monthlyBudget: "10000",
    notifications: true,
  });

  const [currentDate, setCurrentDate] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const today = new Date();

    setCurrentDate(formatLocalDate(today));

    try {
      const savedTransactions = localStorage.getItem(
        STORAGE_TRANSACTIONS
      );

      const savedSettings = localStorage.getItem(STORAGE_SETTINGS);

      const parsedTransactions = savedTransactions
        ? JSON.parse(savedTransactions)
        : null;

      setTransactions(
        Array.isArray(parsedTransactions)
          ? parsedTransactions
          : createInitialTransactions(today)
      );

      setBudgets(readStoredArray(STORAGE_BUDGETS));

      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);

        if (
          parsedSettings &&
          typeof parsedSettings === "object" &&
          !Array.isArray(parsedSettings)
        ) {
          setSettings((previous) => ({
            ...previous,
            ...parsedSettings,
          }));
        }
      }
    } catch (error) {
      console.error("Could not load dashboard data:", error);
      setTransactions(createInitialTransactions(today));
      setBudgets([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  const monthTransactions = useMemo(
    () => getMonthTransactions(transactions, currentDate),
    [transactions, currentDate]
  );

  const income = useMemo(
    () =>
      monthTransactions
        .filter(isIncome)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [monthTransactions]
  );

  const expenses = useMemo(
    () =>
      monthTransactions
        .filter(isExpense)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [monthTransactions]
  );

  const balance = income - expenses;

  const totalBudget = Math.max(
    0,
    Number(settings.monthlyBudget || 0) || 0
  );

  const budgetUsed =
    totalBudget > 0 ? (expenses / totalBudget) * 100 : 0;

  const categoryTotals = useMemo(
    () =>
      categories
        .map((category) => ({
          ...category,
          amount: monthTransactions
            .filter(
              (item) =>
                isExpense(item) && item.category === category.name
            )
            .reduce(
              (sum, item) => sum + Number(item.amount || 0),
              0
            ),
        }))
        .filter((category) => category.amount > 0)
        .sort((a, b) => b.amount - a.amount),
    [monthTransactions]
  );

  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => {
          const dateA = a?.date || "";
          const dateB = b?.date || "";
          return dateB.localeCompare(dateA);
        })
        .slice(0, 5),
    [transactions]
  );

  const weeklyData = useMemo(
    () => getWeeklyData(transactions, currentDate),
    [transactions, currentDate]
  );

  const maxWeeklyValue = Math.max(
    1,
    ...weeklyData.flatMap((day) => [day.income, day.expense])
  );

  const firstName =
    String(settings.name || settings.displayName || "")
      .trim()
      .split(/\s+/)[0] || "User";

  if (!loaded || !currentDate) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F3FA] text-[#6B6885] dark:bg-[#15132A] dark:text-[#A9A5C7]">
        Loading dashboard...
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3FA] text-[#1E1B3A] dark:bg-[#15132A] dark:text-[#F1EFFB]">
      <div className="flex min-h-screen">
        <aside className={`hidden w-64 shrink-0 border-r bg-white p-5 dark:bg-[#201D3D] lg:flex lg:flex-col ${LINE}`}>
          <Link href="/" className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E60023] text-white">
              <Wallet size={23} />
            </div>

            <div>
              <h1 className="text-xl font-extrabold tracking-tight">
                Fintelligence
              </h1>
              <p className={`text-xs ${MUTED}`}>
                Personal Finance
              </p>
            </div>
          </Link>

          <p className={`mb-3 px-3 text-xs font-bold uppercase tracking-widest ${MUTED}`}>
            Workspace
          </p>

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-full px-4 py-3 text-sm transition ${
                    item.href === "/"
                      ? "bg-[#1E1B3A] font-bold text-white dark:bg-[#F1EFFB] dark:text-[#1E1B3A]"
                      : `font-semibold hover:bg-[#F5F3FA] dark:hover:bg-white/5 ${MUTED}`
                  }`}
                >
                  <Icon size={19} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className={`mt-auto rounded-3xl p-4 ${TONES.lilac}`}>
            <div className="mb-2 flex items-center gap-2">
              <Bot size={19} />
              <span className="font-bold">Smart Insights</span>
            </div>

            <p className={`mb-3 text-xs leading-5 ${MUTED}`}>
              Review your spending and discover ways to save.
            </p>

            <Link
              href="/ai-assistant"
              className="flex items-center justify-between text-sm font-bold text-[#E60023] hover:underline"
            >
              Explore insights <ArrowRight size={16} />
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className={`sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b bg-[#F5F3FA]/95 px-5 py-4 backdrop-blur dark:bg-[#15132A]/95 md:px-8 ${LINE}`}>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
                Dashboard
              </h2>

              <p className={`mt-1 text-sm ${MUTED}`}>
                Welcome back, {firstName}!
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`hidden text-sm sm:inline ${MUTED}`}>
                {new Date(`${currentDate}T12:00:00`).toLocaleDateString(
                  "en-US",
                  {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }
                )}
              </span>

              <Link
                href="/transactions"
                className="flex items-center gap-2 rounded-full bg-[#E60023] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-110"
              >
                <Plus size={17} />
                Add Transaction
              </Link>
            </div>
          </header>

          <div className={`border-b px-4 py-3 lg:hidden ${LINE}`}>
            <nav className="flex gap-2 overflow-x-auto">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                    item.href === "/"
                      ? "bg-[#1E1B3A] text-white dark:bg-[#F1EFFB] dark:text-[#1E1B3A]"
                      : `bg-white ring-1 ring-[#E4E0F0] dark:bg-[#201D3D] dark:ring-[#34305A] ${MUTED}`
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mx-auto max-w-[1500px] p-4 md:p-8">
            {/* Pinterest-style masonry board */}
            <div className="columns-1 gap-5 md:columns-2 xl:columns-3 [&>*]:mb-5 [&>*]:break-inside-avoid">
              <SummaryCard
                tone="mint"
                title="Total Income"
                amount={money(income, settings.currency)}
                note="This month"
                icon={TrendingUp}
                iconColor={GOOD}
              />

              <SummaryCard
                tone="peach"
                title="Total Expenses"
                amount={money(expenses, settings.currency)}
                note="This month"
                icon={TrendingDown}
                iconColor={BAD}
              />

              <SummaryCard
                tone="sky"
                title="Net Balance"
                amount={money(balance, settings.currency)}
                note="Income minus expenses"
                icon={Wallet}
                iconColor="text-[#1F5FA8] dark:text-[#8EC1FF]"
              />

              <SummaryCard
                tone="lilac"
                title="Monthly Budget"
                amount={money(totalBudget, settings.currency)}
                note={
                  totalBudget > 0
                    ? `${Math.round(budgetUsed)}% used`
                    : "Set your budget in Settings"
                }
                icon={PiggyBank}
                iconColor="text-[#5B49C8] dark:text-[#B9ADFF]"
              />

              <div className={`${TILE_BASE} ${TONES.surface}`}>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold tracking-tight">
                      Weekly Cash Flow
                    </h3>
                    <p className={`mt-1 text-sm ${MUTED}`}>
                      Income and expenses over the last 7 days
                    </p>
                  </div>

                  <div className={`flex gap-4 text-xs ${MUTED}`}>
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#2FBF9B]" />
                      Income
                    </span>

                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#E8505B]" />
                      Expenses
                    </span>
                  </div>
                </div>

                <div className={`flex h-56 items-end justify-between gap-2 border-b pb-2 ${LINE}`}>
                  {weeklyData.map((day) => (
                    <div
                      key={day.day}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                    >
                      <div className="flex h-full w-full items-end justify-center gap-1">
                        <div
                          title={`Income: ${money(
                            day.income,
                            settings.currency
                          )}`}
                          className="w-3 rounded-t-full bg-[#2FBF9B] transition-all sm:w-4"
                          style={{
                            height: `${Math.max(
                              day.income > 0 ? 4 : 0,
                              (day.income / maxWeeklyValue) * 85
                            )}%`,
                          }}
                        />

                        <div
                          title={`Expenses: ${money(
                            day.expense,
                            settings.currency
                          )}`}
                          className="w-3 rounded-t-full bg-[#E8505B] transition-all sm:w-4"
                          style={{
                            height: `${Math.max(
                              day.expense > 0 ? 4 : 0,
                              (day.expense / maxWeeklyValue) * 85
                            )}%`,
                          }}
                        />
                      </div>

                      <span className={`text-xs ${MUTED}`}>
                        {day.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${TILE_BASE} ${TONES.butter}`}>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-extrabold tracking-tight">
                      Budget Overview
                    </h3>
                    <p className={`mt-1 text-sm ${MUTED}`}>
                      Monthly spending limit
                    </p>
                  </div>

                  <IconBubble>
                    <PiggyBank size={22} />
                  </IconBubble>
                </div>

                <div className="mb-2 flex items-end justify-between gap-2">
                  <span className="text-3xl font-extrabold tracking-tight">
                    {money(expenses, settings.currency)}
                  </span>

                  <span className={`text-sm ${MUTED}`}>
                    of {money(totalBudget, settings.currency)}
                  </span>
                </div>

                <div className="h-3.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all ${
                      budgetUsed >= 100
                        ? "bg-[#E8505B]"
                        : "bg-[#2FBF9B]"
                    }`}
                    style={{
                      width: `${Math.min(budgetUsed, 100)}%`,
                    }}
                  />
                </div>

                <p
                  className={`mt-3 text-sm ${
                    budgetUsed >= 100 && totalBudget > 0
                      ? `font-semibold ${BAD}`
                      : MUTED
                  }`}
                >
                  {totalBudget <= 0
                    ? "Set a monthly budget in Settings to track your limit."
                    : budgetUsed >= 100
                    ? `You have exceeded your budget by ${money(
                        expenses - totalBudget,
                        settings.currency
                      )}.`
                    : `${money(
                        totalBudget - expenses,
                        settings.currency
                      )} remaining in your budget.`}
                </p>

                <Link
                  href="/budgets"
                  className="mt-6 flex items-center justify-between rounded-full bg-white/70 px-5 py-3 text-sm font-bold transition hover:scale-[1.02] dark:bg-white/10"
                >
                  Manage budgets
                  <ArrowUpRight size={17} />
                </Link>
              </div>

              <div className={`${TILE_BASE} ${TONES.surface}`}>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-extrabold tracking-tight">
                      Spending Breakdown
                    </h3>
                    <p className={`mt-1 text-sm ${MUTED}`}>
                      Expenses by category this month
                    </p>
                  </div>

                  <IconBubble>
                    <CircleDollarSign size={22} />
                  </IconBubble>
                </div>

                {categoryTotals.length === 0 ? (
                  <p className={`py-8 text-center text-sm ${MUTED}`}>
                    No expenses recorded this month.
                  </p>
                ) : (
                  <div className="space-y-5">
                    {categoryTotals.map((category) => (
                      <div key={category.name}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{
                                backgroundColor: category.color,
                              }}
                            />
                            {category.name}
                          </span>

                          <span className="font-semibold">
                            {money(
                              category.amount,
                              settings.currency
                            )}
                          </span>
                        </div>

                        <div className="h-2.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(
                                (category.amount / Math.max(expenses, 1)) *
                                  100,
                                100
                              )}%`,
                              backgroundColor: category.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Link
                  href="/analytics"
                  className={`mt-6 flex items-center justify-between border-t pt-4 text-sm ${LINE} ${LINK}`}
                >
                  View analytics <ArrowRight size={17} />
                </Link>
              </div>

              <div className={`${TILE_BASE} ${TONES.surface}`}>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold tracking-tight">
                      Recent Transactions
                    </h3>
                    <p className={`mt-1 text-sm ${MUTED}`}>
                      Your latest financial activity
                    </p>
                  </div>

                  <Link
                    href="/transactions"
                    className={`flex items-center gap-1 text-sm ${LINK}`}
                  >
                    View all <ArrowRight size={16} />
                  </Link>
                </div>

                {recentTransactions.length === 0 ? (
                  <div className="py-10 text-center">
                    <Receipt
                      className={`mx-auto mb-3 ${MUTED}`}
                      size={30}
                    />

                    <p className={`text-sm ${MUTED}`}>
                      No transactions yet.
                    </p>

                    <Link
                      href="/transactions"
                      className={`mt-3 inline-flex items-center gap-2 text-sm ${LINK}`}
                    >
                      <Plus size={16} />
                      Add your first transaction
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentTransactions.map((transaction, index) => {
                      const incomeTransaction = isIncome(transaction);

                      return (
                        <div
                          key={transaction.id ?? `${transaction.date}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-2xl px-2 py-3 transition hover:bg-[#F5F3FA] dark:hover:bg-white/5 sm:px-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                incomeTransaction
                                  ? `bg-[#D5F3E6] dark:bg-[#1F4437] ${GOOD}`
                                  : `bg-[#FFE3D6] dark:bg-[#4A2E33] ${BAD}`
                              }`}
                            >
                              {incomeTransaction ? (
                                <ArrowDownRight size={20} />
                              ) : (
                                <ArrowUpRight size={20} />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold">
                                {transaction.title ||
                                  transaction.description ||
                                  "Transaction"}
                              </p>

                              <p className={`mt-1 truncate text-xs ${MUTED}`}>
                                {transaction.category || "Other"} ·{" "}
                                {transaction.date || "No date"}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 text-sm font-extrabold ${
                              incomeTransaction ? GOOD : BAD
                            }`}
                          >
                            {incomeTransaction ? "+" : "-"}
                            {money(
                              transaction.amount,
                              settings.currency
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <section className={`${TILE_BASE} ${TONES.sky}`}>
                <div className="flex flex-col justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <IconBubble>
                      <Bot size={23} />
                    </IconBubble>

                    <div>
                      <h3 className="font-extrabold tracking-tight">
                        Your Financial Snapshot
                      </h3>

                      <p className={`mt-1 text-sm leading-6 ${MUTED}`}>
                        {expenses === 0
                          ? "Start tracking your expenses to understand your spending habits."
                          : balance < 0
                          ? "Your expenses are higher than your income this month. Review your transactions and budget."
                          : totalBudget > 0 && budgetUsed >= 80
                          ? "You are close to your monthly budget limit. Review your spending before making extra purchases."
                          : "Your income is currently higher than your expenses. Keep tracking your spending to stay on top of your finances."}
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/ai-assistant"
                    className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#E60023] px-5 py-3 text-sm font-bold text-white transition hover:brightness-110"
                  >
                    Open AI Assistant <ArrowRight size={16} />
                  </Link>
                </div>
              </section>
            </div>

            <footer className={`pb-3 pt-4 text-center text-xs ${MUTED}`}>
              Fintelligence · Your finances, made clearer.
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

function IconBubble({ children }) {
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/70 text-[#1E1B3A] shadow-sm dark:bg-white/10 dark:text-[#F1EFFB]">
      {children}
    </span>
  );
}

function SummaryCard({
  tone,
  title,
  amount,
  note,
  icon: Icon,
  iconColor,
}) {
  return (
    <div className={`${TILE_BASE} ${TONES[tone]}`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-medium ${MUTED}`}>{title}</p>
          <p className="mt-3 break-words text-3xl font-extrabold tracking-tight">
            {amount}
          </p>
        </div>

        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/70 dark:bg-white/10 ${iconColor}`}
        >
          <Icon size={22} />
        </div>
      </div>

      <p className={`text-xs ${MUTED}`}>{note}</p>
    </div>
  );
}