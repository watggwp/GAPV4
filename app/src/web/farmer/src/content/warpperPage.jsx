import { useCallback, useEffect, useState } from "react";
import { CloseAccount } from "../method";
import { useGreenhouse } from ".";
import { clientMo } from "../../../../assets/js/moduleClient";
import { useParams } from "react-router";

export default function GreenhouseWrapper({
    element , namepage
}) {
    const { greenhouse_id , gap_id } = useParams()
    const { setCurrentPage } = useGreenhouse()

    const verifiedAuthorize = useCallback( async () => {
        const result = (
            gap_id === undefined ? 
                await clientMo.post("/api/farmer/account/check") :
                await clientMo.post("/api/farmer/formplant/check" , {id_farmhouse : greenhouse_id , id_form_plant : gap_id})
        )
        await CloseAccount(result , setCurrentPage)
    } , [gap_id, greenhouse_id, setCurrentPage])

    useEffect(() => {
        setCurrentPage(namepage)
        verifiedAuthorize()
    } , [namepage, setCurrentPage, verifiedAuthorize])

    return(element)
}