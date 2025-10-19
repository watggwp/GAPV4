import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import * as FileSaver from "file-saver";
import XLSX from "sheetjs-style";

/* ------------------------- helpers: timing / dom ------------------------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SCALE = 4;
const TRIM = {
  top: 2 * SCALE,
  left: 0,
  right: 0,
  bottom: 0
};
const drawChartsAtEnd = (
  pdf,
  chartImages,
  {
    scale = 0.78,
    top = 54,
    gap = 18,
    titleFrom = "",
    titleTo = "",
    titleFS = 14,   // ขนาดตัวอักษรหัวข้อ
    subFS = 10    // ขนาดตัวอักษรบรรทัดช่วงเวลา
  } = {}
) => {
  const PAGE_LEFT = 24;
  const PAGE_RIGHT = pdf.internal.pageSize.getWidth() - 24;

  // ขนาดฐานต่อรูป (เมื่อ scale = 1)
  const BASE_W = PAGE_RIGHT - PAGE_LEFT;
  const BASE_H = 220;

  // ขนาดจริงหลังย่อ/ขยาย
  const IMG_W = BASE_W * scale;
  const IMG_H = BASE_H * scale;

  // ระยะสูงที่เผื่อสำหรับหัวข้อ + ช่วงเวลา
  const HEAD_H = titleFS + subFS + 8;

  // จัดให้รูปอยู่กึ่งกลางแนวนอน
  const X = PAGE_LEFT + (BASE_W - IMG_W) / 2;

  for (let i = 0; i < chartImages.length; i += 2) {
    pdf.addPage();

    for (let r = 0; r < 2; r++) {
      const g = chartImages[i + r];
      if (!g) break;

      const yTop = top + r * (IMG_H + HEAD_H + gap);

      // 1) ชื่อกราฟ
      pdf.setFontSize(titleFS);
      pdf.setFont("THSarabunNew-bold", "bold");
      pdf.text(g?.name || g?.field || "กราฟ", X, yTop);
      pdf.setFont("THSarabunNew", "normal");

      // 2) ช่วงเวลา
      if (titleFrom || titleTo) {
        pdf.setFontSize(subFS);
        pdf.text(`ช่วงเวลา: ${titleFrom || "-"} – ${titleTo || "-"}`, X, yTop + titleFS);
      }

      // 3) รูปกราฟ
      const yImg = yTop + HEAD_H;
      if (g?.img) {
        addImageFit(pdf, g.img, X, yImg, IMG_W, IMG_H);
      } else {
        pdf.setDrawColor(180);
        pdf.rect(X, yImg, IMG_W, IMG_H);
        pdf.setFontSize(12);
        pdf.text("ไม่มีข้อมูลสำหรับกราฟนี้", X + IMG_W / 2, yImg + IMG_H / 2, { align: "center" });
      }
    }
  }

  // คืน font size ให้ค่าเดิม
  pdf.setFontSize(16);
};
const cropDataURL = (dataURL, { left = 0, top = 0, right = 0, bottom = 0 } = {}) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = Math.max(1, img.width - left - right);
      const h = Math.max(1, img.height - top - bottom);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      // วาดเฉพาะส่วนที่ต้องการ
      ctx.drawImage(img, left, top, w, h, 0, 0, w, h);
      resolve(c.toDataURL("image/png"));
    };
    img.crossOrigin = "anonymous";
    img.src = dataURL;
  });
const waitForEvent = (type, { timeout = 8000 } = {}) =>
  new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) resolve(false);
    }, timeout);
    const handler = (e) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(e?.detail || true);
    };
    window.addEventListener(type, handler, { once: true });
  });
const waitForRecharts = async (selector, { tries = 40, delay = 150 } = {}) => {
  for (let i = 0; i < tries; i++) {
    const host = typeof selector === "string" ? document.querySelector(selector) : selector;
    const svg = host?.querySelector?.("svg");
    if (host && svg) {
      const r1 = host.getBoundingClientRect();
      const r2 = svg.getBoundingClientRect();
      if (r1.width > 0 && r1.height > 0 && r2.width > 0 && r2.height > 0) return true;
    }
    await sleep(delay);
  }
  return false;
};
const captureWeatherChart = async ({ field, color }, {
  selector = "#weather-chart-export",
  timeout = 10000
} = {}) => {
  window.dispatchEvent(new CustomEvent("weather-export:set-metric", {
    detail: { field, color }
  }));

  const signaled = await waitForEvent("weather-export:chart-ready", { timeout });
  const ready = signaled || (await waitForRecharts(selector, { tries: 50, delay: 150 }));
  if (!ready) return null;

  await sleep(120);

  // จับเฉพาะกรอบกราฟ (ไม่มีแท็บ)
  const host = document.querySelector(selector);
  const chartOnly = host?.querySelector?.(".recharts-wrapper") || host;

  // แคปภาพ
  let dataURL = await captureElementToDataURL(chartOnly, {
    scale: SCALE,
    backgroundColor: "#fff",
    useCORS: true,
  });

  // ✅ ครอปมุมบนซ้าย (ตัดหัวที่ล้น)
  // ปรับค่า top ตามที่เห็นหน้างาน: 30 ~ 36px
  dataURL = await cropDataURL(dataURL, TRIM);
  return dataURL;
};
const captureElementToDataURL = async (selector, opts = {}) => {
  const el = typeof selector === "string" ? document.querySelector(selector) : selector;
  if (!el) return null;
  el.scrollIntoView({ block: "center", inline: "nearest" });
  await sleep(350);
  const canvas = await html2canvas(el, {
    backgroundColor: "#fff",
    scale: 2,
    useCORS: true,
    ...opts,
  });
  return canvas.toDataURL("image/png");
};

/* ========== drawing helpers ========== */
const TextBoxDot = (pdf = new jsPDF(), count, xStart, y, textOnDot) => {
  let posi = parseInt(xStart, 10) || 0;
  const dotCount = parseInt(count, 10) || 0;

  for (let x = 1; x <= dotCount; x++) {
    const gidx = posi - 1;
    const gidy = parseInt(y, 10) + 1;
    pdf.circle(gidx, gidy, 0.7, "F");
    posi += 4;
  }
  const safeText = String(textOnDot ?? "");
  const widthText = pdf.getStringUnitWidth(safeText) * 18;
  pdf.text(safeText, (xStart + (posi - xStart) / 2 - widthText / 2) + 2, parseInt(y, 10) - 1);
  return posi - 3;
};

const _norm = (s) => s?.toString().trim().toLowerCase().replace(/\s+/g, " ") ?? "";

