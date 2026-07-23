# 顧客Googleへの提供（Cursor / clasp オペレーション）

顧客の許可（編集者共有）は必要。そのうえで **Cursor から中身をデプロイ**するための手順。

## 前提

- このマシンで `clasp login` 済み（デモアカウント）
- 顧客が次のいずれかを実施済み:
  1. **空のスプレッドシート**を作成し、claspログイン中のGoogleアカウントを**編集者**招待  
  2. または **共有フォルダ**を編集者招待し、その中にシートを作成して ID を共有

Apps Script API も顧客側で ON が必要な場合あり（初回のみ）:  
https://script.google.com/home/usersettings

## Cursor に頼むときの言い方（例）

```text
顧客「〇〇社労士事務所」に①残業上限をデプロイして。
スプレッドシートID: xxxxx
```

エージェントは `scripts/deploy-01-to-client.sh` を使う。

## 手動でも同じ

```bash
cd samples/uplink-sharoushi
./scripts/deploy-01-to-client.sh \
  --spreadsheet-id "SPREADSHEET_ID" \
  --client-slug "yamada-office"
```

成功すると:

- 顧客シートに GAS（＋Web UI ソース）が載る
- `clients/<slug>.json` に ID が記録される（以降の改修用）

## 改修（2回目以降）

```bash
./scripts/push-01-client.sh --client-slug "yamada-office"
```

## 顧客に最初にお願いする文面（コピペ用）

```text
お手数ですが、次だけお願いします。

1. Googleドライブで新規スプレッドシートを作成
2. 右上「共有」で、次のアドレスを「編集者」で追加
   （ここに clasp でログインしているGoogleアドレスを書く）
3. シートのURLを返信

あとのセットアップ（チェック画面・判定ロジック）はこちらで入れます。
データは先生のGoogle上に残ります。
```

## できないこと

- 共有前に勝手に顧客アカウントへ書き込むこと
- 顧客のパスワード代行ログイン
