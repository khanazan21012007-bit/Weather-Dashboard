const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const geoBtn = document.getElementById("geoBtn");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const errorBox = document.getElementById("errorBox");
const loadingBox = document.getElementById("loadingBox");
const weatherContent = document.getElementById("weatherContent");
const recentContainer = document.getElementById("recentContainer");
const recentChips = document.getElementById("recentChips");
const cityName = document.getElementById("cityName");
const countryName = document.getElementById("countryName");
const tempValue = document.getElementById("tempValue");
const weatherIcon = document.getElementById("weatherIcon");
const conditionText = document.getElementById("conditionText");
const humidityValue = document.getElementById("humidityValue");
const windValue = document.getElementById("windValue");

let recentSearches =
  JSON.parse(localStorage.getItem("aura_weather_recent")) || [];

function getWeatherDetails(code) {
  const map = {
    0: { text: "Clear Sky", icon: "wb_sunny" },
    1: { text: "Mainly Clear", icon: "wb_sunny" },
    2: { text: "Partly Cloudy", icon: "partly_cloudy_day" },
    3: { text: "Overcast", icon: "cloud" },
    45: { text: "Foggy", icon: "blur_on" },
    51: { text: "Light Drizzle", icon: "grain" },
    61: { text: "Rain Showers", icon: "umbrella" },
    71: { text: "Snowfall", icon: "ac_unit" },
    95: { text: "Thunderstorm", icon: "flash_on" },
  };
  return map[code] || { text: "Fair Weather", icon: "thermostat" };
}

themeToggle.addEventListener("click", () => {
  const currentTheme = document.body.getAttribute("data-theme");
  if (currentTheme === "dark") {
    document.body.setAttribute("data-theme", "light");
    themeIcon.textContent = "dark_mode";
  } else {
    document.body.setAttribute("data-theme", "dark");
    themeIcon.textContent = "light_mode";
  }
});

function showLoading() {
  loadingBox.style.display = "block";
  weatherContent.style.display = "none";
  errorBox.style.display = "none";
}

function hideLoading() {
  loadingBox.style.display = "none";
  weatherContent.style.display = "block";
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.style.display = "block";
  loadingBox.style.display = "none";
  weatherContent.style.display = "none";
}

function saveRecent(city) {
  if (!recentSearches.includes(city)) {
    recentSearches.unshift(city);
    if (recentSearches.length > 3) recentSearches.pop();
    localStorage.setItem("aura_weather_recent", JSON.stringify(recentSearches));
  }
  renderRecent();
}

function renderRecent() {
  if (recentSearches.length > 0) {
    recentContainer.style.display = "flex";
    recentChips.innerHTML = "";
    recentSearches.forEach((city) => {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.textContent = city;
      chip.addEventListener("click", () => fetchWeather(city));
      recentChips.appendChild(chip);
    });
  } else {
    recentContainer.style.display = "none";
  }
}

async function fetchWeather(cityNameQuery) {
  const query = cityNameQuery.trim();
  if (!query) return;

  showLoading();
  errorBox.style.display = "none";

  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        query
      )}&count=1`
    );
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found. Please check spelling.");
    }

    const { name, country, latitude, longitude } = geoData.results[0];

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
    );
    if (!weatherRes.ok) throw new Error("Could not fetch weather metrics.");

    const weatherData = await weatherRes.json();
    const condition = getWeatherDetails(weatherData.current.weather_code);

    cityName.textContent = name;
    countryName.textContent = country || "Region";
    tempValue.textContent = `${Math.round(
      weatherData.current.temperature_2m
    )}°C`;
    weatherIcon.innerHTML = `<span class="material-icons-round" style="font-size: 30px; color: var(--text-color);">${condition.icon}</span>`;
    conditionText.textContent = condition.text;
    humidityValue.textContent = `${weatherData.current.relative_humidity_2m}%`;
    windValue.textContent = `${weatherData.current.wind_speed_10m} km/h`;

    saveRecent(name);
    hideLoading();
  } catch (err) {
    showError(err.message);
  }
}

async function fetchByCoords(lat, lon) {
  showLoading();
  try {
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
    );
    if (!weatherRes.ok) throw new Error("Failed to fetch location weather.");

    const weatherData = await weatherRes.json();
    const condition = getWeatherDetails(weatherData.current.weather_code);

    cityName.textContent = "Current Location";
    countryName.textContent = `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`;
    tempValue.textContent = `${Math.round(
      weatherData.current.temperature_2m
    )}°C`;
    weatherIcon.innerHTML = `<span class="material-icons-round" style="font-size: 30px; color: var(--text-color);">${condition.icon}</span>`;
    conditionText.textContent = condition.text;
    humidityValue.textContent = `${weatherData.current.relative_humidity_2m}%`;
    windValue.textContent = `${weatherData.current.wind_speed_10m} km/h`;

    hideLoading();
  } catch (err) {
    showError(err.message);
  }
}

searchBtn.addEventListener("click", () => fetchWeather(cityInput.value));
cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") fetchWeather(cityInput.value);
});

geoBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchByCoords(pos.coords.latitude, pos.coords.longitude),
      () => showError("Location access denied by user.")
    );
  } else {
    showError("Geolocation is not supported by your browser.");
  }
});
renderRecent();
fetchWeather("London");
