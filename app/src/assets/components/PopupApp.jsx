import React from 'react';
import { useCallback } from 'react';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import { Stack } from '@mui/material';

export default function PopupApp({
    children,
    open,
    onClose
}) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            closeAfterTransition
            slots={{ backdrop: Backdrop }}
            slotProps={{
                backdrop: {
                    timeout: 500,
                },
            }}
        >
            <Fade in={open}>
                <Stack
                    sx={{
                        position: 'absolute',
                        width : "100%",
                        height : "100%",
                        justifyContent : "center",
                        alignItems : "center"
                    }}
                >
                    {children}
                </Stack>
            </Fade>
        </Modal>
    );
}