"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

interface SubCategory {
  id: number;
}

interface Category {
  id: number;
  name: string;
  type: string;
  sub_categories: SubCategory[];
}

interface Budget {
  category_id: number;
  amount: number;
}

interface Transaction {
  date: string;
  amount: number;
  sub_category_id: number;
}

export default function BudgetDashboard({ refreshKey = 0 }: { refreshKey?: number }) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = `${today.getFullYear()}年${today.getMonth() + 1}月`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, budRes, traRes] = await Promise.all([
          fetch(`${API_BASE_URL}/categories/`),
          fetch(`${API_BASE_URL}/budgets/`),
          fetch(`${API_BASE_URL}/transactions/`),
        ]);
        if (!catRes.ok || !budRes.ok || !traRes.ok) return;
        const [cats, buds, tras] = await Promise.all([
          catRes.json(),
          budRes.json(),
          traRes.json(),
        ]);
        setCategories(cats);
        setBudgets(buds);
        setTransactions(tras);
      } catch {
        // silent — ダッシュボードはエラーでも画面全体を壊さない
      }
    };
    fetchData();
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // サブカテゴリID → 親カテゴリID のマップ
  const subToCat = useMemo(() => {
    const map = new Map<number, number>();
    categories.forEach((cat) => {
      cat.sub_categories.forEach((sub) => map.set(sub.id, cat.id));
    });
    return map;
  }, [categories]);

  // 今月の支出をカテゴリごとに集計
  const expenseByCategory = useMemo(() => {
    const map = new Map<number, number>();
    transactions
      .filter((t) => t.amount < 0 && t.date.startsWith(currentMonth))
      .forEach((t) => {
        const catId = subToCat.get(t.sub_category_id);
        if (catId !== undefined) {
          map.set(catId, (map.get(catId) ?? 0) + Math.abs(t.amount));
        }
      });
    return map;
  }, [transactions, subToCat, currentMonth]);

  const budgetRows = useMemo(() => {
    return budgets
      .map((b) => {
        const cat = categories.find((c) => c.id === b.category_id);
        const used = expenseByCategory.get(b.category_id) ?? 0;
        const pct = b.amount > 0 ? (used / b.amount) * 100 : 0;
        return { cat, budget: b.amount, used, pct, over: used > b.amount };
      })
      .filter((r) => r.cat !== undefined)
      .sort((a, b) => b.pct - a.pct); // 消化率が高い順
  }, [budgets, categories, expenseByCategory]);

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalUsed = budgetRows.reduce((s, r) => s + r.used, 0);
  const totalPct = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0;
  const totalRemaining = totalBudget - totalUsed;
  const overCount = budgetRows.filter((r) => r.over).length;

  const barColor = (pct: number, over: boolean): string => {
    if (over) return "bg-red-500";
    if (pct >= 80) return "bg-orange-400";
    return "bg-yellow-400";
  };

  const trackColor = (pct: number, over: boolean): string => {
    if (over) return "bg-red-100";
    if (pct >= 80) return "bg-orange-100";
    return "bg-yellow-100";
  };

  if (budgets.length === 0) {
    return (
      <div className="bg-white border border-yellow-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center shadow-sm">
        <div className="w-14 h-14 rounded-full bg-yellow-50 flex items-center justify-center">
          <TrendingUp size={28} className="text-yellow-500" />
        </div>
        <p className="font-semibold text-gray-700">予算ダッシュボード</p>
        <p className="text-sm text-gray-400">カテゴリごとの予算を設定すると<br />消化率がここに表示されます</p>
        <Link
          href="/settings"
          className="mt-1 px-5 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors"
        >
          予算を設定する
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-yellow-100 text-xs font-semibold">{monthLabel}</p>
          <h2 className="text-white font-bold text-lg">予算ダッシュボード</h2>
        </div>
        {overCount > 0 ? (
          <div className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            <AlertTriangle size={13} />
            {overCount}件オーバー
          </div>
        ) : totalBudget > 0 ? (
          <div className="flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            <CheckCircle2 size={13} />
            予算内
          </div>
        ) : null}
      </div>

      {/* 全体サマリー */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex justify-between items-end mb-2.5">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">今月の支出合計</p>
            <p className="text-2xl font-black text-gray-800 tabular-nums leading-none">
              ¥{totalUsed.toLocaleString()}
              <span className="text-sm font-normal text-gray-400 ml-1.5">
                / ¥{totalBudget.toLocaleString()}
              </span>
            </p>
          </div>
          <div className="text-right">
            {totalRemaining < 0 ? (
              <p className="text-red-600 font-bold text-sm tabular-nums">
                ¥{Math.abs(totalRemaining).toLocaleString()} オーバー
              </p>
            ) : (
              <p className="text-green-600 font-bold text-sm tabular-nums">
                残り ¥{totalRemaining.toLocaleString()}
              </p>
            )}
            <p className="text-xs text-gray-400">{Math.min(totalPct, 999).toFixed(0)}% 消化</p>
          </div>
        </div>
        {/* 全体バー */}
        <div className={`w-full h-3 rounded-full overflow-hidden ${trackColor(totalPct, totalRemaining < 0)}`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor(totalPct, totalRemaining < 0)}`}
            style={{ width: `${Math.min(totalPct, 100)}%` }}
          />
        </div>
      </div>

      {/* カテゴリ別バー一覧 */}
      <div className="px-5 py-3 space-y-3.5 max-h-72 overflow-y-auto">
        {budgetRows.map(({ cat, budget, used, pct, over }) => (
          <div key={cat!.id}>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-gray-700">{cat!.name}</span>
                {over && (
                  <span className="text-xs text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded-full">
                    オーバー
                  </span>
                )}
              </div>
              <div className="text-right text-xs text-gray-400 tabular-nums">
                ¥{used.toLocaleString()}
                <span className="text-gray-300 mx-1">/</span>
                ¥{budget.toLocaleString()}
                <span
                  className={`ml-2 font-bold ${
                    over ? "text-red-500" : pct >= 80 ? "text-orange-500" : "text-gray-500"
                  }`}
                >
                  {Math.min(pct, 999).toFixed(0)}%
                </span>
              </div>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${trackColor(pct, over)}`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor(pct, over)}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            {!over && budget - used > 0 && (
              <p className="text-xs text-gray-400 mt-0.5 text-right tabular-nums">
                残り ¥{(budget - used).toLocaleString()}
              </p>
            )}
            {over && (
              <p className="text-xs text-red-400 mt-0.5 text-right tabular-nums">
                ¥{(used - budget).toLocaleString()} オーバー
              </p>
            )}
          </div>
        ))}
      </div>

      {/* フッター */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
        <Link href="/settings?tab=budget" className="text-xs text-yellow-600 hover:text-yellow-700 font-medium">
          予算を編集する →
        </Link>
      </div>
    </div>
  );
}
