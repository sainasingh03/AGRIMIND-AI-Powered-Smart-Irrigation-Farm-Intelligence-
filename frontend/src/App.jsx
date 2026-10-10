import "./App.css";

import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";

import Dashboard from "./pages/Dashboard";
import Field from "./pages/Field";
import Intelligence from "./pages/Intelligence";
import Reports from "./pages/Reports";

function getPageFromHash() {
  const hash = window.location.hash;

  if (hash === "#field") {
    return "field";
  }

  if (hash === "#intelligence") {
    return "intelligence";
  }

  if (hash === "#reports") {
    return "reports";
  }

  return "dashboard";
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

export default function App() {
  const [page, setPage] = useState(
    getPageFromHash
  );

  useEffect(() => {
    // Reveal cards as they enter the viewport; reduced-motion users are respected in CSS.
    const nodes = document.querySelectorAll(
      ".dashboard-hero, .dashboard-metric, .dashboard-section, .dashboard-field-grid, .field-page > section, .intelligence-page > section, .reports-page > section"
    );
    nodes.forEach((node, index) => {
      node.classList.add("agri-reveal");
      node.style.setProperty("--reveal-delay", `${Math.min(index % 5, 4) * 65}ms`);
    });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("agri-revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -28px 0px" });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [page]);

  useEffect(() => {
    const handleHashChange = () => {
      setPage(getPageFromHash());

      window.setTimeout(() => {
        scrollToTop();
      }, 20);
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

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(
        null,
        "",
        "#dashboard"
      );
    }
  }, []);

  return (
    <div className="app">
      <Navbar />

      <div
        key={page}
        className="app-page-transition"
      >
        {page === "dashboard" && (
          <Dashboard />
        )}

        {page === "field" && (
          <Field />
        )}

        {page === "intelligence" && (
          <Intelligence />
        )}

        {page === "reports" && (
          <Reports />
        )}
      </div>
    </div>
  );
}