const asSet = (v) => {
  if (!v) return new Set();
  if (Array.isArray(v)) return new Set(v.map((s) => s?.toString?.().trim().toLowerCase()));
  return new Set(
    v
      .toString()
      .split(/[|,/\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
};

const OPTION_SYNONYMS = {
  system_glow: {
    "ขึ้นแปลงปลูกตามไหล่เขา": ["ไหล่เขา", "ตามไหล่เขา"],
    "ปลูกแบบพื้นราบ": ["พื้นราบ", "ปลูกพื้นราบ"],
    "ปลูกในวัสดุปลูก": ["วัสดุปลูก", "ปลูกในวัสดุ"],
    "ขึ้นแปลงปลูกในโรงเรือน": ["โรงเรือน", "ขึ้นแปลงในโรงเรือน"],
    "ระบบ Hydroponic": ["hydroponic", "ไฮโดรโปนิก", "ไฮโดรโพนิก", "ไฮโดร"],
  },
  water: {
    "อาศัยน้ำฝน": ["ฝน", "น้ำฝน"],
    "ลำธาร/คลองธรรมชาติ": ["ลำธาร", "คลองธรรมชาติ", "ลำธาร/คลอง"],
    "บ่อบาดาล": ["บาดาล", "น้ำบาดาล"],
    "บ่อ/สระขุด": ["สระขุด", "บ่อขุด", "บ่อ สระขุด", "สระ"],
    "คลองชลประทาน": ["ชลประทาน", "คลองชล"],
    "อ่างเก็บน้ำ": ["อ่าง", "อ่างน้ำ", "อ่างเก็บ"],
  },
  water_flow: {
    "สปริงเกอร์": ["sprinkler", "สปริงเกอร์ต", "ปริงเก"],
    "ระบบน้ำหยด": ["น้ำหยด", "drip"],
    "ปล่อยตามร่อง": ["ตามร่อง", "ปล่อยร่อง"],
    "ใช้สายยางรด": ["สายยาง", "รดน้ำด้วยสายยาง"],
    "ตักรด": ["ตัก", "ตักรดน้ำ"],
  },
};

const resolveChecks = (inputSet, optionMap) => {
  const hitLabels = new Set();
  const others = [];
  if (inputSet && typeof inputSet.forEach === "function") {
    for (const raw of inputSet) {
      const v = _norm(raw);
      let matched = false;
      for (const [label, aliases] of Object.entries(optionMap)) {
        const candidates = [label, ...(aliases || [])].map(_norm);
        if (candidates.some((c) => v.includes(c))) {
          hitLabels.add(label);
          matched = true;
          break;
        }
      }
      if (!matched && v) others.push(raw);
    }
  }
  return { hitLabels, otherText: others.join(", ") };
};

const isCheckedLabel = (label, hitLabels, rawSet) => {
  if (hitLabels && hitLabels.has(label)) return true;
  const L = _norm(label);
  if (rawSet && typeof rawSet.forEach === "function") {
    for (const v of rawSet) if (_norm(v).includes(L)) return true;
  }
  return false;
};

const mergeOther = (autoText, manualText) => {
  const a = _norm(autoText);
  const m = _norm(manualText);
  if (a && m) return a === m ? manualText : `${manualText}, ${autoText}`;
  return manualText || autoText || "";
};

/* ========== TableBox (SAFE) ========== */
const TableBox = (
  pdf = new jsPDF(),
  posiStartX = 0,
  posiStartY = 0,
  headers = [],
  body = [],
  heightHeader = 0,
  heightBody = 0,
  FontSize = 0
) => {
  pdf.setFontSize(FontSize);
  let startHeadX = posiStartX;
  let startHeadY = posiStartY;
  const ObjectText = { fontSize: FontSize, fontName: "THSarabunNew" };

  // Header
  const headerArr = Array.isArray(headers) ? headers : [];
  for (let headerData of headerArr) {
    const hName = String(headerData?.name ?? "");
    const hSize = parseInt(headerData?.size ?? 0, 10);
    const endX = startHeadX + hSize;
    const endY = startHeadY + heightHeader;

    const widthText = pdf.getStringUnitWidth(hName) * FontSize;
    const lineHeight = pdf.getTextDimensions(hName, ObjectText).h;

    pdf.line(startHeadX, startHeadY, endX, startHeadY);
    if (!Array.isArray(body) || body.length === 0) pdf.line(startHeadX, endY, endX, endY);
    pdf.line(startHeadX, startHeadY, startHeadX, endY);

    pdf.text(
      hName,
      startHeadX + ((endX - startHeadX) / 2 - widthText / 2),
      startHeadY + (endY - startHeadY) / ((headerData?.headSup ? (headerData.headSup.length + 1) : 1) * 2) + lineHeight / 3.5
    );

    if (headerData?.headSup) {
      const findCenter = startHeadY + (endY - startHeadY) / (headerData.headSup.length + 1);
      const findXCenter = startHeadX + (endX - startHeadX) / (headerData.headSup.length + 1);
      pdf.line(startHeadX, findCenter, endX, findCenter);
      pdf.line(findXCenter, findCenter, findXCenter, findCenter + heightHeader / (headerData.headSup.length + 1));

      let startSubX = startHeadX;
      let endSubX = findXCenter;
      for (let row of headerData.headSup) {
        for (let data of row) {
          const subName = String(data?.name ?? "");
          const widthTextSub = pdf.getStringUnitWidth(subName) * FontSize;
          const lineHeightSub = pdf.getTextDimensions(subName, ObjectText).h;
          pdf.text(
            subName,
            startSubX + ((endSubX - startSubX) / 2 - widthTextSub / 2),
            findCenter + heightHeader / (headerData.headSup.length + 1) - lineHeightSub / 3.5
          );
          const newPosi = endSubX - startSubX;
          startSubX += newPosi;
          endSubX += newPosi;
        }
      }
    }
    startHeadX += hSize;
  }
  pdf.line(startHeadX, startHeadY, startHeadX, startHeadY + heightHeader);

  // Body
  let startBodyY = startHeadY + heightHeader;
  const bodyArr = Array.isArray(body) ? body : [];

  for (let Row of bodyArr) {
    let startBodyX = posiStartX;
    const rowArr = Array.isArray(Row) ? Row : [];

    const splite = rowArr.filter((val) => String(val?.name ?? "").includes("|"));
    const numLine = [];
    let countHeight = 1;
    const maxText = 3;

    if (splite.length !== 0) {
      const list = String(splite[0]?.name ?? "").split("|");
      for (let x = 0; x < list.length; x += maxText) {
        const newArray = list.slice(x, x + maxText);
        numLine.push(newArray.join(""));
      }
      countHeight = numLine.length || 1;
    }

    for (let Body of rowArr) {
      const nameStr = String(Body?.name ?? "");
      const sizeNum = parseInt(Body?.size ?? 0, 10);

      const endX = startBodyX + sizeNum;
      const endY = startBodyY + heightBody * countHeight;

      const widthText = pdf.getStringUnitWidth(nameStr) * FontSize;
      const lineHeight = pdf.getTextDimensions(nameStr, ObjectText).h;

      pdf.line(startBodyX, startBodyY, endX, startBodyY);
      pdf.line(startBodyX, endY, endX, endY);
      pdf.line(startBodyX, startBodyY, startBodyX, endY);

      if (nameStr.includes("|") && countHeight > 1) {
        const list = nameStr.split("|");
        const newSplit = [];
        for (let x = 0; x < list.length; x += maxText) {
          const newArray = list.slice(x, x + maxText);
          newSplit.push(newArray.join(""));
        }
        const Text = newSplit.join("\n");
        pdf.text(Text, startBodyX + 5, startBodyY + 12);
      } else {
        const noPipe = nameStr.split("|").join("");
        pdf.text(
          noPipe,
          startBodyX + ((endX - startBodyX) / 2 - widthText / 2),
          startBodyY + (endY - startBodyY) / 2 + lineHeight / 3.5
        );
      }

      startBodyX += sizeNum;
    }
    pdf.line(startBodyX, startBodyY, startBodyX, startBodyY + heightBody * countHeight);
    startBodyY += heightBody * countHeight;
  }

  pdf.setFontSize(16);
  return startBodyY;
};

const TextBoxHead = (pdf = new jsPDF(), x, y, text, style = {}) => {
  pdf.setFont("THSarabunNew-bold", "bold");
  pdf.text(text, x, y, style);
  pdf.setFont("THSarabunNew", "normal");
};

const DrawCheckBox = (pdf, x, y, text, checked = false, style = "stroke") => {
  pdf.setDrawColor(0, 0, 0);
  pdf.setTextColor(0, 0, 0);
  pdf.setFillColor(0, 0, 0);
  pdf.setLineWidth(1);
  if (style === "fill" && checked) {
    pdf.setFillColor(230, 230, 230);
    pdf.rect(x, y - 8, 6, 6, "F");
    pdf.setFillColor(0, 0, 0);
  } else {
    pdf.rect(x, y - 8, 6, 6, "S");
  }
  if (checked) {
    pdf.line(x + 1.5, y - 5, x + 3.2, y - 3.2);
    pdf.line(x + 3.2, y - 3.2, x + 5.2, y - 7.0);
  }
  pdf.text(text, x + 10, y);
};

/* ========== Normalizers ========== */
const normalizeExportRecord = (raw) => {
  const farmerArr = Array.isArray(raw?.farmer)
    ? raw.farmer
    : raw?.farmer
    ? [raw.farmer]
    : [];

  const dataForm =
    (Array.isArray(raw?.dataform) && raw?.dataform?.[0]) ||
    raw?.dataform ||
    (Array.isArray(raw?.dataForm) && raw?.dataForm?.[0]) ||
    raw?.dataForm ||
    {};

  return {
    farmer: farmerArr,
    dataForm,
    ferti: Array.isArray(raw?.ferti) ? raw.ferti : [],
    chemi: Array.isArray(raw?.chemi) ? raw.chemi : [],
    report: Array.isArray(raw?.report) ? raw.report : [],
    checkForm: Array.isArray(raw?.checkForm) ? raw.checkForm : [],
    checkPlant: Array.isArray(raw?.checkPlant) ? raw.checkPlant : [],
    chart: { selector: "#weather-chart-export" },
    table: { selector: "#weather-table-export" },
  };
};

const buildExportData = (rawFromApi) => {
  const payload = Array.isArray(rawFromApi) ? rawFromApi : [rawFromApi];
  return payload.map(normalizeExportRecord);
};

/* ========== ExportPDF ========== */
const ExportPDF = async (DataInput, opts = {}) => {
  const { mode = "download" } = opts;

  const Data =
    Array.isArray(DataInput) && (DataInput[0]?.dataForm || DataInput[0]?.farmer)
      ? DataInput
      : buildExportData(DataInput);

  const pdf = new jsPDF("portrait", "pt", "a4", { compress: false });

  // ฟอนต์ (ต้องมีไฟล์ในโปรเจกต์)
  pdf.addFileToVFS("/THSarabunNew.ttf");
  pdf.addFont("/THSarabunNew.ttf", "THSarabunNew", "normal");
  pdf.addFont("/THSarabunNewBold.ttf", "THSarabunNew-bold", "bold");
  pdf.setFont("THSarabunNew");

  let PresentRow = 0;
  const width = pdf.internal.pageSize.getWidth();
  const LEFT_COL_RIGHT = width / 2 - 12;

  for (let index in Data) {
    const Export = Data[index];

    pdf.setFontSize(18);
    TextBoxHead(
      pdf,
      width / 2,
      40,
      "แบบบันทึกเกษตรกร ระบบการผลิตพืชผักและสมุนไพรภายใต้มาตรฐาน  GAP  มูลนิธิโครงการหลวง",
      { align: "center" }
    );

    pdf.setFontSize(16);

    // รองรับชื่อคีย์หลายแบบสำหรับชื่อพืช
    const cropTitle =
      Export?.dataForm?.type_main ||
      Export?.dataForm?.type ||
      Export?.dataForm?.name_plant ||
      Export?.dataForm?.plant_name ||
      "ไม่พบพืชนี้ในระบบ";

    TextBoxHead(pdf, width / 2 / 3 + 30, 70, cropTitle);
    TextBoxHead(pdf, width / 2 - 70, 70, "รหัสเกษตรกร");

    // รหัสเกษตรกร
    let startId = width / 2;
    let newX = 0;
    let y7Header = 0;

    for (let x = 0; x < 10; x++) {
      pdf.rect(startId, 57, 20, 20, "S");
      const ch = (Export?.farmer?.[0]?.id_farmer || "")[x] || "";
      if (ch) pdf.text(String(ch), startId + 7, 70);
      if (x === 7) {
        startId += 28;
        pdf.text("_", startId - 7, 65);
      } else startId += 22;
    }

    // ๑
    TextBoxHead(pdf, 30, 100, "๑.");
    TextBoxHead(pdf, 50, 100, "ชื่อ/สกุล เกษตรกร");
    newX = TextBoxDot(pdf, 65, 132, 100, Export?.farmer?.[0]?.fullname || "");

    TextBoxHead(pdf, newX, 100, "ศูนย์ฯ");
    TextBoxDot(pdf, 38, newX + 30, 100, Export?.farmer?.[0]?.station || "");

    // ๒
    TextBoxHead(pdf, 30, 130, "๒.");
    TextBoxHead(pdf, 50, 130, "ชนิดพืช");
    newX = TextBoxDot(pdf, 27, 86, 130, Export?.dataForm?.name_plant || Export?.dataForm?.plant_name || "");

    TextBoxHead(pdf, newX, 130, "รุ่นที่ปลูก");
    newX = TextBoxDot(pdf, 16, newX + 41, 130, (Export?.dataForm?.generation ?? "").toString());

    TextBoxHead(pdf, newX, 130, "วันที่เพาะกล้า");
    newX = TextBoxDot(pdf, 22, newX + 62, 130, fmtTH(Export?.dataForm?.date_glow, true));

    TextBoxHead(pdf, newX, 130, "วันที่ปลูก");
    TextBoxDot(pdf, 22, newX + 42, 130, fmtTH(Export?.dataForm?.date_plant, true));

    TextBoxHead(pdf, 50, 160, "ระยะการปลูก");
    newX = TextBoxDot(pdf, 20, 112, 160, `${Export?.dataForm?.posi_w ?? ""}x${Export?.dataForm?.posi_h ?? ""}`);

    TextBoxHead(pdf, newX, 160, "จำนวนต้น");
    newX = TextBoxDot(pdf, 13, newX + 44, 160, (Export?.dataForm?.qty ?? "").toString());

    TextBoxHead(pdf, newX, 160, "พื้นที่");
    const area = `${(Export?.dataForm?.area ?? "").toString()} ${(Export?.dataForm?.unit ?? "").toString()}`;
    newX = TextBoxDot(pdf, 25, newX + 24, 160, area);

    TextBoxHead(pdf, newX, 160, "วันที่คาดว่าจะเก็บเกี่ยว");
    newX = TextBoxDot(pdf, 16, newX + 103, 160, fmtTH(Export?.dataForm?.date_harvest, true));

    // sync ช่วงเวลาให้กราฟหน้า index render ก่อนแคป
    let chartImg = null, tableImg = null;
    try {
      const plantStr   = Export?.dataForm?.date_plant || "";
      const harvestStr = Export?.dataForm?.date_success || Export?.dataForm?.date_harvest || "";
      const nowMs = Date.now();

      const st = plantStr ? new Date(plantStr).getTime() : null;
      const et = harvestStr ? new Date(harvestStr).getTime() : nowMs;

      if (Number.isFinite(st) && Number.isFinite(et) && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("weather-export:set-range", { detail: { st, et } }));
        await sleep(750);
      }

      const chartSel = Export?.chart?.selector || "#weather-chart-export";
      const tableSel = Export?.table?.selector || "#weather-table-export";
      chartImg = await captureElementToDataURL(chartSel);
      tableImg = await captureElementToDataURL(tableSel);
    } catch (e) {
      console.warn("capture chart/table failed:", e);
    }
    Export.__chartImg = chartImg || null;
    Export.__tableImg = tableImg || null;

    // ๓ ระบบการปลูก
    const y3 = 190;
    TextBoxHead(pdf, 30, y3, "๓.");
    TextBoxHead(pdf, 50, y3, "ระบบการปลูก");

    const sysSetRaw = asSet(Export?.dataForm?.system_glow);
    const { hitLabels: sysHits, otherText: sysOtherAuto } = resolveChecks(sysSetRaw, OPTION_SYNONYMS.system_glow);
    const finalOther = mergeOther(sysOtherAuto, Export?.dataForm?.system_glow_other);

    const sysTitleText = "ระบบการปลูก";
    const sysTitleW = pdf.getStringUnitWidth(sysTitleText) * pdf.getFontSize();
    const SYS_L = 50 + sysTitleW + 20;
    const SYS_R = 410;
    const SYS_DY = 22;

    DrawCheckBox(pdf, SYS_L, y3 + SYS_DY * 0, "ขึ้นแปลงปลูกตามไหล่เขา", isCheckedLabel("ขึ้นแปลงปลูกตามไหล่เขา", sysHits, sysSetRaw));
    DrawCheckBox(pdf, SYS_L, y3 + SYS_DY * 1, "ปลูกแบบพื้นราบ", isCheckedLabel("ปลูกแบบพื้นราบ", sysHits, sysSetRaw));
    DrawCheckBox(pdf, SYS_L, y3 + SYS_DY * 2, "ปลูกในวัสดุปลูก", isCheckedLabel("ปลูกในวัสดุปลูก", sysHits, sysSetRaw));
    DrawCheckBox(pdf, SYS_R, y3 + SYS_DY * 0, "ขึ้นแปลงปลูกในโรงเรือน", isCheckedLabel("ขึ้นแปลงปลูกในโรงเรือน", sysHits, sysSetRaw));
    DrawCheckBox(pdf, SYS_R, y3 + SYS_DY * 1, "ระบบ Hydroponic", isCheckedLabel("ระบบ Hydroponic", sysHits, sysSetRaw));

    const hasOther = _norm(finalOther).length > 0;
    DrawCheckBox(pdf, SYS_R, y3 + SYS_DY * 2, "อื่น ๆ ระบุ", hasOther, "fill");
    {
      const label = "อื่น ๆ ระบุ";
      const fs = pdf.getFontSize();
      const PAD_BOX_TO_TEXT = 10;
      const PAD_AFTER_LABEL = 6;

      const textStart = SYS_R + PAD_BOX_TO_TEXT;
      const labelW = pdf.getStringUnitWidth(label) * fs;
      const startDot = textStart + labelW + PAD_AFTER_LABEL;

      const pageW = pdf.internal.pageSize.getWidth();
      const rightMargin = 28;
      const endDot = pageW - rightMargin;

      const dots = Math.max(10, Math.floor((endDot - startDot) / 4));
      TextBoxDot(pdf, dots, startDot, y3 + SYS_DY * 2, finalOther);
    }

    // ๔ แหล่งน้ำ
    const y4 = y3 + SYS_DY * 3 + 10;
    TextBoxHead(pdf, 30, y4, "๔.");
    TextBoxHead(pdf, 50, y4, "แหล่งน้ำ (ตอบได้มากกว่า ๑ ข้อ)");

    const waterSetRaw = asSet(Export?.dataForm?.water);
    const { hitLabels: waterHits, otherText: waterOtherAuto } = resolveChecks(waterSetRaw, OPTION_SYNONYMS.water);
    const finalWaterOther = mergeOther(waterOtherAuto, Export?.dataForm?.water_other);

    const Xs4_BASE = [80, 200, 320, 420];
    const OFFSET_X = -20;
    const Xs4 = Xs4_BASE.map((x) => x + OFFSET_X);

    const gapY4 = 22;
    let r4 = y4 + 20;

    DrawCheckBox(pdf, Xs4[0], r4, "อาศัยน้ำฝน", isCheckedLabel("อาศัยน้ำฝน", waterHits, waterSetRaw));
    DrawCheckBox(pdf, Xs4[1], r4, "ลำธาร/คลองธรรมชาติ", isCheckedLabel("ลำธาร/คลองธรรมชาติ", waterHits, waterSetRaw));
    DrawCheckBox(pdf, Xs4[2], r4, "บ่อบาดาล", isCheckedLabel("บ่อบาดาล", waterHits, waterSetRaw));
    DrawCheckBox(pdf, Xs4[3], r4, "บ่อ/สระขุด", isCheckedLabel("บ่อ/สระขุด", waterHits, waterSetRaw));
    r4 += gapY4;

    DrawCheckBox(pdf, Xs4[0], r4, "คลองชลประทาน", isCheckedLabel("คลองชลประทาน", waterHits, waterSetRaw));
    DrawCheckBox(pdf, Xs4[1], r4, "อ่างเก็บน้ำ", isCheckedLabel("อ่างเก็บน้ำ", waterHits, waterSetRaw));

    const hasWaterOther = _norm(finalWaterOther).length > 0;
    DrawCheckBox(pdf, Xs4[2], r4, "อื่น ๆ ระบุ", hasWaterOther, "fill");
    {
      const label = "อื่น ๆ ระบุ";
      const PAD_AFTER = 6;
      const fs = pdf.getFontSize();

      const textStart = Xs4[2] + 10;
      const labelW = pdf.getStringUnitWidth(label) * fs;
      const startDot = textStart + labelW + PAD_AFTER;

      const endRight = pdf.internal.pageSize.getWidth() - 28;
      const rawDots = Math.floor((endRight - startDot) / 4);
      const DOT_TRIM = 12;
      const dots = Math.max(6, rawDots - DOT_TRIM);

      TextBoxDot(pdf, dots, startDot, r4, finalWaterOther);
    }

    // ๕ วิธีการให้น้ำ
    const y5 = r4 + 22;
    TextBoxHead(pdf, 30, y5, "๕.");
    TextBoxHead(pdf, 50, y5, "วิธีการให้น้ำ");

    const flowSetRaw = asSet(Export?.dataForm?.water_flow);
    const { hitLabels: flowHits, otherText: flowOtherAuto } = resolveChecks(flowSetRaw, OPTION_SYNONYMS.water_flow);
    const finalFlowOther = mergeOther(flowOtherAuto, Export?.dataForm?.water_flow_other);

    const title5 = "วิธีการให้น้ำ";
    const title5W = pdf.getStringUnitWidth(title5) * pdf.getFontSize();
    let x5 = 50 + title5W + 12;

    const padText5 = 6;
    const gap5 = 10;
    const advance5 = (x0, label) => x0 + 6 + padText5 + pdf.getStringUnitWidth(label) * pdf.getFontSize() + gap5;

    DrawCheckBox(pdf, x5, y5, "สปริงเกอร์", isCheckedLabel("สปริงเกอร์", flowHits, flowSetRaw));
    x5 = advance5(x5, "สปริงเกอร์");

    DrawCheckBox(pdf, x5, y5, "ระบบน้ำหยด", isCheckedLabel("ระบบน้ำหยด", flowHits, flowSetRaw));
    x5 = advance5(x5, "ระบบน้ำหยด");

    DrawCheckBox(pdf, x5, y5, "ปล่อยตามร่อง", isCheckedLabel("ปล่อยตามร่อง", flowHits, flowSetRaw));
    x5 = advance5(x5, "ปล่อยตามร่อง");

    DrawCheckBox(pdf, x5, y5, "ใช้สายยางรด", isCheckedLabel("ใช้สายยางรด", flowHits, flowSetRaw) || isCheckedLabel("ใช้สายยาง", flowHits, flowSetRaw));
    x5 = advance5(x5, "ใช้สายยางรด");

    DrawCheckBox(pdf, x5, y5, "ตักรด", isCheckedLabel("ตักรด", flowHits, flowSetRaw));
    x5 = advance5(x5, "ตักรด");

    const hasFlowOther = _norm(finalFlowOther).length > 0;
    DrawCheckBox(pdf, x5, y5, "อื่น ๆ ระบุ", hasFlowOther, "fill");

    const otherLabelW = pdf.getStringUnitWidth("อื่น ๆ ระบุ") * pdf.getFontSize();
    const dotStart5 = x5 + 6 + padText5 + otherLabelW + 6;
    const dotCount5 = Math.max(10, Math.floor((LEFT_COL_RIGHT - 6 - dotStart5) / 4));
    TextBoxDot(pdf, dotCount5, dotStart5, y5, finalFlowOther);

    // ๖ ประวัติ/โรค/ระดับ/ป้องกัน
    const y6 = y5 + 22;
    TextBoxHead(pdf, 30, y6, "๖.");
    TextBoxHead(pdf, 50, y6, "ประวัติการใช้พื้นที่และการเกิดโรคระบาด ชนิดพืชก่อนหน้านี้");

    let y = y6 + 20;

    TextBoxHead(pdf, 50, y, "ชนิดพืชที่ปลูก");
    let nx = TextBoxDot(pdf, 30, 114, y, (Export?.dataForm?.history || "").toString());

    TextBoxHead(pdf, nx, y, "โรค/แมลงที่พบ");
    nx = TextBoxDot(pdf, 34, nx + 69, y, (Export?.dataForm?.insect || Export?.dataForm?.history || "").toString());

    y += 22;

    const qtyStr = (Export?.dataForm?.qtyInsect || "").toString();
    const hasQty = (k) => qtyStr.includes(k);

    const padText = 10;
    const gapCheck = 14;
    const advance = (x0, label) => x0 + 6 + padText + pdf.getStringUnitWidth(label) * pdf.getFontSize() + gapCheck;

    let x = 50;

    DrawCheckBox(pdf, x, y, "มาก", hasQty("มาก"));
    x = advance(x, "มาก");

    DrawCheckBox(pdf, x, y, "ปานกลาง", hasQty("ปานกลาง"));
    x = advance(x, "ปานกลาง");

    DrawCheckBox(pdf, x, y, "น้อย", hasQty("น้อย"));
    x = advance(x, "น้อย");

    const labelPrev = "การป้องกันกำจัด";
    const labelPrevW = pdf.getStringUnitWidth(labelPrev) * pdf.getFontSize();
    const xPrev = x + 20;
    TextBoxHead(pdf, xPrev, y, labelPrev);

    const dotStart = xPrev + labelPrevW;
    const available = Math.max(0, LEFT_COL_RIGHT - dotStart);
    let prevDots = Math.floor(available / 4) + 30;
    prevDots = Math.max(6, prevDots);

    TextBoxDot(pdf, prevDots, dotStart, y, (Export?.dataForm?.prevent || Export?.dataForm?.solution || "").toString());

    PresentRow = y + 30;

    // ๗ ข้อแนะนำ
    y7Header = PresentRow;
    TextBoxHead(pdf, 30, PresentRow, "๗.");
    TextBoxHead(pdf, 50, PresentRow, "ข้อแนะนำจากที่ปรึกษา (ส่วนนี้สำหรับเจ้าหน้าที่)");
    PresentRow = y7Header + 16;

    const reports = Array.isArray(Export?.report) ? Export.report : [];

    const LABEL_FS = 14;
    const KEEP_FS = pdf.getFontSize();
    const GAP_AFTER = 0;
    const DOT_MARGIN = 8;
    const DOT_TRIM_ADVICE = 1;
    const DOT_TRIM_SIGN = 30;
    const DOT_TRIM_DATE = 6;

    const measureBold = (text, fs) => {
      pdf.setFont("THSarabunNew-bold", "bold");
      pdf.setFontSize(fs);
      const w = pdf.getStringUnitWidth(text) * fs;
      pdf.setFont("THSarabunNew", "normal");
      pdf.setFontSize(KEEP_FS);
      return w;
    };

    const rowGap = 32;

    for (let i = 0; i < 2; i++) {
      const labelAdvice = `ครั้งที่ ${i + 1}  คำแนะนำ`;
      const labelX = 50;
      const labelW = measureBold(labelAdvice, LABEL_FS);

      pdf.setFontSize(LABEL_FS);
      TextBoxHead(pdf, labelX, PresentRow, labelAdvice);
      pdf.setFontSize(KEEP_FS);

      const adviceStartX = labelX + labelW + GAP_AFTER;
      let adviceDots = Math.floor((LEFT_COL_RIGHT - DOT_MARGIN - adviceStartX) / 4) - DOT_TRIM_ADVICE;
      if (adviceDots < 0) adviceDots = 0;

      const adviceText = reports[i]?.report_text || "";
      TextBoxDot(pdf, adviceDots, adviceStartX, PresentRow, adviceText);

      const y2 = PresentRow + 20;

      const labelSign = "ลงชื่อ";
      const signLabelX = 50;
      const signLabelW = measureBold(labelSign, LABEL_FS);

      pdf.setFontSize(LABEL_FS);
      TextBoxHead(pdf, signLabelX, y2, labelSign);
      pdf.setFontSize(KEEP_FS);

      const signStartX = signLabelX + signLabelW + GAP_AFTER;
      let signDots = Math.floor((LEFT_COL_RIGHT - DOT_MARGIN - signStartX) / 4) - DOT_TRIM_SIGN;
      if (signDots < 0) signDots = 0;

      const name = reports[i]?.advisor_name || reports[i]?.name_doctor || "";
      const endX = TextBoxDot(pdf, signDots, signStartX, y2, name);

      const wdpX = endX;
      const wdpW = measureBold("/ว/ด/ป", LABEL_FS);

      pdf.setFontSize(LABEL_FS);
      TextBoxHead(pdf, wdpX, y2, "/ว/ด/ป");
      pdf.setFontSize(KEEP_FS);

      const rawDate = reports[i]?.date_report || reports[i]?.date || "";
      const dateStr = fmtTH(rawDate, true);

      const dateStartX = wdpX + wdpW + 2;
      let dateDots = Math.floor((LEFT_COL_RIGHT - DOT_MARGIN - dateStartX) / 4) - DOT_TRIM_DATE;
      if (dateDots < 0) dateDots = 0;

      const endDateX = TextBoxDot(pdf, dateDots, dateStartX, y2, dateStr);

      pdf.setFontSize(LABEL_FS);
      TextBoxHead(pdf, endDateX, y2, "(ที่ปรึกษาเกษตรกร)");
      pdf.setFontSize(KEEP_FS);

      PresentRow = y2 + rowGap;
    }

    // ๘ ตรวจสอบก่อนเก็บเกี่ยว
    {
      const _fs = pdf.getFontSize();
      pdf.setFontSize(14);

      TextBoxHead(pdf, 30, PresentRow, "๘.");
      TextBoxHead(pdf, 50, PresentRow, "ผลตรวจสอบแบบบันทึกก่อนการเก็บเกี่ยวผลผลิต จากหมอพืช");

      pdf.setFontSize(_fs);
      PresentRow += 14;

      const rawStatus = Export?.checkForm?.[0]?.status_check;
      const isPass = rawStatus === true || rawStatus === "ผ่าน" || rawStatus === "true" || rawStatus === 1 || rawStatus === "1";
      const isFail = rawStatus === false || rawStatus === "ไม่ผ่าน" || rawStatus === "false" || rawStatus === 0 || rawStatus === "0";

      DrawCheckBox(pdf, 160, PresentRow, "ผ่าน",   isPass);
      DrawCheckBox(pdf, 220, PresentRow, "ไม่ผ่าน", isFail);

      const FIX_LABEL = "การแก้ไข";
      const fixX = 50;
      const fixY = PresentRow + 16;
      const fs = pdf.getFontSize();
      const PAD = 6;

      TextBoxHead(pdf, fixX, fixY, FIX_LABEL);

      const labelW = pdf.getStringUnitWidth(FIX_LABEL) * fs;
      const startDot = fixX + labelW + PAD;
      const endDot = LEFT_COL_RIGHT - 8;
      let dotCount = Math.floor((endDot - startDot) / 4);
      dotCount = Math.max(6, dotCount - 2);

      TextBoxDot(pdf, dotCount, startDot, fixY, Export?.checkForm?.[0]?.note_text || "");

      const shiftX = 40;
      const sigY = fixY + 30;
      const sigX = 148 + shiftX;

      TextBoxDot(pdf, 25, sigX, sigY, "");
      TextBoxHead(pdf, sigX, sigY + 18, "(............................)");
      TextBoxHead(pdf, sigX, sigY + 36, "ลงชื่อเจ้าหน้าที่หมอพืช");

      const dcRaw = Export?.checkForm?.[0]?.date_check || "";
      const dcStr = fmtTH(dcRaw, true);

      const dateY = sigY + 56;
      const dateLabel = "ว/ด/ป";
      const dateX = 140 + shiftX;
      TextBoxHead(pdf, dateX, dateY, dateLabel);

      const fsLabel = pdf.getFontSize();
      const labelWDate = pdf.getStringUnitWidth(dateLabel) * fsLabel;
      const dateStart = dateX + labelWDate + 3;

      TextBoxDot(pdf, 20, dateStart, dateY, dcStr);

      PresentRow = dateY + 40;
    }

    // ๙ ผลวิเคราะห์สารตกค้าง
    const y9 = y7Header || 190;
    let body = [];
    let headers = [
      { name: "ครั้งที่", size: 24 },
      { name: "วันที่วิเคราะห์", size: 52 },
      { name: "ผลวิเคราะห์", size: 72, headSup: [[{ name: "ก่อน", size: 36 }, { name: "หลัง", size: 36 }]] },
      { name: "ผู้วิเคราะห์", size: 56 },
      { name: "หมายเหตุ", size: 52 },
    ];

    for (let i = 0; i < 15; i++) {
      const DataRow = Export?.checkPlant?.[i];
      if (DataRow) {
        const dateStr = fmtTH(DataRow.date_check);
        body.push([
          { name: (i + 1).toString(), size: 24 },
          { name: dateStr, size: 52 },
          { name: !DataRow.state_check ? String(DataRow.status_check ?? "") : "", size: 36 },
          { name:  DataRow.state_check ? String(DataRow.status_check ?? "") : "", size: 36 },
          { name: (DataRow.name_doctor || "").split(" ")[0], size: 56 },
          { name: DataRow.note_text || "", size: 52 },
        ]);
      } else {
        body.push([
          { name: (i + 1).toString(), size: 24 },
          { name: "", size: 52 },
          { name: "", size: 36 },
          { name: "", size: 36 },
          { name: "", size: 56 },
          { name: "", size: 52 },
        ]);
      }
    }

    const tableW = headers.reduce((s, h) => s + parseInt(h.size, 10), 0);
    const RIGHT_MARGIN = 12;
    const startX9 = width - RIGHT_MARGIN - tableW;

    TextBoxHead(pdf, startX9 - 20, y9, "๙.");
    TextBoxHead(pdf, startX9, y9, "ผลการวิเคราะห์สารตกค้างในผลผลิต ก่อน/หลังการเก็บเกี่ยว");

    const HEADER_H = 28;
    const ROW_H = 18;
    const FONT = 12;
    TableBox(pdf, startX9, y9 + 8, headers, body, HEADER_H, ROW_H, FONT);

    /* ---------- หน้า 2 ---------- */
    pdf.addPage();
    pdf.setFontSize(16);
    let presentFactor = 0;
    let oldDay = "";
    body = [];

    // ๑๐ สารเคมี
    TextBoxHead(pdf, 30, 40, "๑๐.");
    TextBoxHead(pdf, 50, 40, "แบบบันทึกการใช้สารเคมีกำจัดศัตรูพืชทางการเกษตร");
    headers = [
      { name: "ว/ด/ป ที่ใช้", size: 40 },
      { name: "ชื่อสิ่งที่ใช้(ชื่อการค้า)", size: 103 },
      { name: "ชื่อสามัญสารเคมี", size: 103 },
      { name: "ศัตรูพืชที่พบ", size: 55 },
      { name: "วิธีการใช้", size: 55 },
      { name: "อัตราที่ผสม", size: 45 },
      { name: "ปริมาณทั้งหมด", size: 60 },
      { name: "วันที่ปลอดภัย", size: 50 },
      { name: "แหล่งที่ซื้อ", size: 75 },
    ];

    for (let i in Export?.chemi) {
      const DataRow = Export.chemi[i];
      if (DataRow) {
        const dUse  = (DataRow.date || "").toString().split(" ")[0];
        const dSafe = (DataRow.date_safe || "").toString().split(" ")[0];
        const safeUse  = dUse  ? fmtTH(dUse, true)  : "";
        const safeSafe = dSafe ? fmtTH(dSafe, true) : "";
        const formula = DataRow.formula_name ?? DataRow.formulaName ?? "";
        const volStr  = (DataRow.volume ?? "").toString();

        body.push([
          { name: oldDay === dUse.split("-").join("") ? "" : safeUse, size: 40 },
          { name: DataRow.name || "", size: 103 },
          { name: formula, size: 103 },
          { name: DataRow.insect || "", size: 55 },
          { name: DataRow.use_is || "", size: 55 },
          { name: DataRow.rate || "", size: 45 },
          { name: volStr, size: 60 },
          { name: safeSafe, size: 50 },
          { name: DataRow.source || "", size: 75 },
        ]);
        oldDay = (dUse || "").split("-").join("");
      }
    }

    presentFactor = TableBox(pdf, 5, 50, headers, body, 20, 20, 12) + 30;

    // ๑๑ ปัจจัยการผลิต
    TextBoxHead(pdf, 30, presentFactor, "๑๑.");
    TextBoxHead(
      pdf,
      50,
      presentFactor,
      "แบบบันทึกการใช้ปัจจัยการผลิต (ได้แก่ ปุ๋ยเคมี ปุ๋ยหมัก ปุ๋ยคอก ปุ๋ยอินทรีย์ ปุ้ยเกร็ด และปุ๋ยน้ำหมักชีวภาพ)"
    );
    headers = [
      { name: "ว/ด/ป ที่ใช้", size: 40 },
      { name: "ชื่อสิ่งที่ใช้(ชื่อการค้า / ตรา)", size: 135 },
      { name: "ชื่อสูตรปุ๋ย", size: 135 },
      { name: "วิธีการใช้", size: 90 },
      { name: "ปริมาณที่ใช้", size: 90 },
      { name: "แหล่งที่ซื้อ", size: 95 },
    ];

    oldDay = "";
    body = [];
    for (let i in Export?.ferti) {
      const DataRow = Export.ferti[i];
      if (DataRow) {
        const dUse  = (DataRow.date || "").toString().split(" ")[0];
        const safeUse = dUse ? fmtTH(dUse, true) : "";
        const formula = DataRow.formula_name ?? DataRow.formulaName ?? "";
        const volStr  = (DataRow.volume ?? "").toString();

        body.push([
          { name: oldDay === dUse.split("-").join("") ? "" : safeUse, size: 40 },
          { name: DataRow.name || "", size: 135 },
          { name: formula, size: 135 },
          { name: DataRow.use_is || "", size: 90 },
          { name: volStr, size: 90 },
          { name: DataRow.source || "", size: 95 },
        ]);
        oldDay = (dUse || "").split("-").join("");
      }
    }
    presentFactor = TableBox(pdf, 5, presentFactor + 10, headers, body, 20, 20, 12) + 30;

    // ลายเซ็น
    TextBoxHead(pdf, 30, presentFactor, "ลงชื่อ");
    const farmer_name_posi = TextBoxDot(pdf, 35, 50, presentFactor, Export.farmer ? (Export.farmer[0]?.fullname || "") : "");
    TextBoxHead(pdf, farmer_name_posi, presentFactor, "เกษตรกร");

    TextBoxHead(pdf, width / 2 + 55, presentFactor, "ลงชื่อ");
    const check_posi = TextBoxDot(pdf, 30, width / 2 + 83, presentFactor, "");
    TextBoxHead(pdf, check_posi, presentFactor, "ผู้ตรวจประเมิน");

    TextBoxHead(pdf, width / 2 + 40, presentFactor + 30, "ลงชื่อ");
    const check_boss_posi = TextBoxDot(pdf, 30, width / 2 + 67, presentFactor + 30, "");
    TextBoxHead(pdf, check_boss_posi, presentFactor + 30, "หัวหน้าผู้ตรวจประเมิน");
    // ถ้า formsOnly และยังมีระเบียนถัดไป ให้คั่นหน้าเลยตรงนี้
    const isLastRecord = parseInt(index, 10) + 1 === Data.length;
    if (formsOnly && !isLastRecord) {
      pdf.addPage();
    }

    /* ------------------------- กราฟสภาพแวดล้อมใต้ข้อ ๑๑ ------------------------- */
    if (!formsOnly) {
      const meta = (typeof window !== "undefined" && window.__weatherMeta)
        || await waitForEvent("weather-export:meta", { timeout: 3000 })
        || {};
      const hasDevice = meta.hasDevice === true;
      {
        // ให้กราฟเริ่มที่หน้าใหม่หลังจบตารางทั้งหมด (นี่จะกลายเป็นหน้า 3)
        const titleFrom = Export?.dataForm?.date_plant
          ? new Date(Export.dataForm.date_plant).toLocaleDateString("th-TH")
          : "";
        const titleTo = (Export?.dataForm?.date_success || Export?.dataForm?.date_harvest)
          ? new Date(Export.dataForm.date_success || Export.dataForm.date_harvest).toLocaleDateString("th-TH")
          : "";


        const charts = (chartImages || []).filter(Boolean);
        if (!hasDevice) {
          // 2) ไม่มี device_id → แจ้งข้อความแทนกราฟ
          pdf.addPage();
          const PAGE_LEFT = 24;
          const PAGE_RIGHT = pdf.internal.pageSize.getWidth() - 30;
          const IMG_W = PAGE_RIGHT - PAGE_LEFT;
          const CHART_H = 220;
          const yGraph = 40;
          pdf.setDrawColor(180);
          pdf.rect(PAGE_LEFT, yGraph, IMG_W, CHART_H);
          pdf.setFontSize(12);
          pdf.text("ไม่สามารถแสดงกราฟได้เนื่องจากไม่พบอุปกรณ์ในโรงเรือน", PAGE_LEFT + IMG_W / 2, 60 + CHART_H / 2, { align: "center" });
          pdf.setFontSize(16);
        } if (charts.length) {
          // วาดทีละ 2 กราฟต่อหน้า (ฟังก์ชันนี้จะ addPage ให้เอง)
          drawChartsAtEnd(pdf, charts, { scale: 0.8, top: 54, gap: 18, titleFrom, titleTo });
        } else {
          // fallback เมื่อไม่มีรูปกราฟใด ๆ
          pdf.addPage();
          const PAGE_LEFT = 24;
          const PAGE_RIGHT = pdf.internal.pageSize.getWidth() - 30;
          const IMG_W = PAGE_RIGHT - PAGE_LEFT;
          const CHART_H = 220;
          const yGraph = 40;
          pdf.setDrawColor(180);
          pdf.rect(PAGE_LEFT, yGraph, IMG_W, CHART_H);
          pdf.setFontSize(12);
          pdf.text("ไม่มีข้อมูลสำหรับกราฟนี้", PAGE_LEFT + IMG_W / 2, 60 + CHART_H / 2, { align: "center" });
          pdf.setFontSize(16);
        }

      presentFactor = yGraph + CHART_H;
    }

    if (parseInt(index, 10) + 1 !== Data.length) pdf.addPage();
  }

  // output
  const filename = `${new Date().getDate()}_${new Date().getMonth()}_${new Date().getFullYear()}.pdf`;

  if (mode === "url") {
    const blob = pdf.output("blob");
    return URL.createObjectURL(blob);
  }
  if (mode === "datauri") {
    return pdf.output("datauristring");
  }

  try {
    await tryDownloadWithLiff(pdf, filename);
  } catch {
    pdf.save(filename);
  }
};

/* ========== ExportExcel ========== */
const Mount = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

const ExportExcel = async (excelData = []) => {
  const filetype = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  const fileExtension = ".xlsx";

  const normalized = Array.isArray(excelData) && (excelData[0]?.dataForm || excelData[0]?.farmer)
    ? excelData
    : buildExportData(excelData);

  const nameSpace = new Set(normalized.map((val) => val.dataForm.name_plant || val.dataForm.plant_name));
  const DataWs = normalized.map((val) => {
    const DatePlant = (val.dataForm.date_plant || "").split(" ")[0].split("-");
    const DateSuccess = val.dataForm.date_success ? val.dataForm.date_success.split(" ")[0].split("-") : "";

    const DataExport = {
      plant: val.dataForm.name_plant || val.dataForm.plant_name || "",
      "ชื่อเกษตรกร": (val.farmer?.[0]?.fullname || "").toString().trim(),
      "รหัสเกษตรกร": (val.farmer?.[0]?.id_farmer || "").toString().trim(),
      "วันที่เริ่มปลูก": DatePlant.length === 3
        ? `${DatePlant[2]}-${Mount[parseInt(DatePlant[1], 10)]}-${(parseInt(DatePlant[0], 10) + 543).toString().slice(2)}`
        : "",
      "วันที่ส่งผลผลิต": Array.isArray(DateSuccess) && DateSuccess.length === 3
        ? `${DateSuccess[2]}-${Mount[parseInt(DateSuccess[1], 10)]}-${(parseInt(DateSuccess[0], 10) + 543).toString().slice(2)}`
        : "ยังไม่ทำการเก็บเกี่ยว",
      "จำนวนต้น": val.dataForm.qty ?? "",
    };

    if ((val.chemi || []).length !== 0) {
      DataExport["สารเคมี"] = "|";
      for (let indexChemi in val.chemi) {
        const row = val.chemi[indexChemi];
        const DateUse = (row.date || "").split(" ")[0].split("-");
        DataExport[`วันเดือนปี ${parseInt(indexChemi, 10) + 1}`] =
          DateUse.length === 3
            ? `${DateUse[2]}-${Mount[parseInt(DateUse[1], 10)]}-${(parseInt(DateUse[0], 10) + 543).toString().slice(2)}`
            : "";
        DataExport[`โรคที่พบ ${parseInt(indexChemi, 10) + 1}`] = row.insect || "";
        DataExport[`การป้องกัน ${parseInt(indexChemi, 10) + 1}`] = `กำจัด${row.insect || ""}`;
        DataExport[`สารเคมี ${parseInt(indexChemi, 10) + 1}`] = row.formula_name ?? row.formulaName ?? "";
        DataExport[`วิธีการใช้ ${parseInt(indexChemi, 10) + 1}`] = row.use_is || "";
        DataExport[`อัตราผสม ${parseInt(indexChemi, 10) + 1} (cc/L)`] = row.rate || "";
        DataExport[`ปริมาณที่ใช้ ${parseInt(indexChemi, 10) + 1} (cc)`] = row.volume ?? "";
      }
    }

    if ((val.ferti || []).length !== 0) {
      DataExport["ปัจจัยการผลิต"] = "|";
      for (let indexFerti in val.ferti) {
        const row = val.ferti[indexFerti];
        const DateUse = (row.date || "").split(" ")[0].split("-");
        DataExport[`วดป. ${parseInt(indexFerti, 10) + 1}`] =
          DateUse.length === 3
            ? `${DateUse[2]}-${Mount[parseInt(DateUse[1], 10)]}-${(parseInt(DateUse[0], 10) + 543).toString().slice(2)}`
            : "";
        DataExport[`ปัจจัย ${parseInt(indexFerti, 10) + 1}`] = row.name || "";
        DataExport[`สูตร ${parseInt(indexFerti, 10) + 1}`] = row.formula_name ?? row.formulaName ?? "";
        DataExport[`วิธีใช้ ${parseInt(indexFerti, 10) + 1}`] = row.use_is || "";
        DataExport[`ปริมาณ ${parseInt(indexFerti, 10) + 1}`] = row.volume ?? "";
      }
    }

    return DataExport;
  });

  const DataSheets = {};
  nameSpace.forEach((name) => {
    const DataInWs = DataWs.filter((val) => val.plant === name).map((val, key) => {
      // eslint-disable-next-line no-param-reassign
      delete val.plant;
      return { "ลำดับที่": key + 1, ...val };
    });
    const ws = XLSX.utils.json_to_sheet(DataInWs);
    let stateColume = "";
    for (let x of Object.entries(ws)) {
      if (x[0][x[0].length - 1] == 1 && isNaN(x[0][x[0].length - 2])) {
        if (ws[x[0]].v === "ลำดับที่") stateColume = "";
        else if (ws[x[0]].v === "สารเคมี") stateColume = "c";
        else if (ws[x[0]].v === "ปัจจัยการผลิต") stateColume = "f";

        const colorFill =
          stateColume === ""
            ? { bgColor: { rgb: "81f6e0" }, fgColor: { rgb: "81f6e0" } }
            : stateColume === "c"
            ? { bgColor: { rgb: "FFFF00" }, fgColor: { rgb: "FFFF00" } }
            : stateColume === "f"
            ? { bgColor: { rgb: "1DFF83" }, fgColor: { rgb: "1DFF83" } }
            : {};

        ws[x[0]].s = {
          font: { bold: true, name: "TH SarabunPSK" },
          alignment: { vertical: "center", horizontal: "center", wrapText: false },
          fill: colorFill,
        };
      } else if (x[0] !== "!ref") {
        ws[x[0]].s = {
          font: { name: "TH SarabunPSK" },
          alignment: { vertical: "center", horizontal: "center", wrapText: false },
        };
      }
    }
    DataSheets[name] = ws;
  });

  const wb = { Sheets: DataSheets, SheetNames: [...nameSpace] };
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

  const data = new Blob([excelBuffer], { type: filetype });
  const filename = `${new Date().toLocaleDateString("th-TH")}${fileExtension}`;
  FileSaver.saveAs(data, filename);
};

export { ExportPDF, ExportExcel };
