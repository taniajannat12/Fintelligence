"use client";

import AppNavigation from "@/components/AppNavigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  UserRound,
  Wallet,
  Bell,
  ShieldCheck,
  Save,
  CheckCircle2,
} from "lucide-react";

const SETTINGS_KEY = "fintelligence-settings-v1";

const DEFAULT_SETTINGS = {
  name: "",
  currency: "BDT",
  monthlyBudget: "10000",
  notifications: true,
};

const CURRENCIES = {
  BDT: { label: "BDT — Bangladeshi Taka (৳)", symbol: "৳" },
  USD: { label: "USD — US Dollar ($)", symbol: "$" },
  EUR: { label: "EUR — Euro (€)", symbol: "€" },
  GBP: { label: "GBP — British Pound (£)", symbol: "£" },
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

const MUTED = "text-[#6B6885] dark:text-[#A9A5C7]";
const GOOD = "text-[#0F7A5F] dark:text-[#6FE3C0]";
const BAD = "text-[#C2263A] dark:text-[#FF8A93]";

const FIELD =
  "w-full rounded-2xl border border-[#E4E0F0] bg-white px-4 py-3 outline-none focus:border-[#E60023] dark:border-[#34305A] dark:bg-[#15132A]";

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);

        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...parsed,
            currency: CURRENCIES[parsed.currency]
              ? parsed.currency
              : "BDT",
            notifications: parsed.notifications !== false,
          });
        }
      }
    } catch (err) {
      console.error("Could not load settings:", err);
      setError("Could not load saved settings.");
    } finally {
      setLoaded(true);
    }
  }, []);

  function updateSetting(key, value) {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));

    setSaved(false);
    setError("");
  }

  function handleSave(event) {
    event.preventDefault();
    setError("");

    const budget = Number(settings.monthlyBudget);

    if (
      settings.monthlyBudget.trim() === "" ||
      !Number.isFinite(budget) ||
      budget < 0
    ) {
      setError("Please enter a valid monthly budget.");
      return;
    }

    try {
      const updatedSettings = {
        ...settings,
        monthlyBudget: String(budget),
      };

      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(updatedSettings)
      );

      setSettings(updatedSettings);
      setSaved(true);
    } catch (err) {
      console.error("Could not save settings:", err);
      setError("Could not save settings. Please try again.");
    }
  }

  const currencySymbol =
    CURRENCIES[settings.currency]?.symbol || "৳";

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F3FA] text-[#6B6885] dark:bg-[#15132A] dark:text-[#A9A5C7]">
        Loading settings...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F3FA] px-5 py-8 text-[#1E1B3A] dark:bg-[#15132A] dark:text-[#F1EFFB] md:px-8">
      <AppNavigation />

      <div className="mx-auto max-w-4xl">
        <header className="mb-9 flex items-center gap-4">
          <Link
            href="/"
            className="rounded-full bg-white p-3 text-[#1E1B3A] shadow-sm ring-1 ring-[#E4E0F0] transition hover:scale-105 hover:shadow-md dark:bg-[#201D3D] dark:text-[#F1EFFB] dark:ring-[#34305A]"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={19} />
          </Link>

          <div>
            <p className="text-sm font-bold tracking-wide text-[#E60023]">FINTELLIGENCE</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
              Settings
            </h1>
            <p className={`mt-1 text-sm ${MUTED}`}>
              Customize your finance dashboard.
            </p>
          </div>
        </header>

        <form onSubmit={handleSave}>
       
          <div className="columns-1 gap-5 sm:columns-2 [&>*]:mb-5 [&>*]:break-inside-avoid">
          
            <section className={`${TILE_BASE} ${TONES.lilac}`}>
              <div className="mb-6 flex items-center gap-3">
                <IconBubble>
                  <UserRound size={21} />
                </IconBubble>
                <div>
                  <h2 className="font-bold">Profile</h2>
                  <p className={`text-sm ${MUTED}`}>
                    Personalize your experience.
                  </p>
                </div>
              </div>

              <label
                htmlFor="displayName"
                className="mb-2 block text-sm font-semibold"
              >
                Display name
              </label>

              <input
                id="displayName"
                type="text"
                maxLength={60}
                value={settings.name}
                onChange={(e) => updateSetting("name", e.target.value)}
                placeholder="Enter your name"
                className={FIELD}
              />
            </section>

            <section className={`${TILE_BASE} ${TONES.peach}`}>
              <div className="mb-6 flex items-center gap-3">
                <IconBubble>
                  <Wallet size={21} />
                </IconBubble>
                <div>
                  <h2 className="font-bold">Finance Preferences</h2>
                  <p className={`text-sm ${MUTED}`}>
                    Choose your preferred currency and budget.
                  </p>
                </div>
              </div>

              <div className="grid gap-5">
                <div>
                  <label
                    htmlFor="currency"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Currency
                  </label>

                  <select
                    id="currency"
                    value={settings.currency}
                    onChange={(e) =>
                      updateSetting("currency", e.target.value)
                    }
                    className={FIELD}
                  >
                    {Object.entries(CURRENCIES).map(([code, currency]) => (
                      <option key={code} value={code}>
                        {currency.label}
                      </option>
                    ))}
                  </select>

                  <p className={`mt-2 text-xs ${MUTED}`}>
                    Currency preference: {settings.currency} ({currencySymbol}).
                    Existing amounts are not converted.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="monthlyBudget"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Monthly budget ({currencySymbol})
                  </label>

                  <input
                    id="monthlyBudget"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={settings.monthlyBudget}
                    onChange={(e) =>
                      updateSetting("monthlyBudget", e.target.value)
                    }
                    className={FIELD}
                  />

                  <p className={`mt-2 text-xs ${MUTED}`}>
                    Your preferred monthly spending limit.
                  </p>
                </div>
              </div>
            </section>

            <section className={`${TILE_BASE} ${TONES.mint}`}>
              <div className="mb-5 flex items-center gap-3">
                <IconBubble>
                  <Bell size={21} />
                </IconBubble>
                <div>
                  <h2 className="font-bold">Notifications</h2>
                  <p className={`text-sm ${MUTED}`}>
                    Manage your budget reminder preference.
                  </p>
                </div>
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Budget reminders</p>
                  <p className={`mt-1 text-sm ${MUTED}`}>
                    Enable budget reminder alerts where supported.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) =>
                    updateSetting("notifications", e.target.checked)
                  }
                  className="h-6 w-6 shrink-0 accent-[#E60023]"
                />
              </label>

              <p className={`mt-4 text-xs ${MUTED}`}>
                This saves your preference. Automatic browser notifications
                require additional notification logic.
              </p>
            </section>

            <section className={`${TILE_BASE} ${TONES.sky}`}>
              <div className="flex items-start gap-3">
                <IconBubble>
                  <ShieldCheck size={21} />
                </IconBubble>

                <div>
                  <h2 className="font-bold">Privacy</h2>
                  <p className={`mt-2 text-sm leading-6 ${MUTED}`}>
                    Your settings are stored in this browser using
                    LocalStorage. They are not synced across accounts or
                    devices, and there is no cloud backup.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-full bg-[#E60023] px-7 py-3 font-bold text-white shadow-sm transition hover:brightness-110"
            >
              <Save size={18} />
              Save Settings
            </button>

            {saved && (
              <p
                role="status"
                className={`flex items-center gap-2 text-sm font-semibold ${GOOD}`}
              >
                <CheckCircle2 size={17} />
                Settings saved successfully!
              </p>
            )}

            {error && (
              <p role="alert" className={`text-sm font-semibold ${BAD}`}>
                {error}
              </p>
            )}
          </div>
        </form>

        <p className={`mt-6 text-xs ${MUTED}`}>
          Fintelligence · Your Money, Smarter.
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