const axios = require("axios");
const { client: redis } = require("../config/redis");

const API_KEY = process.env.GOOGLE_API_KEY;

const axiosInstance = axios.create({
  timeout: 10000,
});

// ---------------- GET COORDINATES ----------------
async function getCoordinates(place) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(place)}&key=${API_KEY}`;

  const response = await axiosInstance.get(url);

  if (response.data.status !== "OK") {
    throw new Error("Geocoding failed");
  }

  const { lat, lng } = response.data.results[0].geometry.location;
  return `${lat},${lng}`;
}

// ---------------- NEARBY SEARCH ----------------
async function searchPlaces(coords, businessType) {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coords}&radius=5000&keyword=${encodeURIComponent(businessType)}&key=${API_KEY}`;

  const response = await axiosInstance.get(url);

  if (response.data.status !== "OK") {
    throw new Error("Nearby search failed");
  }

  return response.data.results;
}

// ---------------- GET DETAILS ----------------
async function getDetails(placeId) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,formatted_address,website,rating,user_ratings_total&key=${API_KEY}`;

  const response = await axiosInstance.get(url);

  if (response.data.status !== "OK") return null;

  return response.data.result;
}

// ---------------- MAIN SERVICE FUNCTION ----------------
exports.generateLeads = async (location, businessType, count) => {
  try {
    // 🔥 Protect Google cost
    if (count > 50) {
      throw new Error("Maximum 50 leads allowed");
    }

    const cacheKey = `${location}-${businessType}-${count}`;

    // ✅ CHECK CACHE FIRST
   let cached = null;

if (process.env.REDIS_URL) {
  cached = await redis.get(cacheKey);
}
    if (cached) {
      console.log("Serving from cache");
      return JSON.parse(cached);
    }

    // 🔥 Only call Google if cache empty
    const coords = await getCoordinates(location);
    const places = await searchPlaces(coords, businessType);

    const finalData = [];
    const seen = new Set();

    for (let place of places) {
      if (finalData.length >= count) break;

      if (seen.has(place.place_id)) continue;
      seen.add(place.place_id);

      try {
        const details = await getDetails(place.place_id);
        if (!details) continue;

        // if (details.website) continue;

        finalData.push({
          name: details.name || "",
          phone: details.formatted_phone_number || "",
          address: details.formatted_address || "",
          rating: details.rating || 0,
          reviews: details.user_ratings_total || 0
        });

        await new Promise(r => setTimeout(r, 200));

      } catch (err) {
        continue;
      }
    }

    // ✅ SAVE TO CACHE (30 mins)
   if (process.env.REDIS_URL) {
  await redis.setEx(cacheKey, 1800, JSON.stringify(finalData));
}

    return finalData;

  } catch (error) {
    throw new Error(error.message);
  }
};