import { createTheme, ThemeProvider } from "@mui/material";
import env from "./env";

const { subpath_server } = env

const theme = createTheme({
    palette: {
        bgSoft : {
            main : "#A4FFC5"
        },
        primary : {
            main : "#379b7a"
        },
        secondary : {
            main : "#daf1ee"
        }
    },
    typography: {
        fontFamily: "Sans-font",
    },
})

(function(history) {
  const originalPushState = history.pushState;

  history.pushState = function(state, title, url) {
    // ถ้า url เป็น relative path
    if (typeof url === "string" && !url.startsWith(subpath_server)) {
      // บังคับเติม subpath_server เข้าไป
      url = subpath_server + url;
    }
    return originalPushState.apply(this, [state, title, url]);
  };
})(window.history);

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