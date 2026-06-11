"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";

interface Category {
  id: number;
  name: string;
  type: string;
}

interface Budget {
  id: number;
  category_id: number;
  amount: number;
}

export default function BudgetManager() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [inputs, setInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, budRes] = await Promise.all([
          fetch(`${API_BASE_URL}/categories/`),
          fetch(`${API_BASE_URL}/budgets/`),
        ]);
        if (!catRes.ok || !budRes.ok) { toast.error("データ取得に失敗しました"); return; }
        const [cats, buds]: [Category[], Budget[]] = await Promise.all([catRes.json(), budRes.json()]);
        setCategories(cats);
        setBudgets(buds);
        const init: Record<number, string> = {};
        buds.forEach((b) => { init[b.category_id] = String(b.amount); });
        setInputs(init);
      } catch {
        toast.error("データ取得に失敗しました");
      }
    };
    fetchData();
  }, []);

  const expenseCategories = categories.filter((c) => c.type === "支出");
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);

  const handleSave = async (categoryId: number) => {
    const val = inputs[categoryId];
    const amount = Number(val);
    if (!val || isNaN(amount) || amount <= 0 || !Number.isInteger(amount)) {
      toast.error("正しい金額を入力してください");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/budgets/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error();
      const updated: Budget = await res.json();
      setBudgets((prev) => {
        const exists = prev.find((b) => b.category_id === categoryId);
        return exists
          ? prev.map((b) => (b.category_id === categoryId ? updated : b))
          : [...prev, updated];
      });
      toast.success("保存しました");
    } catch {
      toast.error("保存に失敗しました");
    }
  };

  const handleDelete = async (categoryId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/budgets/${categoryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setBudgets((prev) => prev.filter((b) => b.category_id !== categoryId));
      setInputs((prev) => {
        const copy = { ...prev };
        delete copy[categoryId];
        return copy;
      });
      toast.success("削除しました");
    } catch {
      toast.error("削除に失敗しました");
    }
  };

  return (
    <div>

      {/* 合計予算 */}
      <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl p-6 mb-6 text-center shadow-sm">
        <p className="text-yellow-100 text-xs font-semibold uppercase tracking-wider mb-1">月間予算合計</p>
        <p className="text-5xl font-black text-white tabular-nums">
          ¥{totalBudget.toLocaleString()}
        </p>
        <p className="text-yellow-100 text-sm mt-2">
          {budgets.length > 0
            ? `${budgets.length}カテゴリ設定済み`
            : "まだ予算が設定されていません"}
        </p>
      </div>

      {/* カテゴリごとの予算入力 */}
      <div className="space-y-2">
        {expenseCategories.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-6">
            支出カテゴリがありません。先にカテゴリを追加してください。
          </p>
        )}
        {expenseCategories.map((cat) => {
          const existing = budgets.find((b) => b.category_id === cat.id);
          const val = inputs[cat.id] ?? "";
          return (
            <div
              key={cat.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                existing
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-white border-gray-100 hover:border-yellow-200"
              }`}
            >
              <span className="flex-1 font-medium text-gray-700 text-sm">{cat.name}</span>
              {existing && (
                <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                  設定済
                </span>
              )}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">
                  ¥
                </span>
                <input
                  type="number"
                  value={val}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, [cat.id]: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleSave(cat.id)}
                  placeholder="0"
                  min={1}
                  className="pl-7 pr-3 py-1.5 w-36 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 text-right tabular-nums"
                />
              </div>
              <button
                onClick={() => handleSave(cat.id)}
                className="px-3 py-1.5 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 transition-colors"
              >
                保存
              </button>
              {existing && (
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="削除"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
