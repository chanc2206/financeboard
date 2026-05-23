import { useState, useEffect, useCallback, useRef } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MOCK_STOCKS = {
  gainers: [
    { symbol: "NVDA", name: "NVIDIA Corp", price: 875.32, change: 4.82, pct: 5.83, volume: "42.1M", mktCap: "2.16T" },
    { symbol: "TSLA", name: "Tesla Inc", price: 248.70, change: 9.45, pct: 3.95, volume: "98.3M", mktCap: "791B" },
    { symbol: "META", name: "Meta Platforms", price: 492.15, change: 12.30, pct: 2.56, volume: "21.7M", mktCap: "1.26T" },
    { symbol: "AMZN", name: "Amazon.com", price: 183.40, change: 3.21, pct: 1.78, volume: "33.2M", mktCap: "1.91T" },
    { symbol: "AAPL", name: "Apple Inc", price: 189.25, change: 2.15, pct: 1.15, volume: "54.8M", mktCap: "2.93T" },
  ],
  watchlist: [
    { symbol: "MSFT", name: "Microsoft", price: 415.80, change: -2.10, pct: -0.50, alert: 420 },
    { symbol: "GOOGL", name: "Alphabet", price: 174.35, change: 1.75, pct: 1.01, alert: 180 },
    { symbol: "JPM", name: "JPMorgan Chase", price: 196.50, change: -0.85, pct: -0.43, alert: 200 },
    { symbol: "BRK.B", name: "Berkshire Hath.", price: 371.20, change: 0.95, pct: 0.26, alert: null },
  ],
  performance: [
    { symbol: "SPY", name: "S&P 500 ETF", ytd: 8.42, oneY: 22.15, threeY: 48.3, beta: 1.00 },
    { symbol: "QQQ", name: "Nasdaq 100", ytd: 11.75, oneY: 31.20, threeY: 56.8, beta: 1.18 },
    { symbol: "VTI", name: "Total Mkt ETF", ytd: 7.90, oneY: 20.85, threeY: 44.2, beta: 0.99 },
    { symbol: "IWM", name: "Russell 2000", ytd: 3.25, oneY: 12.40, threeY: 22.6, beta: 1.22 },
  ],
};

const genChartData = (base, days) => {
  const data = [];
  let price = base;
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    price = price * (1 + (Math.random() - 0.48) * 0.025);
    const open = price * (1 + (Math.random() - 0.5) * 0.01);
    const high = Math.max(price, open) * (1 + Math.random() * 0.01);
    const low = Math.min(price, open) * (1 - Math.random() * 0.01);
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      close: +price.toFixed(2), open: +open.toFixed(2),
      high: +high.toFixed(2), low: +low.toFixed(2),
      volume: Math.floor(Math.random() * 80000000 + 10000000),
    });
  }
  return data;
};

const CHART_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "NVDA", "TSLA", "AMZN", "META"];
const CHART_BASES = { AAPL: 189, MSFT: 415, GOOGL: 174, NVDA: 875, TSLA: 248, AMZN: 183, META: 492 };
const INTERVALS = { "1W": 7, "1M": 30, "3M": 90, "1Y": 365 };

const WIDGET_TYPES = ["Chart", "Table", "Gainers", "Watchlist", "Performance", "Financial"];

const defaultWidgets = [
  { id: 1, type: "Gainers", title: "Market Gainers", col: 0, row: 0, w: 2 },
  { id: 2, type: "Chart", title: "AAPL Price", col: 2, row: 0, w: 2, symbol: "AAPL", interval: "1M" },
  { id: 3, type: "Watchlist", title: "My Watchlist", col: 0, row: 1, w: 2 },
  { id: 4, type: "Performance", title: "ETF Performance", col: 2, row: 1, w: 2 },
];

const fmt = (n) => typeof n === "number" ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n;
const fmtBig = (n) => typeof n === "number" ? (n >= 1e12 ? (n / 1e12).toFixed(2) + "T" : n >= 1e9 ? (n / 1e9).toFixed(1) + "B" : n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n.toLocaleString()) : n;

function ChangeTag({ value }) {
  const pos = value >= 0;
  return (
    <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 7px", borderRadius: 999, background: pos ? "#d1fae5" : "#fee2e2", color: pos ? "#065f46" : "#991b1b", fontFamily: "monospace" }}>
      {pos ? "▲" : "▼"} {Math.abs(value).toFixed(2)}%
    </span>
  );
}

