import { DialogsProvider } from "@toolpad/core";
import { AudioContextProvider } from "./audio";
import { Routes } from "./routes";

export function App() {
  return <DialogsProvider>
    <AudioContextProvider>
      <Routes />
    </AudioContextProvider>
  </DialogsProvider>;
}