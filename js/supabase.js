/* ============================================================
   極光特調 — Supabase 訂單寫入模組
   ------------------------------------------------------------
   設計重點：
   1. 函式庫「延遲載入」——沒設定 Supabase 就完全不下載那 200KB。
   2. 寫入失敗（斷網、Supabase 掛掉、RLS 擋下）一律不影響結帳體驗，
      訂單會先留在本機佇列，之後自動重送。
   3. 所有錯誤只寫 console，不會跳錯誤畫面嚇到客人。
   ============================================================ */
'use strict';

window.Orders = (function () {

  const cfg = window.SUPABASE_CONFIG || {};
  let clientPromise = null;

  /** 是否已正確填入設定 */
  function isConfigured() {
    return !!(
      cfg.enabled &&
      cfg.url && cfg.url !== 'YOUR_SUPABASE_URL' &&
      cfg.anonKey && cfg.anonKey !== 'YOUR_SUPABASE_ANON_KEY'
    );
  }

  /** 動態載入 supabase-js（只載一次） */
  function loadLibrary() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = './js/vendor/supabase.js';
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Supabase 函式庫載入失敗'));
      document.head.appendChild(s);
    });
  }

  /** 取得 client（第一次呼叫時才真正初始化） */
  function getClient() {
    if (!isConfigured()) return Promise.resolve(null);

    if (!clientPromise) {
      clientPromise = loadLibrary()
        .then(() => window.supabase.createClient(cfg.url, cfg.anonKey))
        .catch(err => {
          console.warn('[Supabase]', err.message);
          clientPromise = null;   // 允許下次重試
          return null;
        });
    }
    return clientPromise;
  }

  /** 把內部訂單物件轉成資料表欄位 */
  function toRow(order) {
    return {
      transaction_id: order.id,
      payment_type: order.payment,
      total_amount: order.total,
      items: order.items,              // jsonb 欄位
      customer_name: order.name,
      customer_phone: order.phone,
      address: order.address,
      status: 'processing'
    };
  }

  /**
   * 寫入單筆訂單。
   * @returns {Promise<boolean>} true = 已寫入資料庫；false = 未寫入（需排隊重送）
   */
  async function save(order) {
    if (!isConfigured()) return false;
    if (!navigator.onLine) return false;

    try {
      const client = await getClient();
      if (!client) return false;

      const { error } = await client.from(cfg.table || 'orders').insert([toRow(order)]);
      if (error) throw error;

      console.info('[Supabase] 訂單已寫入：', order.id);
      return true;
    } catch (err) {
      console.warn('[Supabase] 訂單寫入失敗，改為排入本機佇列：', err.message || err);
      return false;
    }
  }

  /**
   * 批次補送佇列中的訂單。
   * @returns {Promise<string[]>} 成功送出的訂單編號
   */
  async function saveMany(orders) {
    if (!isConfigured() || !orders.length) return [];
    if (!navigator.onLine) return [];

    try {
      const client = await getClient();
      if (!client) return [];

      // 用 upsert 避免同一筆訂單重複寫入
      // （需要 transaction_id 欄位設 UNIQUE，見 README 的建表語法）
      const { error } = await client
        .from(cfg.table || 'orders')
        .upsert(orders.map(toRow), { onConflict: 'transaction_id', ignoreDuplicates: true });

      if (error) throw error;

      console.info('[Supabase] 已補送', orders.length, '筆離線訂單');
      return orders.map(o => o.id);
    } catch (err) {
      console.warn('[Supabase] 批次補送失敗，保留佇列下次再試：', err.message || err);
      return [];
    }
  }

  return { isConfigured, save, saveMany };

})();
