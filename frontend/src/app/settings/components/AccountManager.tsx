"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";

interface Account {
    id: number;
    name: string;
}

export default function AccountManager() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [newAccountName, setNewAccountName] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const fetchData = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/accounts/`);
            if (!res.ok) throw new Error();
            setAccounts(await res.json());
        } catch {
            toast.error("データの取得に失敗しました。");
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAdd = async () => {
        if (!newAccountName.trim()) return;
        await toast.promise(
            fetch(`${API_BASE_URL}/accounts/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newAccountName }),
            }).then((r) => { if (!r.ok) throw new Error(); }),
            { loading: "保存中...", success: "追加しました", error: "保存に失敗しました。" }
        );
        setNewAccountName("");
        fetchData();
    };

    const startEdit = (account: Account) => {
        setEditingId(account.id);
        setEditName(account.name);
    };

    const cancelEdit = () => setEditingId(null);

    const handleUpdate = async (id: number) => {
        if (!editName.trim()) return;
        await toast.promise(
            fetch(`${API_BASE_URL}/accounts/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editName }),
            }).then((r) => { if (!r.ok) throw new Error(); }),
            { loading: "保存中...", success: "更新しました", error: "更新に失敗しました。" }
        );
        setEditingId(null);
        fetchData();
    };

    const handleDelete = async (id: number) => {
        if (!confirm("本当に削除しますか？")) return;
        await toast.promise(
            fetch(`${API_BASE_URL}/accounts/${id}`, { method: "DELETE" }).then((r) => {
                if (!r.ok) throw new Error();
            }),
            { loading: "削除中...", success: "削除しました", error: "削除に失敗しました。" }
        );
        setAccounts((prev) => prev.filter((a) => a.id !== id));
    };

    return (
        <div className="max-w-2xl mx-auto py-6 px-2">
            <h2 className="text-xl font-bold text-gray-800 mb-6">支払い方法</h2>

            {/* 追加フォーム */}
            <div className="flex gap-2 mb-8 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                <input
                    type="text"
                    placeholder="新しい支払い方法名..."
                    className="flex-1 bg-gray-50 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                />
                <button
                    onClick={handleAdd}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-xl transition-all shadow-lg shadow-yellow-200"
                >
                    <Plus size={22} />
                </button>
            </div>

            {/* 一覧 */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                {accounts.map((account, idx) => (
                    <div key={account.id} className={idx !== accounts.length - 1 ? "border-b border-gray-50" : ""}>
                        {editingId === account.id ? (
                            <div className="flex items-center gap-2 p-3 bg-yellow-50">
                                <input
                                    autoFocus
                                    className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(account.id); if (e.key === "Escape") cancelEdit(); }}
                                />
                                <button onClick={() => handleUpdate(account.id)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors">
                                    <Check size={18} />
                                </button>
                                <button onClick={cancelEdit} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                <span className="text-sm font-medium text-gray-800">{account.name}</span>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => startEdit(account)} className="p-2 text-gray-300 hover:text-yellow-500 transition-colors">
                                        <Pencil size={15} />
                                    </button>
                                    <button onClick={() => handleDelete(account.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {accounts.length === 0 && (
                    <p className="p-6 text-center text-gray-400 text-sm">支払い方法がありません</p>
                )}
            </div>
        </div>
    );
}
