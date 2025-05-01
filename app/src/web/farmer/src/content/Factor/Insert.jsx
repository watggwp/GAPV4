import TemplatePopup from "./templatePopup";

const InsertFactorData = ({
    setPopup,
    RefPop,
    type_path,
    ReloadData,
}) => {
    return(
        <TemplatePopup
            setPopup={setPopup}
            RefPop={RefPop}
            type_path={type_path}
            ReloadData={ReloadData}
        />
    )
};

export default InsertFactorData;