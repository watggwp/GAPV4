import React, { useCallback } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Stack } from '@mui/material';

export default function ApproveDialogApp({
    open, setOpen ,
    title , detail ,
    onAgree = () => {},
    loadingConfirm,
    disabledConfirm,
    disabledCancel,
}) {
    const handleClose = useCallback(() => {
        setOpen(false);
    } , [setOpen])

    return (
        <Dialog
            open={open}
            onClose={handleClose}
        >
            <DialogTitle>
                {title}
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {detail}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Stack direction={"row"} spacing={2}>
                    <Button onClick={handleClose} variant="contained" color="error" disabled={disabledCancel}>ยกเลิก</Button>
                    <Button onClick={onAgree} variant="contained" autoFocus disabled={disabledConfirm} loading={loadingConfirm}>
                        ยืนยัน
                    </Button>
                </Stack>
            </DialogActions>
        </Dialog>
    );
}