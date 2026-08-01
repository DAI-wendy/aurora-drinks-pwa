#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
極光特調 — 本機測試伺服器

Service Worker 只能在 https 或 localhost 下運作，所以不能直接雙擊 index.html，
必須透過伺服器開啟。

用法：
    python3 serve.py            # 預設 http://localhost:8000
    python3 serve.py 8080       # 指定連接埠
"""

import http.server
import socketserver
import sys
import os

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".webmanifest": "application/manifest+json",
        ".json": "application/json",
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".woff2": "font/woff2",
        ".webp": "image/webp",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        # sw.js 與 manifest 不快取，方便開發時看到最新版本
        if self.path.endswith(("sw.js", ".webmanifest")):
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        # Service Worker 需要在根目錄 scope 生效
        self.send_header("Service-Worker-Allowed", "/")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("  %s\n" % (fmt % args))


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("=" * 52)
        print("  極光特調 Aurora Drinks — 本機測試伺服器")
        print("=" * 52)
        print(f"  網址： http://localhost:{PORT}")
        print("  停止： Ctrl + C")
        print("=" * 52)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n伺服器已停止。")
