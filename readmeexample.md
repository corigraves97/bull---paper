
curl http://localhost:3000/api/overview?tickers=IBM
curl http://localhost:3000/api/shares?tickers=AAPL  



When to use a curl test
Verify an endpoint is reachable (server up / DNS / firewall).
Check HTTP status, headers, and response body.
Validate authentication (Bearer, Basic, API key) and content negotiation.
Reproduce API calls you plan to make from code.
Add simple checks in CI scripts or local health checks.


Useful curl flags (cheat sheet)
-X METHOD — set HTTP method (GET, POST, PUT, DELETE). Often unnecessary for GET.
-H 'Header: v' — add a header (Content-Type, Authorization).
-d / --data — send request body (implies POST unless -X used).
-F — multipart form (file upload): -F 'file=@/path/to/file'
-i — include response headers in output
-I — fetch headers only (HEAD request-like)
-s / -S — silent / show errors (use together: -sS)
-f / --fail — exit non-zero on HTTP 4xx/5xx (good for scripts)
-L — follow redirects
-o FILE — write body to FILE (prevents huge output)
-w FORMAT — write a format string after completion (e.g., '%{http_code} %{time_total}\n')
--max-time NUM — set overall timeout (seconds)
-v or --trace-ascii path — verbose/tracing for debugging
--compressed — accept compressed responses
--header 'Accept: application/json' — request JSON
--remote-name (-O) — save response using remote filename

Simple GET (show headers + body)
curl -i "http://localhost:3000/api/overview?symbol=IBM"

GET JSON and pretty-print
curl -sS "https://www.alphavantage.co/query?function=OVERVIEW&symbol=IBM&apikey=$ALPHAVANTAGE_KEY" -H "Accept: application/json" | jq .


Fail on HTTP error and show only body (good for scripts)
curl -sS --fail "https://api.example.com/health" -o /dev/stdout

Get just the HTTP status code
curl -s -o /dev/null -w "%{http_code}\n" "https://example.com/path"

POST JSON
curl -sS -X POST "http://localhost:3000/api/resource" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"alice","age":30}' | jq .

POST form-data (file upload)
curl -sS -F "file=@/path/to/file.csv" -F "meta=notes" "https://example.com/upload"

Save response to file (download)
curl -L -o data.json "https://example.com/export.json"

Show timing and status for a quick health check
curl -sS -o /dev/null -w "HTTP %{http_code} in %{time_total}s\n" "http://localhost:3000/health"

Alpha Vantage tip (relevant to your project)
curl -sS "https://www.alphavantage.co/query?function=OVERVIEW&symbol=IBM&apikey=$ALPHAVANTAGE_KEY" \
  -H "Accept: application/json" | jq '.Note // .'

Alpha Vantage will often return a JSON with a "Note" field when you are rate-limited. Always check for that in automated checks:


If you see a Note like "Thank you for using Alpha Vantage...please visit ...", you were rate-limited.




// req.body example for saving shares detail
// req.params example for deleting shares detail
// req.query example for fetching shares detail with query parameters


// Example req.params for deleting shares detail
// DELETE /api/shares/:id
// where :id is the ID of the shares detail entry to delete

// Example req.query for fetching shares detail with query parameters
// GET /api/shares/savedShares?symbol=AAPL&date=2023-10-01
// where symbol and date are optional query parameters to filter results




# 📊 Data Correlation Guide for API Routes

This section explains how to correctly correlate and combine data across different routes in your bull-paper application.

## 🔗 Available API Routes & Data Relationships

### **Core Market Data Routes** (mounted on `/api`)
| Route | Endpoint | Data Source | Primary Key |
|-------|----------|-------------|-------------|
| **Overview** | `GET /api/overview?tickers=SYMBOL` | Alpha Vantage OVERVIEW | `symbol` |
| **News** | `GET /api/news?tickers=SYMBOL` | Alpha Vantage NEWS_SENTIMENT | `symbol` |
| **Shares** | `GET /api/shares?tickers=SYMBOL` | Alpha Vantage SHARES_OUTSTANDING | `symbol` |

### **Trading Journal Routes** (mounted on `/api` and `/journal`)
| Route | Endpoint | Purpose | Related Data |
|-------|----------|---------|-------------|
| **Save Trade** | `POST /api/shares` | Save trade with market snapshot | Links to overview + shares data |
| **Get Saved Trades** | `GET /api/savedShares` | Retrieve all saved trades | Contains embedded market snapshots |
| **Journal Entries** | `GET /journal/` | Get all journal entries | Links trades to user accounts |

---

## 🎯 Data Correlation Patterns

### **1. Basic Stock Research Flow**
```bash
# Step 1: Get company overview
curl "http://localhost:3000/api/overview?tickers=AAPL"

# Step 2: Get recent news sentiment  
curl "http://localhost:3000/api/news?tickers=AAPL"

# Step 3: Get shares outstanding data
curl "http://localhost:3000/api/shares?tickers=AAPL"
```

**Correlation Key**: All three endpoints use the same `tickers=SYMBOL` parameter and return data that can be correlated by the stock symbol.