function WidgetShell({ widget, onRemove, onEdit, onDragStart, children }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, widget.id)}
      style={{ background: "#0f1923", border: "1px solid #1e2d3d", borderRadius: 14, padding: "0", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 280, cursor: "grab", userSelect: "none" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #1e2d3d", background: "#0c1520" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.2 }}>{widget.title}</span>
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "#1e3a5f", color: "#60a5fa", fontWeight: 600, letterSpacing: 0.5 }}>{widget.type.toUpperCase()}</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => onEdit(widget)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16, padding: "2px 6px", borderRadius: 6 }} title="Configure">⚙</button>
          <button onClick={() => onRemove(widget.id)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16, padding: "2px 6px", borderRadius: 6 }} title="Remove">✕</button>
        </div>
      </div>
      <div style={{ flex: 1, padding: 16, overflow: "auto" }}>{children}</div>
    </div>
  );
}

function GainersWidget() {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "6px 12px", fontSize: 12, color: "#64748b", fontWeight: 600, paddingBottom: 8, borderBottom: "1px solid #1e2d3d", marginBottom: 8, letterSpacing: 0.5 }}>
        <span>SYMBOL</span><span style={{ textAlign: "right" }}>PRICE</span><span style={{ textAlign: "right" }}>CHANGE</span><span style={{ textAlign: "right" }}>VOL</span>
      </div>
      {MOCK_STOCKS.gainers.map(s => (
        <div key={s.symbol} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "6px 12px", padding: "7px 0", borderBottom: "1px solid #1e2d3d22", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#e2e8f0", fontFamily: "monospace" }}>{s.symbol}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{s.name}</div>
          </div>
          <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600, textAlign: "right", fontFamily: "monospace" }}>${fmt(s.price)}</span>
          <span style={{ textAlign: "right" }}><ChangeTag value={s.pct} /></span>
          <span style={{ fontSize: 11, color: "#64748b", textAlign: "right" }}>{s.volume}</span>
        </div>
      ))}
    </div>
  );
}

function WatchlistWidget() {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "6px 12px", fontSize: 12, color: "#64748b", fontWeight: 600, paddingBottom: 8, borderBottom: "1px solid #1e2d3d", marginBottom: 8, letterSpacing: 0.5 }}>
        <span>SYMBOL</span><span style={{ textAlign: "right" }}>PRICE</span><span style={{ textAlign: "right" }}>CHG%</span><span style={{ textAlign: "right" }}>ALERT</span>
      </div>
      {MOCK_STOCKS.watchlist.map(s => (
        <div key={s.symbol} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "6px 12px", padding: "7px 0", borderBottom: "1px solid #1e2d3d22", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#e2e8f0", fontFamily: "monospace" }}>{s.symbol}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{s.name}</div>
          </div>
          <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600, textAlign: "right", fontFamily: "monospace" }}>${fmt(s.price)}</span>
          <span style={{ textAlign: "right" }}><ChangeTag value={s.pct} /></span>
          <span style={{ fontSize: 11, textAlign: "right", color: s.alert ? "#f59e0b" : "#64748b" }}>{s.alert ? `$${s.alert}` : "—"}</span>
        </div>
      ))}
    </div>
  );
}

function PerformanceWidget() {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto", gap: "6px 10px", fontSize: 11, color: "#64748b", fontWeight: 600, paddingBottom: 8, borderBottom: "1px solid #1e2d3d", marginBottom: 8, letterSpacing: 0.5 }}>
        <span>FUND</span><span style={{ textAlign: "right" }}>YTD</span><span style={{ textAlign: "right" }}>1Y</span><span style={{ textAlign: "right" }}>3Y</span><span style={{ textAlign: "right" }}>BETA</span>
      </div>
      {MOCK_STOCKS.performance.map(s => (
        <div key={s.symbol} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto", gap: "6px 10px", padding: "7px 0", borderBottom: "1px solid #1e2d3d22", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#e2e8f0", fontFamily: "monospace" }}>{s.symbol}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{s.name}</div>
          </div>
          {[s.ytd, s.oneY, s.threeY].map((v, i) => (
            <span key={i} style={{ fontSize: 12, color: v >= 0 ? "#10b981" : "#ef4444", textAlign: "right", fontWeight: 600, fontFamily: "monospace" }}>{v > 0 ? "+" : ""}{v}%</span>
          ))}
          <span style={{ fontSize: 12, color: "#94a3b8", textAlign: "right", fontFamily: "monospace" }}>{s.beta}</span>
        </div>
      ))}
    </div>
  );
}

