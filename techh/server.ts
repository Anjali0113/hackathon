import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Geocoding Proxy
  app.get("/api/geocode", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) return res.status(400).json({ error: "Query required" });
      
      const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: {
          format: "json",
          q,
          countrycodes: "in",
          limit: 5
        },
        headers: {
          'User-Agent': 'SmartSafeRouteFinder/1.0'
        }
      });
      res.json(response.data);
    } catch (error) {
      console.error("Geocode error:", error);
      res.status(500).json({ error: "Failed to fetch location" });
    }
  });

  // Routing Proxy with Safety Scoring and Traffic Prediction
  app.get("/api/route", async (req, res) => {
    try {
      const { start, end, mode = "safest" } = req.query;
      if (!start || !end) return res.status(400).json({ error: "Start and end coordinates required" });

      // Parse mode, departure time, mood, persona, fatigue
      const [prefMode, departureStr, moodStr, personaStr, fatigueStr] = (mode as string).split('|');
      const departureTime = departureStr || "10:00";
      const travelMood = (moodStr || "day") as "day" | "night";
      const persona = personaStr || "office";
      const fatigueHours = parseInt(fatigueStr || "5");
      const [depHour, depMin] = departureTime.split(':').map(Number);

      // OSRM expects coordinates as lon,lat;lon,lat
      const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson&steps=true`;
      const response = await axios.get(osrmUrl);
      
      if (response.data.code !== "Ok") {
        return res.status(400).json({ error: "Could not find route" });
      }

      const route = response.data.routes[0];
      const geometry = route.geometry;
      const steps = route.legs[0].steps;

      // Traffic Simulation Logic (India Focus)
      let trafficFactor = 1.0;
      let trafficIntensity = "Low";
      
      if ((depHour >= 8 && depHour <= 10) || (depHour >= 17 && depHour <= 20)) {
        trafficFactor = 1.8 + Math.random() * 0.5;
        trafficIntensity = "Heavy";
      } else if ((depHour >= 11 && depHour <= 16) || (depHour >= 21 && depHour <= 22)) {
        trafficFactor = 1.3 + Math.random() * 0.2;
        trafficIntensity = "Moderate";
      } else {
        trafficFactor = 1.0 + Math.random() * 0.1;
        trafficIntensity = "Low";
      }

      // Persona Weighting
      if (persona === "delivery") trafficFactor *= 0.9; // Delivery riders take shortcuts
      if (persona === "senior") trafficFactor *= 1.2; // Seniors drive more cautiously

      const adjustedDuration = route.duration * trafficFactor;
      
      // Multi-modal Stitching (Simulated for demo)
      const multiModal = [
        { mode: "Walk", duration: 300, distance: 400, instruction: "Walk to nearest Metro station" },
        { mode: "Metro", duration: 900, distance: 5000, instruction: "Take Purple Line (4 stops)" },
        { mode: "Auto", duration: 600, distance: 2000, instruction: "Last mile via Auto-rickshaw" }
      ];
      const multiModalTotalTime = multiModal.reduce((acc, m) => acc + m.duration, 0);

      // Carbon Footprint (kg CO2 per km)
      const carCO2 = (route.distance / 1000) * 0.12;
      const metroCO2 = (route.distance / 1000) * 0.015;
      const carbonSaved = carCO2 - metroCO2;

      // Fatigue Nudge
      let fatigueNudge = "";
      if (fatigueHours > 15) {
        fatigueNudge = `⚠️ You've already lost ${fatigueHours} hrs to traffic this week. Take the Metro today to save 20 mins and reduce stress.`;
      } else if (fatigueHours > 10) {
        fatigueNudge = "💡 High commute fatigue detected. Consider a multi-modal route for a more relaxed journey.";
      }

      // Delay Ripple Alert (Predictive)
      const rippleAlerts = [];
      if (trafficIntensity === "Heavy") {
        rippleAlerts.push("🔮 Predictive Alert: Silk Board congestion will ripple to HSR Layout in 12 mins.");
        rippleAlerts.push("🔮 Predictive Alert: Secondary arterial roads expected to spike by 15% in 10 mins.");
      }

      // Calculate Arrival Time
      const arrivalDate = new Date();
      arrivalDate.setHours(depHour, depMin, 0);
      arrivalDate.setSeconds(arrivalDate.getSeconds() + adjustedDuration);
      const arrivalTimeStr = arrivalDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

      // Calculate Safety Score
      let totalSafetyScore = 0;
      const safetySegments = steps.map((step: any) => {
        const name = step.name || "Unnamed Road";
        const distance = step.distance;
        
        const isMainRoad = name.toLowerCase().includes("highway") || 
                          name.toLowerCase().includes("expressway") || 
                          name.toLowerCase().includes("road") ||
                          step.distance > 500;
        
        let lightingScore = isMainRoad ? 8 + Math.random() * 2 : 4 + Math.random() * 4;
        if (travelMood === "night" && !isMainRoad) lightingScore -= 2;
        
        let crowdScore = 5;
        if (trafficIntensity === "Heavy") crowdScore = 9;
        else if (trafficIntensity === "Moderate") crowdScore = 7;
        else if (travelMood === "night" || depHour >= 23 || depHour <= 5) crowdScore = 3;
        else crowdScore = 6;

        // Persona Safety Weights
        if (persona === "senior") crowdScore += 1; // Seniors prefer more crowded/visible areas
        if (persona === "parent") lightingScore += 1; // Parents prioritize lighting

        const crimeRisk = isMainRoad ? 3 : 5;
        const lowCrimeScore = 10 - crimeRisk;

        const segmentScore = (0.5 * lowCrimeScore) + (0.3 * lightingScore) + (0.2 * crowdScore);
        
        const alerts = [];
        if (lightingScore < 5) alerts.push("⚠️ Low lighting area ahead");
        if (crowdScore < 4) alerts.push("⚠️ Less crowded zone detected");
        if (trafficIntensity === "Heavy") alerts.push("🚦 Heavy traffic congestion expected");

        return {
          name,
          distance,
          score: segmentScore,
          alerts,
          coordinates: step.geometry.coordinates
        };
      });

      totalSafetyScore = safetySegments.reduce((acc: number, seg: any) => acc + seg.score, 0) / safetySegments.length;

      res.json({
        distance: route.distance,
        duration: adjustedDuration,
        originalDuration: route.duration,
        trafficIntensity,
        trafficFactor: trafficFactor.toFixed(2),
        departureTime,
        arrivalTime: arrivalTimeStr,
        geometry,
        safetyScore: totalSafetyScore.toFixed(1),
        segments: safetySegments,
        alerts: [...safetySegments.flatMap((s: any) => s.alerts), ...rippleAlerts].filter((v: any, i: any, a: any) => a.indexOf(v) === i),
        multiModal,
        multiModalTotalTime,
        carCO2: carCO2.toFixed(2),
        metroCO2: metroCO2.toFixed(2),
        carbonSaved: carbonSaved.toFixed(2),
        fatigueNudge,
        persona
      });

    } catch (error) {
      console.error("Route error:", error);
      res.status(500).json({ error: "Failed to fetch route" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
