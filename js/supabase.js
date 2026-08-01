/* ============================================================
   Aurora Drinks — Supabase 訂單寫入模組
   對應 orders 欄位：customer_name、customer_phone、customer_address、
   remittance_last5、items、total_amount、status、created_at
   ============================================================ */
'use strict';

(() => {
  let clientPromise = null;

  function getConfig() {
    const config = window.AURORA_SUPABASE || window.SUPABASE_CONFIG || {};
    const url = config.url || config.supabaseUrl ||
      (typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : window.SUPABASE_URL);
    const anonKey = config.anonKey || config.key || config.supabaseAnonKey ||
      (typeof SUPABASE_ANON_KEY !== 'undefined' ? SUPABASE_ANON_KEY : window.SUPABASE_ANON_KEY);
    return { url, anonKey };
  }

  function isPlaceholder(value) {
    return !value || /YOUR_|請填入|REPLACE|example/i.test(String(value));
  }

  function isConfigured() {
    const { url, anonKey } = getConfig();
    return !isPlaceholder(url) && !isPlaceholder(anonKey);
  }

  function loadSupabaseLibrary() {
    if (window.supabase?.createClient) return Promise.resolve(window.supabase);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-aurora-supabase]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.supabase), { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.async = true;
      script.dataset.auroraSupabase = 'true';
      script.onload = () => resolve(window.supabase);
      script.onerror = () => reject(new Error('Supabase 函式庫載入失敗'));
      document.head.appendChild(script);
    });
  }

  async function getClient() {
    if (!isConfigured()) return null;
    if (clientPromise) return clientPromise;
    clientPromise = (async () => {
      const lib = await loadSupabaseLibrary();
      if (!lib?.createClient) throw new Error('找不到 Supabase createClient');
      const { url, anonKey } = getConfig();
      return lib.createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
    })().catch(error => {
      clientPromise = null;
      throw error;
    });
    return clientPromise;
  }

  function toRow(order) {
    const last5 = String(order.remittance_last5 || order.remittanceLast5 || '').trim();
    if (!/^\d{5}$/.test(last5)) throw new Error('匯款末五碼必須是 5 位數字');
    return {
      customer_name: String(order.name || '').trim(),
      customer_phone: String(order.phone || '').trim(),
      customer_address: String(order.address || '').trim(),
      remittance_last5: last5,
      items: Array.isArray(order.items) ? order.items : [],
      total_amount: Number.isFinite(Number(order.total)) ? Math.round(Number(order.total)) : 0,
      status: 'pending',
      created_at: order.createdAt || new Date().toISOString()
    };
  }

  async function save(order) {
    try {
      const client = await getClient();
      if (!client) return false;
      const { error } = await client.from('orders').insert(toRow(order));
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[Orders.save] 訂單寫入失敗：', error);
      return false;
    }
  }

  async function saveMany(orders) {
    const sentIds = [];
    for (const order of orders) {
      if (await save(order)) sentIds.push(order.id);
    }
    return sentIds;
  }

  window.Orders = Object.freeze({ isConfigured, save, saveMany });
})();
