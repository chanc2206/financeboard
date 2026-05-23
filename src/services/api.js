
const FINNHUB = import.meta.env.VITE_FINNHUB_API_KEY
const ALPHA = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY

export async function fetchQuote(symbol) {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB}`
  )
  return await res.json()
}

export async function fetchHistorical(symbol='AAPL') {
  const res = await fetch(
    `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${ALPHA}`
  )
  return await res.json()
}
