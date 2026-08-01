# 極光特調 Aurora Drinks — RWD + PWA 網站

由原始 `demo123.html` 單檔改造而成的響應式漸進式網頁應用程式（PWA）。
保留原本的金色奢華視覺、購物車、三步結帳流程與 GA4 電商追蹤，
另外補上完整的 RWD 版面、離線可用能力與「安裝到主畫面」功能。

---

## 一、快速開始

Service Worker 只在 **https** 或 **localhost** 下運作，
所以不能直接雙擊 `index.html`，要透過伺服器開啟：

```bash
python3 serve.py
# 然後打開 http://localhost:8000
```

想換連接埠就加參數：`python3 serve.py 8080`

> 如果你習慣用 Node：`npx serve .` 或 `npx http-server -p 8000` 也可以。

---

## 二、檔案結構

```
aurora-drinks-pwa/
├── index.html                  主頁面
├── offline.html                離線備援頁
├── manifest.webmanifest        PWA 安裝設定（名稱、圖示、捷徑）
├── sw.js                       Service Worker（快取策略）
├── serve.py                    本機測試伺服器
│
├── css/
│   ├── app.css                 已編譯好的樣式（直接上線用這支）
│   ├── src.css                 樣式原始檔（要改樣式改這支）
│   └── fontawesome/            本地化的 Font Awesome（離線也有圖示）
│
├── js/
│   ├── app.js                  菜單、購物車、結帳、GA4 事件
│   ├── pwa.js                  SW 註冊、安裝提示、更新提示、連線偵測
│   ├── supabase-config.js      ← 填你的 Supabase 網址與金鑰（只改這支）
│   ├── supabase.js             訂單寫入邏輯（含離線重送）
│   └── vendor/supabase.js      Supabase 函式庫本地版（離線也不會壞）
│
├── icons/                      所有尺寸的 App 圖示
├── picture/                    ← 商品照片放這裡（見資料夾內說明）
└── tools/
    ├── gen_icons.py            圖示產生器
    └── tailwind.config.js      Tailwind 設定（重新編譯 CSS 用）
```

---

## 三、RWD 做了哪些調整

| 項目 | 原本 | 現在 |
|---|---|---|
| 商品排列 | 手機 1 欄，很浪費空間 | 手機 2 欄、桌機 4 欄，卡片內距隨螢幕縮放 |
| 標題字級 | 固定 px，小螢幕會爆版 | `clamp()` 流體字級，320px 到 4K 都合身 |
| 分類選單 | 換行擠成好幾排 | 手機改成橫向滑動膠囊，捲動時自動高亮目前分類 |
| 彈出視窗 | 手機上被切掉、按鈕搆不到 | 手機改成底部抽屜（bottom sheet），桌機維持置中對話框 |
| 結帳按鈕 | 只在購物車裡面 | 加入商品後，手機底部常駐顯示金額與結帳捷徑 |
| 瀏海與圓角 | 內容會被瀏海／Home 列擋住 | 全面套用 `safe-area-inset`，iPhone 橫豎向都不卡 |
| 觸控目標 | 部分按鈕小於 40px | 觸控裝置上一律 ≥ 44px |
| 圖片 | 一次全載 | `loading="lazy"`，小螢幕改 1:1 比例 |
| 無障礙 | 缺 aria 標記 | 補上 aria-label、可見焦點框、Esc 關閉、跳至主內容連結 |
| 動態效果 | 一律播放 | 尊重 `prefers-reduced-motion` |

---

## 四、PWA 做了哪些事

**可安裝**
Android / 桌機 Chrome 會在導覽列出現「安裝 App」按鈕；
iOS Safari 因為系統不支援自動提示，會在 6 秒後跳出圖文說明教使用者用分享鍵加入主畫面（關掉後不再出現）。

**離線可用**
安裝時就把 HTML、CSS、JS、圖示、Font Awesome 字型全部預先快取，
斷網時仍可瀏覽整份菜單、開商品詳情、加入購物車。
真的連不上又沒有快取時，才會顯示 `offline.html`。

**快取策略**

| 資源 | 策略 | 原因 |
|---|---|---|
| HTML 頁面 | 網路優先 | 確保拿到最新內容，斷網才退回快取 |
| CSS / JS | 先快取再背景更新 | 開啟速度快，下次進來就是新版 |
| 商品圖片 | 快取優先 | 圖片不常變，省流量 |
| Google Fonts | 先快取再背景更新 | 中文字型很大，只下載一次 |
| GA4 / GTM | 完全不攔截 | 分析數據要即時上傳 |

**版本更新提示**
偵測到新版本時，畫面上方會出現「有新版本可用」橫幅，
使用者按下「立即更新」才會套用，不會在填表填到一半被強制重整。

**購物車不會不見**
購物車存在 `localStorage`，關掉重開、離線再回來都還在。

**離線下單佇列**
離線狀態下按確認付款，訂單會先存在裝置端，
恢復連線後自動寫入 Supabase（並透過 Background Sync 通知）。
Supabase 回錯（RLS 擋下、資料表不存在）時訂單一樣會留在佇列，
不會因為後端出狀況就掉單。詳見第五章。

**桌面捷徑**
長按 App 圖示可直接跳到「購物車」「星河氣泡」「冰沙甜點」。

---

## 五、Supabase 訂單資料庫

