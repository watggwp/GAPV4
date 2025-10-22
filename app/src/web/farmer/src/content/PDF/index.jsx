// app/src/web/farmer/src/content/PDF/index.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import WeatherManagement from "../../../../../assets/components/weather-management";
import { ExportPDF } from "../../../../../assets/js/Export";

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
  if (v && typeof v === "string") { try { v = JSON.parse(v); } catch {} }
  return v || null;
}

/* utils */
const asStr = (v) => (v === undefined || v === null ? "" : String(v));
const pick = (...vals) => {
  for (const v of vals) if (v !== undefined && v !== null) return v;
  return undefined;
};
const isPlainObj = (o) => o && typeof o === "object" && !Array.isArray(o);

/* ========= ตัวช่วย “เดาจนเจอ” dataform จาก payload ที่แปลกทรง ========= */

/** มองหา object ที่มีคีย์ของแบบฟอร์ม (plant_name/plant_date/harvest_date/amount/plant_area/unit_name/generation) */
function findFormLikeDeep(raw) {
  const candidates = [];
  const seen = new Set();

  const pushIfFormish = (obj) => {
    if (!isPlainObj(obj)) return;
    const keys = Object.keys(obj).map((k) => k.toLowerCase());
    const hasName = keys.includes("name_plant") || keys.includes("plant_name");
    const hasDate = keys.includes("date_plant") || keys.includes("plant_date");
    const hasAny =
      hasName ||
      hasDate ||
      keys.includes("harvest_date") ||
      keys.includes("date_harvest") ||
      keys.includes("amount") ||
      keys.includes("qty") ||
      keys.includes("plant_area") ||
      keys.includes("unit_name") ||
      keys.includes("generation");

    if (hasAny) candidates.push(obj);
  };

  const walk = (node, depth = 0) => {
    if (!node || depth > 3) return;             // พอแค่ 3 ชั้นกันหลุดโลก
    if (seen.has(node)) return;
    seen.add(node);

    if (isPlainObj(node)) {
      pushIfFormish(node);
      for (const k of Object.keys(node)) {
        const v = node[k];
        if (isPlainObj(v)) walk(v, depth + 1);
        else if (Array.isArray(v)) v.forEach((i) => walk(i, depth + 1));
      }
    } else if (Array.isArray(node)) {
      node.forEach((i) => walk(i, depth + 1));
    }
  };

  walk(raw, 0);
  return candidates[0] || null;
}

/** แมป fields -> รูปแบบที่ ExportPDF ต้องการ (รับ object ที่มีคีย์จริง ๆ) */
function mapDataForm(df) {
  if (!isPlainObj(df)) return {
    type_main:"", name_plant:"", generation:"", date_glow:"", date_plant:"",
    date_success:"", date_harvest:"", posi_w:"", posi_h:"", qty:"", area:"",
    unit:"", history:"", insect:"", prevent:"", qtyInsect:"", system_glow:"",
    system_glow_other:"", water:"", water_other:"", water_flow:"", water_flow_other:""
  };

  return {
    type_main:          asStr(pick(df.type_main, df.type, df.category)),
    name_plant:         asStr(pick(df.name_plant, df.plant_name, df.plant, df.crop)),
    generation:         asStr(pick(df.generation, df.gen)),
    date_glow:          asStr(pick(df.date_glow, df.seed_date, df.date_seed)),
    date_plant:         asStr(pick(df.date_plant, df.plant_date)),
    date_success:       asStr(pick(df.date_success, df.success_date)),
    date_harvest:       asStr(pick(df.date_harvest, df.harvest_date)),
    posi_w:             asStr(df.posi_w ?? ""),
    posi_h:             asStr(df.posi_h ?? ""),
    qty:                asStr(pick(df.qty, df.amount)),
    area:               asStr(pick(df.area, df.plant_area)),
    unit:               asStr(pick(df.unit, df.unit_name)),
    history:            asStr(df.history ?? ""),
    insect:             asStr(df.insect ?? ""),
    prevent:            asStr(pick(df.prevent, df.solution, "")),
    qtyInsect:          asStr(pick(df.qtyInsect, df.qty_insect, "")),
    system_glow:        asStr(df.system_glow ?? ""),
    system_glow_other:  asStr(df.system_glow_other ?? ""),
    water:              asStr(df.water ?? ""),
    water_other:        asStr(df.water_other ?? ""),
    water_flow:         asStr(df.water_flow ?? ""),
    water_flow_other:   asStr(df.water_flow_other ?? ""),
  };
}

