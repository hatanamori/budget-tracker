"use client"

import { useEffect, useState } from "react";
import toast, { Toaster } from 'react-hot-toast';

interface Transaction {
  id: number;
  date: string;
  amount: number;
  memo: string;
  account_id: number;
  sub_category_id: number;
}

interface Account {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface SubCategory {
  id: number;
  name: string;
  category_id: number;
}

export default function Page() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [traRes, accRes, catRes, subRes] = await Promise.all([
          fetch(`${API_BASE_URL}/transactions/`),
          fetch(`${API_BASE_URL}/accounts/`),
          fetch(`${API_BASE_URL}/categories/`),
          fetch(`${API_BASE_URL}/sub-categories/`),
        ]);

        const [traData, accData, catData, subData] = await Promise.all([
          traRes.json(),
          accRes.json(),
          catRes.json(),
          subRes.json(),
        ])

        setTransactions(traData);
        setAccounts(accData);
        setCategories(catData);
        setSubCategories(subData);

      } catch (error) {
        console.error("データの取得に失敗しました", error);
        toast.error("データの取得に失敗しました。");
      }
    };
    fetchData();
  }, []);

  // ID から名前を取得するヘルパー関数
  const getAccountName = (id: number) => accounts.find(a => a.id === id)?.name || "-";
  const getSubCategoryName = (id: number) => subCategories.find(s => s.id === id)?.name || "-";

  // カテゴリ名を取得するヘルパー関数
  const getCategoryName = (subCategoryId: number) => {
    console.log("渡されたID:", subCategoryId);
    // 1. まずサブカテゴリを探す
    const sub = subCategories.find(s => s.id === subCategoryId);
    if (!sub) return "-"; // サブカテゴリが見つからなければ終了

    // 2. そのサブカテゴリが持っている category_id を使ってカテゴリを探す
    const cat = categories.find(c => c.id === sub.category_id);

    // 3. カテゴリが見つかれば名前を返す
    return cat ? cat.name : "-";
  };

  return (
    <main className="p-10">
      <Toaster position="top-center" reverseOrder={false} />

      <h1 className="text-3xl font-bold mb-6">使用履歴</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border-4 border-yellow-900 bg-white text-left text-sm">
          <thead className="bg-yellow-700 text-white">
            <tr>
              <th className="px-4 py-2 border border-yellow-900">日付</th>
              <th className="px-4 py-2 border border-yellow-900">カテゴリ</th>
              <th className="px-4 py-2 border border-yellow-900">詳細</th>
              <th className="px-4 py-2 border border-yellow-900">支払元</th>
              <th className="px-4 py-2 border border-yellow-900">金額</th>
              <th className="px-4 py-2 border border-yellow-900">メモ</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-yellow-900">
            {transactions.map((t) =>
              <tr key={t.id} className="hover:bg-yellow-50">
                <td className="px-4 py-2 border-r border-yellow-900">{t.date}</td>

                <td className="px-4 py-2 border-r border-yellow-900">{getCategoryName(t.sub_category_id)}</td>
                <td className="px-4 py-2 border-r border-yellow-900">{getSubCategoryName(t.sub_category_id)}</td>
                <td className="px-4 py-2 border-r border-yellow-900">{getAccountName(t.account_id)}</td>

                <td className="px-4 py-2 border-r border-yellow-900 text-right">{t.amount.toLocaleString()}</td>
                <td className="px-4 py-2 text-gray-600">{t.memo}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {transactions.length === 0 && (
        <p className="mt-4 text-center text-gray-500">データがありません</p>
      )}
    </main>
  )
}

