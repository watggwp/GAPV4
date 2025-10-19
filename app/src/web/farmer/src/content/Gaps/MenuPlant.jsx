import React, { useCallback, useEffect, useRef, useState } from "react";
import "./Menu.scss";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { CloseAccount } from "../../method";
import { useNavigate, useParams } from "react-router";
import { useGreenhouse } from "..";
import env from "../../../../../env";
import { Chip, Stack, Typography } from "@mui/material";

// ✅ import ไอคอน PDF จาก assets
import pdfIcon from "../../../../../assets/img/iconBt/PDF.png";

const {
  path_icon: { sensor_greenhouse_bg, pump },
} = env;

const MenuPlant = () => {
  const { greenhouse_id, gap_id } = useParams();
  const navigator = useNavigate();
  const { setCurrentPage } = useGreenhouse();
  const NavBody = useRef();
  const [DotReport, setDotReport] = useState([]);

  const FetchCheck = useCallback(async () => {
    try {
      const result = await clientMo.get(
        `/api/farmer/report/check?id_farmhouse=${greenhouse_id}&id_plant=${gap_id}`
      );
      if (await CloseAccount(result, setCurrentPage)) {
        let parsed = typeof result === "string" ? JSON.parse(result) : result;
        if (!Array.isArray(parsed)) parsed = [parsed];

        const cleaned = parsed.map((item) => {
          const obj = {};
          Object.keys(item).forEach((key) => {
            if (item[key] !== 0 && item[key] !== "0" && item[key] !== null) {
              obj[key] = item[key];
            }
          });
          return obj;
        });

        setDotReport(cleaned);
      }
    } catch (err) {
      console.error("❌ FetchCheck error:", err);
    }
  }, [gap_id, greenhouse_id, setCurrentPage]);

  useEffect(() => {
    FetchCheck();
  }, [FetchCheck]);

  // ✅ ปุ่มเมนูนำทาง
  const selectMenu = useCallback(
    async (page) => {
      const basePath = `/farmer/form/${greenhouse_id}/${gap_id}`;
      const pages = {
        gap_data: `${basePath}/d`,
        fertilizer: `${basePath}/z`,
        chemical: `${basePath}/c`,
        success: `${basePath}/s/h`,
        "ec/ph": `${basePath}/ec-ph`,
        pump: `${basePath}/pump`,
        sensor: `${basePath}/sensor`,
        report: `${basePath}/r`,
        pdf: `${basePath}/pdf`, // ✅ เส้นทาง PDF
      };
      navigator(pages[page] || basePath);
    },
    [gap_id, greenhouse_id, navigator]
  );

  return (
    <section ref={NavBody} className="nav-first">
      <div className="all-menu">
        <div className="head">Menu</div>

        {/* แถว 1 */}
        <div className="row">
          <div onClick={() => selectMenu("gap_data")} className="frame-menu frame-plant">
            <div className="img">
              <img src="/plant_glow.jpg" alt="plant" />
            </div>
            <span>ข้อมูลการปลูก</span>
            {DotReport[0]?.checkEditPlant ? <div className="dot-someting"></div> : null}
          </div>

          <div onClick={() => selectMenu("fertilizer")} className="frame-menu frame-ferti">
            <div className="img">
              <img src="/fertilizer.jpg" alt="fertilizer" />
            </div>
            <span>บันทึกปุ๋ย</span>
            {DotReport[0]?.checkEditFertilizer ? <div className="dot-someting"></div> : null}
          </div>
        </div>

        {/* แถว 2 */}
        <div className="row">
          <div onClick={() => selectMenu("chemical")} className="frame-menu frame-chemi">
            <div className="img">
              <img src="/chemical.jpg" alt="chemical" />
            </div>
            <span>สารเคมีที่ใช้</span>
            {DotReport[0]?.checkEditChemical ? <div className="dot-someting"></div> : null}
          </div>

          <div onClick={() => selectMenu("success")} className="frame-menu frame-success">
            <div className="img">
              <img src="/เก็บ.png" alt="harvest" />
            </div>
            <span>การเก็บเกี่ยว</span>
            {DotReport[0]?.success || DotReport[0]?.form || DotReport[0]?.plant ? (
              <div className="dot-someting"></div>
            ) : null}
          </div>
        </div>

        {/* แถว 3 — ซ้าย: EC/pH + PDF (แนวตั้ง) / ขวา: ปั๊มน้ำ */}
        <div className="row row-twoCols">
          {/* คอลัมน์ซ้าย */}
          <div className="stack">
            <div onClick={() => selectMenu("ec/ph")} className="frame-menu frame-ecph">
              <div className="img">
                <img src="/ecph.png" alt="ecph" />
              </div>
              <span>EC/pH</span>
              {DotReport[0]?.checkEditSoil ? <div className="dot-someting"></div> : null}
            </div>

            <div onClick={() => selectMenu("pdf")} className="frame-menu frame-pdf">
              <div className="img">
                <img src={pdfIcon} alt="PDF Icon" />
              </div>
              <span>PDF</span>
              {DotReport[0]?.checkPdf ? <div className="dot-someting"></div> : null}
            </div>
          </div>

          {/* คอลัมน์ขวา */}
          <div>
            <div onClick={() => selectMenu("pump")} className="frame-menu frame-pump">
              <div className="img" style={{ backgroundColor: "white" }}>
                <img src={pump} alt="pump" />
              </div>
              <span>ปั๊มน้ำ</span>
              {DotReport[0]?.checkEditSensor ? <div className="dot-someting"></div> : null}
            </div>
          </div>
        </div>

        {/* เมนู Sensor */}
        <Stack
          borderRadius={4}
          direction={"row"}
          width={"calc(100% - 28px)"}
          maxWidth={"300px"}
          justifyContent={"start"}
          alignItems={"center"}
          padding={2}
          onClick={() => selectMenu("sensor")}
          sx={{
            backgroundImage: `url(${sensor_greenhouse_bg})`,
            backgroundSize: "100%",
            backgroundPositionY: "-40px",
          }}
        >
          <Stack>
            <Chip
              label={
                <Typography color="primary" fontWeight={900} fontSize={"24px"}>
                  สภาพอากาศ
                </Typography>
              }
              sx={{ bgcolor: "white" }}
            />
            <Chip
              label={
                <Typography color="primary" fontWeight={900} fontSize={"24px"}>
                  ในโรงเรือน
                </Typography>
              }
              sx={{ marginTop: 1, bgcolor: "white" }}
            />
          </Stack>
        </Stack>

        {/* รายงาน */}
        <div className="report-farm" onClick={() => selectMenu("report")}>
          <img src="/report.png" alt="report" />
          {DotReport[0]?.report ? <div className="dot-someting"></div> : null}
        </div>
      </div>
    </section>
  );
};

export default MenuPlant;
