const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

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

module.exports = app;
