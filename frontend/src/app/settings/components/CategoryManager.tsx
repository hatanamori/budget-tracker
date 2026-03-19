"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
    Plus,
    Trash2,
    ChevronDown,
    ChevronRight,
    Folder,
    Subtitles,
} from "lucide-react";
import { ICON_MAP } from "../../icons";

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

export default function CategoryManager() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [expandedIds, setExpandedIds] = useState<number[]>([]);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryIcon, setNewCategoryIcon] = useState("Folder");
    const [newCategoryType, setNewCategoryType] = useState("支出");
    const [iconModalType, setIconModalType] = useState<"parent" | "sub" | null>(null);
    const [activeAddSubId, setActiveAddSubId] = useState<number | null>(null);
    const [newSubCategoryName, setNewSubCategoryName] = useState("");
    const [newSubCategoryIcon, setNewSubCategoryIcon] = useState("Folder");

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // データ取得
    const fetchData = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/categories/`);
            if (!res.ok) throw new Error("Fetch failed");

            const data: Category[] = await res.json();

            // ▼ 並び替えロジック: 支出が先、収入が後
            const sortedData = data.sort((a, b) => {
                if (a.type === "支出" && b.type === "収入") return -1;
                if (a.type === "収入" && b.type === "支出") return 1;
                return 0;
            });

            setCategories(sortedData);

            if (selectedCategory) {
                const updatedSelected = sortedData.find((c) => c.id === selectedCategory.id);
                setSelectedCategory(updatedSelected || null);
            }
        } catch (error) {
            console.error("データの取得に失敗しました", error);
            toast.error("データの取得に失敗しました。");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleExpand = (id: number) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const DynamicIconDisplay = ({ iconName }: { iconName?: string }) => {
        const DynamicIcon = (iconName && ICON_MAP[iconName as keyof typeof ICON_MAP]) || ICON_MAP["Folder"];
        return <DynamicIcon size={20} strokeWidth={2.5} className="text-gray-500" />
    }

    // --- 親カテゴリ追加 ---
    const handleAddCategory = async () => {
        if (!newCategoryName) return;

        const promise = fetch(`${API_BASE_URL}/categories/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: newCategoryName,
                type: newCategoryType,
                icon_name: newCategoryIcon
            }),
        }).then(async (response) => {
            if (!response.ok) throw new Error("Server Error");
            return response;
        });

        await toast.promise(promise, {
            loading: "保存中...",
            success: "カテゴリを追加しました！",
            error: "保存に失敗しました。",
        });

        setNewCategoryName("");
        fetchData();
    };

    // --- 親カテゴリ削除 ---
    const handleDeleteCategory = async (id: number) => {
        if (!confirm("カテゴリを削除しますか？紐づくサブカテゴリも削除されます。")) return;

        const promise = fetch(`${API_BASE_URL}/categories/${id}`, {
            method: "DELETE",
        }).then(async (response) => {
            if (!response.ok) throw new Error("Server Error");
            return response;
        });

        await toast.promise(promise, {
            loading: "削除中...",
            success: "削除しました",
            error: "削除に失敗しました。",
        });

        if (selectedCategory?.id === id) {
            setSelectedCategory(null);
        }
        fetchData();
    };

    // --- サブカテゴリ追加 ---
    const handleAddSubCategory = async (parentId: number) => {
        if (!newSubCategoryName) return;

        const promise = fetch(`${API_BASE_URL}/sub-categories/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: newSubCategoryName,
                category_id: parentId,
                icon_name: newSubCategoryIcon
            }),
        }).then(async (response) => {
            if (!response.ok) throw new Error("Server Error");
            return response;
        });

        await toast.promise(promise, {
            loading: "保存中...",
            success: "サブカテゴリを追加しました！",
            error: "保存に失敗しました。",
        });

        setNewSubCategoryName("");
        setActiveAddSubId(null);
        fetchData();
    };

    // --- サブカテゴリ削除 ---
    const handleDeleteSubCategory = async (id: number) => {
        if (!confirm("サブカテゴリを削除しますか？")) return;

        const promise = fetch(`${API_BASE_URL}/sub-categories/${id}`, {
            method: "DELETE",
        }).then(async (response) => {
            if (!response.ok) throw new Error("Server Error");
            return response;
        });

        await toast.promise(promise, {
            loading: "削除中...",
            success: "削除しました",
            error: "削除に失敗しました。",
        });

        fetchData();
    };

    const renderCategorySection = (title: string, type: string) => {
        const filteredCategories = categories.filter(c => c.type === type);

        return (
            <div className="mb-8" key={type}>
                <h3 className={`text-sm font-bold mb-3 px-2 ${type === '支出' ? 'text-red-500' : 'text-blue-500'}`}>
                    {title}
                </h3>
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                    {filteredCategories.map((cat, index) => (
                        <div key={cat.id} className={`${index !== filteredCategories.length - 1 ? 'border-b border-gray-50' : ''}`}>
                            {/* 親カテゴリ行 */}
                            <div
                                className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => toggleExpand(cat.id)}
                            >
                                <div className="flex items-center gap-3">
                                    {expandedIds.includes(cat.id) ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                                    <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                        <DynamicIconDisplay iconName={cat.icon_name} />
                                    </div>
                                    <span className="font-semibold text-gray-800">{cat.name}</span>
                                    <span className="text-xs text-gray-400">({cat.sub_categories.length})</span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCategory(cat.id);
                                    }}
                                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {/* 子サブカテゴリ展開エリア */}
                            {expandedIds.includes(cat.id) && (
                                <div className="bg-gray-50/50 px-4 pb-4 space-y-2">
                                    {cat.sub_categories.map(sub => (
                                        <div key={sub.id} className="flex items-center justify-between ml-10 p-2 bg-white border border-gray-100 rounded-lg shadow-sm">
                                            <DynamicIconDisplay iconName={sub.icon_name} />
                                            <span className="text-sm text-gray-600">{sub.name}</span>
                                            <button
                                                onClick={() => handleDeleteSubCategory(sub.id)}
                                                className="p-1 text-gray-300 hover:text-red-500"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}

                                    {/* サブカテゴリ追加入力 */}
                                    <div className="ml-10 flex gap-2 pt-2">
                                        <input
                                            type="text"
                                            placeholder="子カテゴリを追加..."
                                            className="flex-1 text-sm bg-transparent border-b border-gray-200 focus:border-yellow-500 outline-none px-1 py-1"
                                            value={activeAddSubId === cat.id ? newSubCategoryName : ""}
                                            onChange={(e) => {
                                                setActiveAddSubId(cat.id);
                                                setNewSubCategoryName(e.target.value);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleAddSubCategory(cat.id);
                                            }}
                                        />
                                        <button
                                            onClick={() => setIconModalType("sub")}
                                            className="p-2 bg-gray-50 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center border border-transparent focus:border-yellow-400 outline-none"
                                        >
                                            <DynamicIconDisplay iconName={newSubCategoryIcon} />
                                        </button>
                                        <button
                                            onClick={() => handleAddSubCategory(cat.id)}
                                            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {filteredCategories.length === 0 && (
                        <div className="p-4 text-center text-gray-400 text-sm">カテゴリがありません</div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">カテゴリ設定</h2>

            {/* 新規カテゴリ作成クイックバー */}
            <div className="flex gap-3 mb-10 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <select
                    className="bg-gray-50 border-none rounded-xl px-3 text-sm font-bold text-gray-600 outline-none"
                    value={newCategoryType}
                    onChange={(e) => setNewCategoryType(e.target.value)}
                >
                    <option value="支出">支出</option>
                    <option value="収入">収入</option>
                </select>
                <input
                    type="text"
                    placeholder="新しい親カテゴリ名..."
                    className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-yellow-400"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                />
                {/* アイコン選択ボタン */}
                <button
                    onClick={() => setIconModalType("parent")}
                    className="p-2 bg-gray-50 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center border border-transparent focus:border-yellow-400 outline-none"
                >
                    <DynamicIconDisplay iconName={newCategoryIcon} />
                </button>
                <button
                    onClick={handleAddCategory}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-xl transition-all shadow-lg shadow-yellow-200"
                >
                    <Plus size={24} />
                </button>
            </div>

            {renderCategorySection("支出カテゴリ", "支出")}
            {renderCategorySection("収入カテゴリ", "収入")}

            {iconModalType && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                    onClick={() => setIconModalType(null)}
                >
                    <div
                        className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-gray-800 mb-4">アイコンを選択</h3>
                        <div className="grid grid-cols-5 gap-3">
                            {Object.keys(ICON_MAP).map((iconKey) => {
                                const IconCmp = ICON_MAP[iconKey as keyof typeof ICON_MAP];

                                const isSelected = iconModalType === "parent"
                                    ? newCategoryIcon === iconKey
                                    : newSubCategoryIcon === iconKey;
                                return (
                                    <button
                                        key={iconKey}
                                        onClick={() => {
                                            if (iconModalType === "parent") {
                                                setNewCategoryIcon(iconKey);
                                            } else {
                                                setNewSubCategoryIcon(iconKey);
                                            }
                                            setIconModalType(null);
                                        }}
                                        className={`p-3 rounded-xl flex items-center justify-center transition-colors ${isSelected
                                            ? 'bg-yellow-100 border-2 border-yellow-400'
                                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                                            }`}
                                    >
                                        <IconCmp size={24} className={isSelected ? 'text-yellow-600' : 'text-gray-600'} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}