import React, { useCallback } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export default function ApproveDialogApp({
    open, setOpen ,
    title , detail ,
    onAgree = () => {}
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
                <Button onClick={handleClose} variant="contained" >ยกเลิก</Button>
                <Button onClick={onAgree} variant="contained" autoFocus>
                    ยืนยัน
                </Button>
            </DialogActions>
        </Dialog>
    );
}