#!/bin/bash
# deploy.sh

set -e

COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.prod"
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"

if [ ! -f .env.prod ]; then
    echo "❌ .env.prod ファイルが見つかりません。READMEに従って作成してください。"
    exit 1
fi
source .env.prod

if $COMPOSE ps --format '{{.State}}' db | grep -q "running"; then
    echo "📦 バックアップ中..."
    $COMPOSE exec -T db pg_dump -U "$POSTGRES_USER" --clean --if-exists "$POSTGRES_DB" > "$BACKUP_FILE"
    echo "✅ バックアップ完了: $BACKUP_FILE"
else
    echo "⚠️ dbコンテナが起動していないため、バックアップをスキップします。"
fi

echo "🔄 最新コードを取得中..."
git pull

echo "🏗️ ビルド＆再起動中..."
set +e
$COMPOSE up -d --build
BUILD_RESULT=$?
set -e

if [ $BUILD_RESULT -ne 0 ]; then
    echo "❌ ビルドまたは起動に失敗しました。ログを確認してください。"
    exit 1
fi

echo "🚀 デプロイ完了！"