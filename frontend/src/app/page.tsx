"use client"

import { useEffect, useState} from "react";
import toast, { Toaster } from 'react-hot-toast';
import { WalletCards, Calendar, Utensils, TrainFront, Home as HomeIcon, ShoppingBag, Gamepad2, Coins, Tag } from 'lucide-react';

interface Account {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
  type: string;
}

interface SubCategory {
  id: number;
  name: string;
  category_id: number;
}

// カテゴリ名に合わせてアイコンを返す
const ICON_RULES = [
  { keywords: ["食", "飯", "カフェ"], icon: <Utensils className="w-4 h-4" /> },
  { keywords: ["交通", "車", "電車", "タクシー"], icon: <TrainFront className="w-4 h-4" /> },
  { keywords: ["住", "家", "電気", "ガス"], icon: <HomeIcon className="w-4 h-4" /> },
  { keywords: ["日用", "生活"], icon: <ShoppingBag className="w-4 h-4" /> },
  { keywords: ["エンタメ", "遊", "趣味"], icon: <Gamepad2 className="w-4 h-4" /> },
  { keywords: ["給料", "収入", "賞与"], icon: <Coins className="w-4 h-4" /> },
];

const getCategoryIcon = (name: string) => {
  const match = ICON_RULES.find((rule) => 
    rule.keywords.some((keyword) => name.includes(keyword))
  );
  
  return match ? match.icon : <Tag className="w-4 h-4" />;
};

export default function Home() {
  const [amount, setAmount] = useState<number>(0);
  const [memo, setMemo] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>("");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

  const [transactionType, setTransactionType] = useState<"支出" | "収入">("支出");
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";  

  // 画面表示時に選択肢リストを取得
  useEffect(() => {
    const fetchData = async () => {  
      try {  
        const [accRes, catRes, subRes] = await Promise.all([  
          fetch(`${API_BASE_URL}/accounts/`),  
          fetch(`${API_BASE_URL}/categories/`),  
          fetch(`${API_BASE_URL}/sub-categories/`),  
        ]);  

        const [accData, catData, subData] = await Promise.all([  
          accRes.json(),  
          catRes.json(),  
          subRes.json(),  
        ]);  

        setAccounts(accData);  
        // 初期値の設定  
        if (accData.length > 0) setSelectedAccountId(accData[0].id.toString());  

        setCategories(catData);  

        setSubCategories(subData);  
      } catch (error) {  
        console.error("データの取得に失敗しました", error);  
      }  
    };  
    fetchData();
  }, []);

  const filteredSubCategories = subCategories.filter(
    (sub) => sub.category_id === Number(selectedCategoryId)
  );

  // 支出・収入を選択した時にカテゴリを自動で絞り込む
  const filteredCategories = categories.filter(
    (cat) => cat.type === transactionType
  );

  // 送信ボタンが押された時の処理
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedAccountId || !selectedSubCategoryId) {
      toast.error("すべての項目を選択してください");
      return;
    }

    // バックエンドへ送るデータ
    const transactionData = {
      date: date,
      amount: transactionType === "支出" ? -amount : amount,
      memo: memo,
      account_id: Number(selectedAccountId),
      sub_category_id: Number(selectedSubCategoryId),
      goal_id: null
    };

    try {
      await toast.promise(
        fetch(`${API_BASE_URL}/transactions/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(transactionData),
        }).then(async (response) => {
            if (!response.ok) throw new Error("Server Error");
            return response;
        }),
        {
          loading: '保存中...',
          success: '保存しました！',
          error: '保存に失敗しました。',
        }
      );

      // 保存後にリセットして次を入力しやすいように
      setAmount(0);
      setMemo("");
      setSelectedCategoryId("");
      setSelectedSubCategoryId("");
      setDate(new Date().toISOString().split('T')[0]);

    } catch (error) {
      console.error("エラー:", error);
      alert("サーバーとの通信に失敗しました");
    }
  };

  return (
    <main className="p-10">
      <Toaster position="top-center" reverseOrder={false} />
      
      <h1 className="text-3xl font-bold mb-6">💰 記録広場</h1>

      <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg shadow-md max-w-md space-y-6">
        {/* 金額入力 */}
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-xl text-gray-500">¥</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full pl-8 pr-4 py-3 text-3xl font-bold text-gray-800 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="0"
            />
          </div>
        </div>

        {/* 支出・収入選択*/}
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">transactionType</label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                setTransactionType("支出");
                setSelectedCategoryId("");
                setSelectedSubCategoryId("");
              }}
              className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                transactionType === "支出"
                  ? "bg-yellow-500 text-white shadow-md"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              支出
            </button> 
            <button
              type="button"
              onClick={() => {
                setTransactionType("収入");
                setSelectedCategoryId("");
                setSelectedSubCategoryId("");
              }}
              className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                transactionType === "収入"
                  ? "bg-yellow-500 text-white shadow-md"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              収入
            </button> 
          </div>
        </div>

        {/* 親カテゴリ */}
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">カテゴリ</label>
          <div className="flex flex-wrap gap-2">
            {filteredCategories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id.toString();
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId(cat.id.toString());
                    setSelectedSubCategoryId(""); // 親を変えたら子をリセット
                  }}
                  className={`
                    flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border
                    px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
                    ${isSelected 
                      ? "bg-yellow-600 text-white border-yellow-600 shadow-md scale-105" 
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}
                  `}
                >
                {getCategoryIcon(cat.name)}
                <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 子サブカテゴリ（親の選択によって中身が変わる） */}
        <div className={`transition-all duration-300 ${selectedCategoryId ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">詳細</label>
          <div className="flex flex-wrap gap-2">
            {filteredSubCategories.map((sub) => {
              const isSelected = selectedSubCategoryId === sub.id.toString();
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubCategoryId(sub.id.toString())}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors border
                    ${isSelected 
                      ? "bg-yellow-100 text-yellow-700 border-yellow-300 font-bold" 
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}
                  `}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 支払日 */}
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">日付</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 outline-none transition-all cursor-pointer shadow-sm hover:bg-gray-50"
            />
          </div>
        </div>

        {/* 支払い方法 プルダウン */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">支払い方法</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <WalletCards className="w-5 h-5 text-gray-400" />
              </div>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 outline-none transition-all cursor-pointer shadow-sm hover:bg-gray-50"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
        </div>

        {/* メモ入力 */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">メモ</label>
          <input 
            type="text" 
            value={memo} 
            onChange={(e) => setMemo(e.target.value)}
            className="mt-1 border border-gray-200 rounded w-full p-2 text-gray"
            placeholder="メモ"
          />
        </div>

        <button type="submit" className="mt-4 bg-yellow-500 text-white p-2 rounded w-full hover:bg-blue-600 transition">
          保存
        </button>
      </form>
    </main>
  );
}