const OPEN_METEO_URL =
  "https://api.open-meteo.com/v1/forecast";

function number(value, fallback = 0) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function weatherCodeToText(code) {
  const map = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",

    45: "Fog",
    48: "Depositing rime fog",

    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",

    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",

    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",

    80: "Rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",

    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Thunderstorm with heavy hail",
  };

  return map[code] || "Unknown conditions";
}

function weatherCodeToIcon(code) {
  if (code === 0) {
    return "01d";
  }

  if ([1, 2].includes(code)) {
    return "02d";
  }

  if (code === 3) {
    return "04d";
  }

  if ([45, 48].includes(code)) {
    return "50d";
  }

  if ([51, 53, 55].includes(code)) {
    return "09d";
  }

  if (
    [61, 63, 65, 80, 81, 82].includes(code)
  ) {
    return "10d";
  }

  if ([95, 96, 99].includes(code)) {
    return "11d";
  }

  return "03d";
}

async function fetchOpenMeteo(
  latitude,
  longitude
) {
  const url = new URL(
    OPEN_METEO_URL
  );

  url.searchParams.set(
    "latitude",
    latitude
  );

  url.searchParams.set(
    "longitude",
    longitude
  );

  url.searchParams.set(
    "timezone",
    "auto"
  );

  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "precipitation",
      "rain",
      "showers",
      "weather_code",
      "cloud_cover",
      "surface_pressure",
      "wind_speed_10m",
      "wind_direction_10m",
    ].join(",")
  );

  url.searchParams.set(
    "hourly",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation_probability",
      "precipitation",
      "rain",
      "showers",
      "weather_code",
      "cloud_cover",
      "wind_speed_10m",
      "wind_direction_10m",
    ].join(",")
  );

  url.searchParams.set(
    "forecast_days",
    "7"
  );

  const response = await fetch(
    url.toString()
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      `Open-Meteo HTTP ${response.status}: ${errorText}`
    );
  }

  return response.json();
}

async function getCurrentWeather(
  latitude,
  longitude
) {
  const data =
    await fetchOpenMeteo(
      latitude,
      longitude
    );

  const current =
    data.current || {};

  const weatherCode =
    number(
      current.weather_code,
      0
    );

  return {
    success: true,

    latitude,
    longitude,

    temperature:
      number(
        current.temperature_2m
      ),

    feelsLike:
      number(
        current.apparent_temperature
      ),

    humidity:
      number(
        current.relative_humidity_2m
      ),

    pressure:
      number(
        current.surface_pressure
      ),

    windSpeed:
      number(
        current.wind_speed_10m
      ),

    windDirection:
      number(
        current.wind_direction_10m
      ),

    clouds:
      number(
        current.cloud_cover
      ),

    precipitation:
      number(
        current.precipitation
      ),

    rain:
      number(
        current.rain
      ),

    showers:
      number(
        current.showers
      ),

    weatherCode,

    weather:
      weatherCodeToText(
        weatherCode
      ),

    description:
      weatherCodeToText(
        weatherCode
      ),

    icon:
      weatherCodeToIcon(
        weatherCode
      ),

    source: "Open-Meteo",

    timestamp:
      current.time ||
      new Date().toISOString(),

    timezone:
      data.timezone,
  };
}

async function getForecast(
  latitude,
  longitude
) {
  const data =
    await fetchOpenMeteo(
      latitude,
      longitude
    );

  const hourly =
    data.hourly || {};

  const times =
    hourly.time || [];

  const temperatures =
    hourly.temperature_2m || [];

  const humidity =
    hourly.relative_humidity_2m || [];

  const rainProbability =
    hourly.precipitation_probability ||
    [];

  const precipitation =
    hourly.precipitation || [];

  const rain =
    hourly.rain || [];

  const showers =
    hourly.showers || [];

  const weatherCodes =
    hourly.weather_code || [];

  const cloudCover =
    hourly.cloud_cover || [];

  const windSpeed =
    hourly.wind_speed_10m || [];

  const windDirection =
    hourly.wind_direction_10m || [];

  const forecast =
    times.map(
      (time, index) => ({
        time,

        temperature:
          number(
            temperatures[index]
          ),

        humidity:
          number(
            humidity[index]
          ),

        rainProbability:
          number(
            rainProbability[index]
          ),

        precipitation:
          number(
            precipitation[index]
          ),

        rain:
          number(
            rain[index]
          ),

        showers:
          number(
            showers[index]
          ),

        weatherCode:
          number(
            weatherCodes[index]
          ),

        weather:
          weatherCodeToText(
            number(
              weatherCodes[index]
            )
          ),

        cloudCover:
          number(
            cloudCover[index]
          ),

        windSpeed:
          number(
            windSpeed[index]
          ),

        windDirection:
          number(
            windDirection[index]
          ),
      })
    );

  return {
    success: true,

    latitude,
    longitude,

    timezone:
      data.timezone,

    forecast,

    source:
      "Open-Meteo",

    updatedAt:
      new Date().toISOString(),
  };
}

function calculateRainProbability(
  forecast = []
) {
  if (
    !Array.isArray(forecast) ||
    forecast.length === 0
  ) {
    return 0;
  }

  const values =
    forecast
      .map(
        (item) =>
          Number(
            item?.rainProbability
          )
      )
      .filter(
        Number.isFinite
      );

  if (values.length === 0) {
    return 0;
  }

  return Math.round(
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / values.length
  );
}

module.exports = {
  getCurrentWeather,
  getForecast,
  calculateRainProbability,
};