import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import {
  AnimatedToastStack,
  useAnimatedToastStack,
  type ToastInput,
} from "@/components/motion/animated-toast-stack";
import { useStore } from "@/data";

type ToastApi = {
  /** Show a toast. Returns its id. */
  toast: (input: ToastInput) => string;
  /** Change a toast in place, e.g. loading → success. */
  update: (id: string, patch: Partial<ToastInput>) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

/** Mounts the beUI toast stack once and turns every store `notice` into a success toast. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, showToast, updateToast, dismissToast } = useAnimatedToastStack({ limit: 4 });
  const { notice, setNotice } = useStore();

  useEffect(() => {
    if (!notice) return;
    showToast({ title: notice, status: "success" });
    setNotice(null);
  }, [notice, setNotice, showToast]);

  const api = useMemo<ToastApi>(
    () => ({ toast: showToast, update: updateToast, dismiss: dismissToast }),
    [dismissToast, showToast, updateToast],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <AnimatedToastStack toasts={toasts} onDismiss={dismissToast} position="bottom-right" fixed />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast must be used inside <ToastProvider>.");
  return api;
}
