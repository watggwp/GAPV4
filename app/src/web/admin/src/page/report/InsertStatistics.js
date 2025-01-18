import React, { useCallback, useContext, useEffect, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { PageTemplateContext } from "../PageTemplate";

const InsertStatistics = () => {
  const { openInsert, setOpenInsert } = useContext(PageTemplateContext);
  const [locations, setLocations] = useState([]);

  const ListStatistics = useCallback(async () => {
    try {
      const response = await clientMo.get("/api/admin/report/statistics", {
        params: {
          type: "statistics",
          limit: 100,
          startRow: 0,
          textSearch: "",
        },
      });
      setLocations(response.data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, []);

  useEffect(() => {
    ListStatistics();
  }, [ListStatistics]);

  return (
    <div>
      <h1>Statistics List</h1>
      <ul>
        {locations.map((location, index) => (
          <li key={index}>{location.name}</li> 
        ))}
      </ul>
    </div>
  );
};

export default InsertStatistics;
