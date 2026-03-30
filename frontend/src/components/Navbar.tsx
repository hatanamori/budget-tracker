"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, Target, Settings } from "lucide-react";
import packageJson from "../../package.json";

const NAV_ITEMS = [
  { name: "ホーム", href: "/", icon: Home },
  { name: "履歴", href: "/transactions", icon: List },
  { name: "目標", href: "/goals", icon: Target },
  { name: "設定", href: "/settings", icon: Settings }
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* PC用サイドバー */}
      <aside className="hidden md:flex flex-col w-64 bg-amber-200 h-screen fixed left-0 top-0 shadow-[4px_0px_0px_0px_rgba(0,0,0,0.1)] z-50">
        <div className="p-6">
          <div className="inline-block border-b-[8px] border-double border-amber-900 pb-2 mb-6">
            <h1 className="font-[family-name:var(--font-pixel)] text-3xl text-amber-500 drop-shadow-[2px_2px_0px_#713f12] tracking-wider leading-none">
              BUDGET<br />TRACKER
            </h1>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 
                  font-[family-name:var(--font-pixel)] text-lg
                  border-4 transition-all duration-100
                  ${isActive
                    ? "bg-amber-400 border-amber-900 text-amber-900 shadow-[4px_4px_0px_0px_#713f12] -translate-x-1 -translate-y-1"
                    : "bg-amber-100 border-transparent text-amber-700 hover:border-amber-400 hover:text-amber-900"}
                `}
              >
                <item.icon size={20} strokeWidth={3} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto text-center">
          <span className="font-[family-name:var(--font-pixel)] text-sm text-amber-700/60 tracking-widest">
            v{packageJson.version}
          </span>
        </div>
      </aside>

      {/* スマホ用ボトムナビ */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-amber-200 border-t-4 border-amber-900 shadow-lg z-50 pb-safe">
        <div className="flex justify-around items-center h-20">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center w-full h-full space-y-1
                  font-[family-name:var(--font-pixel)]
                  ${isActive ? "text-amber-900 bg-amber-300" : "text-amber-600"}
                `}
              >
                <item.icon size={24} strokeWidth={isActive ? 3 : 2} />
                <span className="text-xs">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}