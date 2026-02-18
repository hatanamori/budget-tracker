# 開発用メモ
## 1. データベースのボリューム（保存領域）ごと削除して停止
docker compose down -v

## 2. 再構築して起動
docker compose up -d --build

## 3. テーブル作成（マイグレーション適用）
docker compose exec backend alembic upgrade head