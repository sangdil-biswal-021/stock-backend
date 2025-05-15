const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
require('dotenv').config();

app.use(cors());
const TWELVE_DATA_KEY = process.env.TWELVE_DATA_KEY;

// Stock Prediction Endpoint (7-day SMA)
app.get('/predict', async (req, res) => {
  const { symbol } = req.query;
  try {
    const response = await axios.get(
      `https://api.twelvedata.com/time_series`, {
        params: {
          symbol: symbol,
          interval: '1day',
          outputsize: 7,
          apikey: TWELVE_DATA_KEY
        }
      });
    
    const closes = response.data.values.map(v => parseFloat(v.close));
    const prediction = (closes.reduce((a,b) => a + b, 0) / closes.length).toFixed(2);
    
    res.json({ 
      symbol,
      prediction,
      last_refreshed: response.data.meta.regular_market_time
    });
    
  } catch (error) {
    res.status(500).json({ error: "Prediction failed" });
  }
});

//history

app.get('/historical', async (req, res) => {
  const { symbol, days = 30 } = req.query;
  try {
    const response = await axios.get('https://api.twelvedata.com/time_series', {
      params: {
        symbol,
        interval: '1day',
        outputsize: days,
        apikey: process.env.TWELVE_DATA_KEY
      }
    });
    res.json(response.data.values); // Array of OHLC objects
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch historical data" });
  }
});




// Currency Conversion
app.get('/convert', async (req, res) => {
  const { from, to, amount } = req.query;
  
  if (!from || !to || !amount || isNaN(amount)) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  try {
    const response = await axios.get(
      `https://api.twelvedata.com/currency_conversion`, {
        params: {
          symbol: `${from}/${to}`,
          amount: amount,
          apikey: TWELVE_DATA_KEY
        }
      });
    
    res.json({
      from: response.data.symbol.split('/')[0],
      to: response.data.symbol.split('/')[1],
      amount: parseFloat(amount),
      rate: parseFloat(response.data.rate),
      converted: parseFloat(response.data.amount),
      // timestamp: response.data.timestamp
    });

  } catch (error) {
    res.status(500).json({ error: "Conversion failed" });
  }
});

//forex pairs
app.get('/available-forex', async (req, res) => {
  try {
    const { currency } = req.query; // e.g., "INR", "USD", "EUR"
    let params = { apikey: process.env.TWELVE_DATA_KEY };

    // If a currency filter is provided, use both base and quote filters
    if (currency) {
      // API only supports filtering by base or quote, not both at once, so fetch both and merge
      const [baseRes, quoteRes] = await Promise.all([
        axios.get('https://api.twelvedata.com/forex_pairs', {
          params: { ...params, currency_base: currency }
        }),
        axios.get('https://api.twelvedata.com/forex_pairs', {
          params: { ...params, currency_quote: currency }
        })
      ]);

      // Merge and deduplicate pairs
      const allPairs = [
        ...(baseRes.data.data || []),
        ...(quoteRes.data.data || [])
      ];
      const uniquePairs = Array.from(
        new Map(allPairs.map(pair => [pair.symbol, pair])).values()
      );
      const symbolsOnly = uniquePairs.map(pair => ({ symbol: pair.symbol }));
      return res.json(symbolsOnly);
    }

    // If no filter, return all pairs
    const response = await axios.get(
      'https://api.twelvedata.com/forex_pairs',
      { params }
    );
    const symbolsOnly = (response.data.data || []).map(pair => ({ symbol: pair.symbol }));
    res.json(symbolsOnly);

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch available forex pairs" });
  }
});


//available stocks
// app.get('/available-stocks', async (req, res) => {
//   try {
//     const { country, exchange } = req.query;
    
//     // Build parameters object
//     const params = { apikey: process.env.TWELVE_DATA_KEY };
//     if (country) params.country = country;
//     if (exchange) params.exchange = exchange;

//     const response = await axios.get(
//       'https://api.twelvedata.com/stocks',
//       { params }
//     );

//     // Return simplified response
//     const stocks = response.data.data.map(stock => ({
//       symbol: stock.symbol,
//       name: stock.name,
//       exchange: stock.exchange,
//       country: stock.country
//     }));

//     res.json(stocks);

//   } catch (error) {
//     res.status(500).json({ 
//       error: "Failed to fetch stocks",
//       details: error.response?.data?.message || error.message 
//     });
//   }
// });

//available stocks - free tier

app.get('/available-stocks', async (req, res) => {
  try {
    const { country, exchange } = req.query;

    // Build parameters object
    const params = { apikey: process.env.TWELVE_DATA_KEY, show_plan: true };
    if (country) params.country = country;
    if (exchange) params.exchange = exchange;

    const response = await axios.get(
      'https://api.twelvedata.com/stocks',
      { params }
    );

    // Filter for Basic plan only and return simplified response
    const stocks = (response.data.data || [])
      .filter(stock => stock.access && stock.access.plan === "Basic")
      .map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        exchange: stock.exchange,
        country: stock.country
      }));

    res.json(stocks);

  } catch (error) {
    res.status(500).json({ 
      error: "Failed to fetch stocks",
      details: error.response?.data?.message || error.message 
    });
  }
});







const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
