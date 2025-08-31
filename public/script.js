// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const weatherResult = document.getElementById('weatherResult');
const searchHistory = document.getElementById('searchHistory');

// Weather display elements
const weatherIcon = document.getElementById('weatherIcon');
const cityName = document.getElementById('cityName');
const temperature = document.getElementById('temperature');
const description = document.getElementById('description');
const humidity = document.getElementById('humidity');
const pressure = document.getElementById('pressure');
const windSpeed = document.getElementById('windSpeed');

// Event listeners
searchBtn.addEventListener('click', searchWeather);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchWeather();
    }
});

// Functions
async function searchWeather() {
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }

    showLoading();
    hideError();
    hideWeatherResult();

    try {
        console.log('Searching for city:', city); // Debug log
        
        // Updated to match your working backend route
        const response = await fetch(`/api/weather/search?city=${encodeURIComponent(city)}`);
        
        console.log('Response status:', response.status); // Debug log
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API Result:', result); // Debug log

        hideLoading();

        if (result.success) {
            displayWeather(result.data);
            loadSearchHistory();
        } else {
            showError(result.error || 'Failed to fetch weather data');
        }
    } catch (err) {
        hideLoading();
        console.error('Fetch Error:', err); // Debug log
        showError(`Network error: ${err.message}`);
    }
}

function displayWeather(data) {
    cityName.textContent = `${data.city}, ${data.country}`;
    temperature.textContent = `${data.temperature}°C`;
    description.textContent = data.description.charAt(0).toUpperCase() + data.description.slice(1);
    humidity.textContent = `${data.humidity}%`;
    pressure.textContent = `${data.pressure} hPa`;
    windSpeed.textContent = `${data.windSpeed} m/s`;
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
    weatherIcon.alt = data.description;

    showWeatherResult();
    cityInput.value = '';
}

async function loadSearchHistory() {
    try {
        console.log('Loading search history...'); // Debug log
        
        const response = await fetch('/api/weather/history');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('History Result:', result); // Debug log

        if (result.success) {
            displaySearchHistory(result.data);
        }
    } catch (err) {
        console.error('Failed to load search history:', err);
    }
}

function displaySearchHistory(history) {
    searchHistory.innerHTML = '';

    if (history.length === 0) {
        searchHistory.innerHTML = '<p>No recent searches</p>';
        return;
    }

    history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div>
                <div class="city">${item.city}, ${item.country}</div>
                <div class="date">${new Date(item.searchDate).toLocaleString()}</div>
            </div>
            <div class="temp">${item.temperature}°C</div>
        `;
        
        historyItem.addEventListener('click', () => {
            cityInput.value = item.city;
            searchWeather();
        });
        
        searchHistory.appendChild(historyItem);
    });
}

// Utility functions
function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showError(message) {
    error.textContent = message;
    error.classList.remove('hidden');
}

function hideError() {
    error.classList.add('hidden');
}

function showWeatherResult() {
    weatherResult.classList.remove('hidden');
}

function hideWeatherResult() {
    weatherResult.classList.add('hidden');
}

// Load search history on page load
document.addEventListener('DOMContentLoaded', loadSearchHistory);