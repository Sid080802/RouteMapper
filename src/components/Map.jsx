import { useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import "./Map.css";
import { FaMapMarkerAlt, FaExchangeAlt, FaRoute } from "react-icons/fa";

// FitBounds ensures map auto-zooms to the route
const FitBounds = ({ route }) => {
    const map = useMap();
    if (route && route.length > 0) {
        map.fitBounds(route, { padding: [50, 50] });
    }
    return null;
};

// Create a red marker icon for the destination
const redMarker = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
});

const Map = () => {
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [startCoords, setStartCoords] = useState(null);
    const [endCoords, setEndCoords] = useState(null);
    const [route, setRoute] = useState([]);
    const [distance, setDistance] = useState(null);
    const [duration, setDuration] = useState(null);

    const mapRef = useRef();

    // Fetch coordinates for address
    const geocodeAddress = async (address, setCoords) => {
        if (!address.trim()) {
            alert("❌ Please enter a valid location");
            return;
        }
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/geocode`, { address });
            setCoords({ lat: parseFloat(res.data.lat), lon: parseFloat(res.data.lon) });
        } catch (error) {
            console.error("❌ Error fetching coordinates:", error.response?.data || error.message);
            alert("❌ Unable to get location. Check console for details.");
        }
    };

    // Fetch route between start and end
    const getRoute = async () => {
        if (!startCoords || !endCoords) {
            alert("❌ Please set both start and end locations");
            return;
        }
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/route`, {
                start: startCoords,
                end: endCoords,
            });
            const { coordinates, distance, duration } = res.data;
            setRoute(coordinates.map(coord => [coord[0], coord[1]]));
            setDistance(distance / 1000);
            setDuration(formatDuration(duration));
        } catch (error) {
            console.error("❌ Error fetching route:", error.response?.data || error.message);
            alert("❌ Unable to get route. Check console for details.");
        }
    };

    // Format duration (seconds to hr/min)
    const formatDuration = (seconds) => {
        const minutes = Math.round(seconds / 60);
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
    };

    // Swap start and end
    const switchLocations = () => {
        setStart(end);
        setEnd(start);
        setStartCoords(endCoords);
        setEndCoords(startCoords);
    };

    // Focus on destination marker when clicked
    const focusOnDestination = () => {
        if (endCoords) {
            const map = mapRef.current;
            if (map) {
                map.flyTo([endCoords.lat, endCoords.lon], 13); // Zoom level 13
            }
        }
    };

    return (
        <div className="main">
            <div className="header">
                <h1><FaRoute className="logo-icon" /> RouteMapper</h1>
                <p>Find the best route between two locations</p>
            </div>

            <div className="input-container">
                <div className="location-box">
                    <FaMapMarkerAlt className="input-icon" />
                    <input
                        type="text"
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                        placeholder="Start Location"
                    />
                    <button onClick={() => geocodeAddress(start, setStartCoords)}>Set Start</button>
                </div>

                <div className="location-box">
                    <FaMapMarkerAlt className="input-icon" />
                    <input
                        type="text"
                        value={end}
                        onChange={(e) => setEnd(e.target.value)}
                        placeholder="End Location"
                    />
                    <button onClick={() => geocodeAddress(end, setEndCoords)}>Set End</button>
                </div>

                <div className="action-buttons">
                    <button onClick={switchLocations}><FaExchangeAlt /> Switch Locations</button>
                    <button onClick={getRoute}><FaRoute /> Get Route</button>
                </div>
            </div>

            <div className="map-container">
                <MapContainer center={[20, 78]} zoom={4} style={{ height: "500px", width: "100%" }} ref={mapRef}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {startCoords && (
                        <Marker position={[startCoords.lat, startCoords.lon]}>
                            <Popup>Start Location</Popup>
                        </Marker>
                    )}
                    {endCoords && (
                        <Marker position={[endCoords.lat, endCoords.lon]} icon={redMarker} eventHandlers={{
                            click: focusOnDestination,
                        }}>
                            <Popup>Destination</Popup>
                        </Marker>
                    )}
                    {route.length > 0 && (
                        <>
                            <Polyline positions={route} color="blue" />
                            <FitBounds route={route} />
                        </>
                    )}
                </MapContainer>
            </div>

            {distance !== null && duration !== null && (
                <div className="distance-info">
                    <p>🚗 Distance: <strong>{distance.toFixed(2)} km</strong></p>
                    <p>⏱ Duration: <strong>{duration}</strong></p>
                </div>
            )}
        </div>
    );
};

export default Map;