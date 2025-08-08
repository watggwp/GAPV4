import React, { useCallback } from "react";
import "./EcphForm.scss";
import { useNavigate, useParams } from "react-router";
import EcPhManagement from "../../../../../assets/components/ecph-management";
import { Stack } from "@mui/material";

const EcphForm = () => {
    const { greenhouse_id , gap_id } = useParams()
    const navigator = useNavigate()

    const onReturnMenu = useCallback(() => 
        navigator(`/farmer/form/${greenhouse_id}/${gap_id}/p`)
    , [gap_id, greenhouse_id, navigator])

    return (
        <section id="ecph-form-page">
            <div className="head">
                <div
                    className="return"
                    onClick={onReturnMenu}
                >
                    <svg fill="#000000" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
                        <g fillRule="evenodd">
                            <path d="M1052 92.168L959.701 0-.234 959.935 959.701 1920l92.299-92.43-867.636-867.635L1052 92.168Z" />
                            <path d="M1920 92.168L1827.7 0 867.766 959.935 1827.7 1920l92.3-92.43-867.64-867.635L1920 92.168Z" />
                        </g>
                    </svg>
                </div>
                <span>บันทึกค่า EC / pH</span>
            </div>

            <Stack
                height={"calc(100% - 60px)"}
                width={"95%"}
                maxWidth={"350px"}
            >
                <EcPhManagement
                    gap_id={gap_id}
                    role={"farmer"}
                />
            </Stack>
        </section>
    );
};

export default EcphForm;
