import { Pagination, PaginationItem, Stack, Typography } from "@mui/material"
import { DataGrid } from "@mui/x-data-grid"
import { useMemo, useState } from "react";
import DateGAP from "../../core/DateGAP";

export default function DataTable({
    columns,
    historyDatas,
    loadingHistory
}) {
    const [page, setPage] = useState(1);
    
    // 1) จัดกลุ่มตามวัน
    const groupedByDate = useMemo(() => {
        const map = new Map([])
        historyDatas.forEach(({ _timestamp_raw , ...row}) => {
            const date = new DateGAP(_timestamp_raw).format2Str("YYYY-MM-DD")

            if (!map.has(date)) map.set(date, [])
            map.get(date).push(row)
        })
        
        return Array.from(map.entries())
    }, [historyDatas]);

    // 2) แถวของหน้าปัจจุบัน
    const currentHistory = groupedByDate[page - 1]?.[1] ?? [];

    return(
        <Stack
            width={"calc(100% - 8px)"}
            height={"100%"}
            paddingTop={1}
            paddingBottom={1}
            sx={{
                ".MuiTablePagination-displayedRows" : {
                    marginBottom : 0
                }
            }}
            spacing={1}
        >
            <DataGrid
                columns={[
                    { field: 'timestamp', headerName: 'วันที่/เวลา', minWidth: 150 , flex: 1 , align : "center" , headerAlign : "center" },
                    ...columns.map((item) => {
                        return {
                            field : item.field,
                            headerName : item.name,
                            minWidth : 80,
                            flex : 1,
                            align : "center",
                            headerAlign : "center",
                        }
                    }) ,
                ]}
                rows={currentHistory}
                slots={{
                    noRowsOverlay : () => (
                        <Stack
                            justifyContent={"center"}
                            alignItems={"center"}
                            width={"100%"}
                            height={"100%"}
                        >
                            <Typography fontSize={"14px"}>ไม่พบข้อมูลจากสภาพอากาศ</Typography>
                        </Stack>
                    )
                }}
                hideFooter
                pageSizeOptions={[30]}
                disableColumnSorting
                disableColumnMenu
                rowHeight={36}
                columnHeaderHeight={42}
                loading={loadingHistory}
                sx={{
                    minHeight : 220
                }}
            />
            <Stack
                direction={"row"}
                justifyContent={"center"}
                minHeight={0}
            >
                <Pagination
                    count={groupedByDate.length}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    size="small"
                    renderItem={(item) => {
                        const dateLabel = new DateGAP(groupedByDate[item.page - 1]?.[0]).format2Str("DD/MM/YY")
                        return (
                            <PaginationItem
                                {...item}
                                slots={{}}
                                page={dateLabel}
                            />
                        );
                    }}
                />
            </Stack>
        </Stack>
    )
}