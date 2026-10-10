import {
  Activity,
  BarChart3,
  BrainCircuit,
  ChevronDown,
  Circle,
  Leaf,
  MapPinned,
  Menu,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useFarm } from "../context/FarmContext";

import "./Navbar.css";

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Overview",
    href: "#",
    icon: Activity,
  },
  {
    id: "field",
    label: "Field",
    href: "#field",
    icon: MapPinned,
  },
  {
    id: "intelligence",
    label: "Intelligence",
    href: "#intelligence",
    icon: BrainCircuit,
  },
  {
    id: "reports",
    label: "Reports",
    href: "#reports",
    icon: BarChart3,
  },
];

function getCurrentPage() {
  const hash = window.location.hash;

  if (hash === "#field") return "field";
  if (hash === "#intelligence") return "intelligence";
  if (hash === "#reports") return "reports";

  return "dashboard";
}

export default function Navbar() {
  const { systemStatus, backendOnline, farm } = useFarm();

  const [currentPage, setCurrentPage] =
    useState(getCurrentPage);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [farmMenuOpen, setFarmMenuOpen] =
    useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(getCurrentPage());
      setMobileOpen(false);
      setFarmMenuOpen(false);
    };

    window.addEventListener(
      "hashchange",
      handleHashChange
    );

    return () => {
      window.removeEventListener(
        "hashchange",
        handleHashChange
      );
    };
  }, []);

  const status = useMemo(() => {
    if (backendOnline) {
      return {
        label: "LIVE SYSTEM",
        code: "LIVE",
        tone: "live",
      };
    }

    return {
      label: "OFFLINE",
      code: "OFFLINE",
      tone: "offline",
    };
  }, [backendOnline]);

  const farmName =
    farm?.name || "Green Valley Farm";

  const farmId =
    farm?.id || "GVF-001";

  const navigate = (href) => {
    window.location.hash = href.replace("#", "");
    setMobileOpen(false);
    setFarmMenuOpen(false);
  };

  return (
    <header className="agrimind-navbar">
      <div className="navbar-inner">

        {/* BRAND */}
        <button
          className="navbar-brand"
          onClick={() => navigate("#")}
          aria-label="AGRIMIND home"
        >
          <span className="brand-mark">
            <Leaf size={18} strokeWidth={2.1} />
          </span>

          <span className="brand-copy">
            <strong>AGRIMIND</strong>
            <small>Living Intelligence</small>
          </span>
        </button>

        {/* DESKTOP NAVIGATION */}
        <nav
          className="navbar-navigation"
          aria-label="Primary navigation"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              currentPage === item.id;

            return (
              <button
                key={item.id}
                className={`navbar-nav-item ${
                  active
                    ? "navbar-nav-active"
                    : ""
                }`}
                onClick={() =>
                  navigate(item.href)
                }
              >
                <Icon size={15} />

                <span>{item.label}</span>

                {active && (
                  <span className="nav-active-dot" />
                )}
              </button>
            );
          })}
        </nav>

        {/* RIGHT SIDE */}
        <div className="navbar-actions">

          {/* SYSTEM STATUS */}
          <div
            className={`navbar-status navbar-status-${status.tone}`}
            title={
              backendOnline
                ? "AGRIMIND backend is connected"
                : "AGRIMIND backend is offline"
            }
          >
            <span className="status-pulse">
              <Circle size={7} fill="currentColor" />
            </span>

            <span className="status-text">
              {status.label}
            </span>

            <span className="status-code">
              {status.code}
            </span>
          </div>

          {/* FARM SELECTOR */}
          <div className="navbar-farm-wrapper">

            <button
              className="navbar-farm-selector"
              onClick={() =>
                setFarmMenuOpen(
                  (value) => !value
                )
              }
              aria-expanded={
                farmMenuOpen
              }
            >
              <span className="farm-selector-icon">
                <Leaf size={14} />
              </span>

              <span className="farm-selector-copy">
                <small>ACTIVE FARM</small>
                <strong>{farmName}</strong>
              </span>

              <ChevronDown
                size={14}
                className={
                  farmMenuOpen
                    ? "farm-chevron-open"
                    : ""
                }
              />
            </button>

            {farmMenuOpen && (
              <div className="navbar-farm-menu">

                <div className="farm-menu-heading">
                  <span>ACTIVE FIELD</span>

                  <strong>
                    {farmName}
                  </strong>

                  <small>
                    {farmId}
                  </small>
                </div>

                <div className="farm-menu-divider" />

                <button
                  onClick={() =>
                    navigate("#field")
                  }
                >
                  <MapPinned size={15} />

                  <span>
                    Open field intelligence
                  </span>
                </button>

                <button
                  onClick={() =>
                    navigate("#intelligence")
                  }
                >
                  <BrainCircuit size={15} />

                  <span>
                    Open policy brain
                  </span>
                </button>

                <button
                  onClick={() =>
                    navigate("#reports")
                  }
                >
                  <BarChart3 size={15} />

                  <span>
                    View field reports
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* MOBILE MENU */}
          <button
            className="navbar-mobile-toggle"
            onClick={() =>
              setMobileOpen(
                (value) => !value
              )
            }
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X size={21} />
            ) : (
              <Menu size={21} />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE NAVIGATION */}
      <div
        className={`navbar-mobile-panel ${
          mobileOpen
            ? "navbar-mobile-panel-open"
            : ""
        }`}
      >
        <div className="mobile-nav-heading">
          <span>AGRIMIND</span>

          <small>
            {systemStatus?.label ||
              status.label}
          </small>
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              className={`mobile-nav-item ${
                currentPage === item.id
                  ? "mobile-nav-item-active"
                  : ""
              }`}
              onClick={() =>
                navigate(item.href)
              }
            >
              <Icon size={17} />

              <span>{item.label}</span>

              {currentPage ===
                item.id && (
                <span className="mobile-nav-active" />
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}