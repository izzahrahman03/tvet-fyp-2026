// components/userTable/CompanyDropdown.jsx
import { useState, useEffect, useRef } from "react";
import { fetchPartners } from "../../api/adminApi";

export default function CompanyDropdown({ value, onChange }) {
  // query holds the visible text in the input (company name, not ID)
  const [query,    setQuery]    = useState("");
  const [options,  setOptions]  = useState([]);
  const [open,     setOpen]     = useState(false);
  const [fetching, setFetching] = useState(false);
  const ref         = useRef(null);
  const initialised = useRef(false); // guard so we only resolve once on mount

  // ── On mount: resolve the incoming partner_id → company name ─────────────
  useEffect(() => {
    if (!value || initialised.current) return;
    initialised.current = true;

    (async () => {
      try {
        // Fetch all partners (empty query) and find the one matching the id
        const results = await fetchPartners("");
        const match   = results.find(
          (p) => String(p.partner_id) === String(value)
        );
        if (match) setQuery(match.company_name);
      } catch {
        // If lookup fails just leave the input blank; user can search manually
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — run once on mount only

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Debounced search ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return; // don't fetch while the dropdown is closed
    const timer = setTimeout(async () => {
      setFetching(true);
      try {
        const results = await fetchPartners(query);
        setOptions(results);
      } catch {
        setOptions([]);
      } finally {
        setFetching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, open]);

  const handleSelect = (partner) => {
    setQuery(partner.company_name);  // show name in input
    onChange(partner.partner_id);    // emit ID to parent
    setOpen(false);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    // If the user clears the field, also clear the selected ID in the parent
    if (!e.target.value) onChange("");
    setOpen(true);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          className="form-input"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder="Search company name…"
          autoComplete="off"
          style={{ paddingRight: "32px" }}
        />
        <svg
          style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"
        >
          <path d="M21 21l-4.35-4.35 M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
          background: "white", border: "1px solid #e2e8f0", borderRadius: "2px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)", maxHeight: "200px", overflowY: "auto",
        }}>
          {fetching ? (
            <div style={{ padding: "10px 12px", fontSize: "13px", color: "#94a3b8" }}>Searching…</div>
          ) : options.length === 0 ? (
            <div style={{ padding: "10px 12px", fontSize: "13px", color: "#94a3b8" }}>
              {query ? "No companies found." : "Type to search companies…"}
            </div>
          ) : options.map((p) => (
            <div
              key={p.partner_id}
              onClick={() => handleSelect(p)}
              style={{ padding: "10px 12px", cursor: "pointer", fontSize: "13px", borderBottom: "1px solid #f1f5f9" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={(e) => e.currentTarget.style.background = "white"}
            >
              <p style={{ margin: 0, fontWeight: "600", color: "#1e293b" }}>{p.company_name}</p>
              {(p.industry_sector || p.location) && (
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#94a3b8" }}>
                  {[p.industry_sector, p.location].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}