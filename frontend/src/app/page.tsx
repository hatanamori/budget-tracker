"use client"

import { useEffect, useState} from "react";
import toast, { Toaster } from 'react-hot-toast';

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

// カテゴリ名に合わせてアイコンを返す
const getCategoryIcon = (name: string) => {  
  const iconMap: { [key: string]: string } = {  
    "食": "🍔",  
    "交通": "🚃",  
    "住": "🏠",  
    "日用": "🧻",  
    "エンタメ": "🎮",  
    "遊び": "🎮",  
    "給料": "💰",  
  }; 
  return iconMap[name] || "🏷️";
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


  // 送信ボタンが押された時の処理
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedAccountId || !selectedSubCategoryId) {
      toast.error("すべての項目を選択してください");
      return;
    }

    // バックエンドへ送るデータ
    const transactionData = {
      date: new Date().toISOString().split('T')[0],
      amount: amount,
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

      setAmount(0);
      setMemo("");
      setSelectedCategoryId("");
      setSelectedSubCategoryId("");

    } catch (error) {
      console.error("エラー:", error);
      alert("サーバーとの通信に失敗しました");
    }
  };

  return (
    <main className="p-10">
      <Toaster position="top-center" reverseOrder={false} />
      
      <h1 className="text-3xl font-bold mb-6">💰 家計簿アプリ</h1>

      <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg shadow-md max-w-md">
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

        {/* 親カテゴリ */}
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
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
                    px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
                    ${isSelected 
                      ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105" 
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}
                  `}
                >
                  <span className="mr-1">{getCategoryIcon(cat.name)}</span>
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 子サブカテゴリ（親の選択によって中身が変わる） */}
        <div className={`transition-all duration-300 ${selectedCategoryId ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Detail</label>
          <div className="flex flex-wrap gap-2">
            {filteredSubCategories.map((sub) => {
              const isSelected = selectedSubCategoryId === sub.id.toString();
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubCategoryId(sub.id.toString())}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm transition-all duration-200 border
                    ${isSelected 
                      ? "bg-blue-100 text-blue-700 border-blue-300 font-bold" 
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}
                  `}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 支払い方法 プルダウン */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">支払い方法</label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="mt-1 border rounded w-full p-2 text-black bg-white"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        {/* メモ入力 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">メモ</label>
          <input 
            type="text" 
            value={memo} 
            onChange={(e) => setMemo(e.target.value)}
            className="mt-1 border rounded w-full p-2 text-black"
            placeholder="メモ"
          />
        </div>

        <button type="submit" className="mt-4 bg-blue-500 text-white p-2 rounded w-full hover:bg-blue-600 transition">
          保存
        </button>
      </form>
    </main>
  );
}