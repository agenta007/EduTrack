import { createTheme } from "@mui/material";

const theme = createTheme({
    palette: {
        primary: {
            main: "#507DBC",
            dark: "#0D1321",
            contrastText: "#F1F2EE",
        }, 
        secondary: {
            main: "#F1F2EE",
            dark: "#bdd2f0",
            contrastText: "#507DBC",
        },
    },

    components: {
        MuiInput: {
            styleOverrides: {
                root: {
                    color: 'F1F2EE',
                    '&:after': {
                        borderBottomColor: 'rgba(241, 242, 238, 0.5)',
                    },
                    '&:before': {
                        borderBottomColor: 'rgba(241, 242, 238, 0.5)',
                    },
                    '&:hover:not(.Mui-disabled):before': {
                        borderBottomColor: 'rgba(241, 242, 238, 0.5)'
                    }
                },
            },
        },
        MuiInputLabel: {
            styleOverrides: {
                root: {
                    color: 'lightblue',
                    '&.Mui-focused': {
                        color: '#507DBC',
                    },
                },
            },
        },
        MuiSvgIcon: {
            styleOverrides: {
                root: {
                    color: '#F1F2EE',
                }
            }
        },
        MuiListItemText: {
            styleOverrides: {
                root: {
                    color: '#F1F2EE',
                }
            }
        }
    }
});

export default theme;