"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

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

interface RecurringTransaction {
  id: number;
  name: string;
  amount: number;
  memo: string | null;
  frequency: string;
  day_of_month: number;
  month_of_year: number | null;
  start_date: string;
  end_date: string | null;
  last_applied_date: string | null;
  is_active: boolean;
  account_id: number;
  sub_category_id: number;
  account: Account | null;
  sub_category: SubCategory | null;
}

const MONTHS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export default function RecurringManager() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    name: "",
    amount: "",
    memo: "",
    frequency: "monthly",
    day_of_month: "1",
    month_of_year: "1",
    start_date: today,
    end_date: "",
    account_id: "",
    sub_category_id: "",
  });

  const fetchAll = async () => {
    try {
      const [rtRes, accRes, catRes] = await Promise.all([
        fetch(`${API_BASE_URL}/recurring-transactions/`),
        fetch(`${API_BASE_URL}/accounts/`),
        fetch(`${API_BASE_URL}/categories/`),
      ]);
      setItems(await rtRes.json());
      setAccounts(await accRes.json());
      setCategories(await catRes.json());
    } catch {
      toast.error("データの取得に失敗しました。");
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const allSubCategories = categories.flatMap((c) => c.sub_categories);

  const handleAdd = async () => {
    if (!form.name || !form.amount || !form.account_id || !form.sub_category_id) {
      toast.error("名前・金額・支払い方法・カテゴリは必須です。");
      return;
    }

    const selectedSub = allSubCategories.find((s) => s.id === Number(form.sub_category_id));
    const selectedCat = categories.find((c) => c.id === selectedSub?.category_id);
    const isExpense = selectedCat ? selectedCat.type === "支出" : true;

    const body: Record<string, unknown> = {
      name: form.name,
      amount: isExpense ? -Math.abs(Number(form.amount)) : Math.abs(Number(form.amount)),
      memo: form.memo || null,
      frequency: form.frequency,
      day_of_month: Number(form.day_of_month),
      month_of_year: form.frequency === "yearly" ? Number(form.month_of_year) : null,
      start_date: form.start_date,
      end_date: form.end_date || null,
      account_id: Number(form.account_id),
      sub_category_id: Number(form.sub_category_id),
    };

    const promise = fetch(`${API_BASE_URL}/recurring-transactions/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => {
      if (!r.ok) throw new Error();
      return r;
    });

    await toast.promise(promise, {
      loading: "保存中...",
      success: "固定費を登録しました！",
      error: "保存に失敗しました。",
    });

    setForm({
      name: "",
      amount: "",
      memo: "",
      frequency: "monthly",
      day_of_month: "1",
      month_of_year: "1",
      start_date: today,
      end_date: "",
      account_id: "",
      sub_category_id: "",
    });
    fetchAll();
  };

  const handleToggleActive = async (item: RecurringTransaction) => {
    const promise = fetch(`${API_BASE_URL}/recurring-transactions/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !item.is_active }),
    }).then((r) => {
      if (!r.ok) throw new Error();
      return r;
    });

    await toast.promise(promise, {
      loading: "更新中...",
      success: item.is_active ? "無効にしました" : "有効にしました",
      error: "更新に失敗しました。",
    });

    fetchAll();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("この固定費を削除しますか？")) return;

    const promise = fetch(`${API_BASE_URL}/recurring-transactions/${id}`, {
      method: "DELETE",
    }).then((r) => {
      if (!r.ok) throw new Error();
      return r;
    });

    await toast.promise(promise, {
      loading: "削除中...",
      success: "削除しました",
      error: "削除に失敗しました。",
    });

    fetchAll();
  };

  const frequencyLabel = (item: RecurringTransaction) => {
    if (item.frequency === "monthly") return `毎月${item.day_of_month}日`;
    return `毎年${item.month_of_year}月${item.day_of_month}日`;
  };

  const subCategoryName = (item: RecurringTransaction) =>
    item.sub_category?.name ??
    allSubCategories.find((s) => s.id === item.sub_category_id)?.name ??
    "-";

  return (
    <div className="space-y-6">
      {/* 追加フォーム */}
      <div className="p-5 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
        <h3 className="font-bold text-yellow-800">固定費を追加</h3>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="名前（例：家賃、Netflix）"
            className="col-span-2 border border-yellow-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            type="number"
            placeholder="金額（円）"
            className="border border-yellow-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />

          <input
            type="text"
            placeholder="メモ（任意）"
            className="border border-yellow-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
          />

          {/* 頻度 */}
          <select
            className="border border-yellow-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value })}
          >
            <option value="monthly">毎月</option>
            <option value="yearly">毎年</option>
          </select>

          {/* 月（yearly のみ） */}
          {form.frequency === "yearly" && (
            <select
              className="border border-yellow-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={form.month_of_year}
              onChange={(e) => setForm({ ...form, month_of_year: e.target.value })}
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
          )}

          {/* 日 */}
          <select
            className="border border-yellow-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={form.day_of_month}
            onChange={(e) => setForm({ ...form, day_of_month: e.target.value })}
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}日</option>
            ))}
          </select>

          {/* 支払い方法 */}
          <select
            className="border border-yellow-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={form.account_id}
            onChange={(e) => setForm({ ...form, account_id: e.target.value })}
          >
            <option value="">支払い方法を選択</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          {/* サブカテゴリ */}
          <select
            className="border border-yellow-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={form.sub_category_id}
            onChange={(e) => setForm({ ...form, sub_category_id: e.target.value })}
          >
            <option value="">カテゴリを選択</option>
            {categories.map((cat) => (
              <optgroup key={cat.id} label={cat.name}>
                {cat.sub_categories.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* 開始日 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-yellow-700">開始日</label>
            <input
              type="date"
              className="border border-yellow-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>

          {/* 終了日 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-yellow-700">終了日（任意）</label>
            <input
              type="date"
              className="border border-yellow-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>
        </div>

        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-yellow-600 text-white px-5 py-2 rounded hover:bg-yellow-700 font-bold"
        >
          <Plus size={18} />
          追加
        </button>
      </div>

      {/* 一覧 */}
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full border-collapse bg-white text-left text-sm">
          <thead className="bg-yellow-600 text-white">
            <tr>
              <th className="px-4 py-3 font-bold">名前</th>
              <th className="px-4 py-3 font-bold text-right">金額</th>
              <th className="px-4 py-3 font-bold">頻度</th>
              <th className="px-4 py-3 font-bold">カテゴリ</th>
              <th className="px-4 py-3 font-bold">支払い方法</th>
              <th className="px-4 py-3 font-bold">最終登録日</th>
              <th className="px-4 py-3 font-bold text-center">有効</th>
              <th className="px-4 py-3 font-bold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-yellow-100">
            {items.map((item) => (
              <tr
                key={item.id}
                className={`hover:bg-yellow-50 ${!item.is_active ? "opacity-40" : ""}`}
              >
                <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                <td className={`px-4 py-3 text-right font-mono ${item.amount < 0 ? "text-red-600" : "text-green-600"}`}>
                  {item.amount < 0 ? "-" : "+"}¥{Math.abs(item.amount).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-gray-600">{frequencyLabel(item)}</td>
                <td className="px-4 py-3 text-gray-600">{subCategoryName(item)}</td>
                <td className="px-4 py-3 text-gray-600">
                  {item.account?.name ?? "-"}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {item.last_applied_date ?? "未登録"}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleToggleActive(item)}
                    className={item.is_active ? "text-yellow-600" : "text-gray-400"}
                    title={item.is_active ? "無効にする" : "有効にする"}
                  >
                    {item.is_active
                      ? <ToggleRight size={24} />
                      : <ToggleLeft size={24} />}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded border border-red-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-6 text-center text-gray-400">
                  固定費が登録されていません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
