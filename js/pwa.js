/* ============================================================
   極光特調 — PWA 執行階段
   註冊 Service Worker / 安裝提示 / 版本更新 / 連線狀態
   ============================================================ */
'use strict';

(function () {

  /* ---------- 1. 註冊 Service Worker ---------- */
  let registration = null;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' })
        .then(reg => {
          registration = reg;

          // 已有等待中的新版本
          if (reg.waiting) showUpdateBanner(reg.waiting);

          // 偵測新版本安裝完成
          reg.addEventListener('updatefound', () => {
            const sw = reg.installing;
            if (!sw) return;
            sw.addEventListener('statechange', () => {
              if (sw.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateBanner(sw);
              }
            });
          });

          // 每小時檢查一次更新
          setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
        })
        .catch(err => console.warn('[PWA] Service Worker 註冊失敗：', err));

      // 新 SW 接手後重新載入（只做一次）
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      });
    });
  }

  function showUpdateBanner(worker) {
    const banner = document.getElementById('update-banner');
    const btn = document.getElementById('update-btn');
    if (!banner || !btn) return;

    banner.hidden = false;
    btn.onclick = () => {
      btn.disabled = true;
      btn.textContent = '更新中…';
      worker.postMessage({ type: 'SKIP_WAITING' });
    };
  }

  /* ---------- 2. 安裝提示（Android / 桌機）---------- */
  let deferredPrompt = null;
  const installBtns = [
    document.getElementById('install-btn'),
    document.getElementById('install-btn-mobile')
  ].filter(Boolean);

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    installBtns.forEach(b => { b.hidden = false; });
    if (typeof gtag === 'function') gtag('event', 'pwa_install_available');
  });

  installBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (typeof gtag === 'function') {
        gtag('event', outcome === 'accepted' ? 'pwa_install_accepted' : 'pwa_install_dismissed');
      }
      if (outcome === 'accepted' && typeof showToast === 'function') {
        showToast('正在安裝極光特調 App…');
      }

      deferredPrompt = null;
      installBtns.forEach(b => { b.hidden = true; });
    });
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installBtns.forEach(b => { b.hidden = true; });
    if (typeof gtag === 'function') gtag('event', 'pwa_installed');
    if (typeof showToast === 'function') showToast('已加入主畫面，隨時都能點單！');
  });

  /* ---------- 3. iOS 安裝說明 ---------- */
  const IOS_HINT_KEY = 'aurora_ios_hint_dismissed';

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
  }

  if (isIOS() && !isStandalone()) {
    let dismissed = false;
    try { dismissed = localStorage.getItem(IOS_HINT_KEY) === '1'; } catch (e) {}

    if (!dismissed) {
      setTimeout(() => {
        const hint = document.getElementById('ios-hint');
        if (!hint) return;
        hint.hidden = false;
        document.getElementById('ios-hint-close').addEventListener('click', () => {
          hint.hidden = true;
          try { localStorage.setItem(IOS_HINT_KEY, '1'); } catch (e) {}
        });
      }, 6000);
    }
  }

  /* ---------- 4. 連線狀態 ---------- */
  const offlineBanner = document.getElementById('offline-banner');

  function syncOnlineState() {
    const online = navigator.onLine;
    if (offlineBanner) offlineBanner.hidden = online;
    document.body.classList.toggle('is-offline', !online);
  }

  window.addEventListener('online', () => {
    syncOnlineState();
    if (typeof showToast === 'function') showToast('已恢復連線');
    if (typeof flushQueuedOrders === 'function') flushQueuedOrders();
  });

  window.addEventListener('offline', () => {
    syncOnlineState();
    if (typeof showToast === 'function') showToast('目前離線，菜單仍可瀏覽', 'error');
  });

  syncOnlineState();
  if (navigator.onLine && typeof flushQueuedOrders === 'function') {
    setTimeout(flushQueuedOrders, 1500);
  }

  /* ---------- 5. 顯示模式標記 ---------- */
  window.addEventListener('load', () => {
    const label = document.getElementById('app-mode-label');
    if (!label) return;

    if (isStandalone()) {
      label.textContent = 'App 模式運行中';
      if (typeof gtag === 'function') gtag('event', 'pwa_launch', { display_mode: 'standalone' });
    } else {
      label.textContent = '瀏覽器模式';
    }
  });

})();
