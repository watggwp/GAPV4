// app/src/web/farmer/src/content/PDF/index.jsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import WeatherManagement from "../../../../../assets/components/weather-management";
import { ExportPDF } from "../../../../../assets/js/Export"; // ถ้าไฟล์ชื่อ exports.js ให้แก้เป็น ../../../../../assets/js/exports

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

/* --------------- helpers: แกะ/แปลง response --------------- */
function unwrap(res) {
  let v = res;
  if (v && v.data !== undefined) v = v.data; // axios
  if (v && typeof v === "string") { try { v = JSON.parse(v); } catch {} }
  return v || null;
}
function normalizePayload(raw) {
  if (!raw || typeof raw !== "object") return null;
  const dataForm = raw.dataForm ?? raw.dataform ?? null;
  const farmerObj = Array.isArray(raw.farmer) ? raw.farmer[0] : raw.farmer;
  return {
    dataForm,
    farmer: farmerObj || null,
    ferti: raw.ferti || [],
    chemi: raw.chemi || [],
    report: raw.report || [],
    checkPlant: raw.checkPlant || [],
    checkForm: raw.checkForm || [],
    id_farm_house: raw.id_farm_house ?? raw.id_farmhouse ?? raw.id_farmHouse,
    device_id: raw.device_id ?? raw.deviceId,
    __raw: raw,
  };
}

