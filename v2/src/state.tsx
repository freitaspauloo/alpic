import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Experiment = {
  id: string;
  name: string;
  task: string;
  url: string;
  model: string;
  status: "Draft";
  edited: string;
};

type Session = {
  name: string;
  email: string;
  role: string | null;
  experiments: Experiment[];
  setIdentity: (name: string, email: string) => void;
  setRole: (role: string) => void;
  addExperiment: (experiment: Omit<Experiment, "id" | "status" | "edited">) => void;
  signOut: () => void;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState("Paulo Freitas");
  const [email, setEmail] = useState("paulo@du.design");
  const [role, setRoleState] = useState<string | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);

  const value = useMemo<Session>(
    () => ({
      name,
      email,
      role,
      experiments,
      setIdentity: (nextName, nextEmail) => {
        setName(nextName);
        setEmail(nextEmail);
      },
      setRole: setRoleState,
      addExperiment: (experiment) => {
        setExperiments((current) => [
          {
            ...experiment,
            id: `exp_${current.length + 1}`,
            status: "Draft",
            edited: "Just now",
          },
          ...current,
        ]);
      },
      signOut: () => {
        setRoleState(null);
        setExperiments([]);
        setName("Paulo Freitas");
        setEmail("paulo@du.design");
      },
    }),
    [email, experiments, name, role],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside SessionProvider");
  return session;
}
