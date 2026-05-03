import TemplatePopup from "./templatePopup"

const EditFactorData = ({
    setPopup , 
    RefPop , 
    type_path , 
    ReloadData , 
    ObjectData
}) => {
    return(
        <TemplatePopup
            setPopup={setPopup}
            RefPop={RefPop}
            type_path={type_path}
            ReloadData={ReloadData}
            editDefaultField={ObjectData}
        />
    )
}

export default EditFactorData