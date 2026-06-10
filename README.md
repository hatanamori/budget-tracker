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

#### 本番環境
.env.sampleをコピーして.env.prodを作成してください
```bash
# 1. コンテナの起動
./deploy.sh

# 2. DBマイグレーション（初回・スキーマ変更時のみ）
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

#### 開発環境
```bash
# 1. コンテナの起動
docker compose up --build

# 2. DBマイグレーション（初回・スキーマ変更時のみ）
docker compose exec backend alembic upgrade head
```

> **同じデバイスで開発と本番を同時に動かす場合**  
> `docker-compose.yml`のポート番号が競合するため、どちらかを変更してください。  
> 例: 本番を`3000:3000` / `8000:8000`、開発を`3001:3000` / `8001:8000`

### アクセス先

| サービス | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
> 同じデバイスで開発と本番を同時に動かす場合は、ポート番号を変更した番号に変更してください

## 📸 スクリーンショット
支出記録画面
<img width="1246" height="829" alt="スクリーンショット 2026-06-09 9 54 15" src="https://github.com/user-attachments/assets/74dd70d6-0cfa-4bd2-97c8-5559e307c89b" />
