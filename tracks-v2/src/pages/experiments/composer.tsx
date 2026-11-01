import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, ChevronDown, ChevronRight, GitBranch, Plus, Server, Sparkles, Terminal, X, type LucideIcon } from "lucide-react";
import { MenuAction, MenuLabel, MenuSeparator } from "@/app/menu";
import { Button, type ButtonVariant } from "@/components/motion/button/base";
import { Switch } from "@/components/motion/switch";
import { Input } from "@/components/motion/input";
import { MorphPopover, MorphPopoverContent, MorphPopoverTrigger } from "@/components/motion/popover-morph";
import { AGENT_PRESETS, DEFAULT_AGENT, SCENARIO_STARTERS, useStore } from "@/data";
import { familyUsesStroke, resolveIcon } from "@/design/icons";
import { radiusSteps, useDesign } from "@/design/theme";
import { cn } from "@/lib/utils";

const DEFAULT_HOST = "acme.com";

export type ComposerTools = {
  skillIds: string[];
  mcpIds: string[];
  cliIds: string[];
};

export type ToolCoverage = "both" | "with" | "without";

const EMPTY_TOOLS: ComposerTools = { skillIds: [], mcpIds: [], cliIds: [] };

const COVERAGE_LABEL: Record<ToolCoverage, string> = {
  both: "With & without tools",
  with: "With only",
  without: "Without only",
};

type ToolKind = "skills" | "mcp" | "cli";

function includedLines(coverage: ToolCoverage, names: string[]) {
  if (coverage === "without") return ["No tools"];
  if (!names.length) return coverage === "both" ? ["No tools"] : ["No tools selected"];
  if (coverage === "with") return names;
  return ["No tools", ...names];
}

export type ComposerDraft = {
  host: string;
  repositoryId: string | null;
  branch?: string;
  scenarioName: string;
  prompt: string;
  agentName: string;
};

const EMPTY_DRAFT: ComposerDraft = {
  host: "",
  repositoryId: null,
  scenarioName: "Scenario 1",
  prompt: "",
  agentName: DEFAULT_AGENT.name,
};

