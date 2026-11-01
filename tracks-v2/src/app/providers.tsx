import type { ReactNode } from "react";
import { useEffect } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { BrowserRouter } from "react-router-dom";
import { StoreProvider } from "@/data";
import { setDesignMode, useDesign } from "@/design/theme";
import { ToastProvider } from "./toast";

export const THEME_STORAGE_KEY = "tracks-v2:theme";

function DesignSync() {
  const { resolvedTheme } = useTheme();
  const design = useDesign();

  useEffect(() => {
    setDesignMode(resolvedTheme === "dark" ? "dark" : "light");
  }, [resolvedTheme, design]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey={THEME_STORAGE_KEY}>
      <DesignSync />
      <BrowserRouter>
        <StoreProvider>
          <ToastProvider>{children}</ToastProvider>
        </StoreProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
