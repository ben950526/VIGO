<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cloud Agent 本機環境

應用在 `web/`。資料層是本機 Supabase（Docker），不是託管專案。

- 開機時會啟動 Docker 與 `supabase start`，並寫入 `web/.env.local`（不進 git）。`ADMIN_EMAIL` 為 `admin@example.com`。用這個信箱註冊後可進 `/admin/review`。
- 容器之間若連不到，先執行 `sudo iptables-legacy -P FORWARD ACCEPT`。這個 VM 的 legacy iptables FORWARD 預設是 DROP。
- `npm run dev`、`npm run lint`、`npm run build` 都在 `web/` 執行。開發站是 http://localhost:3000。
- `supabase/migrations/020b_referral_signups_check_fix.sql` 檔名不符合 CLI 的 `<timestamp>_name.sql`，本機 start 會略過。那是雲端 SQL Editor 跑到一半時的修復檔；全新資料庫直接套用編號 migration 即可。
