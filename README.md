# budget-tracker

支出を記録し、可視化する家計簿 Web アプリケーション

## ✨ 主な機能

- 収支の記録
- 支出記録の表示


## 🛠 技術スタック

| 層 | 技術 |
|---|---|
| Frontend | TypeScript / React |
| Backend | Python / FastAPI |
| DB | PostgreSQL |
| 実行環境 | Docker Compose |
| マイグレーション | Alembic |

## 📁 ディレクトリ構成

```
budget-tracker/
├── backend/
├── frontend/
├── docs/
└── docker-compose.yml
```

## 🚀 セットアップ

### 前提条件

- Docker / Docker Compose


### 起動手順

```bash
# 1. コンテナの起動
docker compose up --build

# 2. DBマイグレーション
docker compose exec backend alembic upgrade head
```

### アクセス先

| サービス | URL |
|---|---|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:8001 |
| API Docs (Swagger) | http://localhost:8001/docs |

## 📸 スクリーンショット
支出記録画面
<img width="1246" height="829" alt="スクリーンショット 2026-06-09 9 54 15" src="https://github.com/user-attachments/assets/74dd70d6-0cfa-4bd2-97c8-5559e307c89b" />
