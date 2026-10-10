import {
  Layers,
  LocateFixed,
  Map as MapIcon,
  Satellite,
} from "lucide-react";

import {
  MapContainer,
  TileLayer,
  Circle,
  Popup,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

const FIELD_CENTER = [26.4499, 80.3319];

function FitFieldButton() {
  const map = useMap();

  const handleFit = () => {
    map.flyTo(FIELD_CENTER, 16, {
      duration: 1.2,
    });
  };

  return (
    <button
      type="button"
      className="field-map-control"
      onClick={handleFit}
      title="Center field"
    >
      <LocateFixed size={16} />
    </button>
  );
}

function MapLegend() {
  return (
    <div className="field-map-legend">
      <div>
        <span className="legend-dot legend-soil" />
        Soil zone
      </div>

      <div>
        <span className="legend-dot legend-irrigation" />
        Irrigation area
      </div>
    </div>
  );
}

export default function FieldMap() {
  return (
    <div className="field-map-wrapper">

      <div className="field-map-topbar">
        <div className="field-map-title">
          <MapIcon size={16} />
          <span>GREEN VALLEY · GVF-001</span>
        </div>

        <div className="field-map-source">
          <Satellite size={14} />
          SATELLITE VIEW
        </div>
      </div>

      <div className="field-map">
        <MapContainer
          center={FIELD_CENTER}
          zoom={15}
          scrollWheelZoom={true}
          zoomControl={true}
          className="field-leaflet-map"
        >

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Circle
            center={FIELD_CENTER}
            radius={420}
            pathOptions={{
              color: "#718C78",
              fillColor: "#718C78",
              fillOpacity: 0.12,
              weight: 2,
            }}
          >
            <Popup>
              <strong>Green Valley Farm</strong>
              <br />
              Field ID: GVF-001
              <br />
              Crop: Wheat
            </Popup>
          </Circle>

          <Circle
            center={FIELD_CENTER}
            radius={180}
            pathOptions={{
              color: "#C7A96B",
              fillColor: "#C7A96B",
              fillOpacity: 0.08,
              weight: 2,
              dashArray: "6 8",
            }}
          />

          {/* IMPORTANT:
              This component must stay INSIDE MapContainer
              because it uses useMap().
          */}
          <FitFieldButton />

        </MapContainer>

        <MapLegend />

      </div>

      <div className="field-map-footer">

        <div className="field-map-coordinate">
          <span>LAT</span>
          <strong>26.4499° N</strong>
        </div>

        <div className="field-map-coordinate">
          <span>LON</span>
          <strong>80.3319° E</strong>
        </div>

        <div className="field-map-status">
          <span />
          FIELD MONITORING ACTIVE
        </div>

      </div>

    </div>
  );
}