function ChartWidget({ symbol = "AAPL", interval = "1M", onUpdate }) {
  const [sym, setSym] = useState(symbol);
  const [intv, setIntv] = useState(interval);
  const data = genChartData(CHART_BASES[sym] || 100, INTERVALS[intv]);
  const first = data[0]?.close || 0;
  const last = data[data.length - 1]?.close || 0;
  const pctChange = ((last - first) / first * 100).toFixed(2);
  const isUp = parseFloat(pctChange) >= 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {CHART_SYMBOLS.map(s => (
            <button key={s} onClick={() => { setSym(s); onUpdate && onUpdate({ symbol: s }); }} style={{ background: s === sym ? "#1e3a5f" : "none", border: `1px solid ${s === sym ? "#3b82f6" : "#1e2d3d"}`, color: s === sym ? "#60a5fa" : "#64748b", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>{s}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {Object.keys(INTERVALS).map(k => (
            <button key={k} onClick={() => setIntv(k)} style={{ background: k === intv ? "#1e3a5f" : "none", border: `1px solid ${k === intv ? "#3b82f6" : "#1e2d3d"}`, color: k === intv ? "#60a5fa" : "#64748b", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer" }}>{k}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", fontFamily: "monospace" }}>${fmt(last)}</span>
        <span style={{ fontSize: 14, color: isUp ? "#10b981" : "#ef4444", fontWeight: 600 }}>{isUp ? "▲" : "▼"} {Math.abs(pctChange)}%</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`grad-${sym}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isUp ? "#10b981" : "#ef4444"} stopOpacity={0.25} />
              <stop offset="95%" stopColor={isUp ? "#10b981" : "#ef4444"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#475569" }} interval={Math.floor(data.length / 5)} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} tickFormatter={v => `$${v}`} width={55} />
          <Tooltip contentStyle={{ background: "#0c1520", border: "1px solid #1e2d3d", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#94a3b8" }} itemStyle={{ color: "#e2e8f0" }} formatter={v => [`$${fmt(v)}`, "Close"]} />
          <Area type="monotone" dataKey="close" stroke={isUp ? "#10b981" : "#ef4444"} strokeWidth={2} fill={`url(#grad-${sym})`} dot={false} activeDot={{ r: 4, fill: isUp ? "#10b981" : "#ef4444" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function TableWidget({ searchable = true }) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("price");
  const [sortDir, setSortDir] = useState(-1);
  const [page, setPage] = useState(0);
  const PER_PAGE = 4;

  const all = [...MOCK_STOCKS.gainers, ...MOCK_STOCKS.watchlist.map(s => ({ ...s, volume: "—", mktCap: "—" }))];
  const filtered = all.filter(s => s.symbol.includes(search.toUpperCase()) || s.name.toLowerCase().includes(search.toLowerCase()));
  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortField], bv = b[sortField];
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * sortDir;
    return String(av).localeCompare(String(bv)) * sortDir;
  });
  const paged = sorted.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(sorted.length / PER_PAGE);

  const sortBy = (f) => { if (sortField === f) setSortDir(d => d * -1); else { setSortField(f); setSortDir(-1); } };

  return (
    <div>
      {searchable && (
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search symbol or name..." style={{ width: "100%", marginBottom: 10, padding: "7px 12px", background: "#0c1520", border: "1px solid #1e2d3d", borderRadius: 8, color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
      )}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            {["symbol", "name", "price", "pct", "volume"].map(f => (
              <th key={f} onClick={() => sortBy(f)} style={{ textAlign: f === "symbol" || f === "name" ? "left" : "right", padding: "6px 8px", color: "#64748b", fontWeight: 600, cursor: "pointer", borderBottom: "1px solid #1e2d3d", letterSpacing: 0.5, fontSize: 11, userSelect: "none" }}>
                {f.toUpperCase()} {sortField === f ? (sortDir === 1 ? "↑" : "↓") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paged.map(s => (
            <tr key={s.symbol} style={{ borderBottom: "1px solid #1e2d3d22" }}>
              <td style={{ padding: "7px 8px", color: "#60a5fa", fontWeight: 700, fontFamily: "monospace" }}>{s.symbol}</td>
              <td style={{ padding: "7px 8px", color: "#94a3b8" }}>{s.name}</td>
              <td style={{ padding: "7px 8px", textAlign: "right", color: "#e2e8f0", fontFamily: "monospace", fontWeight: 600 }}>${fmt(s.price)}</td>
              <td style={{ padding: "7px 8px", textAlign: "right" }}><ChangeTag value={s.pct} /></td>
              <td style={{ padding: "7px 8px", textAlign: "right", color: "#64748b" }}>{s.volume || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i)} style={{ width: 28, height: 28, borderRadius: 6, background: i === page ? "#1e3a5f" : "none", border: `1px solid ${i === page ? "#3b82f6" : "#1e2d3d"}`, color: i === page ? "#60a5fa" : "#64748b", cursor: "pointer", fontSize: 12 }}>{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function FinancialWidget() {
  const cards = [
    { label: "Portfolio Value", value: "$248,392", change: "+12.4%", icon: "💼" },
    { label: "Today's P&L", value: "+$1,247", change: "+0.51%", icon: "📈" },
    { label: "Total Return", value: "+$48,392", change: "+24.2%", icon: "📊" },
    { label: "Cash Balance", value: "$12,480", change: "Available", icon: "💰" },
  ];
  const barData = [
    { month: "Dec", value: 212000 }, { month: "Jan", value: 219000 }, { month: "Feb", value: 226000 },
    { month: "Mar", value: 231000 }, { month: "Apr", value: 238000 }, { month: "May", value: 248392 },
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: "#0c1520", borderRadius: 10, padding: "10px 12px", border: "1px solid #1e2d3d" }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{c.icon} {c.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", fontFamily: "monospace" }}>{c.value}</div>
            <div style={{ fontSize: 11, color: c.change.startsWith("+") ? "#10b981" : "#64748b", marginTop: 2 }}>{c.change}</div>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={barData} barSize={24}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip contentStyle={{ background: "#0c1520", border: "1px solid #1e2d3d", borderRadius: 8, fontSize: 12 }} formatter={v => [`$${fmtBig(v)}`, "Value"]} labelStyle={{ color: "#94a3b8" }} />
          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function renderWidget(w, onUpdate) {
  switch (w.type) {
    case "Gainers": return <GainersWidget />;
    case "Watchlist": return <WatchlistWidget />;
    case "Performance": return <PerformanceWidget />;
    case "Chart": return <ChartWidget symbol={w.symbol} interval={w.interval} onUpdate={onUpdate} />;
    case "Table": return <TableWidget />;
    case "Financial": return <FinancialWidget />;
    default: return null;
  }
}

function AddWidgetModal({ onAdd, onClose }) {
  const [type, setType] = useState("Chart");
  const [title, setTitle] = useState("");
  const [symbol, setSymbol] = useState("AAPL");
  const [interval, setInterval] = useState("1M");

  const submit = () => {
    if (!title.trim()) return;
    onAdd({ type, title, symbol, interval });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#0f1923", border: "1px solid #1e2d3d", borderRadius: 16, padding: 28, width: 420, maxWidth: "90vw" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ color: "#e2e8f0", margin: 0, fontSize: 17, fontFamily: "'DM Sans', sans-serif" }}>Add New Widget</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600, letterSpacing: 0.5 }}>WIDGET TYPE</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "8px 0 16px" }}>
          {WIDGET_TYPES.map(t => (
            <button key={t} onClick={() => setType(t)} style={{ padding: "6px 14px", borderRadius: 8, background: t === type ? "#1e3a5f" : "#0c1520", border: `1px solid ${t === type ? "#3b82f6" : "#1e2d3d"}`, color: t === type ? "#60a5fa" : "#94a3b8", cursor: "pointer", fontSize: 13, fontWeight: t === type ? 600 : 400 }}>{t}</button>
          ))}
        </div>
        <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600, letterSpacing: 0.5 }}>WIDGET NAME</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Tech Gainers, My Watchlist..." style={{ width: "100%", marginTop: 6, marginBottom: 14, padding: "9px 12px", background: "#0c1520", border: "1px solid #1e2d3d", borderRadius: 8, color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        {type === "Chart" && (
          <>
            <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600, letterSpacing: 0.5 }}>SYMBOL</label>
            <select value={symbol} onChange={e => setSymbol(e.target.value)} style={{ width: "100%", marginTop: 6, marginBottom: 14, padding: "9px 12px", background: "#0c1520", border: "1px solid #1e2d3d", borderRadius: 8, color: "#e2e8f0", fontSize: 13, outline: "none" }}>
              {CHART_SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600, letterSpacing: 0.5 }}>DEFAULT INTERVAL</label>
            <select value={interval} onChange={e => setInterval(e.target.value)} style={{ width: "100%", marginTop: 6, marginBottom: 14, padding: "9px 12px", background: "#0c1520", border: "1px solid #1e2d3d", borderRadius: 8, color: "#e2e8f0", fontSize: 13, outline: "none" }}>
              {Object.keys(INTERVALS).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", background: "none", border: "1px solid #1e2d3d", borderRadius: 8, color: "#94a3b8", cursor: "pointer", fontSize: 13 }}>Cancel</button>
          <button onClick={submit} style={{ padding: "9px 22px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Add Widget</button>
        </div>
      </div>
    </div>
  );
}

function ConfigModal({ widget, onSave, onClose }) {
  const [title, setTitle] = useState(widget.title);
  const [symbol, setSymbol] = useState(widget.symbol || "AAPL");
  const [interval, setInterval] = useState(widget.interval || "1M");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#0f1923", border: "1px solid #1e2d3d", borderRadius: 16, padding: 28, width: 380, maxWidth: "90vw" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ color: "#e2e8f0", margin: 0, fontSize: 17 }}>Configure Widget</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600, letterSpacing: 0.5 }}>TITLE</label>
        <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: "100%", marginTop: 6, marginBottom: 14, padding: "9px 12px", background: "#0c1520", border: "1px solid #1e2d3d", borderRadius: 8, color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        {widget.type === "Chart" && (
          <>
            <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600, letterSpacing: 0.5 }}>SYMBOL</label>
            <select value={symbol} onChange={e => setSymbol(e.target.value)} style={{ width: "100%", marginTop: 6, marginBottom: 14, padding: "9px 12px", background: "#0c1520", border: "1px solid #1e2d3d", borderRadius: 8, color: "#e2e8f0", fontSize: 13, outline: "none" }}>
              {CHART_SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600, letterSpacing: 0.5 }}>INTERVAL</label>
            <select value={interval} onChange={e => setInterval(e.target.value)} style={{ width: "100%", marginTop: 6, marginBottom: 14, padding: "9px 12px", background: "#0c1520", border: "1px solid #1e2d3d", borderRadius: 8, color: "#e2e8f0", fontSize: 13, outline: "none" }}>
              {Object.keys(INTERVALS).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", background: "none", border: "1px solid #1e2d3d", borderRadius: 8, color: "#94a3b8", cursor: "pointer", fontSize: 13 }}>Cancel</button>
          <button onClick={() => { onSave({ ...widget, title, symbol, interval }); onClose(); }} style={{ padding: "9px 22px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function FinBoard() {
  const [widgets, setWidgets] = useState(() => {
    try { const s = localStorage.getItem("finboard_widgets"); return s ? JSON.parse(s) : defaultWidgets; } catch { return defaultWidgets; }
  });
  const [showAdd, setShowAdd] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [ticker, setTicker] = useState(0);
  const [dragId, setDragId] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const nextId = useRef(100);

  useEffect(() => {
    try { localStorage.setItem("finboard_widgets", JSON.stringify(widgets)); } catch {}
  }, [widgets]);

  useEffect(() => {
    const t = setInterval(() => setTicker(x => x + 1), 15000);
    return () => clearInterval(t);
  }, []);

  const addWidget = (cfg) => {
    setWidgets(ws => [...ws, { id: nextId.current++, ...cfg, col: 0, row: ws.length, w: 2 }]);
  };
  const removeWidget = (id) => setWidgets(ws => ws.filter(w => w.id !== id));
  const saveWidget = (updated) => setWidgets(ws => ws.map(w => w.id === updated.id ? updated : w));

  const handleDragStart = (e, id) => { setDragId(id); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver = (e, id) => { e.preventDefault(); setDragOver(id); };
  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (dragId === targetId) return;
    setWidgets(ws => {
      const fromIdx = ws.findIndex(w => w.id === dragId);
      const toIdx = ws.findIndex(w => w.id === targetId);
      const arr = [...ws];
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    });
    setDragId(null); setDragOver(null);
  };

  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(widgets, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "finboard-config.json"; a.click();
  };
  const importConfig = () => {
    const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
    input.onchange = e => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => { try { setWidgets(JSON.parse(ev.target.result)); } catch {} };
      reader.readAsText(file);
    };
    input.click();
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const tickerSymbols = MOCK_STOCKS.gainers;

  return (
    <div style={{ minHeight: "100vh", background: "#070d14", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: "#e2e8f0" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Ticker tape */}
      <div style={{ background: "#0c1520", borderBottom: "1px solid #1e2d3d", padding: "6px 0", overflow: "hidden", whiteSpace: "nowrap" }}>
        <div style={{ display: "inline-flex", gap: 32, animation: "ticker 30s linear infinite" }}>
          {[...tickerSymbols, ...tickerSymbols].map((s, i) => (
            <span key={i} style={{ fontSize: 12, fontFamily: "monospace" }}>
              <span style={{ color: "#60a5fa", fontWeight: 700 }}>{s.symbol}</span>
              <span style={{ color: "#e2e8f0", marginLeft: 6 }}>${fmt(s.price)}</span>
              <span style={{ marginLeft: 6, color: s.pct >= 0 ? "#10b981" : "#ef4444" }}>{s.pct >= 0 ? "▲" : "▼"}{Math.abs(s.pct)}%</span>
            </span>
          ))}
        </div>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid #1e2d3d", background: "#0c1520" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg, #3b82f6, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📈</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#e2e8f0", letterSpacing: -0.3 }}>FinBoard</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Live · {timeStr} · {widgets.length} widget{widgets.length !== 1 ? "s" : ""}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={importConfig} title="Import" style={{ background: "#0f1923", border: "1px solid #1e2d3d", color: "#94a3b8", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 12 }}>⬆ Import</button>
          <button onClick={exportConfig} title="Export" style={{ background: "#0f1923", border: "1px solid #1e2d3d", color: "#94a3b8", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 12 }}>⬇ Export</button>
          <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} style={{ background: "#0f1923", border: "1px solid #1e2d3d", color: "#94a3b8", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 12 }}>{theme === "dark" ? "☀ Light" : "🌙 Dark"}</button>
          <button onClick={() => setShowAdd(true)} style={{ background: "#3b82f6", border: "none", color: "#fff", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add Widget
          </button>
        </div>
      </div>

      {/* Dashboard grid */}
      <div style={{ padding: 20 }}>
        {widgets.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, color: "#475569" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No widgets yet</div>
            <div style={{ fontSize: 14, marginBottom: 20 }}>Add your first widget to start monitoring the markets</div>
            <button onClick={() => setShowAdd(true)} style={{ background: "#3b82f6", border: "none", color: "#fff", borderRadius: 10, padding: "10px 22px", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>+ Add Widget</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 16 }}>
            {widgets.map(w => (
              <div
                key={w.id}
                onDragOver={(e) => handleDragOver(e, w.id)}
                onDrop={(e) => handleDrop(e, w.id)}
                style={{ opacity: dragOver === w.id ? 0.6 : 1, transition: "opacity 0.15s", outline: dragOver === w.id ? "2px dashed #3b82f6" : "none", borderRadius: 14 }}
              >
                <WidgetShell widget={w} onRemove={removeWidget} onEdit={setEditingWidget} onDragStart={handleDragStart}>
                  {renderWidget(w, (updates) => saveWidget({ ...w, ...updates }))}
                </WidgetShell>
              </div>
            ))}
            {/* Ghost add tile */}
            <div onClick={() => setShowAdd(true)} style={{ border: "2px dashed #1e2d3d", borderRadius: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 280, cursor: "pointer", transition: "border-color 0.2s", color: "#475569" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#3b82f6"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#1e2d3d"}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>+</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Add Widget</div>
            </div>
          </div>
        )}
      </div>

      {showAdd && <AddWidgetModal onAdd={addWidget} onClose={() => setShowAdd(false)} />}
      {editingWidget && <ConfigModal widget={editingWidget} onSave={saveWidget} onClose={() => setEditingWidget(null)} />}

      <style>{`
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0c1520; }
        ::-webkit-scrollbar-thumb { background: #1e2d3d; border-radius: 3px; }
      `}</style>
    </div>
  );
}
