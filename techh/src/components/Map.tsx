import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, LayersControl, Circle } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
import { cn } from "@/src/lib/utils";

// Force L to be global for leaflet plugins
if (typeof window !== 'undefined') {
  (window as any).L = L;
}
import "leaflet.heat";

// Fix Leaflet icon issue
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  start?: [number, number];
  end?: [number, number];
  route?: any;
  mood?: "day" | "night";
}

function HeatmapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();

  useEffect(() => {
    try {
      // @ts-ignore
      const heat = L.heatLayer(points, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
      }).addTo(map);

      return () => {
        map.removeLayer(heat);
      };
    } catch (error) {
      console.error("Heatmap error:", error);
    }
  }, [map, points]);

  return null;
}

function MapController({ start, end, route }: MapProps) {
  const map = useMap();

  useEffect(() => {
    if (route?.geometry?.coordinates?.length > 0) {
      const bounds = L.geoJSON(route.geometry).getBounds();
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (start && end) {
      const bounds = L.latLngBounds([start, end]);
      map.fitBounds(bounds, { padding: [100, 100] });
    }
  }, [route, start, end, map]);

  return null;
}

export default function Map({ start, end, route, mood = "day" }: MapProps) {
  const defaultCenter: [number, number] = [12.9716, 77.5946]; // Bangalore
  const defaultZoom = 12;

  const [hotspots, setHotspots] = useState<[number, number, number][]>([]);

  useEffect(() => {
    // Simulate live congestion pulse every 30 seconds
    const generateHotspots = () => {
      const centers = [
        [12.9279, 77.6271], // Koramangala
        [12.9172, 77.6228], // Silk Board
        [12.9784, 77.6408], // Indiranagar
        [12.9591, 77.6407], // Domlur
        [12.9081, 77.6476], // HSR Layout
      ];
      
      const newPoints = centers.map(c => [
        c[0] + (Math.random() - 0.5) * 0.01,
        c[1] + (Math.random() - 0.5) * 0.01,
        0.5 + Math.random() * 0.5
      ] as [number, number, number]);
      
      setHotspots(newPoints);
    };

    generateHotspots();
    const interval = setInterval(generateHotspots, 30000);
    return () => clearInterval(interval);
  }, []);

  const polylinePositions = route?.geometry?.coordinates?.map((coord: [number, number]) => [coord[1], coord[0]]) || [];

  return (
    <div className={cn("w-full h-full relative", mood === "night" && "brightness-90 contrast-110")}>
      <MapContainer 
        center={defaultCenter} 
        zoom={defaultZoom} 
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked={mood === "day"} name="Street Map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer checked={mood === "night"} name="Dark Mode">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite View">
            <TileLayer
              attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay checked name="Congestion Pulse">
            <HeatmapLayer points={hotspots} />
          </LayersControl.Overlay>
        </LayersControl>

        {/* Pulse Hotspots */}
        {hotspots.map((p, i) => (
          <Circle 
            key={i}
            center={[p[0], p[1]]}
            radius={300}
            pathOptions={{ 
              color: 'red', 
              fillColor: 'red', 
              fillOpacity: 0.2,
              weight: 1
            }}
          >
            <Popup>
              <div className="text-[10px] font-bold uppercase tracking-widest">
                Hyperlocal Congestion Spike
                <div className="text-rose-500 mt-1">Intensity: {Math.round(p[2] * 100)}%</div>
              </div>
            </Popup>
          </Circle>
        ))}

        <MapController start={start} end={end} route={route} />
        
        {start && (
          <Marker position={start}>
            <Popup>Start: {start[0].toFixed(4)}, {start[1].toFixed(4)}</Popup>
          </Marker>
        )}
        
        {end && (
          <Marker position={end}>
            <Popup>Destination: {end[0].toFixed(4)}, {end[1].toFixed(4)}</Popup>
          </Marker>
        )}

        {polylinePositions.length > 0 && (
          <Polyline 
            positions={polylinePositions} 
            color={mood === "night" ? "#3B82F6" : "#2563EB"} 
            weight={6} 
            opacity={0.8}
          />
        )}

        {/* Highlight unsafe segments in red */}
        {route?.segments?.map((seg: any, idx: number) => {
          if (seg.score < 6) {
            const segCoords = seg.coordinates.map((c: [number, number]) => [c[1], c[0]]);
            return (
              <Polyline 
                key={idx}
                positions={segCoords} 
                color="#ef4444" 
                weight={8} 
                opacity={0.9}
              />
            );
          }
          return null;
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute top-5 left-5 z-[1000] bg-[#1E293B]/90 backdrop-blur p-3 rounded-xl border border-white/10 shadow-2xl">
        <div className="text-[8px] font-bold uppercase tracking-widest text-[#94A3B8] mb-2">Live Sensors</div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-[10px] text-white font-bold">Heavy Congestion</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-[10px] text-white font-bold">Clear Flow</span>
        </div>
      </div>
    </div>
  );
}
