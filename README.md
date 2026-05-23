
# FinBoard Dynamic Realtime

> A fully dynamic realtime finance dashboard built using React, Vite, Finnhub API, and Alpha Vantage API.

FinBoard is a modern finance dashboard inspired by Bloomberg and TradingView terminals.  
It provides realtime market monitoring, dynamic stock charts, customizable widgets, and responsive financial analytics.

---

# 🚀 Live Demo

Add your Netlify deployment URL here:

```txt
https://your-netlify-url.netlify.app
```

---

# ✨ Features

- 📈 Realtime stock market tracking
- 📊 Interactive live stock charts
- 🔄 Automatic data refresh every 15 seconds
- 💹 Dynamic gainers & watchlist widgets
- 🧩 Modular widget-based dashboard
- 🌙 Modern dark finance UI
- 📱 Fully responsive layout
- ⚡ Fast Vite-powered frontend
- 🔌 Live API integration
- 📡 Dynamic realtime rendering

---

# 🖼️ Screenshots

## Dashboard Overview

The main dashboard displaying realtime stock prices, gainers, widgets, live ticker tape, and interactive finance cards.

![Dashboard Overview](./screenshots/screenshot1.png)

---

## Watchlist & ETF Performance Widgets

Custom watchlist tracking with realtime stock prices and ETF performance analytics including YTD, 1Y, and 3Y performance.

![Watchlist & ETF Performance](./screenshots/screenshot2.png)

---

## Dynamic Realtime Stock Chart

Interactive realtime chart visualization with selectable stock symbols and timeframe controls.

![Realtime Chart](./screenshots/screenshot3.png)

---

# 🛠️ Tech Stack

| Technology | Usage |
|---|---|
| React | Frontend UI |
| Vite | Build Tool |
| Recharts | Realtime Charts |
| Finnhub API | Live Market Data |
| Alpha Vantage API | Intraday Chart Data |
| Netlify | Deployment |

---

# 📡 APIs Used

## Finnhub API

https://finnhub.io/dashboard

Used for:
- realtime stock quotes
- live percentage changes
- market monitoring

---

## Alpha Vantage API

https://www.alphavantage.co/support/#api-key

Used for:
- intraday chart data
- historical stock prices
- chart rendering

---

# ⚙️ Installation

Clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
```

Install dependencies:

```bash
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file in the project root:

```env
VITE_FINNHUB_API_KEY=YOUR_FINNHUB_API_KEY
VITE_ALPHA_VANTAGE_API_KEY=YOUR_ALPHA_VANTAGE_API_KEY
```

---

# ▶️ Run Locally

```bash
npm run dev
```

---

# 🚀 Deploy on Netlify

## Build Command

```bash
npm run build
```

## Publish Directory

```txt
dist
```

Add the environment variables inside the Netlify dashboard before deployment.

---

# 📁 Project Structure

```txt
src/
 ├── components/
 ├── services/
 ├── hooks/
 ├── utils/
 ├── App.jsx
 └── main.jsx
```

---

# 🔄 Realtime Functionality

The dashboard automatically refreshes market data every 15 seconds using live API polling.

Current realtime features:
- live stock quotes
- dynamic charts
- market gainers
- watchlist updates
- realtime percentage changes
- interactive stock switching

---

# 📈 Future Improvements

- WebSocket live streaming
- Drag-and-drop widgets
- Portfolio tracking
- Crypto market integration
- AI market analysis
- News sentiment analysis
- Persistent layouts
- TradingView integration

---

# 📚 Assignment Coverage

This project implements the customizable finance dashboard requirements including realtime widgets, finance cards, responsive UI, API integration, dynamic charts, and scalable frontend architecture.
