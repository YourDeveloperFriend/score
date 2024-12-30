import { AppBar, styled, Toolbar, Typography } from "@mui/material";
import { Link, Outlet } from "react-router";

const Offset = styled('div')(({ theme }) => theme.mixins.toolbar);

export function Layout() {
  return <>
    <AppBar position="fixed">
      <Toolbar>
        <Typography color="white" style={{ textDecoration: 'none' }} variant="h6" sx={{ flexGrow: 1 }} component={Link} to="/">
          Adam's Score Tracker
        </Typography>
      </Toolbar>
    </AppBar>
    <Offset />
    <main>
      <Outlet />
    </main>
  </>;
}