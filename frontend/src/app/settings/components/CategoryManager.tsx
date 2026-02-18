"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

// 型定義に type を追加
interface SubCategory {
  id: number;
  name: string;
  category_id: number;
}

interface Category {
  id: number;
  name: string;
  type: string; // "支出" or "収入"
  sub_categories: SubCategory[];
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // 入力フォームの状態
  const [newCategoryName, setNewCategoryName] = useState("");
  // デフォルトは 支出
  const [newCategoryType, setNewCategoryType] = useState("支出"); 
  
  const [newSubCategoryName, setNewSubCategoryName] = useState("");

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

  // --- 親カテゴリ追加 ---
  const handleAddCategory = async () => {
    if (!newCategoryName) return;

    const promise = fetch(`${API_BASE_URL}/categories/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        name: newCategoryName,
        type: newCategoryType 
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
  const handleAddSubCategory = async () => {
    if (!selectedCategory || !newSubCategoryName) return;

    const promise = fetch(`${API_BASE_URL}/sub-categories/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newSubCategoryName,
        category_id: selectedCategory.id,
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      {/* ================= 左側：親カテゴリ ================= */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-700">カテゴリ (親)</h2>

        {/* 追加フォームエリア */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
          {/* ▼ ラジオボタンエリア */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="categoryType"
                value="支出"
                checked={newCategoryType === "支出"}
                onChange={(e) => setNewCategoryType(e.target.value)}
                className="accent-red-500"
              />
              <span className="text-gray-700 font-medium">支出</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="categoryType"
                value="収入"
                checked={newCategoryType === "収入"}
                onChange={(e) => setNewCategoryType(e.target.value)}
                className="accent-blue-500"
              />
              <span className="text-gray-700 font-medium">収入</span>
            </label>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="新しいカテゴリ名"
              className="border border-yellow-400 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <button
              onClick={handleAddCategory}
              className="bg-yellow-600 text-white px-6 py-2 rounded hover:bg-yellow-700 font-bold whitespace-nowrap"
            >
              追加
            </button>
          </div>
        </div>

        {/* 一覧表示エリア */}
        <div className="overflow-x-auto shadow-md rounded-lg max-h-[600px] overflow-y-auto">
          <table className="min-w-full border-collapse bg-white text-left text-sm">
            <thead className="bg-yellow-600 text-white sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 font-bold">カテゴリ名</th>
                <th className="px-6 py-3 font-bold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-yellow-100">
              {categories.map((cat) => (
                <tr
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat)}
                  className={`cursor-pointer transition-colors ${
                    selectedCategory?.id === cat.id
                      ? "bg-yellow-100 border-l-4 border-yellow-600"
                      : "hover:bg-yellow-50"
                  }`}
                >
                  <td className="px-6 py-4 font-medium text-gray-800">
                    <div className="flex items-center gap-2">
                      {/* タイプのバッジ表示 */}
                      <span
                        className={`text-xs px-2 py-0.5 rounded border ${
                          cat.type === "収入"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : "bg-red-100 text-red-700 border-red-200"
                        }`}
                      >
                        {cat.type}
                      </span>
                      <span>{cat.name}</span>
                      {selectedCategory?.id === cat.id && (
                        <span className="ml-2 text-xs text-yellow-700 font-bold">
                          選択中
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat.id);
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded border border-red-200"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
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

      {/* ================= 右側：サブカテゴリ ================= */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-700">
          サブカテゴリ (子)
          {selectedCategory && (
            <span className="text-base font-normal ml-2 text-gray-500">
              - {selectedCategory.name}
            </span>
          )}
        </h2>

        {!selectedCategory ? (
          <div className="p-10 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-400">
            左側のリストからカテゴリを選択してください
          </div>
        ) : (
          <>
            {/* 追加フォームエリア */}
            <div className="flex gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="text"
                placeholder="新しいサブカテゴリ名"
                className="border border-blue-400 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newSubCategoryName}
                onChange={(e) => setNewSubCategoryName(e.target.value)}
              />
              <button
                onClick={handleAddSubCategory}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-bold whitespace-nowrap"
              >
                追加
              </button>
            </div>

            {/* 一覧表示エリア */}
            <div className="overflow-x-auto shadow-md rounded-lg max-h-[600px] overflow-y-auto">
              <table className="min-w-full border-collapse bg-white text-left text-sm">
                <thead className="bg-blue-600 text-white sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 font-bold">サブカテゴリ名</th>
                    <th className="px-6 py-3 font-bold text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {selectedCategory.sub_categories.map((sub) => (
                    <tr key={sub.id} className="hover:bg-blue-50">
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {sub.name}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteSubCategory(sub.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded border border-red-200"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                  {selectedCategory.sub_categories.length === 0 && (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        サブカテゴリが登録されていません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}