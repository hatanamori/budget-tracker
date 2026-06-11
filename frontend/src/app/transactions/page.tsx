"use client";

import { useEffect, useState, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import { ArrowUpDown, ArrowUp, ArrowDown, Table2, Clock, Layers } from "lucide-react";

interface Transaction {
  id: number;
  date: string;
  amount: number;
  memo: string | null;
  account_id: number;
  sub_category_id: number;
  account: { id: number; name: string } | null;
}

interface Account {
  id: number;
  name: string;
}

interface SubCategory {
  id: number;
  name: string;
  category_id: number;
}

interface Category {
  id: number;
  name: string;
  type: string;
  sub_categories: SubCategory[];
}

type ViewMode = "table" | "timeline" | "category";
type SortKey = "date" | "amount";
type SortDir = "asc" | "desc";
type TypeFilter = "all" | "expense" | "income";

// ヘルパー：金額表示
function amountDisplay(amount: number) {
  if (amount === 0) {
    return <span className="font-mono font-bold tabular-nums text-gray-600">¥0</span>;
  }
  const isInc = amount > 0;
  return (
    <span className={`font-mono font-bold tabular-nums ${isInc ? "text-blue-600" : "text-red-600"}`}>
      {isInc ? "+" : "-"}¥{Math.abs(amount).toLocaleString()}
    </span>
  );
}

// ヘルパー：日付を M/D 形式に
function fmtDate(d: string) {
  const parts = d.split("-");
  if (parts.length < 3) return d;
  const [, m, day] = parts;
  return `${parseInt(m, 10)}/${parseInt(day, 10)}`;
}

export default function Page() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const todayDate = new Date();
  const todayMonth = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, "0")}`;

  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [filterMonth, setFilterMonth] = useState<string>(todayMonth);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showAccount, setShowAccount] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [traRes, accRes, catRes] = await Promise.all([
          fetch(`${API_BASE_URL}/transactions/`),
          fetch(`${API_BASE_URL}/accounts/`),
          fetch(`${API_BASE_URL}/categories/`),
        ]);
        if (!traRes.ok || !accRes.ok || !catRes.ok) {
          throw new Error("データの取得に失敗しました。");
        }
        const [traData, accData, catData] = await Promise.all([
          traRes.json(),
          accRes.json(),
          catRes.json(),
        ]);
        setTransactions(traData);
        setAccounts(accData);
        setCategories(catData);
      } catch {
        toast.error("データの取得に失敗しました。");
      }
    };
    fetchData();
  }, []);

  const allSubCategories = useMemo(
    () => categories.flatMap((c) => c.sub_categories),
    [categories]
  );

  const getAccountName = (id: number) => accounts.find((a) => a.id === id)?.name ?? "-";
  const getSubCategory = (id: number) => allSubCategories.find((s) => s.id === id);
  const getCategory = (subId: number) => {
    const sub = getSubCategory(subId);
    return sub ? categories.find((c) => c.id === sub.category_id) : undefined;
  };

  // 選択可能な月一覧（データにある月 + 今月）
  const availableMonths = useMemo(() => {
    const months = new Set(transactions.map((t) => t.date.slice(0, 7)));
    months.add(todayMonth);
    return Array.from(months).sort().reverse();
  }, [transactions, todayMonth]);

  // フィルター＋ソート済みリスト
  const filtered = useMemo(() => {
    let list = transactions.filter((t) => t.date.startsWith(filterMonth));
    if (typeFilter === "expense") list = list.filter((t) => t.amount < 0);
    if (typeFilter === "income") list = list.filter((t) => t.amount > 0);
    if (filterCategoryId) {
      list = list.filter((t) => {
        const sub = allSubCategories.find((s) => s.id === t.sub_category_id);
        const cat = sub ? categories.find((c) => c.id === sub.category_id) : undefined;
        return cat?.id === Number(filterCategoryId);
      });
    }
    return [...list].sort((a, b) => {
      const base =
        sortKey === "date"
          ? b.date.localeCompare(a.date)
          : Math.abs(b.amount) - Math.abs(a.amount);
      return sortDir === "asc" ? -base : base;
    });
  }, [transactions, filterMonth, typeFilter, filterCategoryId, sortKey, sortDir, allSubCategories, categories]);

  const expenses = useMemo(() => filtered.filter((t) => t.amount < 0), [filtered]);
  const incomes = useMemo(() => filtered.filter((t) => t.amount > 0), [filtered]);
  const totalExpense = useMemo(() => expenses.reduce((s, t) => s + Math.abs(t.amount), 0), [expenses]);
  const totalIncome = useMemo(() => incomes.reduce((s, t) => s + t.amount, 0), [incomes]);

  // タイムライン用：日付でグループ化
  const byDate = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    filtered.forEach((t) => {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    });
    return Array.from(map.entries()).sort(([a], [b]) =>
      sortDir === "asc" ? a.localeCompare(b) : b.localeCompare(a)
    );
  }, [filtered, sortDir]);

  // カテゴリ別用：カテゴリでグループ化
  const byCat = useMemo(() => {
    const map = new Map<number, { cat: Category; txns: Transaction[] }>();
    filtered.forEach((t) => {
      const sub = allSubCategories.find((s) => s.id === t.sub_category_id);
      const cat = sub ? categories.find((c) => c.id === sub.category_id) : undefined;
      if (!cat) return;
      const entry = map.get(cat.id) ?? { cat, txns: [] };
      entry.txns.push(t);
      map.set(cat.id, entry);
    });
    return Array.from(map.values()).sort(
      (a, b) =>
        b.txns.reduce((s, t) => s + Math.abs(t.amount), 0) -
        a.txns.reduce((s, t) => s + Math.abs(t.amount), 0)
    );
  }, [filtered, allSubCategories, categories]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown size={13} className="opacity-30 inline ml-1" />;
    return sortDir === "desc"
      ? <ArrowDown size={13} className="inline ml-1" />
      : <ArrowUp size={13} className="inline ml-1" />;
  };

  // テーブルビューの共通テーブル
  const renderTable = (list: Transaction[], isIncome: boolean) => {
    const colCount = !isIncome && showAccount ? 6 : 5;
    return (
      <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-100">
        <table className="min-w-full bg-white text-sm border-collapse">
          <thead className={`text-white text-xs ${isIncome ? "bg-blue-600" : "bg-yellow-700"}`}>
            <tr>
              <th
                className="px-3 py-2 text-left w-12 cursor-pointer whitespace-nowrap"
                onClick={() => toggleSort("date")}
              >
                日付{sortIcon("date")}
              </th>
              <th className="px-3 py-2 text-left w-20">カテゴリ</th>
              <th className="px-3 py-2 text-left w-28">詳細</th>
              {!isIncome && showAccount && (
                <th className="px-3 py-2 text-left w-20">支払元</th>
              )}
              <th
                className="px-3 py-2 text-right w-28 cursor-pointer whitespace-nowrap"
                onClick={() => toggleSort("amount")}
              >
                金額{sortIcon("amount")}
              </th>
              <th className="px-3 py-2 text-left">メモ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-400 text-xs">{fmtDate(t.date)}</td>
                <td className="px-3 py-2 text-gray-500 text-xs truncate max-w-[5rem]">
                  {getCategory(t.sub_category_id)?.name ?? "-"}
                </td>
                <td className="px-3 py-2 font-medium text-gray-800">
                  {getSubCategory(t.sub_category_id)?.name ?? "-"}
                </td>
                {!isIncome && showAccount && (
                  <td className="px-3 py-2 text-gray-400 text-xs">{getAccountName(t.account_id)}</td>
                )}
                <td className="px-3 py-2 text-right">{amountDisplay(t.amount)}</td>
                <td className="px-3 py-2 text-gray-400 text-xs">{t.memo ?? ""}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-4 py-6 text-center text-gray-400">
                  データがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">使用履歴</h1>

      {/* ─── フィルター＆コントロール ─── */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        {/* 月選択 */}
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
        >
          {availableMonths.map((m) => (
            <option key={m} value={m}>
              {m.replace("-", "年")}月
            </option>
          ))}
        </select>

        {/* 収支フィルター */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm bg-white">
          {(["all", "expense", "income"] as TypeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 transition-colors ${
                typeFilter === t ? "bg-yellow-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t === "all" ? "すべて" : t === "expense" ? "支出" : "収入"}
            </button>
          ))}
        </div>

        {/* カテゴリ絞り込み */}
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
          value={filterCategoryId}
          onChange={(e) => setFilterCategoryId(e.target.value)}
        >
          <option value="">カテゴリ: すべて</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* 支払元表示トグル */}
        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showAccount}
            onChange={(e) => setShowAccount(e.target.checked)}
            className="rounded accent-yellow-500"
          />
          支払元を表示
        </label>

        <div className="flex-1" />

        {/* 表示モード切替 */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white text-sm">
          {(
            [
              { mode: "table" as ViewMode, icon: <Table2 size={15} />, label: "テーブル" },
              { mode: "timeline" as ViewMode, icon: <Clock size={15} />, label: "タイムライン" },
              { mode: "category" as ViewMode, icon: <Layers size={15} />, label: "カテゴリ別" },
            ]
          ).map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1.5 px-3 py-2 transition-colors ${
                viewMode === mode ? "bg-yellow-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {icon}{label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── サマリー ─── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
          <p className="text-xs text-red-600 mb-1">支出合計</p>
          <p className="text-2xl font-black text-red-600 tabular-nums">¥{totalExpense.toLocaleString()}</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
          <p className="text-xs text-blue-600 mb-1">収入合計</p>
          <p className="text-2xl font-black text-blue-600 tabular-nums">¥{totalIncome.toLocaleString()}</p>
        </div>
        <div
          className={`border rounded-xl p-4 text-center ${
            totalIncome - totalExpense >= 0
              ? "bg-green-50 border-green-100"
              : "bg-gray-50 border-gray-100"
          }`}
        >
          <p className={`text-xs mb-1 ${totalIncome - totalExpense >= 0 ? "text-green-700" : "text-gray-600"}`}>
            収支
          </p>
          <p className={`text-2xl font-black tabular-nums ${totalIncome - totalExpense >= 0 ? "text-green-600" : "text-gray-700"}`}>
            {totalIncome - totalExpense >= 0 ? "+" : ""}¥{(totalIncome - totalExpense).toLocaleString()}
          </p>
        </div>
      </div>

      {/* ─── テーブルビュー ─── */}
      {viewMode === "table" && (
        <div className="space-y-6">
          {(typeFilter === "all" || typeFilter === "expense") && (
            <section>
              <h2 className="text-sm font-bold text-red-600 mb-2">
                支出 <span className="font-normal text-gray-400">({expenses.length}件)</span>
              </h2>
              {renderTable(expenses, false)}
            </section>
          )}
          {(typeFilter === "all" || typeFilter === "income") && (
            <section>
              <h2 className="text-sm font-bold text-blue-600 mb-2">
                収入 <span className="font-normal text-gray-400">({incomes.length}件)</span>
              </h2>
              {renderTable(incomes, true)}
            </section>
          )}
        </div>
      )}

      {/* ─── タイムラインビュー ─── */}
      {viewMode === "timeline" && (
        <div className="space-y-3">
          <div className="flex justify-end mb-1">
            <button
              onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              {sortDir === "desc" ? <ArrowDown size={13} /> : <ArrowUp size={13} />}
              {sortDir === "desc" ? "新しい順" : "古い順"}
            </button>
          </div>
          {byDate.map(([d, txns]) => {
            const dayExp = txns.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
            const dayInc = txns.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
            return (
              <div key={d} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="font-bold text-gray-700 text-sm">{fmtDate(d)}</span>
                  <div className="flex gap-3 text-xs font-mono">
                    {dayExp > 0 && <span className="text-red-500">-¥{dayExp.toLocaleString()}</span>}
                    {dayInc > 0 && <span className="text-blue-500">+¥{dayInc.toLocaleString()}</span>}
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {txns.map((t) => {
                    const isInc = t.amount > 0;
                    return (
                      <div key={t.id} className="flex items-center px-4 py-3 gap-3 hover:bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 text-sm">
                              {getSubCategory(t.sub_category_id)?.name ?? "-"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {getCategory(t.sub_category_id)?.name ?? ""}
                            </span>
                          </div>
                          {t.memo && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{t.memo}</p>
                          )}
                        </div>
                        {!isInc && showAccount && (
                          <span className="text-xs text-gray-400 shrink-0">
                            {getAccountName(t.account_id)}
                          </span>
                        )}
                        <span className="shrink-0">{amountDisplay(t.amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {byDate.length === 0 && (
            <p className="text-center text-gray-400 py-10">データがありません</p>
          )}
        </div>
      )}

      {/* ─── カテゴリ別ビュー ─── */}
      {viewMode === "category" && (
        <div className="space-y-3">
          {byCat.map(({ cat, txns }) => {
            const total = txns.reduce((s, t) => s + t.amount, 0);
            const isIncome = cat.type === "収入";
            return (
              <details
                key={cat.id}
                open
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <summary
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer select-none ${
                    isIncome ? "bg-blue-50" : "bg-yellow-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isIncome ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {isIncome ? "収入" : "支出"}
                    </span>
                    <span className="font-bold text-gray-800">{cat.name}</span>
                    <span className="text-xs text-gray-400">({txns.length}件)</span>
                  </div>
                  {amountDisplay(total)}
                </summary>
                <div className="divide-y divide-gray-50">
                  {txns.map((t) => (
                    <div key={t.id} className="flex items-center px-4 py-2 gap-3 text-sm hover:bg-gray-50">
                      <span className="text-gray-400 text-xs w-9 shrink-0">{fmtDate(t.date)}</span>
                      <span className="flex-1 text-gray-700">
                        {getSubCategory(t.sub_category_id)?.name ?? "-"}
                      </span>
                      {t.memo && (
                        <span className="text-xs text-gray-400 flex-1 truncate">{t.memo}</span>
                      )}
                      {!isIncome && showAccount && (
                        <span className="text-xs text-gray-400 shrink-0">
                          {getAccountName(t.account_id)}
                        </span>
                      )}
                      <span className="shrink-0">{amountDisplay(t.amount)}</span>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
          {byCat.length === 0 && (
            <p className="text-center text-gray-400 py-10">データがありません</p>
          )}
        </div>
      )}
    </main>
  );
}
