"use client";

import AppNavigation from "@/components/AppNavigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Plus,
  X,
  Trash2,
  Wallet,
  Download,
  TrendingUp,
  TrendingDown,
  ReceiptText,
  SlidersHorizontal,
  CalendarDays,
  Pencil,
  ArrowUpDown,
  CircleDollarSign,
} from "lucide-react";

const STORAGE_KEY = "fintelligence-transactions-v1";

const categories = [
  "Food",
  "Transport",
  "Education",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Salary",
  "Freelance",
  "Other",
];

const TILE_BASE =
  "rounded-[28px] p-5 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1E1B3A]/10";

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

const FIELD =
  "w-full rounded-2xl border border-[#E4E0F0] bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-[#9C98B5] focus:border-[#E60023] dark:border-[#34305A] dark:bg-[#15132A]";

const OPTION = "bg-white text-[#1E1B3A] dark:bg-[#201D3D] dark:text-[#F1EFFB]";

const ICON_BTN =
  "rounded-full bg-[#F5F3FA] p-2 transition hover:scale-105 dark:bg-white/10";

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const emptyForm = {
  title: "",
  amount: "",
  type: "expense",
  category: "Food",
  date: "",
};

function formatMoney(amount) {
  return `৳${Number(amount || 0).toLocaleString("en-BD", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(`${date}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [sortNewest, setSortNewest] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setTransactions(parsed);
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error("Failed to save transactions:", error);
    }
  }, [transactions, loaded]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((transaction) => {
        const title = (transaction.title || "").toLowerCase();
        const category = (transaction.category || "").toLowerCase();
        const query = search.toLowerCase();

        const matchesSearch =
          title.includes(query) || category.includes(query);

        const matchesFilter =
          filter === "All" ||
          (filter === "Income" && transaction.type === "income") ||
          (filter === "Expenses" && transaction.type === "expense");

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        const dateA = a.date || "";
        const dateB = b.date || "";
        return sortNewest
          ? dateB.localeCompare(dateA)
          : dateA.localeCompare(dateB);
      });
  }, [transactions, search, filter, sortNewest]);

  const income = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const expenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const balance = income - expenses;

  function openAddModal() {
    setEditingId(null);
    setForm({ ...emptyForm, date: getToday() });
    setShowModal(true);
  }

  function openEditModal(transaction) {
    setEditingId(transaction.id);
    setForm({
      title: transaction.title || "",
      amount: String(transaction.amount ?? ""),
      type: transaction.type || "expense",
      category: transaction.category || "Other",
      date: transaction.date || getToday(),
    });
    setShowModal(true);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const amount = Number(form.amount);

    if (
      !form.title.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      alert("Enter a title and a valid amount.");
      return;
    }

    if (!form.date) {
      alert("Please select a transaction date.");
      return;
    }

    const transaction = {
      id: editingId ?? Date.now(),
      title: form.title.trim(),
      amount,
      type: form.type,
      category: form.category,
      date: form.date,
    };

    if (editingId !== null) {
      setTransactions((previous) =>
        previous.map((item) =>
          item.id === editingId ? transaction : item
        )
      );
    } else {
      setTransactions((previous) => [transaction, ...previous]);
    }

    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function deleteTransaction(id) {
    if (confirm("Delete this transaction?")) {
      setTransactions((previous) =>
        previous.filter((transaction) => transaction.id !== id)
      );
    }
  }

  function exportTransactions() {
    if (transactions.length === 0) {
      alert("No transactions to export!");
      return;
    }

    const headers = ["Title", "Amount", "Type", "Category", "Date"];

    const rows = transactions.map((transaction) => [
      transaction.title,
      transaction.amount,
      transaction.type,
      transaction.category,
      transaction.date,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map(
            (value) => `"${String(value ?? "").replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "fintelligence-transactions.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F5F3FA] text-[#1E1B3A] dark:bg-[#15132A] dark:text-[#F1EFFB]">
      <div className="relative mx-auto max-w-[1440px] px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <AppNavigation />

        <header className="mb-8 mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <Link
              href="/"
              className="mt-1 rounded-full bg-white p-3 text-[#1E1B3A] shadow-sm ring-1 ring-[#E4E0F0] transition hover:scale-105 hover:shadow-md dark:bg-[#201D3D] dark:text-[#F1EFFB] dark:ring-[#34305A]"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#E60023]" />
                <p className="text-xs font-bold tracking-[0.22em] text-[#E60023]">
                  FINANCIAL MANAGEMENT
                </p>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Transactions<span className="text-[#E60023]">.</span>
              </h1>

              <p className={`mt-2 text-sm ${MUTED}`}>
                Track every taka. Understand every decision.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 sm:justify-end">
            <button
              onClick={exportTransactions}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#1E1B3A] shadow-sm ring-1 ring-[#E4E0F0] transition hover:scale-[1.02] hover:shadow-md dark:bg-[#201D3D] dark:text-[#F1EFFB] dark:ring-[#34305A]"
            >
              <Download size={17} />
              Export CSV
            </button>

            <button
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E60023] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-110"
            >
              <Plus size={18} />
              Add Transaction
            </button>
          </div>
        </header>

        <section className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Total Income"
            amount={formatMoney(income)}
            note="Money coming in"
            icon={TrendingUp}
            color="emerald"
          />

          <StatCard
            title="Total Expenses"
            amount={formatMoney(expenses)}
            note="Money going out"
            icon={TrendingDown}
            color="rose"
          />

          <StatCard
            title="Net Balance"
            amount={formatMoney(balance)}
            note="Income minus expenses"
            icon={Wallet}
            color="blue"
          />
        </section>

        <section
          className={`overflow-hidden rounded-[28px] shadow-sm ${TONES.surface}`}
        >
          <div className={`flex flex-col gap-4 border-b p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between ${LINE}`}>
            <div>
              <div className="flex items-center gap-3">
                <IconBubble tone="lilac">
                  <ReceiptText size={20} />
                </IconBubble>
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">
                    All Transactions
                  </h2>
                  <p className={`mt-1 text-xs ${MUTED}`}>
                    {filteredTransactions.length}{" "}
                    {filteredTransactions.length === 1
                      ? "record"
                      : "records"}{" "}
                    found
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex min-w-0 items-center gap-2 rounded-full border border-[#E4E0F0] bg-[#F5F3FA] px-4 transition focus-within:border-[#E60023] dark:border-[#34305A] dark:bg-[#15132A] sm:w-64">
                <Search size={17} className={`shrink-0 ${MUTED}`} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search transactions..."
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-[#9C98B5]"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className={`${MUTED} hover:text-[#E60023]`}
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 rounded-full border border-[#E4E0F0] bg-[#F5F3FA] px-4 dark:border-[#34305A] dark:bg-[#15132A]">
                <SlidersHorizontal size={16} className={MUTED} />
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className="w-full bg-transparent py-3 text-sm font-medium outline-none sm:w-auto"
                >
                  <option className={OPTION}>All</option>
                  <option className={OPTION}>Income</option>
                  <option className={OPTION}>Expenses</option>
                </select>
              </div>
            </div>
          </div>

          {!loaded ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#E60023]/20 border-t-[#E60023]" />
              <p className={`text-sm ${MUTED}`}>
                Loading your transactions...
              </p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="px-5 py-16 text-center sm:py-20">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#E6DDFB] text-[#1E1B3A] dark:bg-[#3A2F66] dark:text-[#F1EFFB]">
                <Wallet size={30} />
              </div>

              <h3 className="text-lg font-extrabold tracking-tight">
                {search || filter !== "All"
                  ? "No matching transactions"
                  : "Your financial journey starts here"}
              </h3>

              <p className={`mx-auto mt-2 max-w-sm text-sm leading-6 ${MUTED}`}>
                {search || filter !== "All"
                  ? "Try a different search term or change your filter."
                  : "Add your first transaction to start tracking income and expenses."}
              </p>

              {search || filter !== "All" ? (
                <button
                  onClick={() => {
                    setSearch("");
                    setFilter("All");
                  }}
                  className="mt-5 rounded-full bg-[#F5F3FA] px-5 py-2.5 text-sm font-bold ring-1 ring-[#E4E0F0] transition hover:scale-[1.02] dark:bg-white/10 dark:ring-[#34305A]"
                >
                  Clear filters
                </button>
              ) : (
                <button
                  onClick={openAddModal}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#E60023] px-5 py-3 text-sm font-bold text-white transition hover:brightness-110"
                >
                  <Plus size={17} />
                  Add your first transaction
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-[#F5F3FA]/70 dark:bg-white/5">
                    <tr className={`border-b text-xs uppercase tracking-wider ${LINE} ${MUTED}`}>
                      <th className="px-6 py-4 font-bold">
                        Transaction
                      </th>
                      <th className="px-4 py-4 font-bold">Category</th>
                      <th className="px-4 py-4 font-bold">
                        <button
                          onClick={() => setSortNewest((value) => !value)}
                          className="inline-flex items-center gap-2 transition hover:text-[#E60023]"
                        >
                          Date <ArrowUpDown size={13} />
                        </button>
                      </th>
                      <th className="px-4 py-4 text-right font-bold">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-right font-bold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTransactions.map((transaction) => {
                      const isIncome = transaction.type === "income";

                      return (
                        <tr
                          key={transaction.id}
                          className={`group border-b transition hover:bg-[#F5F3FA]/70 last:border-0 dark:hover:bg-white/5 ${LINE}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                                  isIncome
                                    ? `bg-[#D5F3E6] dark:bg-[#1F4437] ${GOOD}`
                                    : `bg-[#FFE3D6] dark:bg-[#4A2E33] ${BAD}`
                                }`}
                              >
                                {isIncome ? (
                                  <ArrowDownLeft size={20} />
                                ) : (
                                  <ArrowUpRight size={20} />
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="max-w-[240px] truncate font-bold">
                                  {transaction.title || "Untitled"}
                                </p>
                                <p className={`mt-1 text-xs ${MUTED}`}>
                                  {isIncome ? "Income" : "Expense"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span className="inline-flex items-center rounded-full bg-[#E6DDFB] px-3 py-1.5 text-xs font-semibold dark:bg-[#3A2F66]">
                              {transaction.category || "Other"}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className={`flex items-center gap-2 ${MUTED}`}>
                              <CalendarDays size={15} />
                              {formatDate(transaction.date)}
                            </div>
                          </td>

                          <td
                            className={`px-4 py-4 text-right font-extrabold ${
                              isIncome ? GOOD : BAD
                            }`}
                          >
                            {isIncome ? "+" : "−"}
                            {formatMoney(transaction.amount)}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2 opacity-70 transition group-hover:opacity-100">
                              <button
                                onClick={() => openEditModal(transaction)}
                                className={`${ICON_BTN} hover:text-[#E60023]`}
                                aria-label={`Edit ${transaction.title}`}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() =>
                                  deleteTransaction(transaction.id)
                                }
                                className={`${ICON_BTN} ${BAD}`}
                                aria-label={`Delete ${transaction.title}`}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="columns-1 gap-4 p-4 sm:columns-2 md:hidden [&>*]:mb-4 [&>*]:break-inside-avoid">
                {filteredTransactions.map((transaction) => {
                  const isIncome = transaction.type === "income";

                  return (
                    <div
                      key={transaction.id}
                      className={`rounded-3xl p-4 sm:p-5 ${
                        isIncome ? TONES.mint : TONES.peach
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/70 dark:bg-white/10 ${
                              isIncome ? GOOD : BAD
                            }`}
                          >
                            {isIncome ? (
                              <ArrowDownLeft size={20} />
                            ) : (
                              <ArrowUpRight size={20} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-bold">
                              {transaction.title || "Untitled"}
                            </p>
                            <p className={`mt-1 text-xs ${MUTED}`}>
                              {transaction.category || "Other"}
                            </p>
                          </div>
                        </div>

                        <p
                          className={`shrink-0 text-sm font-extrabold ${
                            isIncome ? GOOD : BAD
                          }`}
                        >
                          {isIncome ? "+" : "−"}
                          {formatMoney(transaction.amount)}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className={`flex items-center gap-1.5 text-xs ${MUTED}`}>
                          <CalendarDays size={14} />
                          {formatDate(transaction.date)}
                        </span>

                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(transaction)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-2 text-xs font-bold dark:bg-white/10"
                          >
                            <Pencil size={13} />
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              deleteTransaction(transaction.id)
                            }
                            className={`rounded-full bg-white/70 p-2 dark:bg-white/10 ${BAD}`}
                            aria-label={`Delete ${transaction.title}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className={`flex flex-wrap items-center justify-between gap-3 border-t bg-[#F5F3FA]/70 px-5 py-4 text-xs dark:bg-white/5 sm:px-6 ${LINE} ${MUTED}`}>
            <span>
              Showing {filteredTransactions.length} of {transactions.length}{" "}
              transactions
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2FBF9B]" />
              Data saved in this browser
            </span>
          </div>
        </section>

        <footer className={`mt-7 flex flex-col items-center justify-between gap-3 pb-3 text-xs sm:flex-row ${MUTED}`}>
          <p>© Fintelligence · Personal Finance Management</p>
          <p className="flex items-center gap-1.5">
            <CircleDollarSign size={14} />
            Make every taka count.
          </p>
        </footer>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#1E1B3A]/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className="my-auto w-full max-w-lg overflow-hidden rounded-[28px] bg-white shadow-2xl dark:bg-[#201D3D]">
            <div className={`flex items-center justify-between border-b px-5 py-5 sm:px-6 ${LINE}`}>
              <div className="flex items-center gap-3">
                <IconBubble tone="lilac">
                  {editingId !== null ? (
                    <Pencil size={19} />
                  ) : (
                    <Plus size={20} />
                  )}
                </IconBubble>
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">
                    {editingId !== null
                      ? "Edit Transaction"
                      : "New Transaction"}
                  </h2>
                  <p className={`mt-1 text-xs ${MUTED}`}>
                    Enter the details below
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className={ICON_BTN}
                aria-label="Close modal"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Transaction title
                </label>
                <input
                  required
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  placeholder="e.g. Grocery shopping"
                  className={FIELD}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Amount
                </label>
                <div className="flex items-center rounded-2xl border border-[#E4E0F0] bg-white transition focus-within:border-[#E60023] dark:border-[#34305A] dark:bg-[#15132A]">
                  <span className="border-r border-[#E4E0F0] px-4 py-3.5 text-sm font-bold text-[#E60023] dark:border-[#34305A]">
                    ৳
                  </span>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) =>
                      setForm({ ...form, amount: event.target.value })
                    }
                    placeholder="0.00"
                    className="w-full bg-transparent px-4 py-3.5 text-sm outline-none placeholder:text-[#9C98B5]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Transaction type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {["expense", "income"].map((type) => {
                    const selected = form.type === type;
                    const isIncome = type === "income";

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            type,
                            category: isIncome ? "Salary" : "Food",
                          })
                        }
                        className={`flex items-center justify-center gap-2 rounded-full px-4 py-3.5 text-sm font-bold capitalize transition ${
                          selected
                            ? isIncome
                              ? `bg-[#D5F3E6] ring-2 ring-[#2FBF9B] dark:bg-[#1F4437] ${GOOD}`
                              : `bg-[#FFE3D6] ring-2 ring-[#E8505B] dark:bg-[#4A2E33] ${BAD}`
                            : `bg-[#F5F3FA] ring-1 ring-[#E4E0F0] hover:scale-[1.02] dark:bg-white/5 dark:ring-[#34305A] ${MUTED}`
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownLeft size={17} />
                        ) : (
                          <ArrowUpRight size={17} />
                        )}
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value })
                    }
                    className={FIELD}
                  >
                    {categories
                      .filter((category) =>
                        form.type === "income"
                          ? ["Salary", "Freelance", "Other"].includes(category)
                          : !["Salary", "Freelance"].includes(category)
                      )
                      .map((category) => (
                        <option
                          key={category}
                          value={category}
                          className={OPTION}
                        >
                          {category}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Date
                  </label>
                  <input
                    required
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      setForm({ ...form, date: event.target.value })
                    }
                    className={FIELD}
                  />
                </div>
              </div>

              <div className={`flex gap-3 border-t pt-5 ${LINE}`}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-full bg-[#F5F3FA] px-4 py-3.5 text-sm font-bold ring-1 ring-[#E4E0F0] transition hover:scale-[1.02] dark:bg-white/10 dark:ring-[#34305A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#E60023] px-4 py-3.5 text-sm font-bold text-white transition hover:brightness-110"
                >
                  {editingId !== null ? (
                    <Pencil size={16} />
                  ) : (
                    <Plus size={17} />
                  )}
                  {editingId !== null ? "Save Changes" : "Add Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function IconBubble({ children, tone = "surface" }) {
  const bg = {
    surface: "bg-[#F5F3FA] dark:bg-white/10",
    lilac: "bg-[#E6DDFB] dark:bg-[#3A2F66]",
  };

  return (
    <span
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#1E1B3A] dark:text-[#F1EFFB] ${bg[tone]}`}
    >
      {children}
    </span>
  );
}

function StatCard({ title, amount, note, icon: Icon, color }) {
  const styles = {
    emerald: { tone: TONES.mint, text: GOOD, dot: "bg-[#2FBF9B]" },
    rose: { tone: TONES.peach, text: BAD, dot: "bg-[#E8505B]" },
    blue: { tone: TONES.sky, text: "text-[#1F5FA8] dark:text-[#8EC1FF]", dot: "bg-[#4A90E2]" },
  };

  const style = styles[color];

  return (
    <div className={`${TILE_BASE} ${style.tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-sm font-medium ${MUTED}`}>{title}</p>
          <p className="mt-4 break-words text-3xl font-extrabold tracking-tight sm:text-4xl">
            {amount}
          </p>
          <p className={`mt-2 text-xs ${MUTED}`}>{note}</p>
        </div>

        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/70 dark:bg-white/10 ${style.text}`}
        >
          <Icon size={22} />
        </div>
      </div>

      <div className="mt-5 h-px w-full bg-black/10 dark:bg-white/10" />
      <p className={`mt-3 flex items-center gap-2 text-xs ${MUTED}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
        All recorded transactions
      </p>
    </div>
  );
}