/** รวม normalize ทั้ง payload (รองรับทรงแปลก และ array) */
function normalizePayload(raw) {
  if (!raw || typeof raw !== "object") return null;

  // ---- farmer ----
  let farmerObj = Array.isArray(raw.farmer) ? raw.farmer[0] : raw.farmer;
  if (!isPlainObj(farmerObj) && isPlainObj(raw.acc_farmer)) farmerObj = raw.acc_farmer; // กันแบ็กเอนด์ดึงชื่อ table มา
  const farmer = farmerObj
    ? {
        fullname: asStr(pick(farmerObj.fullname, farmerObj.name, farmerObj.full_name)),
        id_farmer: asStr(pick(farmerObj.id_farmer, farmerObj.farmer_id, farmerObj.code)),
        station: asStr(pick(farmerObj.station, farmerObj.name_station, farmerObj.center)),
      }
    : null;

  // ---- dataform ----
  let df = raw.dataForm ?? raw.dataform ?? raw.form ?? null;
  if (Array.isArray(df)) df = df[0];
  if (!isPlainObj(df)) {
    // พยายามหาใน payload
    df = findFormLikeDeep(raw);
  }
  const dataForm = mapDataForm(df || {});

  // ---- collections ----
  const ferti = Array.isArray(raw.ferti) ? raw.ferti : [];
  const chemi = Array.isArray(raw.chemi) ? raw.chemi : [];
  const report = Array.isArray(raw.report) ? raw.report : [];
  const checkPlant = Array.isArray(raw.checkPlant) ? raw.checkPlant : [];
  const checkForm = Array.isArray(raw.checkForm) ? raw.checkForm : [];

  const id_farm_house = pick(raw.id_farm_house, raw.id_farmhouse, raw.id_farmHouse, df?.id_farm_house);
  const device_id = pick(raw.device_id, raw.deviceId, df?.device_id);

  return {
    dataForm,
    farmer: farmer || null,
    ferti,
    chemi,
    report,
    checkPlant,
    checkForm,
    id_farm_house: id_farm_house ?? null,
    device_id: device_id ?? null,
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
  const [{ greenhouse_id, gap_id }] = useState(getIdsFromURL());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  /* host สำหรับกราฟซ่อน */
  const [hostSize, setHostSize] = useState(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 980;
    const maxW = w <= 480 ? 360 : 720;
    const width = Math.min(maxW, Math.max(280, w - 24));
    const height = Math.round(width * 0.5);
    return { width, height };
  });
  const hostRef = useRef(null);

  /* แจ้งพร้อมเมื่อ Recharts mount เสร็จ */
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

  /* โหลดข้อมูล + เติม fallback ให้ครบข้อ 7–9 และ log raw */
  useEffect(() => {
    if (!greenhouse_id || !gap_id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await clientMo.get(
          `/api/farmer/report/export?id_farmhouse=${greenhouse_id}&id_plant=${gap_id}`
        );
        const raw = unwrap(res);
        console.log("[RAW export]", raw);

        let payload = normalizePayload(raw);

        // set meta for chart
        if (typeof window !== "undefined") {
          window.__weatherMeta = {
            hasDevice: !!payload?.device_id,
            device_id: payload?.device_id || null,
            rows: 0,
          };
        }

        // ---- Fallback เติมข้อมูลให้ครบถ้ายังไม่มี ----
        const needs = {
          report: !payload?.report?.length,
          checkForm: !payload?.checkForm?.length,
          checkPlant: !payload?.checkPlant?.length,
        };
        const qsBase = `id_farmhouse=${greenhouse_id}&id_plant=${gap_id}`;
        const ask = async (type) => {
          try {
            const r = await clientMo.get(`/api/farmer/report/list?type=${type}&${qsBase}`);
            return unwrap(r) || [];
          } catch {
            return [];
          }
        };
        if (needs.report)     payload.report     = await ask("r");
        if (needs.checkForm)  payload.checkForm  = await ask("cf");
        if (needs.checkPlant) payload.checkPlant = await ask("cp");

        setData(payload);
        console.log("[mapped] farmer →", payload.farmer);
        console.log("[mapped] dataForm →", payload.dataForm);
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

      if (hostRef.current) {
        hostRef.current.style.width = `${hostSize.width}px`;
        hostRef.current.style.height = `${hostSize.height}px`;
      }

      const st = toMs(payload?.dataForm?.date_plant);
      const et = endOfDayLocal2359(payload?.dataForm?.date_harvest || new Date().toISOString());
      const timeRange = st && et && et >= st ? { st, et } : null;
      if (timeRange) {
        try {
          window.dispatchEvent(
            new CustomEvent("weather-export:set-range", { detail: { st: timeRange.st, et: timeRange.et } })
          );
        } catch {}
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

      console.log("[export payload] dataForm:", formatted.dataForm);
      await ExportPDF([formatted], { range: timeRange, download: true });
    } catch (e) {
      console.error(e);
      alert("ดาวน์โหลดไม่สำเร็จ");
    } finally {
      setDownloading(false);
    }
  }, [greenhouse_id, gap_id, data, hostSize.width, hostSize.height]);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) window.history.back();
    else window.location.assign("/");
  }, []);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .wrap { min-height: 100vh; width: 100%; background: #e7f4ef;
          display: flex; flex-direction: column; padding: max(env(safe-area-inset-top), 8px) 12px 12px; gap: 10px; }
        .topbar{ align-self: stretch; display: flex; justify-content: flex-start; padding: 4px 0;
          margin-left: -12px; margin-right: -12px;
          padding-left: max(env(safe-area-inset-left), 6px); padding-right: max(env(safe-area-inset-right), 6px); }
        .btn-back{ display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 38px; padding: 0 12px;
          background: #fff; border: 2px solid #e53935; border-radius: 12px; color: #e53935; font-weight: 800; font-size: 14px;
          box-shadow: 0 2px 8px rgba(229,57,53,.18); -webkit-tap-highlight-color: transparent; cursor: pointer; }
        .btn-back:active{ transform: translateY(1px); }
        .btn-back svg{ display:block } .btn-back path{ stroke:#e53935; stroke-width:4; stroke-linecap:round; stroke-linejoin:round; fill:none; }
        .center { flex: 1 1 auto; display: grid; place-items: start center; }
        .card { width: 100%; max-width: 360px; background: #fff; border-radius: 12px; border: 2px solid #3f6f3f;
          box-shadow: 0 6px 18px rgba(0,0,0,.08); padding: 14px 14px 16px; text-align: center; }
        .title { margin: 4px 0 14px; font-size: clamp(18px, 5.2vw, 22px); font-weight: 900; color: #0b311f; letter-spacing: .2px; }
        .btn { width: 100%; height: 44px; border: 0; border-radius: 12px; background: #3f6f3f; color: #fff; font-size: 16px; font-weight: 800;
          letter-spacing: .2px; box-shadow: 0 8px 18px rgba(63,111,63,.25); -webkit-tap-highlight-color: transparent; cursor: pointer; }
        .btn:active { transform: translateY(1px); }
        .btn[disabled] { opacity: .7; cursor: not-allowed; }
        .hiddenHost { position: fixed; left: -10000px; top: 0; width: 1px; height: 1px; opacity: 0; pointer-events: none; z-index: -1; }
        @media (max-width: 360px) {
          .card { max-width: 320px; padding: 12px 12px 14px; }
          .btn { height: 42px; font-size: 15px; }
        }
      `}</style>

      <div className="wrap">
        {/* ปุ่มย้อนกลับ ใต้โลโก้ GAP */}
        <div className="topbar">
          <button className="btn-back" onClick={handleBack} aria-label="ย้อนกลับ">
            <svg width="28" height="20" viewBox="0 0 28 20" aria-hidden="true">
              <path d="M16 3 L8 10 L16 17" />
              <path d="M23 3 L15 10 L23 17" />
            </svg>
          </button>
        </div>

        {/* host กราฟซ่อน */}
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
                  { field: "soil_temperature", name: "อุณหภูมิดิน",    color: "red"    },
                  { field: "soil_humidity",    name: "ความชื้นดิน",    color: "blue"   },
                  { field: "pressure",         name: "ความกดอากาศ",    color: "#4a4573"},
                  { field: "batt",             name: "แบตเตอรี่",      color: "red"    },
                ]}
                showTable={false}
              />
            )}
          </div>
        </div>

        {/* การ์ดดาวน์โหลด */}
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
