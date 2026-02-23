# Maps API Proxy

Google Maps API Key 保護代理服務器，使用 Node.js/Express 構建。

## 功能

- 保護 API Key 不暴露在前端代碼
- CORS 控制，只允許指定域名訪問
- 速率限制（Rate Limiting）防止濫用
- 支持 Street View、Geocoding、Reverse Geocoding

## 快速部署到 Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

1. Fork 此 repo
2. 在 Railway 新建項目，選擇 "Deploy from GitHub repo"
3. 設定環境變數：`GOOGLE_MAPS_API_KEY`、`ALLOWED_ORIGINS`
4. 部署完成！

## 環境變數

| 變數 | 說明 | 預設值 |
|------|------|--------|
| GOOGLE_MAPS_API_KEY | Google Maps API Key | 必填 |
| PORT | 服務器端口 | 3000 |
| ALLOWED_ORIGINS | 允許的前端域名（逗號分隔） | localhost:8080 |
| RATE_LIMIT_MAX_REQUESTS | 每IP限流次數/15分鐘 | 100 |

## API 端點

- `GET /health` - 健康檢查
- `POST /api/maps/geocode` - 地址轉坐標
- `POST /api/maps/reverse-geocode` - 坐標轉地址
- `GET /api/maps/streetview/metadata` - 街景元數據
- `GET /api/maps/streetview/image-url` - 街景圖片URL
- `POST /api/maps/places/autocomplete` - 地址自動完成

## 本地開發

```bash
cp .env.example .env
# 編輯 .env 填入你的 API Key
npm install
npm run dev
```

## 文件結構

```
maps-api-proxy/
├── server.js              # 主服務器
├── routes/
│   └── maps-api.js        # API 路由
├── middleware/
│   └── rate-limiter.js    # 速率限制
├── package.json
├── vercel.json            # Vercel 部署配置
└── .env.example
```
