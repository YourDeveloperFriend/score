import { useMemo } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import { Game } from "./game";
import { Home } from "./home";
import { Layout } from "./layout";

export function Routes() {
  const router = useMemo(() => createBrowserRouter([
    {
      path: '/',
      element: <Layout />,
      children: [
        {
          path: '/',
          element: <Home />,
        },
        {
          path: '/games/:gameId',
          element: <Game />,
        },
      ],
    },
  ]), []);
  return <RouterProvider router={router}></RouterProvider>;
}