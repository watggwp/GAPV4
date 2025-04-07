import { createTheme, ThemeProvider } from "@mui/material";

const theme = createTheme({
    palette: {
        primary: {
            main: '#22C7A9',
        },
        secondary: {
            main: '#dc004e',
        },
    },
})

export default function ThemeProviderApp({
    children
}) {
    return(
        <ThemeProvider
            theme={theme}
        >
            {children}
        </ThemeProvider>
    )
}