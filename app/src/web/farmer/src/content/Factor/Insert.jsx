import TemplatePopup from "./templatePopup";

const InsertFactorData = ({
    setPopup,
    RefPop,
    type_path,
    ReloadData,
    greenhouse_id,
    gap_id,
}) => {
    return(
        <TemplatePopup
            setPopup={setPopup}
            RefPop={RefPop}
            type_path={type_path}
            ReloadData={ReloadData}
            greenhouse_id={greenhouse_id}
            gap_id={gap_id}
        />
    )
};

export default InsertFactorData;