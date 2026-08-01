/* ============================================================
   極光特調 — Supabase 設定
   ------------------------------------------------------------
   把下面兩個值換成你自己專案的資料，訂單就會自動寫入資料庫。
   位置：Supabase 後台 → Project Settings → API

   ⚠️ 沒有填也不會壞：維持 'YOUR_SUPABASE_URL' 的話，
      整個網站照常運作，只是不寫資料庫（訂單仍會存在瀏覽器本機）。

   ⚠️ 這裡只能放 anon public key，絕對不要放 service_role key，
      因為前端程式碼任何人都看得到。存取控制請用 RLS 政策（見 README）。
   ============================================================ */

window.SUPABASE_CONFIG = {
  url: 'https://gyrmfrygervbdfcbmaor.supabase.co/',              // OUR_SUPABASE_URL 例：https://abcdefghijk.supabase.co
  anonKey: 'sb_publishable_gk7atgOLk9Yb6GM5n2p7Qg_8-s8IMxB',     // YOUR_SUPABASE_ANON_KEY 例：eyJhbGciOiJIUzI1NiIsInR5cCI6...

  table: 'orders',                       // 訂單資料表名稱

  // true  = 每次結帳都即時寫入（斷網時自動排隊，恢復連線再補送）
  // false = 完全停用資料庫寫入
  enabled: true
};
