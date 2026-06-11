"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil, Check, X } from "lucide-react";
import { ICON_MAP, ICON_GROUPS } from "../../icons";

interface SubCategory {
    id: number;
    name: string;
    category_id: number;
    icon_name?: string;
}

interface Category {
    id: number;
    name: string;
    type: string;
    sub_categories: SubCategory[];
    icon_name?: string;
}

type IconPickerMode = "new-parent" | "new-sub" | "edit" | null;

export default function CategoryManager() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [expandedIds, setExpandedIds] = useState<number[]>([]);

    // 新規追加フォーム
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryIcon, setNewCategoryIcon] = useState("Folder");
    const [newCategoryType, setNewCategoryType] = useState("支出");
    const [activeAddSubId, setActiveAddSubId] = useState<number | null>(null);
    const [newSubCategoryName, setNewSubCategoryName] = useState("");
    const [newSubCategoryIcon, setNewSubCategoryIcon] = useState("Folder");

    // インライン編集
    const [editingCatId, setEditingCatId] = useState<number | null>(null);
    const [editingSubId, setEditingSubId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editIcon, setEditIcon] = useState("Folder");

    // アイコンピッカー
    const [iconPickerMode, setIconPickerMode] = useState<IconPickerMode>(null);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const fetchData = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/categories/`);
            if (!res.ok) throw new Error();
            const data: Category[] = await res.json();
            setCategories(
                data.sort((a, b) => (a.type === "支出" && b.type === "収入" ? -1 : 1))
            );
        } catch {
            toast.error("データの取得に失敗しました。");
        }
    };

    useEffect(() => { fetchData(); }, []);

    const Icon = ({ name, size = 20 }: { name?: string; size?: number }) => {
        const Cmp = (name && ICON_MAP[name as keyof typeof ICON_MAP]) || ICON_MAP["Folder"];
        return <Cmp size={size} strokeWidth={2.5} className="text-gray-500" />;
    };

    const toggleExpand = (id: number) =>
        setExpandedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

    // ----- 追加 -----
    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        await toast.promise(
            fetch(`${API_BASE_URL}/categories/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCategoryName, type: newCategoryType, icon_name: newCategoryIcon }),
            }).then((r) => { if (!r.ok) throw new Error(); }),
            { loading: "保存中...", success: "追加しました", error: "保存に失敗しました。" }
        );
        setNewCategoryName("");
        fetchData();
    };

    const handleAddSubCategory = async (parentId: number) => {
        if (!newSubCategoryName.trim()) return;
        await toast.promise(
            fetch(`${API_BASE_URL}/sub-categories/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newSubCategoryName, category_id: parentId, icon_name: newSubCategoryIcon }),
            }).then((r) => { if (!r.ok) throw new Error(); }),
            { loading: "保存中...", success: "追加しました", error: "保存に失敗しました。" }
        );
        setNewSubCategoryName("");
        setActiveAddSubId(null);
        fetchData();
    };

    // ----- 編集 -----
    const startEditCat = (cat: Category) => {
        setEditingCatId(cat.id);
        setEditingSubId(null);
        setEditName(cat.name);
        setEditIcon(cat.icon_name || "Folder");
    };

    const startEditSub = (sub: SubCategory) => {
        setEditingSubId(sub.id);
        setEditingCatId(null);
        setEditName(sub.name);
        setEditIcon(sub.icon_name || "Folder");
    };

    const cancelEdit = () => { setEditingCatId(null); setEditingSubId(null); };

    const handleUpdateCategory = async (id: number) => {
        if (!editName.trim()) return;
        await toast.promise(
            fetch(`${API_BASE_URL}/categories/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editName, icon_name: editIcon }),
            }).then((r) => { if (!r.ok) throw new Error(); }),
            { loading: "保存中...", success: "更新しました", error: "更新に失敗しました。" }
        );
        cancelEdit();
        fetchData();
    };

    const handleUpdateSubCategory = async (id: number) => {
        if (!editName.trim()) return;
        await toast.promise(
            fetch(`${API_BASE_URL}/sub-categories/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editName, icon_name: editIcon }),
            }).then((r) => { if (!r.ok) throw new Error(); }),
            { loading: "保存中...", success: "更新しました", error: "更新に失敗しました。" }
        );
        cancelEdit();
        fetchData();
    };

    // ----- 削除 -----
    const handleDeleteCategory = async (id: number) => {
        if (!confirm("カテゴリを削除しますか？紐づくサブカテゴリも削除されます。")) return;
        await toast.promise(
            fetch(`${API_BASE_URL}/categories/${id}`, { method: "DELETE" }).then((r) => {
                if (!r.ok) throw new Error();
            }),
            { loading: "削除中...", success: "削除しました", error: "削除に失敗しました。" }
        );
        fetchData();
    };

    const handleDeleteSubCategory = async (id: number) => {
        if (!confirm("サブカテゴリを削除しますか？")) return;
        await toast.promise(
            fetch(`${API_BASE_URL}/sub-categories/${id}`, { method: "DELETE" }).then((r) => {
                if (!r.ok) throw new Error();
            }),
            { loading: "削除中...", success: "削除しました", error: "削除に失敗しました。" }
        );
        fetchData();
    };

    // ----- アイコンピッカー -----
    const currentPickerSelected =
        iconPickerMode === "new-parent" ? newCategoryIcon
        : iconPickerMode === "new-sub" ? newSubCategoryIcon
        : editIcon;

    const handleIconSelect = (key: string) => {
        if (iconPickerMode === "new-parent") setNewCategoryIcon(key);
        else if (iconPickerMode === "new-sub") setNewSubCategoryIcon(key);
        else setEditIcon(key);
        setIconPickerMode(null);
    };

    // ----- セクション描画 -----
    const renderSection = (title: string, type: string) => {
        const filtered = categories.filter((c) => c.type === type);
        return (
            <div className="mb-8" key={type}>
                <h3 className={`text-xs font-bold mb-3 px-1 tracking-wider uppercase ${type === "支出" ? "text-red-400" : "text-blue-400"}`}>
                    {title}
                </h3>
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                    {filtered.map((cat, idx) => (
                        <div key={cat.id} className={idx !== filtered.length - 1 ? "border-b border-gray-50" : ""}>

                            {/* 親カテゴリ行 */}
                            {editingCatId === cat.id ? (
                                // 編集モード
                                <div className="flex items-center gap-2 p-3 bg-yellow-50">
                                    <button
                                        onClick={() => setIconPickerMode("edit")}
                                        className="p-2 bg-white border border-gray-200 rounded-lg hover:border-yellow-400 transition-colors"
                                    >
                                        <Icon name={editIcon} size={18} />
                                    </button>
                                    <input
                                        autoFocus
                                        className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") handleUpdateCategory(cat.id); if (e.key === "Escape") cancelEdit(); }}
                                    />
                                    <button onClick={() => handleUpdateCategory(cat.id)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors">
                                        <Check size={18} />
                                    </button>
                                    <button onClick={cancelEdit} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                // 表示モード
                                <div
                                    className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => toggleExpand(cat.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        {expandedIds.includes(cat.id)
                                            ? <ChevronDown size={16} className="text-gray-400" />
                                            : <ChevronRight size={16} className="text-gray-400" />}
                                        <div className="p-2 bg-gray-100 rounded-lg"><Icon name={cat.icon_name} /></div>
                                        <span className="font-semibold text-gray-800 text-sm">{cat.name}</span>
                                        <span className="text-xs text-gray-400">({cat.sub_categories.length})</span>
                                    </div>
                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => startEditCat(cat)} className="p-2 text-gray-300 hover:text-yellow-500 transition-colors">
                                            <Pencil size={15} />
                                        </button>
                                        <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* サブカテゴリ展開エリア */}
                            {expandedIds.includes(cat.id) && (
                                <div className="bg-gray-50/50 px-4 pb-4 space-y-2">
                                    {cat.sub_categories.map((sub) => (
                                        <div key={sub.id}>
                                            {editingSubId === sub.id ? (
                                                // サブ編集モード
                                                <div className="flex items-center gap-2 ml-8 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                                                    <button
                                                        onClick={() => setIconPickerMode("edit")}
                                                        className="p-1.5 bg-white border border-gray-200 rounded-lg hover:border-yellow-400 transition-colors"
                                                    >
                                                        <Icon name={editIcon} size={16} />
                                                    </button>
                                                    <input
                                                        autoFocus
                                                        className="flex-1 text-sm px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        onKeyDown={(e) => { if (e.key === "Enter") handleUpdateSubCategory(sub.id); if (e.key === "Escape") cancelEdit(); }}
                                                    />
                                                    <button onClick={() => handleUpdateSubCategory(sub.id)} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg">
                                                        <Check size={16} />
                                                    </button>
                                                    <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                // サブ表示モード
                                                <div className="flex items-center justify-between ml-8 p-2 bg-white border border-gray-100 rounded-lg shadow-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Icon name={sub.icon_name} size={16} />
                                                        <span className="text-sm text-gray-600">{sub.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => startEditSub(sub)} className="p-1 text-gray-300 hover:text-yellow-500 transition-colors">
                                                            <Pencil size={13} />
                                                        </button>
                                                        <button onClick={() => handleDeleteSubCategory(sub.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* サブカテゴリ追加 */}
                                    <div className="ml-8 flex gap-2 pt-1">
                                        <input
                                            type="text"
                                            placeholder="子カテゴリを追加..."
                                            className="flex-1 text-sm bg-transparent border-b border-gray-200 focus:border-yellow-500 outline-none px-1 py-1"
                                            value={activeAddSubId === cat.id ? newSubCategoryName : ""}
                                            onChange={(e) => { setActiveAddSubId(cat.id); setNewSubCategoryName(e.target.value); }}
                                            onKeyDown={(e) => { if (e.key === "Enter") handleAddSubCategory(cat.id); }}
                                        />
                                        <button
                                            onClick={() => setIconPickerMode("new-sub")}
                                            className="p-1.5 bg-gray-50 rounded-lg hover:bg-gray-200 border border-transparent focus:border-yellow-400 outline-none"
                                        >
                                            <Icon name={newSubCategoryIcon} size={16} />
                                        </button>
                                        <button onClick={() => handleAddSubCategory(cat.id)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded">
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <p className="p-4 text-center text-gray-400 text-sm">カテゴリがありません</p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-2xl mx-auto py-6 px-2">
            <h2 className="text-xl font-bold text-gray-800 mb-6">カテゴリ設定</h2>

            {/* 新規追加バー */}
            <div className="flex gap-2 mb-8 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                <select
                    className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-bold text-gray-600 outline-none border-none"
                    value={newCategoryType}
                    onChange={(e) => setNewCategoryType(e.target.value)}
                >
                    <option value="支出">支出</option>
                    <option value="収入">収入</option>
                </select>
                <input
                    type="text"
                    placeholder="新しいカテゴリ名..."
                    className="flex-1 bg-gray-50 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); }}
                />
                <button
                    onClick={() => setIconPickerMode("new-parent")}
                    className="p-2 bg-gray-50 rounded-xl hover:bg-gray-200 transition-colors border border-transparent focus:border-yellow-400 outline-none"
                >
                    <Icon name={newCategoryIcon} />
                </button>
                <button
                    onClick={handleAddCategory}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-xl transition-all shadow-lg shadow-yellow-200"
                >
                    <Plus size={22} />
                </button>
            </div>

            {renderSection("支出カテゴリ", "支出")}
            {renderSection("収入カテゴリ", "収入")}

            {/* アイコンピッカー モーダル */}
            {iconPickerMode && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                    onClick={() => setIconPickerMode(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h3 className="text-base font-bold text-gray-800">アイコンを選択</h3>
                        </div>
                        <div className="overflow-y-auto max-h-[60vh] px-4 py-3 space-y-5">
                            {ICON_GROUPS.map((group) => (
                                <div key={group.label}>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                        {group.label}
                                    </p>
                                    <div className="grid grid-cols-7 gap-1.5">
                                        {group.icons.map((key) => {
                                            const Cmp = ICON_MAP[key as keyof typeof ICON_MAP];
                                            const selected = currentPickerSelected === key;
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => handleIconSelect(key)}
                                                    className={`p-2.5 rounded-xl flex items-center justify-center transition-colors ${
                                                        selected
                                                            ? "bg-yellow-100 border-2 border-yellow-400"
                                                            : "bg-gray-50 hover:bg-yellow-50 border-2 border-transparent"
                                                    }`}
                                                >
                                                    <Cmp size={20} className={selected ? "text-yellow-600" : "text-gray-600"} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="px-4 py-3 border-t border-gray-100">
                            <button
                                onClick={() => setIconPickerMode(null)}
                                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 font-medium"
                            >
                                キャンセル
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
