import React from "react";
import {
  Activity,
  Droplets,
  Thermometer,
  CloudRain,
  Sprout,
  Gauge,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

/**
 * AGRIMIND — Metric Card
 *
 * Reusable premium telemetry card for:
 * - Soil moisture
 * - Temperature
 * - Humidity
 * - Rain probability
 * - Tank level
 * - Crop / field metrics
 *
 * Props:
 *   label        → Metric name
 *   value        → Main value
 *   unit         → %, °C, L, etc.
 *   status       → DRY / OPTIMAL / HOT / LOW etc.
 *   icon         → Lucide icon component
 *   trend        → UP / DOWN / STABLE
 *   trendValue   → Optional trend text
 *   variant      → default / warning / danger / success
 *   description  → Small supporting text
 *   dark         → Dark card variant
 */

const ICONS = {
  moisture: Droplets,
  soil: Sprout,
  temperature: Thermometer,
  humidity: Activity,
  rain: CloudRain,
  tank: Gauge,
  activity: Activity,
};

function getTrendIcon(trend) {
  if (!trend) return null;

  const normalized = String(trend).toUpperCase();

  if (normalized === "UP" || normalized === "INCREASING") {
    return <TrendingUp size={12} />;
  }

  if (normalized === "DOWN" || normalized === "DECREASING") {
    return <TrendingDown size={12} />;
  }

  return <Minus size={12} />;
}

function getVariant(status, variant) {
  if (variant && variant !== "default") {
    return variant;
  }

  const normalized = String(status || "").toUpperCase();

  if (
    normalized.includes("HOT") ||
    normalized.includes("HIGH") ||
    normalized.includes("VERY DRY") ||
    normalized.includes("CRITICAL") ||
    normalized.includes("ALERT")
  ) {
    return "warning";
  }

  if (
    normalized.includes("DRY") ||
    normalized.includes("LOW") ||
    normalized.includes("DANGER")
  ) {
    return "danger";
  }

  if (
    normalized.includes("OPTIMAL") ||
    normalized.includes("STABLE") ||
    normalized.includes("ACTIVE") ||
    normalized.includes("GOOD")
  ) {
    return "success";
  }

  return "default";
}

export default function MetricCard({
  label = "METRIC",
  value = "--",
  unit = "",
  status = "",
  icon,
  iconName,
  trend,
  trendValue,
  description,
  variant = "default",
  dark = false,
  className = "",
}) {
  const Icon =
    icon ||
    ICONS[String(iconName || "").toLowerCase()] ||
    Activity;

  const cardVariant = getVariant(status, variant);

  const classes = [
    "agrimind-metric-card",
    `agrimind-metric-card--${cardVariant}`,
    dark ? "agrimind-metric-card--dark" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={classes}>
      {/* Background decoration */}
      <div className="agrimind-metric-card-glow" />

      {/* Header */}
      <div className="agrimind-metric-card-header">
        <div className="agrimind-metric-card-icon">
          <Icon size={18} strokeWidth={1.8} />
        </div>

        <span className="agrimind-metric-card-label">
          {label}
        </span>

        {status && (
          <span className="agrimind-metric-card-status">
            <span className="agrimind-metric-status-dot" />
            {status}
          </span>
        )}
      </div>

      {/* Main value */}
      <div className="agrimind-metric-card-main">
        <div className="agrimind-metric-card-value">
          {value}
          {unit && (
            <span className="agrimind-metric-card-unit">
              {unit}
            </span>
          )}
        </div>

        {trend && (
          <div
            className={`agrimind-metric-card-trend agrimind-metric-card-trend--${String(
              trend
            ).toLowerCase()}`}
          >
            {getTrendIcon(trend)}

            {trendValue && (
              <span>{trendValue}</span>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="agrimind-metric-card-description">
          {description}
        </p>
      )}

      {/* Bottom indicator */}
      <div className="agrimind-metric-card-footer">
        <div className="agrimind-metric-card-line">
          <span />
        </div>

        <span className="agrimind-metric-card-live">
          LIVE SENSOR
        </span>
      </div>
    </article>
  );
}