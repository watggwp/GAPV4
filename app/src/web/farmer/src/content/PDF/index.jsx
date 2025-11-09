import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import WeatherManagement from "../../../../../assets/components/weather-management";
import { ExportPDF } from "../../../../../assets/js/Export";
import { useFarmer } from "../../main";

/* ---------------- helpers: วันที่/ช่วงเวลา ---------------- */
const toMs = (input) => {
  if (!input) return null;
  if (typeof input === "number") return input < 1e12 ? input * 1000 : input;
  const iso = String(input).includes("T") ? input : String(input).replace(" ", "T");
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.getTime();
};
const endOfDayLocal2359 = (input) => {
  const ms = toMs(input);
  if (ms == null) return null;
  const d = new Date(ms);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
};

/* --------------- helpers: response --------------- */
function unwrap(res) {
  let v = res;
  if (v && v.data !== undefined) v = v.data;
  if (v && typeof v === "string") {
    try { v = JSON.parse(v); } catch {}
  }
  return v || null;
}

/** normalize/alias ค่า dataForm ให้ตรงกับสิ่งที่ ExportPDF ใช้ (ดูจาก exports.js) */
function mapDataForm(dfRaw = {}) {
  const g = (k, ...alts) => {
    for (const key of [k, ...alts]) {
      const v = dfRaw?.[key];
      if (v !== undefined && v !== null && v !== "") return v;
    }
    return "";
  };
  return {
    type_main:    g("type_main", "type", "typeMain", "name_varieties"),
    name_plant:   g("name_plant", "plant_name"),
    generation:   g("generation", "generation_no"),
    date_glow:    g("date_glow"),
    date_plant:   g("date_plant"),
    date_success: g("date_success"),
    date_harvest: g("date_harvest"),
    posi_w:       g("posi_w"),
    posi_h:       g("posi_h"),
    qty:          g("qty"),
    qtyInsect:    g("qtyInsect", "qty_insect"),
    area:         g("area"),
    unit:         g("unit"),
    history:      g("history"),
    insect:       g("insect"),
    prevent:      g("prevent", "solution"),
    system_glow:  g("system_glow", "system"),
    water:        g("water"),
    water_flow:   g("water_flow"),
    __raw: dfRaw,
  };
}

function normalizePayload(raw) {
  if (!raw || typeof raw !== "object") return null;
  const rawDataForm = raw.dataForm ?? raw.dataform ?? {};
  const farmerObj   = Array.isArray(raw.farmer) ? raw.farmer[0] : raw.farmer;

  return {
    dataForm: mapDataForm(rawDataForm),
    farmer: farmerObj || null,
    ferti: Array.isArray(raw.ferti) ? raw.ferti : [],
    chemi: Array.isArray(raw.chemi) ? raw.chemi : [],
    report: Array.isArray(raw.report) ? raw.report : [],
    checkPlant: Array.isArray(raw.checkPlant) ? raw.checkPlant : [],
    checkForm: Array.isArray(raw.checkForm) ? raw.checkForm : [],
    id_farm_house: raw.id_farm_house ?? raw.id_farmhouse ?? raw.id_farmHouse ?? raw.id_farm ?? raw.dataForm?.id_farm_house ?? raw.dataform?.id_farm_house ?? null,
    device_id: raw.device_id ?? raw.deviceId ?? null,
    __raw: raw,
  };
}

