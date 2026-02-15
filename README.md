
## 🚀 セットアップ手順
1. コンテナの起動
```bash
docker compose up --build
```
2. データベースの構築
マイグレーションを実施する
```bash
docker compose exec backend alembic upgrade head
```