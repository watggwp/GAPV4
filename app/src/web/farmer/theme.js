import { createTheme, ThemeProvider } from "@mui/material";

const theme = createTheme({
    palette: {
        bgSoft : {
            main : "#A4FFC5"
        }
    },
    typography: {
        fontFamily: "Sans-font",
    },
})

export default function ThemeFarmer( {children} ) {
    return(
        <ThemeProvider theme={theme}>
            {children}
        </ThemeProvider>
    )
}