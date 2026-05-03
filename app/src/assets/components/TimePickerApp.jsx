import * as React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

dayjs.locale('th');

export default function TimePickerApp({ label , value , onChange , onAccept , onClose , sxTextField }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
        <TimePicker 
            label={label}
            value={value ? dayjs(value) : null}
            onChange={onChange}
            onAccept={onAccept}
            onClose={onClose}
            slotProps={{
              textField : {
                size : "small",
                sx : sxTextField,
              },
            }}
            ampm={false}
        />
    </LocalizationProvider>
  );
}