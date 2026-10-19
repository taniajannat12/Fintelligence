"use client";

import AppNavigation from "@/components/AppNavigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Send,
  Bot,
  User,
  Wallet,
  Lightbulb,
} from "lucide-react";

const STORAGE_KEY = "fintelligence-transactions-v1";
const API_URL = "http://127.0.0.1:8000/chat";

const suggestions = [
  "Analyze my spending",
  "How can I save money?",
  "Give me a budget tip",
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

export default function AIAssistantPage() {
  const [transactions, setTransactions] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm your Money Companion. Ask me about your income, expenses, or savings.",
    },
  ]);

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
      console.error("Could not load transactions:", error);
    }
  }, []);

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const money = (amount) =>
    `৳${Number(amount).toLocaleString("en-BD", {
      maximumFractionDigits: 2,
    })}`;

  async function sendMessage(text = input) {
    const question = text.trim();

    if (!question || loading) return;

    setInput("");
    setLoading(true);

    setMessages((previous) => [
      ...previous,
      { role: "user", text: question },
    ]);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          transactions,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.error ||
            `Backend request failed (${response.status}).`
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: data.answer || "Sorry, I could not generate an answer.",
        },
      ]);
    } catch (error) {
      console.error("AI Assistant error:", error);

      let errorMessage = error.message;

      if (
        error instanceof TypeError &&
        error.message.toLowerCase().includes("fetch")
      ) {
        errorMessage =
          "Python Backend Cannot work";
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: `Sorry, request failed: ${errorMessage}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F3FA] px-5 py-8 text-[#1E1B3A] dark:bg-[#15132A] dark:text-[#F1EFFB] md:px-8">
      <AppNavigation />

      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center gap-4">
          <Link
            href="/"
            className="rounded-full bg-white p-3 text-[#1E1B3A] shadow-sm ring-1 ring-[#E4E0F0] transition hover:scale-105 hover:shadow-md dark:bg-[#201D3D] dark:text-[#F1EFFB] dark:ring-[#34305A]"
          >
            <ArrowLeft size={19} />
          </Link>

          <div>
            <p className="text-sm font-bold tracking-wide text-[#E60023]">FINTELLIGENCE</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
              AI Money Companion
            </h1>
            <p className={`mt-1 text-sm ${MUTED}`}>
              Your personal finance guidance assistant.
            </p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div
            className={`flex min-h-[600px] flex-col overflow-hidden rounded-[28px] shadow-sm ${TONES.surface}`}
          >
            <div className={`flex items-center gap-3 border-b p-5 ${LINE}`}>
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[#E6DDFB] text-[#1E1B3A] dark:bg-[#3A2F66] dark:text-[#F1EFFB]">
                <Sparkles size={22} />
              </div>

              <div>
                <h2 className="font-extrabold tracking-tight">Money Companion</h2>
                <p className={`text-xs ${MUTED}`}>
                  Powered by Gemini AI via Python FastAPI
                </p>
              </div>

              <span className={`ml-auto flex items-center gap-2 rounded-full bg-[#D5F3E6] px-3 py-1.5 text-xs font-semibold dark:bg-[#1F4437] ${GOOD}`}>
                <span className="h-2 w-2 rounded-full bg-[#2FBF9B]" />
                {loading ? "Thinking..." : "Ready"}
              </span>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : ""
                  }`}
                >
                  {message.role === "assistant" && (
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#E6DDFB] text-[#1E1B3A] dark:bg-[#3A2F66] dark:text-[#F1EFFB]">
                      <Bot size={18} />
                    </span>
                  )}

                  <div
                    className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap ${
                      message.role === "user"
                        ? "rounded-br-lg bg-[#1E1B3A] text-white dark:bg-[#F1EFFB] dark:text-[#1E1B3A]"
                        : "rounded-bl-lg bg-[#F5F3FA] dark:bg-[#15132A]"
                    }`}
                  >
                    {message.text}
                  </div>

                  {message.role === "user" && (
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FFE3D6] text-[#1E1B3A] dark:bg-[#4A2E33] dark:text-[#F1EFFB]">
                      <User size={18} />
                    </span>
                  )}
                </div>
              ))}

              {loading && (
                <div className={`flex items-center gap-3 text-sm ${MUTED}`}>
                  <Bot size={18} className="text-[#E60023]" />
                  Analyzing your transactions...
                </div>
              )}
            </div>

            <div className={`border-t p-5 ${LINE}`}>
              <div className="mb-3 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={loading}
                    onClick={() => sendMessage(suggestion)}
                    className="rounded-full bg-[#F5F3FA] px-4 py-2 text-xs font-semibold ring-1 ring-[#E4E0F0] transition hover:scale-[1.03] hover:text-[#E60023] hover:ring-[#E60023] disabled:opacity-40 dark:bg-white/5 dark:ring-[#34305A]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex items-center gap-3 rounded-full border border-[#E4E0F0] bg-[#F5F3FA] p-2 pl-4 transition focus-within:border-[#E60023] dark:border-[#34305A] dark:bg-[#15132A]"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your spending..."
                  disabled={loading}
                  className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[#9C98B5]"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="rounded-full bg-[#E60023] p-3 text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Send message"
                >
                  <Send size={17} />
                </button>
              </form>
            </div>
          </div>

          <aside className="space-y-4">
            <div className={`${TILE_BASE} ${TONES.peach}`}>
              <div className="mb-4 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white/70 dark:bg-white/10">
                  <Wallet size={19} />
                </span>
                <h2 className="font-extrabold tracking-tight">Your Overview</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <p className={`text-sm ${MUTED}`}>Income</p>
                  <p className={`mt-1 text-2xl font-extrabold tracking-tight ${GOOD}`}>
                    {money(income)}
                  </p>
                </div>

                <div>
                  <p className={`text-sm ${MUTED}`}>Expenses</p>
                  <p className={`mt-1 text-2xl font-extrabold tracking-tight ${BAD}`}>
                    {money(expenses)}
                  </p>
                </div>

                <div className="border-t border-black/10 pt-4 dark:border-white/10">
                  <p className={`text-sm ${MUTED}`}>Net Balance</p>
                  <p className="mt-1 text-2xl font-extrabold tracking-tight">
                    {money(income - expenses)}
                  </p>
                </div>
              </div>
            </div>

            <div className={`${TILE_BASE} ${TONES.butter}`}>
              <span className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-white/70 dark:bg-white/10">
                <Lightbulb size={20} />
              </span>
              <h2 className="font-extrabold tracking-tight">Smart Tip</h2>
              <p className={`mt-2 text-sm leading-6 ${MUTED}`}>
                Track your expenses regularly and set realistic category
                budgets to build healthier financial habits.
              </p>
            </div>

            <Link
              href="/transactions"
              className="block rounded-full bg-[#E60023] px-4 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:brightness-110"
            >
              View Transactions
            </Link>
          </aside>
        </section>

        <p className={`mt-5 text-xs ${MUTED}`}>
          AI responses are generated by Gemini using the transaction data
          provided by your app. Review financial suggestions carefully.
        </p>
      </div>
    </main>
  );
}