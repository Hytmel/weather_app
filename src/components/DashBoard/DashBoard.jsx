import { useState, useEffect } from "react";
import "./DashBoard.css";

const DashBoard = ({ selectedCity }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [otherCitiesData, setOtherCitiesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllCities, setShowAllCities] = useState(false);
  const [userLocationData, setUserLocationData] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState("Your Location");

  const API_KEY = "dddd398c7652c9c3398a81ee2313e509";

  // Weather icon mapping with night/day conditions
  const weatherIconMap = {
    // Clear conditions
    Clear: "☀️",
    "clear sky": "☀️",
    
    // Cloud conditions
    Clouds: "☁️",
    "few clouds": "⛅",
    "scattered clouds": "🌤️",
    "broken clouds": "☁️",
    "overcast clouds": "☁️",
    
    // Rain conditions
    Rain: "🌧️",
    Drizzle: "🌦️",
    "light rain": "🌦️",
    "moderate rain": "🌧️",
    "heavy intensity rain": "🌧️",
    "very heavy rain": "🌧️",
    "extreme rain": "🌧️",
    "shower rain": "🌧️",
    "light intensity shower rain": "🌧️",
    "heavy intensity shower rain": "🌧️",
    "ragged shower rain": "🌧️",
    
    // Storm conditions
    Thunderstorm: "⛈️",
    "thunderstorm with light rain": "⛈️",
    "thunderstorm with rain": "⛈️",
    "thunderstorm with heavy rain": "⛈️",
    "light thunderstorm": "⛈️",
    "thunderstorm with light drizzle": "⛈️",
    "thunderstorm with drizzle": "⛈️",
    "thunderstorm with heavy drizzle": "⛈️",
    "heavy thunderstorm": "⛈️",
    "ragged thunderstorm": "⛈️",
    
    // Snow conditions
    Snow: "❄️",
    "light snow": "🌨️",
    "heavy snow": "❄️",
    "sleet": "🌨️",
    "light shower sleet": "🌨️",
    "shower sleet": "🌨️",
    "light rain and snow": "🌨️",
    "rain and snow": "🌨️",
    "light shower snow": "🌨️",
    "shower snow": "❄️",
    "heavy shower snow": "❄️",
    
    // Atmospheric conditions
    Mist: "🌫️",
    Smoke: "🌫️",
    Haze: "🌫️",
    "sand/ dust whirls": "🌪️",
    Fog: "🌫️",
    Sand: "🌪️",
    Dust: "🌫️",
    "volcanic ash": "🌫️",
    Squall: "⛈️",
    Tornado: "🌪️",
    
    // Default fallback
    default: "☀️"
  };

  // Night icon mapping based on icon codes
  const getNightIcon = (iconCode, description) => {
    if (!iconCode) return "🌙";
    
    // Night icons (when iconCode ends with 'n')
    if (iconCode.endsWith('n')) {
      const baseCode = iconCode.slice(0, -1);
      switch (baseCode) {
        case '01': return "🌙"; // clear sky night
        case '02': return "⭐"; // few clouds night
        case '03': return "☁️"; // scattered clouds night
        case '04': return "☁️"; // broken clouds night
        case '09': return "🌧️"; // shower rain night
        case '10': return "🌧️"; // rain night
        case '11': return "⛈️"; // thunderstorm night
        case '13': return "❄️"; // snow night
        case '50': return "🌫️"; // mist night
        default: return "🌙";
      }
    }
    
    // Day icons - use the regular mapping
    return weatherIconMap[description] || weatherIconMap.default;
  };

  // List of Algerian cities
  const initialCities = ["Algiers", "Oran", "Constantine", "Annaba"];
  const allAlgerianCities = [
    "Algiers", "Oran", "Constantine", "Annaba", "Batna", "Blida", 
    "Setif", "Tlemcen", "Ghardaia", "Mostaganem", "Bejaia", "Tebessa",
    "Tiaret", "El Oued", "Biskra", "Djelfa", "Souk Ahras", "Mascara",
    "Relizane", "Tamanrasset", "Ouargla", "Guelma", "Chlef", "Laghouat",
    "Jijel", "Mila", "Bouira", "Tizi Ouzou", "Tipaza", "Ain Defla",
    "Ain Temouchent", "Adrar", "Bechar", "Bordj Bou Arreridj", "Boumerdes",
    "El Bayadh", "El Tarf", "Illizi", "Khenchela", "M'Sila", "Naama",
    "Oum El Bouaghi", "Saida", "Sidi Bel Abbes", "Skikda", "Tindouf",
    "Tissemsilt", "Tizi Ouzou", "Tlemcen", "Touggourt", "Zeralda"
  ];

  // Show initial 4 cities or all cities based on state
  const citiesToDisplay = showAllCities ? allAlgerianCities : initialCities;

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchInitialWeatherData();
    }
  }, [userLocation]);

  useEffect(() => {
    if (!loading) {
      fetchCitiesData();
    }
  }, [showAllCities, loading]);

  // Handle city switching when user searches
  useEffect(() => {
    if (selectedCity) {
      handleCitySwitch(selectedCity);
    }
  }, [selectedCity]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      // Fallback to Sidi Bel Abbes if geolocation is not supported
      fetchInitialWeatherDataFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lon: longitude });
        
        // Get city name from coordinates
        fetchCityName(latitude, longitude);
      },
      (err) => {
        // Fallback to Sidi Bel Abbes if location access is denied
        console.log("Location access denied, using fallback");
        fetchInitialWeatherDataFallback();
      }
    );
  };

  const fetchCityName = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setLocationName(data[0].name);
        }
      }
    } catch (error) {
      console.error("Error fetching city name:", error);
    }
  };

  const handleCitySwitch = (newCityData) => {
    // Store current weather data as user location data if it's not already stored
    if (weatherData && !userLocationData) {
      setUserLocationData(weatherData);
    }

    // Set the new city as main weather data
    setWeatherData(newCityData);

    // Fetch forecast for the new city
    fetchForecastForCity(newCityData.name);

    // Update other cities list
    updateOtherCitiesList(newCityData);
  };

  const fetchForecastForCity = async (cityName) => {
    try {
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName},DZ&appid=${API_KEY}&units=metric`
      );
      if (forecastResponse.ok) {
        const forecastDataObj = await forecastResponse.json();
        setForecastData(forecastDataObj);
      }
    } catch (error) {
      console.error('Error fetching forecast for new city:', error);
    }
  };

  const updateOtherCitiesList = (newCityData) => {
    setOtherCitiesData(prevCities => {
      // Remove the new city from other cities if it exists
      const filteredCities = prevCities.filter(city => city.name !== newCityData.name);
      
      // Add user location to the list if we have its data and it's not already there
      if (userLocationData && !filteredCities.some(city => city.name === locationName)) {
        return [userLocationData, ...filteredCities];
      }
      
      return filteredCities;
    });
  };

  const fetchInitialWeatherDataFallback = async () => {
    setLoading(true);
    try {
      // Fallback to Sidi Bel Abbes
      const [currentWeatherResponse, forecastResponse] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=Sidi Bel Abbes,DZ&appid=${API_KEY}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?q=Sidi Bel Abbes,DZ&appid=${API_KEY}&units=metric`)
      ]);

      let currentWeatherData = null;
      if (currentWeatherResponse.ok) {
        currentWeatherData = await currentWeatherResponse.json();
        setWeatherData(currentWeatherData);
      } else {
        setWeatherData(null);
      }

      let forecastDataObj = null;
      if (forecastResponse.ok) {
        forecastDataObj = await forecastResponse.json();
        setForecastData(forecastDataObj);
      } else {
        setForecastData(null);
      }

      setLoading(false);
      fetchCitiesData();
    } catch (error) {
      setWeatherData(null);
      setForecastData(null);
      setOtherCitiesData([]);
      setLoading(false);
    }
  };

  const fetchInitialWeatherData = async () => {
    if (!userLocation) return;
    
    setLoading(true);
    try {
      // Fetch all data in parallel for faster loading
      const [currentWeatherResponse, forecastResponse] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${userLocation.lat}&lon=${userLocation.lon}&appid=${API_KEY}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${userLocation.lat}&lon=${userLocation.lon}&appid=${API_KEY}&units=metric`)
      ]);

      // Process current weather data
      let currentWeatherData = null;
      if (currentWeatherResponse.ok) {
        currentWeatherData = await currentWeatherResponse.json();
        setWeatherData(currentWeatherData);
      } else {
        setWeatherData(null);
      }

      // Process forecast data
      let forecastDataObj = null;
      if (forecastResponse.ok) {
        forecastDataObj = await forecastResponse.json();
        setForecastData(forecastDataObj);
      } else {
        setForecastData(null);
      }

      // Set loading to false immediately after main data is loaded
      setLoading(false);

      // Fetch cities data in the background (don't wait for it)
      fetchCitiesData();
    } catch (error) {
      setWeatherData(null);
      setForecastData(null);
      setOtherCitiesData([]);
      setLoading(false);
    }
  };

  const fetchCitiesData = async () => {
    try {
      // Fetch weather for other Algerian cities with timeout for faster loading
      const otherCitiesPromises = citiesToDisplay.map((city) =>
        Promise.race([
          fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city},DZ&appid=${API_KEY}&units=metric`
          )
            .then((response) => (response.ok ? response.json() : null))
            .catch(() => null),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]).catch(() => null)
      );
      const otherCitiesResults = await Promise.all(otherCitiesPromises);
      setOtherCitiesData(otherCitiesResults.filter((data) => data !== null));
    } catch (error) {
      setOtherCitiesData([]);
    }
  };

  const handleSeeMore = () => {
    setShowAllCities(!showAllCities);
  };

  // Helper function to get day name
  const getDayName = (dateString) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const date = new Date(dateString);
    return days[date.getDay()];
  };

  // Get next few days from forecast
  const getUpcomingForecast = () => {
    if (!forecastData) {
      return [null, null];
    }

    const today = new Date().getDate();
    const upcomingDays = [];
    const usedDates = new Set(); // Track which dates we've already used

    // Group forecast data by date and get the noon forecast for each day
    const dailyForecasts = {};
    
    forecastData.list.forEach((forecast) => {
      const forecastDate = new Date(forecast.dt * 1000);
      const forecastDay = forecastDate.getDate();
      const forecastHour = forecastDate.getHours();
      
      // Skip today's data
      if (forecastDay === today) return;
      
      // If we haven't seen this date yet, or if this is closer to noon (12:00)
      if (!dailyForecasts[forecastDay] || Math.abs(forecastHour - 12) < Math.abs(dailyForecasts[forecastDay].hour - 12)) {
        dailyForecasts[forecastDay] = {
          ...forecast,
          hour: forecastHour
        };
      }
    });

    // Convert to array and sort by date
    const sortedDays = Object.values(dailyForecasts)
      .sort((a, b) => new Date(a.dt * 1000) - new Date(b.dt * 1000))
      .slice(0, 2);

    return sortedDays.length < 2
      ? [...sortedDays, null, null].slice(0, 2)
      : sortedDays;
  };

  const upcomingForecast = getUpcomingForecast();

  // Helper function to render weather icon as emoji with different sizes
  const renderWeatherIcon = (weatherData, isMainIcon = false) => {
    if (!weatherData || !weatherData.weather || !weatherData.weather[0]) {
      const defaultSize = isMainIcon ? '72px' : '48px';
      return (
        <span 
          className="weather-icon" 
          style={{ 
            fontSize: defaultSize, 
            display: 'inline-block', 
            width: defaultSize, 
            height: defaultSize, 
            lineHeight: defaultSize,
            textAlign: 'center'
          }}
        >
          ☀️
        </span>
      );
    }

    const iconCode = weatherData.weather[0].icon;
    const description = weatherData.weather[0].description.toLowerCase();
    const mainCondition = weatherData.weather[0].main;
    
    // Get appropriate icon (day/night aware)
    const emoji = getNightIcon(iconCode, description) || weatherIconMap[mainCondition] || weatherIconMap[description] || weatherIconMap.default;

    // Make main icon larger
    const iconSize = isMainIcon ? '72px' : '48px';

    return (
      <span 
        className="weather-icon" 
        style={{ 
          fontSize: iconSize, 
          display: 'inline-block', 
          width: iconSize, 
          height: iconSize, 
          lineHeight: iconSize,
          textAlign: 'center'
        }}
        title={weatherData.weather[0].description}
      >
        {emoji}
      </span>
    );
  };

  // Highlight icons mapping
  const highlightIcons = {
    feelsLike: "🌡️",
    cloud: "☁️",
    rain: "🌧️",
    humidity: "💧",
    pressure: "📊",
    wind: "💨"
  };

  if (loading) {
    return (
      <section className="dashboard-section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{
            width: '3rem',
            height: '3rem',
            border: '4px solid #e3e3e3',
            borderTop: '4px solid #409ac7',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <div style={{ color: '#409ac7', fontWeight: 500, fontSize: '1.1rem' }}>Loading weather data...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-section">
      <div className="home">
        <div className="feed-1">
          <div className="feeds">
            {renderWeatherIcon(weatherData, true)}
            <div>
              <div>
                <span>
                  {weatherData
                    ? `${weatherData.name}, ${weatherData.sys?.country || 'Algeria'}`
                    : `${locationName}, Algeria`}
                </span>
                <span>
                  {weatherData
                    ? weatherData.weather[0].description
                    : "Partly Cloud"}
                </span>
              </div>
              <div>
                <span>
                  {weatherData ? Math.round(weatherData.main.temp) : "28"}{" "}
                  <sup>o</sup>
                </span>
              </div>
            </div>
          </div>
          <div className="feed">
            <div>
              <div>
                {upcomingForecast[0] ? renderWeatherIcon(upcomingForecast[0]) : null}
                <span>
                  {upcomingForecast[0]
                    ? Math.round(upcomingForecast[0].main.temp)
                    : "14"} <sup>o</sup>
                </span>
              </div>
              <div>
                <span>
                  {upcomingForecast[0]
                    ? getDayName(upcomingForecast[0].dt_txt)
                    : "????"}
                </span>
                <span>
                  {upcomingForecast[0]
                    ? upcomingForecast[0].weather[0].main
                    : "Sun"}
                </span>
              </div>
            </div>
            <div>
              <div>
                {upcomingForecast[1] ? renderWeatherIcon(upcomingForecast[1]) : null}
                <span>
                  {upcomingForecast[1]
                    ? Math.round(upcomingForecast[1].main.temp)
                    : "16"} <sup>o</sup>
                </span>
              </div>
              <div>
                <span>
                  {upcomingForecast[1]
                    ? getDayName(upcomingForecast[1].dt_txt)
                    : "?????"}
                </span>
                <span>
                  {upcomingForecast[1]
                    ? upcomingForecast[1].weather[0].main
                    : "Wind"}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="highlights">
          <h2>Today's Highlights</h2>
          <div className="all-highlights">
            <div>
              <div>
                <span className="highlight-icon">{highlightIcons.feelsLike}</span>
                <div>
                  <span>Feel Like</span>
                  <span>Normal</span>
                </div>
              </div>
              <div>
                <span>
                  {weatherData ? Math.round(weatherData.main.feels_like) : "7"} <sup>o</sup>
                </span>
              </div>
            </div>
            <div>
              <div>
                <span className="highlight-icon">{highlightIcons.cloud}</span>
                <div>
                  <span>Cloud</span>
                  <span>
                    {weatherData
                      ? weatherData.clouds.all > 50
                        ? "Heavy"
                        : "Normal"
                      : "Heavy"}
                  </span>
                </div>
              </div>
              <div>
                <span>
                  {weatherData ? weatherData.clouds.all : "18"} <sup>%</sup>
                </span>
              </div>
            </div>
            <div>
              <div>
                <span className="highlight-icon">{highlightIcons.rain}</span>
                <div>
                  <span>Rain</span>
                  <span>
                    {weatherData && weatherData.rain ? "Heavy" : "Normal"}
                  </span>
                </div>
              </div>
              <div>
                <span>
                  {weatherData && weatherData.rain
                    ? Math.round(weatherData.rain["1h"] || 0)
                    : "0"} <sup>mm</sup>
                </span>
              </div>
            </div>
            <div>
              <div>
                <span className="highlight-icon">{highlightIcons.humidity}</span>
                <div>
                  <span>Humidity</span>
                  <span>
                    {weatherData
                      ? weatherData.main.humidity > 60
                        ? "Heavy"
                        : "Normal"
                      : "Heavy"}
                  </span>
                </div>
              </div>
              <div>
                <span>
                  {weatherData ? weatherData.main.humidity : "65"} <sup>%</sup>
                </span>
              </div>
            </div>
            <div>
              <div>
                <span className="highlight-icon">{highlightIcons.pressure}</span>
                <div>
                  <span>Pressure</span>
                  <span>
                    {weatherData
                      ? weatherData.main.pressure > 1013
                        ? "High"
                        : "Normal"
                      : "Heavy"}
                  </span>
                </div>
              </div>
              <div>
                <span>
                  {weatherData ? weatherData.main.pressure : "1013"} <sup>hPa</sup>
                </span>
              </div>
            </div>
            <div>
              <div>
                <span className="highlight-icon">{highlightIcons.wind}</span>
                <div>
                  <span>Wind</span>
                  <span>
                    {weatherData
                      ? weatherData.wind.speed > 5
                        ? "Strong"
                        : "Normal"
                      : "Normal"}
                  </span>
                </div>
              </div>
              <div>
                <span>
                  {weatherData
                    ? Math.round(weatherData.wind.speed * 3.6)
                    : "26"} <sup>km/h</sup>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="cities">
        <h2>Other Cities</h2>
        <div className={`all-cities ${showAllCities ? 'scrollable' : ''}`}>
          {otherCitiesData.map((cityData, idx) => (
            <div key={cityData.id || idx}>
              <div>
                {renderWeatherIcon(cityData)}
                <div>
                  <span>{cityData ? cityData.name : "-"}</span>
                  <span>
                    {cityData
                      ? `${cityData.weather[0].description}. High: ${Math.round(
                          cityData.main.temp_max
                        )}° Low: ${Math.round(cityData.main.temp_min)}°`
                      : "-"}
                  </span>
                </div>
              </div>
              <div>
                <span>
                  {cityData ? Math.round(cityData.main.temp) : "-"} <sup>o</sup>
                </span>
              </div>
            </div>
          ))}
          <button onClick={handleSeeMore}>
            <span>{showAllCities ? "See Less" : "See More"}</span>
            <ion-icon name={showAllCities ? "arrow-up-outline" : "arrow-forward-outline"}></ion-icon>
          </button>
        </div>
      </div>
    </section>
  );
};

export default DashBoard;