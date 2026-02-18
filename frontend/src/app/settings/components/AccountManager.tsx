"use client"

import { useEffect, useState} from "react";
import toast, { Toaster } from 'react-hot-toast';

interface Account {
  id: number;
  name: string;
}

export default function Page() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [newAccountName, setNewAccountName] = useState("");

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";  

    const fetchData = async () => {
        try {
        const accRes = await fetch(`${API_BASE_URL}/accounts/`);
        const accData = await accRes.json();
        setAccounts(accData);
        } catch (error) {
        console.error("データの取得に失敗しました", error);
        toast.error("データの取得に失敗しました。");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = async () => {
        if (!newAccountName) return;

        const promise = fetch(`${API_BASE_URL}/accounts/`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({name: newAccountName}),
        }).then(async (response) => {
            if (!response.ok) throw new Error("Server Error");
            return response
        });

        await toast.promise(promise, {
            loading: '保存中...',
            success: '保存しました！',
            error: '保存に失敗しました。',
        }).then(() => {
            setNewAccountName("");
            fetchData();
        }).catch(() => {});
    }

    const handleDelete = async (id: number) => {
        if (!confirm("本当に削除しますか？")) return;

        const promise = fetch(`${API_BASE_URL}/accounts/${id}`, {
            method: "DELETE",
        }).then(async (response) => {
            if (!response.ok) throw new Error("Server Error");
            return response
        });

        await toast.promise(promise, {
            loading: '削除中...',
            success: '削除しました',
            error: '削除に失敗しました。',
        }).then(() => {
            setAccounts((prev) => prev.filter(a => a.id !== id));
        }).catch(() => {});
    }

    return (
      <div className="space-y-6">
        {/* ▼ 追加フォームエリア */}
        <div className="flex gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <input
            type="text"
            placeholder="新しい支払い方法名"
            className="border border-yellow-400 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-yellow-500"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
          />
          <button
            onClick={handleAdd}
            className="bg-yellow-600 text-white px-6 py-2 rounded hover:bg-yellow-700 font-bold whitespace-nowrap"
          >
            追加
          </button>
        </div>

        {/* ▼ 一覧表示エリア */}
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full border-collapse bg-white text-left text-sm">
            <thead className="bg-yellow-600 text-white">
              <tr>
                <th className="px-6 py-3 font-bold">支払い方法名</th>
                <th className="px-6 py-3 font-bold text-right">操作</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-yellow-100">
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-yellow-50">
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {account.name}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded border border-red-200"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
              
              {/* データがない場合 */}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                    データがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
}