原本 demo 的 Supabase 寫入功能完整保留，並且補強成「離線也不會掉單」。

### 5-1　設定步驟

**① 建資料表**

在 Supabase 後台 → SQL Editor 貼上執行：

```sql
create table if not exists public.orders (
  id              bigint generated always as identity primary key,
  transaction_id  text not null unique,          -- unique 是重送去重的關鍵
  payment_type    text,
  total_amount    numeric,
  items           jsonb,
  customer_name   text,
  customer_phone  text,
  address         text,
  status          text default 'processing',
  created_at      timestamptz default now()
);

-- 開啟資料列層級安全性
alter table public.orders enable row level security;

-- 允許前端匿名「新增」訂單，但不能讀取別人的訂單
create policy "anon can insert orders"
  on public.orders for insert
  to anon
  with check (true);
```

> ⚠️ 千萬不要加 `for select to anon` 的政策，否則任何人都能撈到
> 全部客人的姓名、電話與地址。後台要看訂單請用 Supabase Dashboard，
> 或另外做一個需登入的管理頁。

**② 填入金鑰**

打開 `js/supabase-config.js`，把兩行換成你的專案資料：

```js
window.SUPABASE_CONFIG = {
  url: 'https://你的專案代號.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIs...',
  table: 'orders',
  enabled: true
};
```

位置在 Supabase 後台 → Project Settings → API。
**只能放 anon public key**，`service_role` key 放上去等於把資料庫鑰匙公開。

就這樣，不用改其他檔案。

### 5-2　和原始版本的差異

| | 原始 demo | 現在 |
|---|---|---|
| 函式庫來源 | jsDelivr CDN | 本地 `js/vendor/supabase.js`，離線不會壞 |
| 載入時機 | 每次開頁都載 210KB | 有填設定才載入，沒填就完全不下載 |
| 寫入時機 | 結帳時同步呼叫 | 背景寫入，客人不用等資料庫回應 |
| 寫入失敗 | 只在 console 留錯誤，**訂單就消失了** | 自動排入本機佇列，恢復連線後補送 |
| 重複送出 | 無防護 | 用 `transaction_id` 做 upsert 去重 |
| 儲存欄位 | 缺姓名、電話 | 補上 `customer_name`、`customer_phone` |
| 沒填金鑰時 | 正常（不寫入） | 正常（不寫入），且完全不載入函式庫 |

### 5-3　驗收方式

1. 填好金鑰，跑 `python3 serve.py`，下一筆測試訂單
2. Console 應出現 `[Supabase] 訂單已寫入：LXR_xxxxx`
3. Supabase 後台 Table Editor → orders 應看到那筆資料
4. **測離線補送**：DevTools → Network 勾 Offline → 再下一單
   （Console 會說改排入佇列）→ 取消 Offline
   → 應跳出「已補送 1 筆離線訂單」，資料庫也多一筆

### 5-4　如果不想用 Supabase

把 `js/supabase-config.js` 裡的 `enabled` 改成 `false` 就好，
或是維持 `YOUR_SUPABASE_URL` 不動。網站照常運作，
訂單只會留在瀏覽器本機，GA4 事件也照常送。

---

## 六、上線注意事項

1. **一定要 HTTPS。** Service Worker 在 http 下不會註冊（localhost 例外）。
2. **`.webmanifest` 的 MIME type** 要設成 `application/manifest+json`。
   多數平台（Netlify、Vercel、Cloudflare Pages、GitHub Pages）預設就對；
   如果是自架 Nginx，記得在 `mime.types` 補一行。
3. **`sw.js` 不要被 CDN 長期快取**，建議設 `Cache-Control: no-cache`，
   否則使用者收不到新版本。
4. 全部都是靜態檔案，直接把整個資料夾丟上去即可，不需要後端。

---

## 七、常見修改

**改菜單價格或品項**
編輯 `js/app.js` 最上方的 `menuData` 陣列。

**換 GA4 追蹤編號**
`index.html` 搜尋 `G-JQEE2PLNR8`，共兩處。

**改樣式**
改 `css/src.css`，然後重新編譯：

```bash
npm install -D tailwindcss@3
npx tailwindcss -c tools/tailwind.config.js -i css/src.css -o css/app.css --minify
```

**換 App 圖示**
改 `tools/gen_icons.py` 裡的繪圖邏輯或品牌色，再執行：

```bash
pip install pillow
python3 tools/gen_icons.py
```

**發布新版本**
把 `sw.js` 第一行的 `VERSION` 加一（例如 `v1.0.0` → `v1.0.1`），
舊快取會自動清除，使用者也會看到更新提示。

---

## 八、驗收方式

用 Chrome DevTools：

- **Application → Manifest**：確認名稱、圖示、捷徑都讀得到
- **Application → Service Workers**：狀態應為 activated
- **Network → 勾選 Offline 後重整**：菜單應該照常顯示
- **Lighthouse → 勾 PWA 與 Mobile**：可安裝性與 RWD 檢查

---

## 授權備註

Font Awesome Free 依 CC BY 4.0 / SIL OFL 1.1 / MIT 授權使用，
授權條款全文放在 `css/fontawesome/LICENSE.txt`。
supabase-js 依 MIT 授權使用，條款放在 `js/vendor/supabase-LICENSE.txt`。
商品名稱與內容為 Demo 展示用途。
