"use client"

import { useState } from "react";
import AccountManager from "./AccountManager";
import CategoryManager from "./CategoryManager";
import RecurringManager from "./RecurringManager";

type Tab = 'categories' | 'accounts' | 'recurring';

export default function page() {
    const [activeTab, setActiveTab] = useState<Tab>('categories')

    const tabs: { key: Tab; label: string }[] = [
        { key: 'categories', label: 'カテゴリ' },
        { key: 'accounts', label: '支払い方法' },
        { key: 'recurring', label: '固定費' },
    ];

    return (
        <main className="p-10">
            <h1 className="text-3xl font-bold mb-6">設定</h1>

            {/* タブのボタングループ */}
            <div className="flex border-b border-gray-300 mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-6 py-3 font-semibold ${
                            activeTab === tab.key
                            ? "border-b-4 border-yellow-600 text-yellow-800"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                {activeTab === 'categories' && <CategoryManager />}
                {activeTab === 'accounts' && <AccountManager />}
                {activeTab === 'recurring' && <RecurringManager />}
            </div>
        </main>
    )
}