const express = require('express');
const axios = require('axios');
const Weather = require('../models/Weather');

const router = express.Router();

// Test route - keep this for debugging
router.get('/test', (req, res) => {
  res.json({ message: 'Weather routes working!' });
});

// Get search history
router.get('/history', async (req, res) => {
  try {
    const history = await Weather.find()
      .sort({ searchDate: -1 })
      .limit(10);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Database Error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch search history' 
    });
  }
});

// Get weather data for a city
router.get('/search', async (req, res) => {
  try {
    const { city } = req.query;
    const apiKey = process.env.WEATHER_API_KEY;
    
    console.log('Searching for city:', city); // Debug log
    console.log('API Key present:', !!apiKey); // Debug log
    
    if (!city || city.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'City parameter is required' 
      });
    }
    
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'Weather API key not configured' 
      });
    }

    // Call OpenWeatherMap API
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city.trim())}&appid=${apiKey}&units=metric`;
    console.log('Calling API URL:', apiUrl.replace(apiKey, 'HIDDEN_KEY')); // Debug log
    
    const response = await axios.get(apiUrl);
    const weatherData = response.data;
    
    console.log('Weather API response received'); // Debug log

    // Create weather object for database
    const weather = new Weather({
      city: weatherData.name,
      country: weatherData.sys.country,
      temperature: Math.round(weatherData.main.temp),
      description: weatherData.weather[0].description,
      humidity: weatherData.main.humidity,
      pressure: weatherData.main.pressure,
      windSpeed: weatherData.wind?.speed || 0,
      icon: weatherData.weather[0].icon
    });

    // Save to database
    await weather.save();
    console.log('Weather data saved to database'); // Debug log

    // Return weather data
    res.json({
      success: true,
      data: {
        city: weather.city,
        country: weather.country,
        temperature: weather.temperature,
        description: weather.description,
        humidity: weather.humidity,
        pressure: weather.pressure,
        windSpeed: weather.windSpeed,
        icon: weather.icon,
        searchDate: weather.searchDate
      }
    });

  } catch (error) {
    console.error('Weather Search Error:', error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        success: false, 
        error: 'City not found' 
      });
    }
    
    if (error.response?.status === 401) {
      return res.status(500).json({ 
        success: false, 
        error: 'Invalid API key' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch weather data' 
    });
  }
});

module.exports = router;