/** The new-experiment composer. The landing and the product page both render this. */
export function ExperimentComposer({
  orgId,
  onContinue,
  value,
  onChange,
  actionLabel = "Continue",
  canSubmit,
  files,
  onFiles,
  onRemoveFile,
  showAgent = true,
  showPrompt = true,
  source = false,
  promptPlaceholder = "Describe what the agent should do.",
  tools: toolsProp,
  onToolsChange,
  coverage: coverageProp,
  onCoverageChange,
}: {
  orgId: string;
  onContinue: (draft: ComposerDraft) => void;
  value?: ComposerDraft;
  onChange?: (draft: ComposerDraft) => void;
  actionLabel?: string;
  /** When set, the action stays visible and only enables once the caller allows it. */
  canSubmit?: boolean;
  files?: string[];
  onFiles?: (list: FileList) => void;
  onRemoveFile?: (name: string) => void;
  /** The setup page draws its own agent row above this composer. */
  showAgent?: boolean;
  /** The setup page keeps the prompt on the scenario step. */
  showPrompt?: boolean;
  /** Repo and branch, instead of the product and repository row. */
  source?: boolean;
  promptPlaceholder?: string;
  /** Skills, connectors, and command-line tools attached on the setup composer. */
  tools?: ComposerTools;
  onToolsChange?: (tools: ComposerTools) => void;
  coverage?: ToolCoverage;
  onCoverageChange?: (coverage: ToolCoverage) => void;
}) {
  const navigate = useNavigate();
  const { repositories: allRepositories, skills: allSkills, mcpServers: allMcp, tools: allCli } = useStore();
  const repositories = allRepositories.filter((item) => item.orgId === orgId);
  const skills = allSkills.filter((item) => item.orgId === orgId);
  const mcpServers = allMcp.filter((item) => item.orgId === orgId);
  const cliTools = allCli.filter((item) => item.orgId === orgId);
  const design = useDesign();
  const menuRadius = Math.round(radiusSteps(design.radius).xl);
  const iconSettings = design.icons;
  const stroke = familyUsesStroke(iconSettings.family, iconSettings.weight) ? iconSettings.strokeWidth : undefined;
  const ProductIcon = resolveIcon("globe", iconSettings.family, iconSettings.weight);
  const RepoIcon = resolveIcon("folder-git-2", iconSettings.family, iconSettings.weight);
  const [inner, setInner] = useState<ComposerDraft>(value ?? EMPTY_DRAFT);
  const [innerTools, setInnerTools] = useState<ComposerTools>(EMPTY_TOOLS);
  const [innerCoverage, setInnerCoverage] = useState<ToolCoverage>("both");
  const [starterLabel, setStarterLabel] = useState("");
  const [submenu, setSubmenu] = useState<ToolKind | null>(null);
  const [menu, setMenu] = useState<null | "product" | "repo" | "branch" | "agent" | "attach" | "coverage">(null);
  const tools = toolsProp ?? innerTools;
  const coverage = coverageProp ?? innerCoverage;
  const setTools = (next: ComposerTools) => {
    if (!toolsProp) setInnerTools(next);
    onToolsChange?.(next);
  };
  const setCoverage = (next: ToolCoverage) => {
    if (!coverageProp) setInnerCoverage(next);
    onCoverageChange?.(next);
  };
  const toggleTool = (key: keyof ComposerTools, id: string) => {
    const list = tools[key];
    setTools({ ...tools, [key]: list.includes(id) ? list.filter((item) => item !== id) : [...list, id] });
  };
  const fileRef = useRef<HTMLInputElement>(null);
  const draft = value ?? inner;
  const { host, prompt, scenarioName, agentName, repositoryId, branch = "" } = draft;
  const patch = (partial: Partial<ComposerDraft>) => {
    const next = { ...draft, ...partial };
    if (!value) setInner(next);
    onChange?.(next);
    return next;
  };

  const product = host.trim() || DEFAULT_HOST;
  const starter = SCENARIO_STARTERS.find((item) => item.label === starterLabel) ?? null;
  const agent = AGENT_PRESETS.find((item) => item.name === agentName) ?? DEFAULT_AGENT;
  const repository = repositories.find((item) => item.id === repositoryId) ?? null;
  const openMenu = (name: NonNullable<typeof menu>) => (open: boolean) => setMenu(open ? name : null);

  const chooseStarter = (label: string) => {
    const next = SCENARIO_STARTERS.find((item) => item.label === label);
    if (!next) return;
    setStarterLabel(label);
    patch({ scenarioName: next.name, prompt: next.prompt.replaceAll("{website}", product) });
    setMenu(null);
  };

  const ready = (canSubmit ?? true) && prompt.trim().length > 0;
  const chips = [
    ...tools.skillIds.map((id) => ({ id, key: "skillIds" as const, name: skills.find((item) => item.id === id)?.name, icon: Sparkles })),
    ...tools.mcpIds.map((id) => ({ id, key: "mcpIds" as const, name: mcpServers.find((item) => item.id === id)?.name, icon: Server })),
    ...tools.cliIds.map((id) => ({ id, key: "cliIds" as const, name: cliTools.find((item) => item.id === id)?.name, icon: Terminal })),
  ].filter((item): item is { id: string; key: keyof ComposerTools; name: string; icon: LucideIcon } => Boolean(item.name));
  const chipNames = chips.map((item) => item.name);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = prompt.trim();
    if (!ready || !text) return;
    onContinue({ ...draft, scenarioName: scenarioName.trim() || "Scenario 1", prompt: text, agentName: agent.name });
  };

  return (
    <form onSubmit={submit} className="flex flex-col rounded-[var(--radius-2xl)] bg-card">
      {showAgent ? (
        <div className="flex flex-wrap items-center px-1.5 pt-1.5">
          <Picker
            open={menu === "agent"}
            onOpenChange={openMenu("agent")}
            radius={menuRadius}
            label={`Agent: ${agent.name}`}
            value={agent.name}
          >
            <MenuLabel>Agent</MenuLabel>
            {AGENT_PRESETS.map((item) => (
              <MenuAction
                key={item.name}
                active={item.name === agent.name}
                trailing={<span className="font-mono">{item.model}</span>}
                onSelect={() => { patch({ agentName: item.name }); setMenu(null); }}
              >
                {item.name}
              </MenuAction>
            ))}
          </Picker>
        </div>
      ) : null}
      <div className={cn("flex flex-wrap items-center px-1.5", showAgent ? "pt-0" : source ? "pt-1.5 pb-2" : "pt-1.5")}>
        {source ? null : (
          <Picker
            open={menu === "product"}
            onOpenChange={openMenu("product")}
            radius={menuRadius}
            label={`Product: ${product}`}
            icon={<ProductIcon className="size-3.5" strokeWidth={stroke} />}
            value={product}
            panelClassName="w-72 gap-2 p-3"
          >
            <Input
              label="Website"
              value={host}
              onChange={(nextHost) => {
                patch({
                  host: nextHost,
                  ...(starter ? { prompt: starter.prompt.replaceAll("{website}", nextHost.trim() || DEFAULT_HOST) } : {}),
                });
              }}
              placeholder={DEFAULT_HOST}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.preventDefault();
              }}
            />
          </Picker>
        )}
        <Picker
          open={menu === "repo"}
          onOpenChange={openMenu("repo")}
          radius={menuRadius}
          label={repository ? `Repository: ${repository.name}` : "Repository"}
          icon={<RepoIcon className="size-3.5" strokeWidth={stroke} />}
          value={repository?.name ?? (source ? "Repository" : "No repository")}
        >
          <MenuLabel>Repository</MenuLabel>
          <MenuAction active={!repository} onSelect={() => { patch({ repositoryId: null, branch: "" }); setMenu(null); }}>
            No repository
          </MenuAction>
          {repositories.map((item) => (
            <MenuAction key={item.id} active={item.id === repositoryId} onSelect={() => { patch({ repositoryId: item.id, branch: item.ref }); setMenu(null); }}>
              {item.name}
            </MenuAction>
          ))}
          <MenuSeparator />
          <MenuAction icon={Plus} onSelect={() => navigate(`/${orgId}/library/repositories`)}>
            Add repository
          </MenuAction>
        </Picker>
        {source ? (
          <Picker
            open={menu === "branch"}
            onOpenChange={openMenu("branch")}
            radius={menuRadius}
            label={branch.trim() ? `Branch: ${branch}` : "Branch"}
            icon={<GitBranch className="size-3.5" strokeWidth={stroke} />}
            value={branch.trim() || "Branch"}
            disabled={!repository}
          >
            <MenuLabel>Branch</MenuLabel>
            {repository ? (
              [...new Set([repository.ref, "main"])].map((ref) => (
                <MenuAction key={ref} active={branch === ref} onSelect={() => { patch({ branch: ref }); setMenu(null); }}>
                  <span className="font-mono">{ref}</span>
                </MenuAction>
              ))
            ) : (
              <p className="px-2.5 py-1.5 text-xs text-muted-foreground">Pick a repository first.</p>
            )}
          </Picker>
        ) : null}
      </div>
      {source ? <div aria-hidden="true" className="h-px bg-foreground/5" /> : null}

      <div className={cn("flex gap-1 px-1.5", source ? "flex-col pt-2 pb-1.5" : "items-center pb-1.5")}>
        {source && chips.length ? (
          <div className="flex flex-wrap gap-1.5 px-0.5">
            {chips.map((chip) => (
              <ToolChip key={`${chip.key}-${chip.id}`} name={chip.name} icon={chip.icon} onRemove={() => toggleTool(chip.key, chip.id)} />
            ))}
          </div>
        ) : null}
        {showPrompt ? (
          <textarea
            value={prompt}
            rows={1}
            aria-label={promptPlaceholder}
            placeholder={promptPlaceholder}
            onChange={(event) => {
              patch({ prompt: event.target.value });
              setStarterLabel("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            className={cn(
              "resize-none bg-transparent px-2 text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground/60",
              source ? "min-h-9 w-full py-1" : "order-2 h-9 min-h-9 min-w-0 flex-1 py-2",
            )}
          />
        ) : (
          <span className={cn("min-w-0 flex-1", source && "hidden")} />
        )}
        <div className={cn("flex min-w-0 items-center gap-1", source ? "w-full" : "contents")}>
          <Picker
            open={menu === "attach"}
            onOpenChange={(open) => {
              if (open) setSubmenu(null);
              openMenu("attach")(open);
            }}
            radius={menuRadius}
            label="Add"
            iconOnly
            icon={<Plus className="size-4" />}
            side={source ? "top" : "bottom"}
            panelClassName={source ? "w-auto p-0" : "w-64 p-1.5"}
          >
            {source ? (
              <div className="flex items-stretch">
                <div className="flex w-52 shrink-0 flex-col p-1.5">
                  <MenuLabel>Add</MenuLabel>
                  <ToolMenuRow icon={Sparkles} label="Skills" open={submenu === "skills"} onOpen={() => setSubmenu("skills")} />
                  <ToolMenuRow icon={Server} label="Connectors" open={submenu === "mcp"} onOpen={() => setSubmenu("mcp")} />
                  <ToolMenuRow icon={Terminal} label="CLIs" open={submenu === "cli"} onOpen={() => setSubmenu("cli")} />
                </div>
                {submenu ? (
                  <div className="flex w-64 flex-col border-l border-border p-1.5">
                    {submenu === "skills" ? (
                      <ToolList
                        items={skills}
                        selected={tools.skillIds}
                        empty="No skills yet"
                        manage="Manage skills"
                        onToggle={(id) => toggleTool("skillIds", id)}
                        onManage={() => { setMenu(null); navigate(`/${orgId}/library/skills`); }}
                      />
                    ) : null}
                    {submenu === "mcp" ? (
                      <ConnectorList
                        items={mcpServers}
                        selected={tools.mcpIds}
                        onToggle={(id) => toggleTool("mcpIds", id)}
                        onManage={() => { setMenu(null); navigate(`/${orgId}/library/mcp-servers`); }}
                      />
                    ) : null}
                    {submenu === "cli" ? (
                      <ToolList
                        items={cliTools}
                        selected={tools.cliIds}
                        empty="No CLIs yet"
                        manage="Manage CLIs"
                        onToggle={(id) => toggleTool("cliIds", id)}
                        onManage={() => { setMenu(null); navigate(`/${orgId}/library/command-line-tools`); }}
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <MenuLabel>Add</MenuLabel>
                {onFiles ? (
                  <MenuAction icon={Plus} onSelect={() => { setMenu(null); fileRef.current?.click(); }}>
                    Files
                  </MenuAction>
                ) : null}
                {SCENARIO_STARTERS.map((item) => (
                  <MenuAction key={item.label} active={item.label === starterLabel} onSelect={() => chooseStarter(item.label)}>
                    {item.name}
                  </MenuAction>
                ))}
              </>
            )}
          </Picker>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              if (event.target.files) onFiles?.(event.target.files);
              event.target.value = "";
            }}
          />
          {showPrompt && starter ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              aria-label={`Remove ${starter.name}`}
              onClick={() => {
                setStarterLabel("");
                patch({ prompt: "" });
              }}
            >
              {starter.name}
              <X className="size-3.5 text-muted-foreground" />
            </Button>
          ) : null}
          {files?.map((file) => (
            <button
              key={file}
              type="button"
              aria-label={`Remove ${file}`}
              onClick={() => onRemoveFile?.(file)}
              className="inline-flex h-8 max-w-40 items-center gap-1.5 rounded-[var(--radius-control)] bg-foreground/8 px-3 text-xs text-foreground"
            >
              <span className="truncate">{file}</span>
              <X className="size-3.5 shrink-0 text-muted-foreground" />
            </button>
          ))}
          {source ? <span className="min-w-0 flex-1" /> : null}
          {source ? (
            <Picker
              open={menu === "coverage"}
              onOpenChange={openMenu("coverage")}
              radius={menuRadius}
              label={`Variants: ${COVERAGE_LABEL[coverage]}`}
              value={COVERAGE_LABEL[coverage]}
              side="top"
              align="end"
              triggerVariant="outline"
              triggerClassName="rounded-full"
              valueClassName="max-w-44"
            >
              {(Object.keys(COVERAGE_LABEL) as ToolCoverage[]).map((mode) => (
                <MenuAction key={mode} active={coverage === mode} onSelect={() => { setCoverage(mode); setMenu(null); }}>
                  {COVERAGE_LABEL[mode]}
                </MenuAction>
              ))}
              <MenuSeparator />
              <MenuLabel>Included</MenuLabel>
              {includedLines(coverage, chipNames).map((line, index) => (
                <p
                  key={`${line}-${index}`}
                  className={cn(
                    "px-2.5 py-1.5 text-xs",
                    line === "No tools" || line === "No tools selected" ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {line}
                </p>
              ))}
            </Picker>
          ) : null}
          <Button type="submit" size="icon" aria-label={actionLabel} disabled={!ready} className={cn("disabled:opacity-40", !source && "order-3")}>
            <ArrowUp className="size-4" />
          </Button>
        </div>
      </div>
    </form>
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
  disabled,
  align = "start",
  side = "bottom",
  panelClassName = "w-64 p-1.5",
  triggerVariant = "ghost",
  triggerClassName,
  valueClassName = "max-w-40",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  radius: number;
  label: string;
  value?: string;
  icon?: ReactNode;
  iconOnly?: boolean;
  disabled?: boolean;
  align?: "start" | "end";
  side?: "top" | "bottom";
  panelClassName?: string;
  triggerVariant?: ButtonVariant;
  triggerClassName?: string;
  valueClassName?: string;
  children: ReactNode;
}) {
  return (
    <MorphPopover open={disabled ? false : open} onOpenChange={disabled ? () => undefined : onOpenChange}>
      <MorphPopoverTrigger>
        <Button
          type="button"
          variant={triggerVariant}
          size={iconOnly ? "icon" : "sm"}
          aria-label={label}
          disabled={disabled}
          className={iconOnly ? triggerClassName : cn("px-2", triggerClassName)}
        >
          {icon}
          {iconOnly ? null : <span className={cn("truncate", valueClassName)}>{value}</span>}
          {iconOnly ? null : <ChevronDown className="size-3.5 text-muted-foreground" />}
        </Button>
      </MorphPopoverTrigger>
      <MorphPopoverContent side={side} align={align} sideOffset={8} radius={radius} className={cn("flex flex-col", panelClassName)}>
        {children}
      </MorphPopoverContent>
    </MorphPopover>
  );
}

function ToolMenuRow({ icon: Icon, label, open, onOpen }: { icon: LucideIcon; label: string; open: boolean; onOpen: () => void }) {
  return (
    <div onMouseEnter={onOpen}>
      <MenuAction icon={Icon} active={open} trailing={<ChevronRight className="size-3.5" />} onSelect={onOpen}>
        {label}
      </MenuAction>
    </div>
  );
}

function ToolList({
  items,
  selected,
  empty,
  manage,
  onToggle,
  onManage,
}: {
  items: { id: string; name: string }[];
  selected: string[];
  empty: string;
  manage: string;
  onToggle: (id: string) => void;
  onManage: () => void;
}) {
  return (
    <>
      {items.length ? items.map((item) => (
        <MenuAction key={item.id} active={selected.includes(item.id)} onSelect={() => onToggle(item.id)}>
          {item.name}
        </MenuAction>
      )) : (
        <p className="px-2.5 py-1.5 text-xs text-muted-foreground">{empty}</p>
      )}
      <MenuSeparator />
      <MenuAction onSelect={onManage}>{manage}</MenuAction>
    </>
  );
}

function ConnectorList({
  items,
  selected,
  onToggle,
  onManage,
}: {
  items: { id: string; name: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  onManage: () => void;
}) {
  return (
    <>
      {items.length ? items.map((item) => {
        const on = selected.includes(item.id);
        return (
          <div key={item.id} className="flex items-center gap-2 rounded-lg py-1 pr-1.5 pl-2.5 hover:bg-muted">
            <span className="min-w-0 flex-1 truncate text-xs text-foreground">{item.name}</span>
            <Switch checked={on} onCheckedChange={() => onToggle(item.id)} ariaLabel={item.name} />
          </div>
        );
      }) : (
        <p className="px-2.5 py-1.5 text-xs text-muted-foreground">No connectors yet</p>
      )}
      <MenuSeparator />
      <MenuAction onSelect={onManage}>Manage connectors</MenuAction>
    </>
  );
}

function ToolChip({ name, icon: Icon, onRemove }: { name: string; icon: LucideIcon; onRemove: () => void }) {
  return (
    <span className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border border-border bg-transparent pr-1 pl-2.5 text-xs font-medium text-foreground">
      <Icon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="max-w-36 truncate">{name}</span>
      <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${name}`} onClick={onRemove} className="size-6 rounded-full">
        <X className="size-3.5" />
      </Button>
    </span>
  );
}
