
import os
from collections import defaultdict

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key) if api_key else None

app = FastAPI(title="Fintelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    question: str
    transactions: list[dict] = []


class AnalyzeRequest(BaseModel):
    transactions: list[dict] = []


def get_amount(transaction):
    try:
        return float(transaction.get("amount", 0) or 0)
    except (TypeError, ValueError):
        return 0.0


def get_type(transaction):
    return str(transaction.get("type", "")).lower().strip()


@app.get("/")
def home():
    return {"message": "Fintelligence API is running!"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "ai_configured": client is not None,
        "groq_configured": client is not None,
    }


@app.post("/analyze")
def analyze(request: AnalyzeRequest):
    transactions = request.transactions

    income = sum(
        get_amount(t)
        for t in transactions
        if get_type(t) == "income"
    )

    expenses = sum(
        get_amount(t)
        for t in transactions
        if get_type(t) in ("expense", "expenses")
    )

    savings = income - expenses
    savings_rate = savings / income * 100 if income > 0 else 0

    categories = defaultdict(float)

    for transaction in transactions:
        if get_type(transaction) in ("expense", "expenses"):
            category = str(transaction.get("category", "Other"))
            categories[category] += get_amount(transaction)

    top_category = (
        max(categories, key=categories.get)
        if categories
        else "None"
    )

    return {
        "total_income": round(income, 2),
        "total_expenses": round(expenses, 2),
        "savings": round(savings, 2),
        "savings_rate": round(savings_rate, 2),
        "top_expense_category": top_category,
        "category_breakdown": dict(categories),
    }


@app.post("/chat")
def chat(request: ChatRequest):
    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Please enter a question.",
        )

    if client is None:
        raise HTTPException(
            status_code=500,
            detail="Groq API key missing. Check backend/.env.",
        )

    transactions = request.transactions

    income = sum(
        get_amount(t)
        for t in transactions
        if get_type(t) == "income"
    )

    expenses = sum(
        get_amount(t)
        for t in transactions
        if get_type(t) in ("expense", "expenses")
    )

    categories = defaultdict(float)

    for transaction in transactions:
        if get_type(transaction) in ("expense", "expenses"):
            category = str(transaction.get("category", "Other"))
            categories[category] += get_amount(transaction)

    category_summary = (
        "\n".join(
            f"- {category}: ৳{amount:,.2f}"
            for category, amount in categories.items()
        )
        or "No expense records available."
    )

    transaction_summary = "\n".join(
        (
            f"- Type: {t.get('type', 'Unknown')}, "
            f"Category: {t.get('category', 'Other')}, "
            f"Amount: ৳{get_amount(t):,.2f}, "
            f"Description: {t.get('description', 'N/A')}"
        )
        for t in transactions[:100]
    ) or "No transactions available."

    prompt = f"""
You are Fintelligence, a helpful personal finance assistant.

Answer the user's question clearly and simply.
Use the financial data below when relevant.
Amounts are in Bangladeshi Taka (BDT).
Never invent transactions or financial facts.
If data is missing, explain that clearly.
Give practical budgeting advice when appropriate.
Do not claim to execute payments or financial transactions.

Financial overview:
Total income: ৳{income:,.2f}
Total expenses: ৳{expenses:,.2f}
Net savings: ৳{income - expenses:,.2f}

Expenses by category:
{category_summary}

Recent transactions:
{transaction_summary}

User's question:
{request.question}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are Fintelligence, a helpful personal "
                        "finance assistant. Be accurate and concise."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.4,
            max_tokens=1024,
        )

        answer = response.choices[0].message.content

        if not answer:
            raise HTTPException(
                status_code=502,
                detail="AI returned an empty response. Please try again.",
            )

        return {"answer": answer}

    except HTTPException:
        raise

    except Exception as error:
        print("Groq API error:", repr(error))
        error_text = str(error).lower()

        if "429" in error_text or "rate_limit" in error_text:
            detail = (
                "Groq free-tier limit reached. Please wait and try again."
            )
        elif "401" in error_text or "authentication" in error_text:
            detail = (
                "Groq API key is invalid. Check backend/.env."
            )
        elif "model" in error_text and (
            "not found" in error_text or "decommissioned" in error_text
        ):
            detail = (
                "The selected Groq model is unavailable. "
                "Please check the available models."
            )
        else:
            detail = (
                "Groq AI request failed. Check the backend terminal "
                "for details."
            )

        raise HTTPException(status_code=502, detail=detail)