/* --------- ดึง greenhouse_id/gap_id จาก URL ---------- */
function getIdsFromURL() {
  let greenhouse_id = null, gap_id = null;
  try {
    const url = new URL(window.location.href);
    const qs = new URLSearchParams(url.search);
    greenhouse_id = qs.get("greenhouse_id");
    gap_id = qs.get("gap_id");
    if (!greenhouse_id || !gap_id) {
      const parts = url.pathname.split("/").filter(Boolean);
      const pdfIdx = parts.findIndex((p) => p.toLowerCase() === "pdf");
      if (pdfIdx >= 0) {
        const afterA = parts[pdfIdx + 1], afterB = parts[pdfIdx + 2];
        const beforeA = parts[pdfIdx - 2], beforeB = parts[pdfIdx - 1];
        if (afterA && afterB) { greenhouse_id ??= afterA; gap_id ??= afterB; }
        else if (beforeA && beforeB) { greenhouse_id ??= beforeA; gap_id ??= beforeB; }
      }
      if ((!greenhouse_id || !gap_id) && parts.length >= 2) {
        const [a, b] = parts.slice(-2);
        if (a && b) { greenhouse_id ??= a; gap_id ??= b; }
      }
    }
  } catch {}
  return { greenhouse_id, gap_id };
}

