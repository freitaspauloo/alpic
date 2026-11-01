import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, ChevronDown, FolderGit2, Globe, Plus, X } from "lucide-react";
import { MenuAction, MenuLabel, MenuSeparator } from "@/app/menu";
import { Button } from "@/components/motion/button/base";
import { Input } from "@/components/motion/input";
import { MorphPopover, MorphPopoverContent, MorphPopoverTrigger } from "@/components/motion/popover-morph";
import {
  AGENT_PRESETS,
  DEFAULT_AGENT,
  SCENARIO_STARTERS,
  newId,
  useOrgData,
  useStore,
  type Scenario,
} from "@/data";
import { radiusSteps, useDesign } from "@/design/theme";
import { cn } from "@/lib/utils";

const DEFAULT_HOST = "acme.com";

function scenarioTitle(prompt: string, starterName: string | null) {
  if (starterName) return starterName;
  const line = prompt.trim().split(/[.\n]/)[0]?.trim() ?? "";
  if (!line) return "Untitled experiment";
  return line.length > 48 ? `${line.slice(0, 48).trimEnd()}…` : line;
}

export function NewExperimentPage() {
  const { orgId, repositories } = useOrgData();
  const { createExperiment, setNotice } = useStore();
  const navigate = useNavigate();
  const menuRadius = Math.round(radiusSteps(useDesign().radius).xl);
  const [host, setHost] = useState("");
  const [prompt, setPrompt] = useState("");
  const [starterLabel, setStarterLabel] = useState("");
  const [agentName, setAgentName] = useState<string>(DEFAULT_AGENT.name);
  const [repositoryId, setRepositoryId] = useState<string | null>(null);
  const [menu, setMenu] = useState<null | "product" | "repo" | "agent" | "attach">(null);
  const [error, setError] = useState<string | null>(null);

  const product = host.trim() || DEFAULT_HOST;
  const starter = SCENARIO_STARTERS.find((item) => item.label === starterLabel) ?? null;
  const agent = AGENT_PRESETS.find((item) => item.name === agentName) ?? DEFAULT_AGENT;
  const repository = repositories.find((item) => item.id === repositoryId) ?? null;

  const openMenu = (name: NonNullable<typeof menu>) => (open: boolean) => setMenu(open ? name : null);

  const chooseStarter = (label: string) => {
    const next = SCENARIO_STARTERS.find((item) => item.label === label);
    if (!next) return;
    setStarterLabel(label);
    setPrompt(next.prompt.replaceAll("{website}", product));
    setError(null);
    setMenu(null);
  };

  const onHost = (value: string) => {
    const nextHost = value.trim() || DEFAULT_HOST;
    setHost(value);
    if (starter) setPrompt(starter.prompt.replaceAll("{website}", nextHost));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = prompt.trim();
    if (!text) {
      setError("Describe what the agent should do.");
      return;
    }
    const scenario: Scenario = {
      id: newId("sc"),
      name: scenarioTitle(text, starter?.name ?? null),
      prompt: text,
    };
    const id = createExperiment(orgId, scenario.name, [scenario], {
      agent: { name: agent.name, model: agent.model, harness: agent.harness },
      repositoryId,
    });
    setNotice(`Experiment created. ${agent.name} will run this scenario.`);
    navigate(`/${orgId}/experiments/${id}`);
  };

  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center"
      style={{ gap: "var(--space-section)", padding: "var(--space-page)" }}
    >
      <div className="flex flex-col gap-2 text-center">
        <h1
          className="font-medium text-foreground"
          style={{ fontSize: "var(--text-title)", letterSpacing: "var(--tracking-title)" }}
        >
          What should an agent be able to do?
        </h1>
        <p className="text-muted-foreground" style={{ fontSize: "var(--text-body)" }}>
          One scenario. Tracks runs it against {product}.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col" style={{ gap: "var(--space-control)" }}>
        <div className="flex flex-wrap items-center" style={{ gap: "var(--space-control)" }}>
          <Picker
            open={menu === "product"}
            onOpenChange={openMenu("product")}
            radius={menuRadius}
            label={`Product: ${product}`}
            icon={<Globe className="size-3.5" />}
            value={product}
            panelClassName="w-72 gap-2 p-3"
          >
            <Input
              label="Website"
              value={host}
              onChange={onHost}
              placeholder={DEFAULT_HOST}
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter") event.preventDefault();
              }}
            />
            <p className="px-1 text-xs text-muted-foreground">The site the agent has to use. Attached questions fill in this address.</p>
          </Picker>

          <Picker
            open={menu === "repo"}
            onOpenChange={openMenu("repo")}
            radius={menuRadius}
            label={repository ? `Repository: ${repository.name}` : "Attach a repository"}
            icon={<FolderGit2 className="size-3.5" />}
            value={repository?.name ?? "No repository"}
          >
            <MenuLabel>Repository</MenuLabel>
            <MenuAction active={!repository} onSelect={() => { setRepositoryId(null); setMenu(null); }}>
              No repository
            </MenuAction>
            {repositories.map((item) => (
              <MenuAction
                key={item.id}
                active={item.id === repositoryId}
                trailing={<span className="font-mono">{item.ref}</span>}
                onSelect={() => { setRepositoryId(item.id); setMenu(null); }}
              >
                {item.name}
              </MenuAction>
            ))}
            <MenuSeparator />
            <MenuAction icon={Plus} onSelect={() => navigate(`/${orgId}/library/repositories`)}>
              Add repository
            </MenuAction>
          </Picker>
        </div>

        <div
          className={cn(
            "flex flex-col border border-border bg-card shadow-sm focus-within:ring-2 focus-within:ring-ring",
            error && "border-destructive focus-within:ring-destructive/30",
          )}
          style={{ borderRadius: "var(--radius-2xl)" }}
        >
          {starter ? (
            <div className="flex px-2.5 pt-2.5">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                aria-label={`Remove ${starter.name}`}
                onClick={() => {
                  setStarterLabel("");
                  setPrompt("");
                }}
              >
                {starter.name}
                <X className="size-3.5 text-muted-foreground" />
              </Button>
            </div>
          ) : null}
          <textarea
            value={prompt}
            rows={3}
            aria-label="What the agent should do"
            aria-invalid={error ? true : undefined}
            placeholder="Describe what the agent should do. Attach a question, or write your own."
            onChange={(event) => {
              setPrompt(event.target.value);
              setStarterLabel("");
              if (error) setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            className="min-h-24 w-full resize-none bg-transparent px-3.5 py-3 text-foreground outline-none placeholder:text-muted-foreground/60"
            style={{ fontSize: "var(--text-body)" }}
          />
          <div className="flex items-center px-2 pb-2" style={{ gap: "var(--space-control)" }}>
            <Picker
              open={menu === "attach"}
              onOpenChange={openMenu("attach")}
              radius={menuRadius}
              label="Attach a question"
              iconOnly
              icon={<Plus className="size-4" />}
            >
              <MenuLabel>Attach</MenuLabel>
              {SCENARIO_STARTERS.map((item) => (
                <MenuAction key={item.label} active={item.label === starterLabel} onSelect={() => chooseStarter(item.label)}>
                  {item.name}
                </MenuAction>
              ))}
            </Picker>
            <div className="ml-auto flex items-center" style={{ gap: "var(--space-control)" }}>
              <Picker
                open={menu === "agent"}
                onOpenChange={openMenu("agent")}
                radius={menuRadius}
                label={`Agent: ${agent.name}`}
                value={agent.name}
                align="end"
              >
                <MenuLabel>Agent</MenuLabel>
                {AGENT_PRESETS.map((item) => (
                  <MenuAction
                    key={item.name}
                    active={item.name === agent.name}
                    trailing={<span className="font-mono">{item.model}</span>}
                    onSelect={() => { setAgentName(item.name); setMenu(null); }}
                  >
                    {item.name}
                  </MenuAction>
                ))}
              </Picker>
              <Button type="submit" size="icon" aria-label="Start experiment" disabled={!prompt.trim()} className="disabled:opacity-40">
                <ArrowUp className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {error ? (
          <p role="alert" className="px-1 text-xs text-destructive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap" style={{ gap: "var(--space-control)" }} role="group" aria-label="Questions">
          {SCENARIO_STARTERS.map((item) => (
            <Button
              key={item.label}
              type="button"
              size="sm"
              variant={item.label === starterLabel ? "primary" : "secondary"}
              aria-pressed={item.label === starterLabel}
              onClick={() => chooseStarter(item.label)}
            >
              {item.name}
            </Button>
          ))}
        </div>
      </form>
    </div>
  );
}

function Picker({
  open,
  onOpenChange,
  radius,
  label,
  value,
  icon,
  iconOnly,
  align = "start",
  panelClassName = "w-64 p-1.5",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  radius: number;
  label: string;
  value?: string;
  icon?: ReactNode;
  iconOnly?: boolean;
  align?: "start" | "end";
  panelClassName?: string;
  children: ReactNode;
}) {
  return (
    <MorphPopover open={open} onOpenChange={onOpenChange}>
      <MorphPopoverTrigger>
        <Button type="button" variant="ghost" size={iconOnly ? "icon" : "sm"} aria-label={label} className={iconOnly ? undefined : "px-2"}>
          {icon}
          {iconOnly ? null : <span className="max-w-40 truncate">{value}</span>}
          {iconOnly ? null : <ChevronDown className="size-3.5 text-muted-foreground" />}
        </Button>
      </MorphPopoverTrigger>
      <MorphPopoverContent side="bottom" align={align} sideOffset={8} radius={radius} className={cn("flex flex-col", panelClassName)}>
        {children}
      </MorphPopoverContent>
    </MorphPopover>
  );
}