### **2. Trade Entry with Market Context**
```bash
# Get current market data first
curl "http://localhost:3000/api/overview?tickers=TSLA"

# Save trade with market snapshot (automatically correlates overview + shares data)
curl -X POST "http://localhost:3000/api/shares" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "TSLA",
    "side": "long", 
    "shareSize": 100,
    "entry": 250.00,
    "exit": 260.00,
    "volume": "50m - 70m",
    "executedDay": "2025-09-30T10:30:00Z",
    "timeOfDay": "2025-09-30T10:30:00Z",
    "notes": "Breakout pattern trade",
    "marketSnapshot": {
      "timestamp": "2025-09-30T10:30:00Z",
      "symbol": "TSLA",
      "overview": "< data from /api/overview >",
      "shares": "< data from /api/shares >"
    }
  }'
```

### **3. Historical Analysis & Correlation**
```bash
# Get all saved trades to analyze performance
curl "http://localhost:3000/api/savedShares"

# Get journal entries (requires authentication)
curl "http://localhost:3000/journal/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔀 Data Relationship Mapping

### **Symbol-Based Correlation**
All market data routes correlate via stock symbol:
```javascript
// Frontend example: Fetch complete stock profile
async function getStockProfile(symbol) {
  const [overview, news, shares] = await Promise.all([
    fetch(`/api/overview?tickers=${symbol}`),
    fetch(`/api/news?tickers=${symbol}`),  
    fetch(`/api/shares?tickers=${symbol}`)
  ]);
  
  return {
    symbol: symbol,
    overview: await overview.json(),
    sentiment: await news.json(),
    sharesData: await shares.json(),
    correlatedAt: new Date().toISOString()
  };
}
```

### **Trade-to-Market Data Linking**
When saving trades, market snapshot automatically correlates current market conditions:
```javascript
// Market snapshot structure embedded in saved trades
{
  "_id": "trade_id_123",
  "symbol": "AAPL",
  "entry": 150.25,
  "exit": 155.50,
  "executedDay": "2025-09-30",
  "marketSnapshot": {
    "timestamp": "2025-09-30T10:30:00Z",
    "symbol": "AAPL", // << Correlation key
    "overview": {
      "marketCap": "3000000000000",
      "peRatio": "28.5",
      "sector": "Technology"
    },
    "sharesOutstanding": "15800000000"
  }
}
```

### **User-to-Journal Correlation**
Journal entries link trades to user accounts:
```javascript
// Journal entry structure  
{
  "_id": "journal_entry_456", 
  "author": "user_id_789", // << User correlation
  "symbol": "AAPL",        // << Stock correlation
  "timeOfDay": "2025-09-30T10:30:00Z",
  "shareSize": 100,
  "entry": 150.25,
  "marketSnapshot": { ... } // << Embedded market context
}
```

---

## 📋 Best Practices for Data Correlation

### **1. Consistent Symbol Format**
```bash
# Always use uppercase symbols for consistency
✅ GOOD: tickers=AAPL
❌ BAD:  tickers=aapl

# Multiple symbols (if supported)
✅ GOOD: tickers=AAPL,MSFT,GOOGL
```

### **2. Timestamp Correlation**
```bash
# When correlating time-sensitive data, capture timestamps
curl "http://localhost:3000/api/overview?tickers=AAPL" | jq '{symbol, data: ., timestamp: now}'
```

### **3. Error Handling for Missing Correlations**
```javascript
// Check for rate limits or missing data
const response = await fetch('/api/overview?tickers=INVALID');
const data = await response.json();

if (data.Note) {
  console.warn('Alpha Vantage rate limit:', data.Note);
} else if (data['Error Message']) {
  console.error('Invalid symbol:', data['Error Message']);
}
```

### **4. Batch Data Correlation**
```bash
# Get overview for multiple symbols in sequence
for symbol in AAPL MSFT GOOGL; do
  echo "=== $symbol ==="
  curl -s "http://localhost:3000/api/overview?tickers=$symbol" | jq '.Symbol, .Name, .Sector'
done
```

---

## 🧪 Testing Data Correlation

### **Test Complete Stock Research Flow**
```bash
#!/bin/bash
SYMBOL="IBM"

echo "📊 Testing complete data correlation for $SYMBOL"

echo "1️⃣ Overview Data:"
curl -s "http://localhost:3000/api/overview?tickers=$SYMBOL" | jq '{Symbol, Name, Sector, MarketCapitalization}'

echo "2️⃣ News Sentiment:"  
curl -s "http://localhost:3000/api/news?tickers=$SYMBOL" | jq '.feed[0] // "No news available"'

echo "3️⃣ Shares Outstanding:"
curl -s "http://localhost:3000/api/shares?tickers=$SYMBOL" | jq '. // "No shares data"'

echo "✅ All data correlated by symbol: $SYMBOL"
```

### **Test Trade Saving with Market Context**
```bash
# Save a test trade with correlated market data
curl -X POST "http://localhost:3000/api/shares" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "side": "long",
    "shareSize": 10,
    "entry": 150.00,
    "exit": 155.00, 
    "volume": "10m - 20m",
    "executedDay": "'$(date -I)'",
    "timeOfDay": "'$(date -Iseconds)'",
    "notes": "Test correlation trade"
  }' | jq '{saved: .saved, marketSnapshot: .marketSnapshot.symbol}'
```

---

## ⚡ Quick Reference Commands

```bash
# Get correlated data for a single stock
SYMBOL="TSLA"
curl -s "localhost:3000/api/overview?tickers=$SYMBOL" > ${SYMBOL}_overview.json
curl -s "localhost:3000/api/news?tickers=$SYMBOL" > ${SYMBOL}_news.json  
curl -s "localhost:3000/api/shares?tickers=$SYMBOL" > ${SYMBOL}_shares.json

