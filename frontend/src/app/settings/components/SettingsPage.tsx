"use client"

import { useEffect, useState} from "react";
import toast, { Toaster } from 'react-hot-toast';
import AccountManager from "./AccountManager";
import CategoryManager from "./CategoryManager";


export default function page() {
    const [activeTab, setActiveTab] = useState<'accounts' | 'categories'>('categories')

    return (
        <main className="p-10">
            <h1 className="text-3xl font-bold mb-6">設定</h1>

            {/* タブのボタングループ */}
            <div className="flex border-b border-gray-300 mb-6">
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-6 py-3 font-semibold ${
                        activeTab== 'categories'
                        ? "border-b-4 border-yellow-600 text-yellow-800"
                        : "tex-gray-500 hober:text-gray-700"
                    }`}
                >
                    カテゴリ        
                </button>
                <button
                    onClick={() => setActiveTab('accounts')}
                    className={`px-6 py-3 font-semibold ${
                        activeTab== 'accounts'
                        ? "border-b-4 border-yellow-600 text-yellow-800"
                        : "tex-gray-500 hober:text-gray-700"
                    }`}
                >
                    支払い方法       
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                {activeTab === 'categories' && <CategoryManager />}
                {activeTab === 'accounts' && <AccountManager />}
            </div>
        </main>
    )
}