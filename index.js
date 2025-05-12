const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
require('dotenv').config();


app.use(cors());

// Simple prediction endpoint
app.get('/predict', async (req, res) => {
  const { symbol } = req.query;
  try {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${process.env.ALPHA_KEY}`
    );
    const prices = Object.values(response.data['Time Series (Daily)'])
                      .slice(0, 7)
                      .map(entry => parseFloat(entry['4. close']));
    const prediction = (prices.reduce((a,b) => a + b, 0) / prices.length).toFixed(2);
    res.json({ symbol, prediction });
  } catch (error) {
    res.status(500).json({ error: "Prediction failed" });
  }
});


//financial details endpoint
app.get('/fundamentals', async (req, res) => {
  const { symbol } = req.query;
  try {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${process.env.ALPHA_KEY}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch fundamentals" });
  }
});


// Exchange rates endpoint
app.get('/forex', async (req, res) => {
  const { from_currency, to_currency } = req.query;
  try {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from_currency}&to_currency=${to_currency}&apikey=${process.env.ALPHA_KEY}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch exchange rate" });
  }
});


//sector performance endpoint
app.get('/sector', async (req, res) => {
  try {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=SECTOR&apikey=${process.env.ALPHA_KEY}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sector performance" });
  }
});

// News endpoint
app.get('/news', async (req, res) => {
  const { symbol } = req.query;
  try {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${process.env.ALPHA_KEY}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch news" });
  }
});



// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