# Verify all files have the same symbol
grep -h "Symbol\|symbol" ${SYMBOL}_*.json

# Get all your saved trades with market snapshots
curl -s "localhost:3000/api/savedShares" | jq '.[].marketSnapshot.symbol' | sort | uniq -c
```

This correlation system ensures that all your market data, trades, and journal entries are properly linked by stock symbols and timestamps, enabling comprehensive analysis and backtesting.

---

# ⚛️ React Frontend Data Correlation Guide

This section shows how to build a React frontend that properly correlates and displays data from all your API routes.

## 🏗️ React Project Setup

### **1. Initialize React App**
```bash
# Create new React app
npx create-react-app bull-paper-frontend
cd bull-paper-frontend

# Install additional dependencies
npm install axios react-router-dom @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material @mui/x-date-pickers dayjs
```

### **2. Project Structure**
```
src/
├── components/
│   ├── StockOverview/
│   ├── TradingForm/
│   ├── MarketData/
│   └── Journal/
├── services/
│   └── api.js
├── hooks/
│   └── useCorrelatedData.js
├── utils/
│   └── dataCorrelation.js
└── App.js
```

---

## 🔌 API Service Layer (`src/services/api.js`)

```javascript
import axios from 'axios';

class BullPaperAPI {
  constructor(baseURL = 'http://localhost:3000') {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  // Market Data Endpoints
  async getOverview(symbol) {
    return this.client.get(`/api/overview?tickers=${symbol.toUpperCase()}`);
  }

  async getNews(symbol) {
    return this.client.get(`/api/news?tickers=${symbol.toUpperCase()}`);
  }

  async getShares(symbol) {
    return this.client.get(`/api/shares?tickers=${symbol.toUpperCase()}`);
  }

  // Trading Endpoints
  async saveTrade(tradeData) {
    return this.client.post('/api/shares', tradeData);
  }

  async getSavedTrades() {
    return this.client.get('/api/savedShares');
  }

  async deleteTrade(tradeId) {
    return this.client.delete(`/api/shares/${tradeId}`);
  }

  // Journal Endpoints (with auth)
  async getJournalEntries(token) {
    return this.client.get('/journal/', {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // Correlated Data Methods
  async getCompleteStockProfile(symbol) {
    try {
      const [overview, news, shares] = await Promise.allSettled([
        this.getOverview(symbol),
        this.getNews(symbol),
        this.getShares(symbol)
      ]);

      return {
        symbol: symbol.toUpperCase(),
        overview: overview.status === 'fulfilled' ? overview.value : null,
        news: news.status === 'fulfilled' ? news.value : null,
        shares: shares.status === 'fulfilled' ? shares.value : null,
        timestamp: new Date().toISOString(),
        errors: {
          overview: overview.status === 'rejected' ? overview.reason.message : null,
          news: news.status === 'rejected' ? news.reason.message : null,
          shares: shares.status === 'rejected' ? shares.reason.message : null,
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch complete profile for ${symbol}: ${error.message}`);
    }
  }

  async saveTradeWithMarketSnapshot(tradeData) {
    // Fetch current market data for the symbol
    const marketSnapshot = await this.getCompleteStockProfile(tradeData.symbol);
    
    // Combine trade data with market snapshot
    const payload = {
      ...tradeData,
      marketSnapshot: {
        timestamp: marketSnapshot.timestamp,
        symbol: marketSnapshot.symbol,
        overview: marketSnapshot.overview,
        sharesData: marketSnapshot.shares,
        newsContext: marketSnapshot.news?.feed?.slice(0, 3) // Latest 3 news items
      }
    };

    return this.saveTrade(payload);
  }
}

export default new BullPaperAPI();
```

---

## 🎣 Custom React Hook (`src/hooks/useCorrelatedData.js`)

```javascript
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useCorrelatedData = (symbol) => {
  const [data, setData] = useState({
    overview: null,
    news: null,
    shares: null,
    loading: false,
    error: null,
    lastFetched: null
  });

  const fetchCorrelatedData = useCallback(async (stockSymbol) => {
    if (!stockSymbol) return;

    setData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const profile = await api.getCompleteStockProfile(stockSymbol);
      
      setData({
        overview: profile.overview,
        news: profile.news,
        shares: profile.shares,
        symbol: profile.symbol,
        loading: false,
        error: profile.errors.overview || profile.errors.news || profile.errors.shares || null,
        lastFetched: profile.timestamp
      });
    } catch (error) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  }, []);

  // Auto-fetch when symbol changes
  useEffect(() => {
    if (symbol) {
      fetchCorrelatedData(symbol);
    }
  }, [symbol, fetchCorrelatedData]);

  const refresh = useCallback(() => {
    if (data.symbol) {
      fetchCorrelatedData(data.symbol);
    }
  }, [data.symbol, fetchCorrelatedData]);

  return {
    ...data,
    refresh,
    fetchCorrelatedData
  };
};

export const useSavedTrades = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    try {
      const savedTrades = await api.getSavedTrades();
      setTrades(savedTrades);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveTrade = useCallback(async (tradeData) => {
    try {
      const result = await api.saveTradeWithMarketSnapshot(tradeData);
      await fetchTrades(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchTrades]);

  const deleteTrade = useCallback(async (tradeId) => {
    try {
      await api.deleteTrade(tradeId);
      await fetchTrades(); // Refresh the list
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchTrades]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  return {
    trades,
    loading,
    error,
    fetchTrades,
    saveTrade,
    deleteTrade
  };
};
```

---

## 🏢 Stock Overview Component (`src/components/StockOverview/StockOverview.jsx`)

```javascript
import React, { useState } from 'react';
import { 
  Card, CardContent, Typography, Grid, Box, 
  TextField, Button, CircularProgress, Alert,
  Chip, Divider, List, ListItem, ListItemText
} from '@mui/material';
import { TrendingUp, TrendingDown, Business, Article } from '@mui/icons-material';
import { useCorrelatedData } from '../../hooks/useCorrelatedData';

const StockOverview = () => {
  const [symbol, setSymbol] = useState('');
  const [searchSymbol, setSearchSymbol] = useState('');
  const { 
    overview, news, shares, loading, error, lastFetched, fetchCorrelatedData 
  } = useCorrelatedData(searchSymbol);

  const handleSearch = (e) => {
    e.preventDefault();
    if (symbol.trim()) {
      setSearchSymbol(symbol.trim().toUpperCase());
    }
  };

  const formatNumber = (num) => {
    if (!num) return 'N/A';
    return Number(num).toLocaleString();
  };

  const formatCurrency = (num) => {
    if (!num) return 'N/A';
    return `$${Number(num).toLocaleString()}`;
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        📊 Stock Research Dashboard
      </Typography>

      {/* Search Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <form onSubmit={handleSearch}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label="Stock Symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="AAPL"
                size="small"
                sx={{ minWidth: 200 }}
              />
              <Button 
                type="submit" 
                variant="contained" 
                disabled={loading || !symbol.trim()}
              >
                {loading ? <CircularProgress size={20} /> : 'Research Stock'}
              </Button>
              {searchSymbol && (
                <Button 
                  onClick={() => fetchCorrelatedData(searchSymbol)} 
                  variant="outlined"
                  disabled={loading}
                >
                  Refresh Data
                </Button>
              )}
            </Box>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {searchSymbol && (
        <Grid container spacing={3}>
          {/* Company Overview */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Company Overview - {searchSymbol}
                </Typography>
                
                {loading && !overview ? (
                  <CircularProgress />
                ) : overview ? (
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      {overview.Name}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Chip label={overview.Sector} color="primary" sx={{ mr: 1 }} />
                      <Chip label={overview.Industry} color="secondary" />
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Market Cap</Typography>
                        <Typography variant="h6">{formatCurrency(overview.MarketCapitalization)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">P/E Ratio</Typography>
                        <Typography variant="h6">{overview.PERatio || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">52W High</Typography>
                        <Typography variant="h6">{formatCurrency(overview['52WeekHigh'])}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">52W Low</Typography>
                        <Typography variant="h6">{formatCurrency(overview['52WeekLow'])}</Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      {overview.Description?.substring(0, 200)}...
                    </Typography>
                  </Box>
                ) : (
                  <Alert severity="warning">No overview data available</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Shares Outstanding */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📈 Shares Outstanding Data
                </Typography>
                
                {loading && !shares ? (
                  <CircularProgress />
                ) : shares ? (
                  <Box>
                    <Typography variant="h4" color="primary" gutterBottom>
                      {formatNumber(shares.annualReports?.[0]?.shareClass || 'N/A')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Latest Report: {shares.annualReports?.[0]?.fiscalDateEnding || 'N/A'}
                    </Typography>
                    
                    {shares.quarterlyReports && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Recent Quarterly Data:</Typography>
                        {shares.quarterlyReports.slice(0, 3).map((report, index) => (
                          <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                            <Typography variant="body2">{report.fiscalDateEnding}</Typography>
                            <Typography variant="body2">{formatNumber(report.shareClass)}</Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Alert severity="warning">No shares data available</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* News Sentiment */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Article sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Recent News & Sentiment
                </Typography>
                
                {loading && !news ? (
                  <CircularProgress />
                ) : news?.feed ? (
                  <Box>
                    {/* Overall Sentiment */}
                    {news.overall_sentiment_label && (
                      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">Overall Sentiment:</Typography>
                        <Chip 
                          label={news.overall_sentiment_label}
                          color={
                            news.overall_sentiment_label === 'Bullish' ? 'success' :
                            news.overall_sentiment_label === 'Bearish' ? 'error' : 'default'
                          }
                          icon={news.overall_sentiment_label === 'Bullish' ? <TrendingUp /> : <TrendingDown />}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Score: {news.overall_sentiment_score}
                        </Typography>
                      </Box>
                    )}

                    {/* News Articles */}
                    <List>
                      {news.feed.slice(0, 5).map((article, index) => (
                        <ListItem key={index} divider>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1">
                                {article.title}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  {new Date(article.time_published).toLocaleDateString()} - {article.source}
                                </Typography>
                                <Typography variant="body2">
                                  {article.summary?.substring(0, 150)}...
                                </Typography>
                                {article.ticker_sentiment && (
                                  <Box sx={{ mt: 1 }}>
                                    {article.ticker_sentiment
                                      .filter(t => t.ticker === searchSymbol)
                                      .map((sentiment, idx) => (
                                        <Chip
                                          key={idx}
                                          size="small"
                                          label={`${sentiment.ticker}: ${sentiment.ticker_sentiment_label}`}
                                          color={
                                            sentiment.ticker_sentiment_label === 'Bullish' ? 'success' :
                                            sentiment.ticker_sentiment_label === 'Bearish' ? 'error' : 'default'
                                          }
                                        />
                                      ))}
                                  </Box>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ) : (
                  <Alert severity="warning">No news data available</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Data Correlation Info */}
          {lastFetched && (
            <Grid item xs={12}>
              <Alert severity="info">
                📊 All data correlated by symbol <strong>{searchSymbol}</strong> at {new Date(lastFetched).toLocaleString()}
              </Alert>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default StockOverview;
```

---

## 💼 Trading Form Component (`src/components/TradingForm/TradingForm.jsx`)

```javascript
import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Grid, TextField,
  Button, Select, MenuItem, FormControl, InputLabel,
  Alert, Box, Chip, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import { useSavedTrades } from '../../hooks/useCorrelatedData';
import api from '../../services/api';

const TradingForm = () => {
  const [formData, setFormData] = useState({
    symbol: '',
    side: '',
    shareSize: '',
    entry: '',
    exit: '',
    volume: '',
    fees: '5.99',
    timeOfDay: new Date().toISOString().slice(0, 16),
    executedDay: new Date().toISOString().split('T')[0],
    strategyTag: '',
    notes: ''
  });

  const [marketPreview, setMarketPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [profitLoss, setProfitLoss] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const { trades, saveTrade, deleteTrade, loading: tradesLoading } = useSavedTrades();

  // Calculate P/L in real-time
  useEffect(() => {
    const entry = parseFloat(formData.entry) || 0;
    const exit = parseFloat(formData.exit) || 0;
    const shareSize = parseInt(formData.shareSize) || 0;
    const fees = parseFloat(formData.fees) || 0;

    if (entry && exit && shareSize) {
      let profit;
      if (formData.side === 'long') {
        profit = (exit - entry) * shareSize;
      } else if (formData.side === 'short') {
        profit = (entry - exit) * shareSize;
      } else {
        return;
      }
      setProfitLoss(profit - fees);
    }
  }, [formData.entry, formData.exit, formData.shareSize, formData.fees, formData.side]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const previewMarketData = async () => {
    if (!formData.symbol) {
      setMessage('Please enter a stock symbol first');
      return;
    }

    try {
      const profile = await api.getCompleteStockProfile(formData.symbol);
      setMarketPreview(profile);
      setShowPreview(true);
    } catch (error) {
      setMessage(`Error fetching market data: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      // Convert form data to API format
      const tradeData = {
        symbol: formData.symbol.toUpperCase(),
        side: formData.side,
        shareSize: parseInt(formData.shareSize),
        entry: parseFloat(formData.entry),
        exit: parseFloat(formData.exit),
        volume: formData.volume,
        fees: parseFloat(formData.fees) || 0,
        timeOfDay: new Date(formData.timeOfDay).toISOString(),
        executedDay: new Date(formData.executedDay).toISOString(),
        meta: { strategyTag: formData.strategyTag },
        notes: formData.notes
      };

      const result = await saveTrade(tradeData);
      
      setMessage(`✅ Trade saved successfully! Market snapshot captured for ${tradeData.symbol}`);
      
      // Reset form
      setFormData({
        symbol: '',
        side: '',
        shareSize: '',
        entry: '',
        exit: '',
        volume: '',
        fees: '5.99',
        timeOfDay: new Date().toISOString().slice(0, 16),
        executedDay: new Date().toISOString().split('T')[0],
        strategyTag: '',
        notes: ''
      });
      setProfitLoss(0);
      
    } catch (error) {
      setMessage(`❌ Error saving trade: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        💼 Trading Entry Form
      </Typography>

      <Grid container spacing={3}>
        {/* Trading Form */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  {/* Basic Trade Info */}
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Stock Symbol"
                      name="symbol"
                      value={formData.symbol}
                      onChange={handleInputChange}
                      required
                      InputProps={{ style: { textTransform: 'uppercase' } }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Trade Side</InputLabel>
                      <Select
                        name="side"
                        value={formData.side}
                        onChange={handleInputChange}
                        label="Trade Side"
                      >
                        <MenuItem value="long">Long</MenuItem>
                        <MenuItem value="short">Short</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Prices & Size */}
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Entry Price"
                      name="entry"
                      type="number"
                      step="0.01"
                      value={formData.entry}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Exit Price"
                      name="exit"
                      type="number"
                      step="0.01"
                      value={formData.exit}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Share Size"
                      name="shareSize"
                      type="number"
                      value={formData.shareSize}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>

                  {/* Volume & Fees */}
                  <Grid item xs={8}>
                    <FormControl fullWidth required>
                      <InputLabel>Volume Range</InputLabel>
                      <Select
                        name="volume"
                        value={formData.volume}
                        onChange={handleInputChange}
                        label="Volume Range"
                      >
                        <MenuItem value="1m - 5m">1M - 5M</MenuItem>
                        <MenuItem value="10m - 20m">10M - 20M</MenuItem>
                        <MenuItem value="30m - 40m">30M - 40M</MenuItem>
                        <MenuItem value="50m - 70m">50M - 70M</MenuItem>
                        <MenuItem value="80m - 100m">80M - 100M</MenuItem>
                        <MenuItem value="120m - 150m">120M - 150M</MenuItem>
                        <MenuItem value="160m - 180m">160M - 180M</MenuItem>
                        <MenuItem value="200+m">200M+</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Fees"
                      name="fees"
                      type="number"
                      step="0.01"
                      value={formData.fees}
                      onChange={handleInputChange}
                    />
                  </Grid>

                  {/* Dates */}
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Time of Day"
                      name="timeOfDay"
                      type="datetime-local"
                      value={formData.timeOfDay}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Execution Date"
                      name="executedDay"
                      type="date"
                      value={formData.executedDay}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>

                  {/* Strategy & Notes */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Strategy Tag"
                      name="strategyTag"
                      value={formData.strategyTag}
                      onChange={handleInputChange}
                      placeholder="swing_trade, breakout, etc."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Trade Notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Enter analysis, emotions, market conditions..."
                    />
                  </Grid>

                  {/* P/L Display */}
                  {profitLoss !== 0 && (
                    <Grid item xs={12}>
                      <Alert 
                        severity={profitLoss >= 0 ? 'success' : 'error'}
                        sx={{ display: 'flex', alignItems: 'center' }}
                      >
                        <Typography variant="h6">
                          {profitLoss >= 0 ? '📈' : '📉'} Net P/L: ${profitLoss.toFixed(2)}
                        </Typography>
                      </Alert>
                    </Grid>
                  )}

                  {/* Action Buttons */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={previewMarketData}
                        disabled={!formData.symbol}
                      >
                        📊 Preview Market Data
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={saving}
                        sx={{ flexGrow: 1 }}
                      >
                        {saving ? '💾 Saving...' : '💾 Save Trade with Market Snapshot'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>

              {message && (
                <Alert severity={message.includes('✅') ? 'success' : 'error'} sx={{ mt: 2 }}>
                  {message}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Saved Trades List */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 'fit-content' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📜 Recent Trades ({trades.length})
              </Typography>
              
              {tradesLoading ? (
                <Typography>Loading trades...</Typography>
              ) : trades.length > 0 ? (
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {trades.slice(0, 10).map((trade) => (
                    <Box key={trade._id} sx={{ mb: 2, p: 1, border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2">{trade.symbol}</Typography>
                        <Chip 
                          label={trade.side} 
                          size="small" 
                          color={trade.side === 'long' ? 'success' : 'error'} 
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        ${trade.entry} → ${trade.exit} ({trade.shareSize} shares)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(trade.executedDay).toLocaleDateString()}
                      </Typography>
                      {trade.marketSnapshot && (
                        <Chip 
                          label="📊 Market Snapshot" 
                          size="small" 
                          variant="outlined" 
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">No trades saved yet</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Market Data Preview Dialog */}
      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="md" fullWidth>
        <DialogTitle>📊 Market Snapshot Preview - {formData.symbol}</DialogTitle>
        <DialogContent>
          {marketPreview && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                This market data will be automatically saved with your trade for future correlation analysis.
              </Alert>
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                {JSON.stringify(marketPreview, null, 2)}
              </pre>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default TradingForm;
```

---

## 🚀 Main App Component (`src/App.js`)

```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, AppBar, Toolbar, Typography, Container, Box, Tabs, Tab } from '@mui/material';
import StockOverview from './components/StockOverview/StockOverview';
import TradingForm from './components/TradingForm/TradingForm';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [tabValue, setTabValue] = React.useState(0);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              🐂 Bull Paper - Trading Dashboard
            </Typography>
            <Box sx={{ display: 'flex' }}>
              <Tabs 
                value={tabValue} 
                onChange={(e, newValue) => setTabValue(newValue)}
                textColor="inherit"
              >
                <Tab 
                  label="📊 Stock Research" 
                  component={NavLink} 
                  to="/" 
                  sx={{ color: 'white' }}
                />
                <Tab 
                  label="💼 Trading" 
                  component={NavLink} 
                  to="/trading" 
                  sx={{ color: 'white' }}
                />
              </Tabs>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 2 }}>
          <Routes>
            <Route path="/" element={<StockOverview />} />
            <Route path="/trading" element={<TradingForm />} />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;
```

---

## 🔄 Usage Examples

### **Complete Integration Workflow**

```javascript
// Example of full data correlation in a React component
import { useCorrelatedData, useSavedTrades } from '../hooks/useCorrelatedData';

const ComprehensiveDashboard = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  
  // Get correlated market data
  const { 
    overview, news, shares, loading, error 
  } = useCorrelatedData(selectedSymbol);
  
  // Get saved trades with market snapshots
  const { trades, saveTrade } = useSavedTrades();
  
  // Find trades for current symbol
  const symbolTrades = trades.filter(trade => 
    trade.symbol === selectedSymbol
  );
  
  // Correlate current market data with historical trades
  const analysis = useMemo(() => {
    if (!overview || symbolTrades.length === 0) return null;
    
    return {
      currentPrice: overview.LatestPrice,
      avgEntryPrice: symbolTrades.reduce((sum, trade) => sum + trade.entry, 0) / symbolTrades.length,
      totalTrades: symbolTrades.length,
      profitableTrades: symbolTrades.filter(trade => 
        trade.side === 'long' ? trade.exit > trade.entry : trade.entry > trade.exit
      ).length,
      marketCapChange: symbolTrades[0]?.marketSnapshot?.overview?.MarketCapitalization !== overview.MarketCapitalization
    };
  }, [overview, symbolTrades]);
  
  return (
    <div>
      <h2>📈 Comprehensive Analysis for {selectedSymbol}</h2>
      
      {/* Current Market Data */}
      <MarketDataDisplay 
        overview={overview}
        news={news}
        shares={shares}
      />
      
      {/* Historical Trades */}
      <TradeHistory trades={symbolTrades} />
      
      {/* Correlation Analysis */}
      {analysis && (
        <AnalysisPanel analysis={analysis} />
      )}
    </div>
  );
};
```

This React setup provides:
- **Complete API integration** with proper error handling
- **Real-time data correlation** across all your endpoints
- **Automatic market snapshot capturing** when saving trades
- **Historical analysis** by correlating saved trades with current market data
- **Responsive UI** with Material-UI components
- **Type safety** and reusable hooks for data management

---

# 🛤️ Complete Route Analysis with Model Relationships

This section breaks down every route in your application and explains exactly what each one does with your MongoDB models.

## 📊 Data Model Overview

Your application uses 6 main MongoDB models:

```javascript
// Core Models from JOURNAL/models.js
Journal           // Main trading journal entries with embedded market data
MarketSnapshot    // Real-time market conditions at trade time  
SharesDetail      // Shares outstanding data from Alpha Vantage
Overview          // Company fundamentals (P/E, market cap, etc.)
NewsArticle       // News articles with sentiment analysis
TickerSentiment   // Per-ticker sentiment scores from news

// User Model from USER/models/User.js  
User              // User accounts with authentication
```

---

## 🔄 Route-by-Route Analysis

### **1. Authentication Routes** (`/auth` - USER/controllers/auth.js)

#### **Uses Model**: `User`
```bash
POST /auth/sign-up
POST /auth/sign-in
```

**What it does with your models**:
- **Sign-up**: Creates new `User` document with hashed password
- **Sign-in**: Validates `User` credentials and returns JWT token
- **Purpose**: Manages user authentication for journal access

**Model Operation**:
```javascript
// Creates User document
const user = await User.create({
    username: req.body.username,
    password: bcrypt.hashSync(req.body.password, saltRounds)
});
```

---

### **2. User Management Routes** (`/users` - USER/controllers/users.js)

#### **Uses Model**: `User`
```bash
GET /users        # List users
GET /users/:id    # Get specific user
```

**What it does with your models**:
- Retrieves `User` documents for admin/profile purposes
- Does NOT create or modify trading data

---

### **3. Market Data Routes** (`/api` - apiClient/routes/)

These routes fetch **external Alpha Vantage data** but don't directly save to your models (they provide data for `MarketSnapshot` creation):

#### **News Route** (`apiClient/routes/news.js`)
```bash
GET /api/news?tickers=AAPL
```
**What it does**:
- Fetches Alpha Vantage NEWS_SENTIMENT data
- **Does NOT save to database**
- Returns raw news data that can populate `NewsArticle` and `TickerSentiment` models
- Used as input for `MarketSnapshot.newsArticles[]` when saving trades

#### **Overview Route** (`apiClient/routes/overView.js`)  
```bash
GET /api/overview?tickers=AAPL
```
**What it does**:
- Fetches Alpha Vantage OVERVIEW data (company fundamentals)
- **Does NOT save to database**  
- Returns raw overview data that can populate `Overview` model
- Used as input for `MarketSnapshot.overview[]` when saving trades

#### **Shares Route** (`apiClient/routes/shares.js` → `JOURNAL/controllers/shares.js`)
```bash
GET /api/shares?tickers=AAPL         # Fetch external data
POST /api/shares                     # Save trade + market snapshot  
GET /api/savedShares                 # Get saved trades
DELETE /api/shares/:id               # Delete saved trade
POST /api/sharesAndJournal          # Save trade + journal entry
```

**What it does with your models**:

##### **GET /api/shares** (External Data):
- Fetches Alpha Vantage SHARES_OUTSTANDING data
- **Does NOT save to database**
- Returns data for `SharesDetail` model population

##### **POST /api/shares** (Save Trade):
**Uses Models**: `SharesDetail`, `Journal`, `MarketSnapshot`
```javascript
// Creates SharesDetail document
const newShare = new sharesDetail(req.body);

// Creates Journal entry with embedded MarketSnapshot
const newJournalEntry = new Journal({
    userId: req.user._id,           // Links to User
    symbol: req.body.symbol,        // Stock ticker
    side: req.body.side,           // 'long' or 'short'
    entry: req.body.entry,         // Entry price
    exit: req.body.exit,           // Exit price  
    shareSize: req.body.shareSize, // Number of shares
    marketSnapshot: {              // Embedded MarketSnapshot
        symbol: req.body.symbol,
        newsArticles: [...],       // From /api/news
        overview: [...],           // From /api/overview  
        sharesDetail: [...],       // From /api/shares
        fetchedAt: new Date()
    }
});
```

##### **GET /api/savedShares** (Retrieve Saved Trades):
**Uses Model**: `SharesDetail`
```javascript
// Gets all saved SharesDetail documents
const savedShares = await sharesDetail.find().sort({ createdAt: -1 });
```

##### **DELETE /api/shares/:id** (Delete Trade):
**Uses Model**: `SharesDetail`
```javascript
// Removes SharesDetail document by ID
const deletedShare = await sharesDetail.findByIdAndDelete(id);
```

---

### **4. Journal Routes** (`/journal` - JOURNAL/controllers/journalList.js)

#### **Uses Models**: `Journal` (with embedded `MarketSnapshot`)
```bash
GET /journal/              # Get all journal entries (auth required)
GET /journal/:journalId    # Get specific journal entry (auth required)  
POST /journal/new          # Create new journal entry (auth required)
PUT /journal/:journalId/edit    # Update journal entry (auth required)
DELETE /journal/:journalId      # Delete journal entry (auth required)
```

**What it does with your models**:

##### **GET /journal/** (List All Entries):
```javascript
// Gets all Journal documents for authenticated user
const journal = await Journal.find({})
    .populate("author")           // Populates User reference
    .sort({ createdAt: "desc" }); // Newest first
```

##### **POST /journal/new** (Create Entry):
```javascript
// Creates new Journal document linked to authenticated user
const journal = await Journal.create({
    ...req.body,              // All journal fields
    userId: req.user._id,     // Links to User model
    marketSnapshot: {         // Embedded market data
        // Contains NewsArticle, Overview, SharesDetail data
    }
});
```

##### **PUT /journal/:journalId/edit** (Update Entry):
```javascript
// Updates existing Journal document (user ownership verified)
const updatedJournal = await Journal.findByIdAndUpdate(
    req.params.journalId,
    req.body,
    { new: true }
);
```

---

## 🔗 Model Relationship Flow

### **Complete Data Flow Example**:

1. **User Authentication** (`User` model):
```bash
POST /auth/sign-in → Creates JWT token → User can access /journal routes
```

2. **Market Research** (External APIs, no model saves):
```bash
GET /api/overview?tickers=AAPL  → Raw Alpha Vantage data
GET /api/news?tickers=AAPL      → Raw Alpha Vantage data  
GET /api/shares?tickers=AAPL    → Raw Alpha Vantage data
```

3. **Trade Entry** (`SharesDetail` + `Journal` + `MarketSnapshot` models):
```bash
POST /api/shares → {
    // Creates SharesDetail document
    SharesDetail: { entry: 150, exit: 155, shareSize: 100 }
    
    // Creates Journal document with embedded MarketSnapshot
    Journal: {
        userId: "user123",
        symbol: "AAPL", 
        entry: 150,
        marketSnapshot: {
            symbol: "AAPL",
            overview: [{ marketCap: 3000000000, peRatio: 28 }],
            newsArticles: [{ title: "Apple earnings...", sentiment: "Bullish" }],
            sharesDetail: [{ asOf: "2025-09-30", basic: 15800000 }]
        }
    }
}
```

4. **Journal Management** (`Journal` model with `User` reference):
```bash
GET /journal/        → Returns all Journal entries for authenticated User
PUT /journal/:id     → Updates Journal entry (ownership verified)
DELETE /journal/:id  → Removes Journal entry (ownership verified)
```

---

## 🎯 Key Model Interactions

### **1. User ↔ Journal Relationship**
```javascript
// Journal references User
Journal: {
    userId: ObjectId("user123"),  // References User._id
    // ... other fields
}

// Populated in queries
journal.populate("author")  // Brings in full User document
```

### **2. Journal ↔ MarketSnapshot Embedding**
```javascript  
// MarketSnapshot is embedded in Journal (not separate collection)
Journal: {
    symbol: "AAPL",
    entry: 150.00,
    marketSnapshot: {           // Embedded document
        symbol: "AAPL",         // Same symbol correlation
        overview: [...],        // Company fundamentals
        newsArticles: [...],    // News sentiment
        sharesDetail: [...],    // Shares outstanding
        fetchedAt: Date         // When market data was captured
    }
}
```

### **3. External API ↔ Model Population**
```javascript
// Alpha Vantage APIs populate model fields
GET /api/overview    → Overview model fields
GET /api/news        → NewsArticle + TickerSentiment model fields  
GET /api/shares      → SharesDetail model fields

// These get embedded in MarketSnapshot when saving trades
```

---

## 📋 Route Summary by Model Usage

| Route | Model(s) Used | Operation | Purpose |
|-------|---------------|-----------|---------|
| `/auth/*` | `User` | Create, Read | Authentication |
| `/users/*` | `User` | Read | User management |
| `/api/news` | None (external) | Fetch | Get news for MarketSnapshot |
| `/api/overview` | None (external) | Fetch | Get overview for MarketSnapshot |  
| `/api/shares` (GET) | None (external) | Fetch | Get shares data for MarketSnapshot |
| `/api/shares` (POST) | `SharesDetail`, `Journal`, `MarketSnapshot` | Create | Save trade with market context |
| `/api/savedShares` | `SharesDetail` | Read | Get saved trades |
| `/api/shares/:id` (DELETE) | `SharesDetail` | Delete | Remove saved trade |
| `/journal/*` | `Journal` (+ embedded `MarketSnapshot`) | CRUD | Full journal management |

### **Data Correlation Key**:
- **Symbol**: All market data correlates by stock ticker (`AAPL`, `MSFT`, etc.)
- **User**: All journal entries link to authenticated user via `userId`
- **Time**: Market snapshots capture exact market conditions at trade time
- **Embedding**: MarketSnapshot embeds Overview, News, and Shares data for historical context

This design ensures every trade is permanently linked to the market conditions that existed when the trade was made, enabling powerful backtesting and analysis capabilities!

// how to fetch from an external front end

