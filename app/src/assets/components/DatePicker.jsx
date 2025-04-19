import * as React from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export default function DatePickerApp({ label , onChange }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker 
            label={label}
            onChange={onChange}
        />
    </LocalizationProvider>
  );
}