/* --------- ดึง greenhouse_id/gap_id จาก URL ---------- */
function getIdsFromURL() {
  let greenhouse_id = null;
  let gap_id = null;
  try {
    const url = new URL(window.location.href);
    const qs = new URLSearchParams(url.search);
    greenhouse_id = qs.get("greenhouse_id");
    gap_id = qs.get("gap_id");
    if (!greenhouse_id || !gap_id) {
      const parts = url.pathname.split("/").filter(Boolean);
      const pdfIdx = parts.findIndex((p) => p.toLowerCase() === "pdf");
      if (pdfIdx >= 0) {
        const afterA = parts[pdfIdx + 1];
        const afterB = parts[pdfIdx + 2];
        const beforeA = parts[pdfIdx - 2];
        const beforeB = parts[pdfIdx - 1];
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
  const [{ greenhouse_id, gap_id }] = useState(getIdsFromURL());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // ขนาด host ของกราฟที่ซ่อน (เล็กลงบนมือถือเพื่อไม่ดันเลย์เอาต์)
  const [hostSize, setHostSize] = useState(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 980;
    const maxW = w <= 480 ? 420 : 980;
    const width = Math.min(maxW, Math.max(300, w - 24));
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
      const maxW = w <= 480 ? 420 : 980;
      const width = Math.min(maxW, Math.max(300, w - 24));
      const height = Math.round(width * 0.5);
      setHostSize({ width, height });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!greenhouse_id || !gap_id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await clientMo.get(
          `/api/farmer/report/export?id_farmhouse=${greenhouse_id}&id_plant=${gap_id}`
        );
        setData(normalizePayload(unwrap(res)));
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
    return st && et && et >= st ? { st, et } : null;
  }, [data]);

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
      const formatted = {
        farmer: [payload.farmer],
        dataForm: payload.dataForm,
        ferti: payload.ferti || [],
        chemi: payload.chemi || [],
        report: payload.report || [],
        checkPlant: payload.checkPlant || [],
        checkForm: payload.checkForm || [],
        id_farm_house: payload.id_farm_house,
        device_id: payload.device_id,
      };
      const st = toMs(payload?.dataForm?.date_plant);
      const et = endOfDayLocal2359(payload?.dataForm?.date_harvest || new Date().toISOString());
      const timeRange = st && et && et >= st ? { st, et } : null;
      await ExportPDF([formatted], { range: timeRange, download: true });
    } catch (e) {
      console.error(e);
      alert("ดาวน์โหลดไม่สำเร็จ");
    } finally {
      setDownloading(false);
    }
  }, [greenhouse_id, gap_id, data]);

  return (
    <>
      {/* CSS mobile-first & fixed CTA bottom */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        .pdf-shell {
          /* ให้เต็มความกว้างจริงๆ ของ parent */
          width: 100%;
          min-height: 100vh;
          background: #f3f8f6;
          display: flex;
          flex-direction: column;
          /* กันหัวแอปชน: เว้นบนสักหน่อย */
          padding-top: max(env(safe-area-inset-top), 8px);
        }

        .pdf-content {
          flex: 1 1 auto;
          display: flex;
          justify-content: center;
          padding: 12px 12px 96px;  /* เผื่อพื้นที่ปุ่มล่าง */
        }

        .pdf-card {
          width: 100%;
          max-width: min(640px, 100%);
          background: #fff;
          border: 1px solid #e6efe9;
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 6px 14px rgba(0,0,0,.05);
          text-align: center;
        }

        .pdf-title {
          margin: 2px 0 10px;
          font-size: clamp(18px, 4.8vw, 22px);
          line-height: 1.35;
        }

        /* แถบปุ่มล่างติดขอบ */
        .pdf-cta {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 10px max(env(safe-area-inset-right), 14px)
                   max(calc(env(safe-area-inset-bottom) + 6px), 12px)
                   max(env(safe-area-inset-left), 14px);
          background: linear-gradient(180deg, rgba(243,248,246,0) 0%, rgba(243,248,246,.9) 30%, rgba(243,248,246,1) 100%);
          display: flex;
          justify-content: center;
          z-index: 9;
        }
        .pdf-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 560px;
          height: 54px;
          padding: 0 16px;
          border: 0;
          border-radius: 14px;
          font-size: clamp(15px, 4vw, 16px);
          font-weight: 800;
          letter-spacing: .2px;
          color: #fff;
          background: #1db954;
          box-shadow: 0 10px 22px rgba(0,0,0,.18);
          cursor: pointer;
          transition: transform .06s ease, box-shadow .12s ease, opacity .2s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .pdf-btn:active { transform: translateY(1px) scale(0.995); box-shadow: 0 6px 16px rgba(0,0,0,.16); }
        .pdf-btn[disabled] { opacity: .6; cursor: not-allowed; }

        .pdf-note {
          margin-top: 8px;
          color: #6a7a71;
          font-size: clamp(13px, 3.6vw, 14px);
        }

        /* จอเล็กมาก */
        @media (max-width: 360px) {
          .pdf-card { padding: 14px; border-radius: 12px; }
          .pdf-btn { height: 50px; }
        }

        /* จอใหญ่ขึ้น */
        @media (min-width: 768px) {
          .pdf-content { padding: 20px 20px 110px; }
          .pdf-card { padding: 22px; border-radius: 18px; }
        }
      `}</style>

      <div className="pdf-shell">
        <div className="pdf-content">
          {/* host กราฟซ่อน (ไม่ทำให้เกิดแถบขาวด้านข้าง) */}
          <div
            ref={hostRef}
            style={{
              position: "fixed",
              inset: "0 auto auto -10000px",
              width: hostSize.width,
              height: hostSize.height,
              opacity: 0,
              pointerEvents: "none",
              zIndex: -1,
            }}
            aria-hidden
          >
            <div id="weather-chart-export" style={{ width: "100%", height: "100%" }}>
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

          {/* การ์ดเนื้อหา */}
          <div className="pdf-card">
            <h1 className="pdf-title">ดาวน์โหลดรายงาน GAP</h1>
            {loading && <div className="pdf-note">กำลังเตรียมข้อมูล…</div>}
          </div>
        </div>

        {/* ปุ่มล่างติดขอบ (ไม่เลื่อนหนีมือ) */}
        <div className="pdf-cta">
          <button
            className="pdf-btn"
            disabled={downloading || loading}
            onClick={handleDownload}
          >
            {downloading ? "กำลังสร้างไฟล์..." : "ดาวน์โหลด PDF"}
          </button>
        </div>
      </div>
    </>
  );
}