export default function PDFDownloadOnly() {
  const { liff } = useFarmer()

  const [{ greenhouse_id, gap_id }] = useState(getIdsFromURL());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [hostSize, setHostSize] = useState(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 980;
    const maxW = w <= 480 ? 360 : 720;
    const width = Math.min(maxW, Math.max(280, w - 24));
    const height = Math.round(width * 0.5);
    return { width, height };
  });
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const obs = new MutationObserver(() => {
      const svg = host.querySelector("#weather-chart-export .recharts-wrapper");
      if (svg && svg.offsetWidth > 0 && svg.offsetHeight > 0) {
        window.dispatchEvent(new CustomEvent("weather-export:chart-ready"));
      }
    });
    obs.observe(host, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      const maxW = w <= 480 ? 360 : 720;
      const width = Math.min(maxW, Math.max(280, w - 24));
      const height = Math.round(width * 0.5);
      setHostSize({ width, height });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* โหลดข้อมูล */
  useEffect(() => {
    if (!greenhouse_id || !gap_id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await clientMo.get(
          `/api/farmer/report/export?id_farmhouse=${greenhouse_id}&id_plant=${gap_id}`
        );
        const payload = normalizePayload(unwrap(res));
        setData(payload);
        if (typeof window !== "undefined") {
          window.__weatherMeta = {
            hasDevice: !!payload?.device_id,
            device_id: payload?.device_id || null,
            rows: 0,
          };
        }
        console.log("[mapped] farmer ->", payload?.farmer);
        console.log("[mapped] dataForm ->", payload?.dataForm);
      } catch (e) {
        console.error(e);
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [greenhouse_id, gap_id]);

  const range = useMemo(() => {
    if (!data?.dataForm) return null;
    const st = toMs(data.dataForm.date_plant);
    const et = endOfDayLocal2359(data.dataForm.date_harvest || new Date().toISOString());
    return st && et && et >= st ? { st, et } : { st: null, et: null };
  }, [data]);

  const waitChartReady = useCallback((timeout = 2000) => {
    return new Promise((resolve) => {
      let done = false;
      const to = setTimeout(() => {
        if (!done) { done = true; resolve(false); }
      }, timeout);
      const h = () => {
        if (done) return;
        done = true;
        clearTimeout(to);
        resolve(true);
      };
      window.addEventListener("weather-export:chart-ready", h, { once: true });
      setTimeout(() => {
        if (range?.st && range?.et) {
          try {
            window.dispatchEvent(new CustomEvent("weather-export:set-range", { detail: { st: range.st, et: range.et } }));
            window.dispatchEvent(new CustomEvent("weather-export:get-meta"));
          } catch {}
        }
      }, 100);
    });
  }, [range]);

  const handleDownload = useCallback(async () => {
    if (!greenhouse_id || !gap_id) {
      alert("ขาดพารามิเตอร์ greenhouse_id / gap_id ใน URL");
      return;
    }
    setDownloading(true);
    try {
      let payload = data;
      if (!payload) {
        const res = await clientMo.get(
          `/api/farmer/report/export?id_farmhouse=${greenhouse_id}&id_plant=${gap_id}`
        );
        payload = normalizePayload(unwrap(res));
      }
      if (!payload?.dataForm || !payload?.farmer) {
        console.log("payload:", payload);
        alert("ไม่พบข้อมูลสำหรับสร้าง PDF");
        return;
      }

      if (hostRef.current) {
        hostRef.current.style.width = `${hostSize.width}px`;
        hostRef.current.style.height = `${hostSize.height}px`;
      }

      const st = toMs(payload?.dataForm?.date_plant);
      const et = endOfDayLocal2359(payload?.dataForm?.date_harvest || new Date().toISOString());
      const timeRange = st && et && et >= st ? { st, et } : { st: null, et: null };

      if (timeRange?.st && timeRange?.et) {
        try {
          window.dispatchEvent(new CustomEvent("weather-export:set-range", { detail: timeRange }));
        } catch {}
      }

      if (payload.device_id) {
        await waitChartReady(2000);
      }

      const formatted = {
        farmer: [payload.farmer],
        dataForm: payload.dataForm,
        ferti: payload.ferti || [],
        chemi: payload.chemi || [],
        report: payload.report || [],
        checkPlant: payload.checkPlant || [],
        checkForm: payload.checkForm || [],
        id_farm_house: payload.id_farm_house || greenhouse_id,
        device_id: payload.device_id || null,
      };

      // 🛠 ป้องกัน split error
      if (!formatted.dataForm) formatted.dataForm = {};
      for (const key of [
        "date_plant",
        "date_harvest",
        "date_glow",
        "name_plant",
        "type_main",
        "unit",
        "generation",
      ]) {
        if (!formatted.dataForm[key]) formatted.dataForm[key] = "";
      }

      console.log("[export payload] dataForm:", formatted.dataForm);
      console.log("[export payload] ferti:", formatted.ferti);
      console.log("[export payload] chemi:", formatted.chemi);

      try {
        const blob = await ExportPDF([formatted], { range: timeRange, download: false });
        const blobUrl = URL.createObjectURL(blob);

        liff.openWindow({
          url: blobUrl,
          external: true
        })
      } catch (err) {
        console.error("❌ ExportPDF error:", err);
        alert("เกิดข้อผิดพลาดระหว่างสร้างไฟล์ PDF\n" + (err.message || ""));
      }

    } catch (e) {
      console.error("❌ handleDownload error:", e);
      alert("ดาวน์โหลดไม่สำเร็จ");
    } finally {
      setDownloading(false);
    }
  }, [greenhouse_id, gap_id, data, hostSize.width, hostSize.height, waitChartReady, liff]);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) window.history.back();
    else window.location.assign("/");
  }, []);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .wrap { min-height: 100vh; width: 100%; background: #e7f4ef; display: flex; flex-direction: column; padding: max(env(safe-area-inset-top), 8px) 12px 12px; gap: 10px; }
        .topbar{ align-self: stretch; display: flex; justify-content: flex-start; padding: 4px 0; margin-left: -12px; margin-right: -12px; padding-left: max(env(safe-area-inset-left), 6px); padding-right: max(env(safe-area-inset-right), 6px); }
        .btn-back{ display:inline-flex; align-items:center; justify-content:center; gap:8px; height:38px; padding:0 12px; background:#fff; border:3px solid #3f6f3f; border-radius:12px; color:#e53935; font-weight:800; font-size:14px; box-shadow:0 2px 8px rgba(229,57,53,.18); -webkit-tap-highlight-color:transparent; cursor:pointer; }
        .btn-back:active{ transform: translateY(1px); }
        .btn-back svg{ display:block }
        .btn-back path{ stroke:#e53935; stroke-width:4; stroke-linecap:round; stroke-linejoin:round; fill:none; }
        .center { flex: 1 1 auto; display: grid; place-items: start center; }
        .card { width: 100%; max-width: 360px; background: #fff; border-radius: 12px; border: 2px solid #3f6f3f; box-shadow: 0 6px 18px rgba(0,0,0,.08); padding: 14px 14px 16px; text-align: center; }
        .title { margin:4px 0 14px; font-size: clamp(18px, 5.2vw, 22px); font-weight: 900; color:#0b311f; letter-spacing:.2px; }
        .btn { width: 100%; height: 44px; border: 0; border-radius: 12px; background: #3f6f3f; color: #fff; font-size: 16px; font-weight: 800; letter-spacing: .2px; box-shadow: 0 8px 18px rgba(63,111,63,.25); -webkit-tap-highlight-color: transparent; cursor: pointer; }
        .btn:active { transform: translateY(1px); }
        .btn[disabled] { opacity: .7; cursor: not-allowed; }
        .hiddenHost { position: fixed; left: -10000px; top: 0; width: 1px; height: 1px; opacity: 0; pointer-events: none; z-index: -1; }
        @media (max-width: 360px) { .card { max-width: 320px; padding: 12px 12px 14px; } .btn { height: 42px; font-size: 15px; } }
      `}</style>

      <div className="wrap">
        <div className="topbar">
          <button className="btn-back" onClick={handleBack} aria-label="ย้อนกลับ">
            <svg width="28" height="20" viewBox="0 0 28 20" aria-hidden="true">
              <path d="M16 3 L8 10 L16 17" />
              <path d="M23 3 L15 10 L23 17" />
            </svg>
          </button>
        </div>

        <div className="hiddenHost" ref={hostRef} aria-hidden>
          <div id="weather-chart-export" style={{ width: hostSize.width, height: hostSize.height }}>
            {data?.device_id && range?.st && range?.et && (
              <WeatherManagement
                endpointData={`/api/sensor/weather-greenhouse/${data.id_farm_house || greenhouse_id}/${data.device_id}`}
                query={{ r: "farmer" }}
                startTime={range.st}
                endTime={range.et}
                columnTimestamp="timestamp"
                columns={[
                  { field: "air_temperature",  name: "อุณหภูมิ",      color: "green"  },
                  { field: "air_humidity",     name: "ความชื้น",       color: "yellow" },
                  { field: "light",            name: "แสง",            color: "orange" },
                  { field: "soil_temperature", name: "อุณหภูมิดิน",     color: "red"    },
                  { field: "soil_humidity",    name: "ความชื้นดิน",     color: "blue"   },
                  { field: "pressure",         name: "ความกดอากาศ",     color: "#4a4573"},
                  { field: "batt",             name: "แบตเตอรี่",       color: "red"    },
                ]}
                showTable={false}
              />
            )}
          </div>
        </div>

        <div className="center">
          <div className="card">
            <h1 className="title">ดาวน์โหลดรายงาน GAP</h1>
            <button
              className="btn"
              disabled={downloading || loading}
              onClick={handleDownload}
              aria-label="ดาวน์โหลด PDF"
            >
              {downloading ? "กำลังสร้างไฟล์..." : "ดาวน์โหลดPDF"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------ inline styles ------------------------ */
// const styles = {
//   wrap: {
//     minHeight: "100vh",
//     display: "grid",
//     placeItems: "center",
//     background: "#f7faf9",
//     padding: 16,
//   },
//   btn: {
//     height: 56,
//     minWidth: 240,
//     padding: "0 20px",
//     border: 0,
//     borderRadius: 14,
//     fontSize: 18,
//     fontWeight: 800,
//     letterSpacing: ".2px",
//     color: "#fff",
//     background: "#1db954",
//     cursor: "pointer",
//     boxShadow: "0 10px 22px rgba(0,0,0,.18)",
//   },
//   btnDisabled: { opacity: 0.6, cursor: "not-allowed" },
//   hiddenHost: {
//     position: "fixed",
//     left: -10000,
//     top: 0,
//     width: 980,
//     height: 360,
//     opacity: 0,
//     pointerEvents: "none",
//     zIndex: -1,
//   },
// };
