import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Paperclip, Pencil, Plus, Trash2, TriangleAlert, Upload, X } from "lucide-react";
import { MenuAction } from "@/app/menu";
import { Button } from "@/components/motion/button/base";
import {
  CenterMorphModal,
  CenterMorphModalContent,
} from "@/components/motion/center-morph-modal";
import { Input } from "@/components/motion/input";
import { MorphPopover, MorphPopoverContent, MorphPopoverTrigger } from "@/components/motion/popover-morph";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/motion/select";
import { newId } from "@/data";
import { radiusSteps, useDesign } from "@/design/theme";
import { cn } from "@/lib/utils";

export type PassPolicy = "all" | "score";

export type SetupEvaluation = {
  id: string;
  name: string;
  instructions: string;
  weight: number;
  open: boolean;
};

export type SetupScenario = {
  id: string;
  name: string;
  prompt: string;
  files: string[];
  evaluations: SetupEvaluation[];
  policy: PassPolicy;
  passingScore: number;
};

const INSTRUCTIONS_PLACEHOLDER = "What the agent must do or say to pass, in detail. For example: Passed when the agent runs the full test suite before answering and reports how many tests passed.";

export function createScenario(index: number, partial?: Partial<SetupScenario>): SetupScenario {
  return {
    id: partial?.id ?? newId("sc"),
    name: partial?.name ?? `Scenario ${index}`,
    prompt: partial?.prompt ?? "",
    files: partial?.files ?? [],
    evaluations: partial?.evaluations ?? [],
    policy: partial?.policy ?? "all",
    passingScore: partial?.passingScore ?? 80,
  };
}

export function scenarioIssues(scenario: SetupScenario) {
  let count = scenario.prompt.trim() ? 0 : 1;
  for (const evaluation of scenario.evaluations) {
    if (!evaluation.instructions.trim()) count += 1;
  }
  return count;
}

export function scenariosReady(scenarios: SetupScenario[]) {
  return scenarios.length > 0 && scenarios.every((scenario) => scenarioIssues(scenario) === 0);
}

export function scenarioPromptText(scenario: SetupScenario) {
  const evaluations = scenario.evaluations
    .filter((item) => item.instructions.trim())
    .map((item) => {
      const name = item.name.trim() || "Evaluation";
      const weight = scenario.policy === "score" ? ` (weight ${item.weight})` : "";
      return `${name}${weight}: ${item.instructions.trim()}`;
    });
  const policy = scenario.policy === "score"
    ? `Pass when the weighted score reaches ${scenario.passingScore} out of 100.`
    : evaluations.length
      ? "Pass when every evaluation passes."
      : "";
  return [
    scenario.prompt.trim(),
    scenario.files.length ? `Files: ${scenario.files.join(", ")}.` : "",
    evaluations.length ? `Evaluations:\n${evaluations.join("\n")}` : "",
    policy,
  ].filter(Boolean).join("\n\n");
}

function issueLabel(count: number) {
  return `${count} ${count === 1 ? "thing" : "things"} left`;
}

function displayName(scenario: SetupScenario, index: number) {
  return scenario.name.trim() || `Scenario ${index + 1}`;
}

function isBlank(scenario: SetupScenario) {
  return !scenario.prompt.trim() && scenario.files.length === 0 && scenario.evaluations.length === 0;
}

function shortName(text: string, fallback: string) {
  const head = text.split(/[.:\n]/)[0]?.trim() ?? "";
  const words = head.split(/\s+/).filter(Boolean).slice(0, 8).join(" ");
  return (words || fallback).slice(0, 48);
}

function stripMarker(line: string) {
  return line.replace(/^#{1,3}\s+/, "").replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trim();
}

function weightOf(text: string) {
  const explicit = text.match(/weight\s*[:=]?\s*(\d+(?:\.\d+)?)/i) ?? text.match(/×\s*(\d+(?:\.\d+)?)/);
  if (explicit) return Number(explicit[1]);
  if (/counts double|count double|\bx2\b|\b2x\b|×\s*2/i.test(text)) return 2;
  return 1;
}

function looksLikeCriterion(line: string) {
  return /passed when|must |counts double|weight\s*[:=]?\s*\d|×\s*\d/i.test(line);
}

function evaluationFrom(line: string, index: number): SetupEvaluation {
  const instructions = stripMarker(line);
  return {
    id: newId("ev"),
    name: shortName(instructions, `Evaluation ${index}`),
    instructions,
    weight: weightOf(instructions),
    open: index === 1,
  };
}

function taskChunks(document: string) {
  const text = document.replace(/\r\n/g, "\n").trim();
  if (!text) return [];
  if (/^#{1,3}\s+/m.test(text)) {
    return text.split(/\n(?=#{1,3}\s+)/).map((chunk) => chunk.trim()).filter(Boolean);
  }
  const numbered = text.split(/\n(?=\d+[.)]\s+)/).map((chunk) => chunk.trim()).filter(Boolean);
  if (numbered.length > 1) return numbered;
  const paragraphs = text.split(/\n\s*\n/).map((chunk) => chunk.trim()).filter(Boolean);
  if (paragraphs.length > 1) return paragraphs;
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  return lines.length > 1 ? lines : [text];
}

function parseScenarios(document: string) {
  return taskChunks(document).map((block, index) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const title = stripMarker(lines[0] ?? "");
    const promptLines: string[] = [];
    const criteria: string[] = [];
    let inEvaluations = false;
    for (const line of lines.slice(1)) {
      if (/^evaluations?\b/i.test(stripMarker(line))) {
        inEvaluations = true;
        continue;
      }
      if (inEvaluations || looksLikeCriterion(line)) criteria.push(line);
      else promptLines.push(stripMarker(line));
    }
    const prompt = promptLines.join("\n") || title;
    return createScenario(index + 1, {
      name: promptLines.length || criteria.length ? shortName(title, `Scenario ${index + 1}`) : shortName(prompt, `Scenario ${index + 1}`),
      prompt,
      evaluations: criteria.map((line, criterion) => evaluationFrom(line, criterion + 1)),
    });
  });
}

function parseEvaluations(document: string) {
  const lines = document
    .replace(/\r\n/g, "\n")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const items = lines.length ? lines : [document.trim()];
  return items.filter(Boolean).map((line, index) => evaluationFrom(line, index + 1));
}

export function ScenarioEditor({
  scenarios,
  index,
  onChange,
  onIndex,
}: {
  scenarios: SetupScenario[];
  index: number;
  onChange: (scenarios: SetupScenario[]) => void;
  onIndex: (index: number) => void;
}) {
  const design = useDesign();
  const radius = Math.round(radiusSteps(design.radius).xl);
  const scenario = scenarios[index] ?? scenarios[0];
  const nameRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [listOpen, setListOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmEval, setConfirmEval] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [importKind, setImportKind] = useState<null | "scenarios" | "evaluations">(null);
  const [documentText, setDocumentText] = useState("");

  useEffect(() => {
    setConfirmRemove(false);
    setConfirmEval(null);
  }, [scenario?.id]);

  if (!scenario) return null;

  const issues = scenarioIssues(scenario);
  const label = displayName(scenario, index);
  const scored = scenario.policy === "score";

  const update = (patch: Partial<SetupScenario>) => {
    onChange(scenarios.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const updateEvaluation = (id: string, patch: Partial<SetupEvaluation>) => {
    update({
      evaluations: scenario.evaluations.map((item) => item.id === id ? { ...item, ...patch } : item),
    });
  };

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const names = [...list].map((file) => file.name);
    update({ files: [...scenario.files, ...names.filter((name) => !scenario.files.includes(name))] });
  };

  const addScenario = () => {
    const next = [...scenarios, createScenario(scenarios.length + 1)];
    onChange(next);
    onIndex(next.length - 1);
  };

  const removeScenario = () => {
    setConfirmRemove(false);
    if (scenarios.length === 1) {
      onChange([createScenario(1)]);
      onIndex(0);
      return;
    }
    const next = scenarios.filter((_, itemIndex) => itemIndex !== index);
    onChange(next);
    onIndex(Math.min(index, next.length - 1));
  };

  const addEvaluation = () => {
    const next = evaluationFrom("", scenario.evaluations.length + 1);
    next.name = "";
    next.instructions = "";
    next.open = true;
    update({ evaluations: [...scenario.evaluations, next] });
  };

  const removeEvaluation = (id: string) => {
    setConfirmEval(null);
    update({ evaluations: scenario.evaluations.filter((item) => item.id !== id) });
  };

  const openImport = (kind: "scenarios" | "evaluations") => {
    setDocumentText("");
    setImportKind(kind);
  };

  const applyImport = (event: FormEvent) => {
    event.preventDefault();
    const text = documentText.trim();
    if (!text || !importKind) return;
    if (importKind === "scenarios") {
      const imported = parseScenarios(text);
      if (!imported.length) return;
      const replace = scenarios.every(isBlank);
      const next = replace ? imported : [...scenarios, ...imported];
      onChange(next);
      onIndex(replace ? 0 : scenarios.length);
    } else {
      const imported = parseEvaluations(text);
      if (!imported.length) return;
      update({ evaluations: [...scenario.evaluations, ...imported] });
    }
    setImportKind(null);
    setDocumentText("");
  };

  const readDroppedDocument = (event: DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    void file.text().then((text) => setDocumentText(text));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={() => openImport("scenarios")}>
          <Upload className="size-3.5" />
          Import
        </Button>
      </div>

      <div className="flex items-center gap-0.5 rounded-[var(--radius-xl)] bg-background p-1">
        <div className="relative min-w-0 flex-1">
          <input
            ref={nameRef}
            aria-label="Scenario name"
            value={scenario.name}
            placeholder={`Scenario ${index + 1}`}
            onChange={(event) => update({ name: event.target.value })}
            className={cn(
              "h-9 w-full rounded-[var(--radius-control)] bg-card pr-9 pl-3 text-sm text-foreground outline-none",
              "placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring",
              issues > 0 && "pr-16",
            )}
          />
          {issues > 0 ? (
            <span className="pointer-events-none absolute top-1/2 right-9 flex -translate-y-1/2" title={issueLabel(issues)}>
              <TriangleAlert className="size-3.5 text-destructive" aria-hidden="true" />
              <span className="sr-only">{issueLabel(issues)}</span>
            </span>
          ) : null}
          <MorphPopover open={listOpen} onOpenChange={setListOpen}>
            <MorphPopoverTrigger>
              <button
                type="button"
                aria-label="Select scenario"
                className="absolute top-1/2 right-1 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-[var(--radius-control)] text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className="size-3.5" />
              </button>
            </MorphPopoverTrigger>
            <MorphPopoverContent side="bottom" align="end" sideOffset={8} radius={radius} className="flex w-64 flex-col p-1.5">
              {scenarios.map((item, itemIndex) => {
                const pending = scenarioIssues(item);
                return (
                  <MenuAction
                    key={item.id}
                    active={itemIndex === index}
                    trailing={itemIndex === index ? <Check className="size-3.5" /> : null}
                    onSelect={() => {
                      onIndex(itemIndex);
                      setListOpen(false);
                    }}
                  >
                    {pending > 0 ? <TriangleAlert className="mr-1 inline size-3.5 text-destructive" aria-hidden="true" /> : null}
                    {displayName(item, itemIndex)}
                  </MenuAction>
                );
              })}
            </MorphPopoverContent>
          </MorphPopover>
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label={`Rename ${label}`} onClick={() => { nameRef.current?.focus(); nameRef.current?.select(); }}>
          <Pencil className="size-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Add scenario" onClick={addScenario}>
          <Plus className="size-3.5" />
        </Button>
        {confirmRemove ? (
          <>
            <button type="button" aria-label={`Confirm: Remove ${label}`} onClick={removeScenario} className="h-8 px-2 text-xs text-foreground">
              Remove
            </button>
            <button type="button" aria-label={`Cancel: Remove ${label}`} onClick={() => setConfirmRemove(false)} className="h-8 px-2 text-xs text-muted-foreground">
              Cancel
            </button>
          </>
        ) : (
          <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${label}`} onClick={() => setConfirmRemove(true)}>
            <Trash2 className="size-3.5" />
          </Button>
        )}
        <span className="px-1 text-xs tabular-nums whitespace-nowrap text-muted-foreground">
          {index + 1} / {scenarios.length}
        </span>
        <Button type="button" variant="ghost" size="icon" aria-label="Previous scenario" disabled={index === 0} onClick={() => onIndex(index - 1)}>
          <ChevronLeft className="size-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Next scenario" disabled={index >= scenarios.length - 1} onClick={() => onIndex(index + 1)}>
          <ChevronRight className="size-3.5" />
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-sm font-medium text-foreground">
          Prompt<span className="text-destructive">*</span>
        </span>
        <div
          className={cn("rounded-[var(--radius-lg)] border border-border", dragging && "ring-2 ring-ring")}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            addFiles(event.dataTransfer.files);
          }}
        >
          <textarea
            aria-label="Prompt"
            required
            rows={4}
            value={scenario.prompt}
            placeholder="Describe what the agent should do."
            onChange={(event) => update({ prompt: event.target.value })}
            className="min-h-24 w-full resize-y bg-transparent px-3 pt-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
          />
          {scenario.files.length ? (
            <div className="flex flex-wrap gap-1 px-3 pb-1">
              {scenario.files.map((file) => (
                <button
                  key={file}
                  type="button"
                  aria-label={`Remove ${file}`}
                  onClick={() => update({ files: scenario.files.filter((entry) => entry !== file) })}
                  className="inline-flex h-7 max-w-40 items-center gap-1.5 rounded-[var(--radius-control)] bg-foreground/8 px-2.5 text-xs text-foreground"
                >
                  <span className="truncate">{file}</span>
                  <X className="size-3.5 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex items-center gap-2 px-3 pt-1 pb-2.5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Paperclip className="size-3.5" />
              Add files
            </button>
            <span className="text-xs text-muted-foreground">or drop them here</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-foreground">Evaluations</h3>
          <Button type="button" variant="ghost" size="sm" onClick={() => openImport("evaluations")}>
            <Upload className="size-3.5" />
            Import
          </Button>
        </div>
        <div className="divide-y divide-border overflow-hidden rounded-[var(--radius-lg)] border border-border">
          {scenario.evaluations.map((evaluation, evaluationIndex) => {
            const title = evaluation.name.trim() || `Evaluation ${evaluationIndex + 1}`;
            const confirming = confirmEval === evaluation.id;
            return (
              <div key={evaluation.id}>
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <button
                    type="button"
                    aria-expanded={evaluation.open}
                    aria-label={evaluation.open ? `Collapse ${title}` : `Expand ${title}`}
                    onClick={() => updateEvaluation(evaluation.id, { open: !evaluation.open })}
                    className="inline-flex min-w-0 items-center gap-2 text-sm text-foreground"
                  >
                    <ChevronDown className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", !evaluation.open && "-rotate-90")} />
                    <span className="truncate">{title}</span>
                  </button>
                  {confirming ? (
                    <span className="flex shrink-0 items-center">
                      <button type="button" aria-label={`Confirm: Remove ${title}`} onClick={() => removeEvaluation(evaluation.id)} className="h-8 px-2 text-xs text-foreground">
                        Remove
                      </button>
                      <button type="button" aria-label={`Cancel: Remove ${title}`} onClick={() => setConfirmEval(null)} className="h-8 px-2 text-xs text-muted-foreground">
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${title}`} onClick={() => setConfirmEval(evaluation.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
                {evaluation.open ? (
                  <div className="flex flex-col gap-3 px-3 pb-3">
                    <div className={cn("grid gap-3", scored && "sm:grid-cols-[minmax(0,1fr)_7rem]")}>
                      <Input label="Name" value={evaluation.name} onChange={(value) => updateEvaluation(evaluation.id, { name: value })} />
                      {scored ? (
                        <Input
                          label="Weight"
                          type="number"
                          min={1}
                          value={String(evaluation.weight)}
                          onChange={(value) => {
                            const next = Number(value);
                            if (value.trim() && Number.isFinite(next) && next > 0) updateEvaluation(evaluation.id, { weight: next });
                          }}
                        />
                      ) : null}
                    </div>
                    <label className="flex flex-col gap-1.5">
                      <span className="px-1 text-sm font-medium text-foreground">
                        Judging instructions<span className="text-destructive">*</span>
                      </span>
                      <textarea
                        aria-label="Judging instructions"
                        required
                        rows={3}
                        value={evaluation.instructions}
                        placeholder={INSTRUCTIONS_PLACEHOLDER}
                        onChange={(event) => updateEvaluation(evaluation.id, { instructions: event.target.value })}
                        className="min-h-20 w-full resize-y rounded-[var(--radius-lg)] border border-border bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </label>
                  </div>
                ) : null}
              </div>
            );
          })}
          <button type="button" onClick={addEvaluation} className="flex h-11 w-full items-center gap-2 px-3 text-sm text-foreground hover:bg-foreground/8">
            <Plus className="size-3.5" />
            Add evaluation
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-52 flex-col gap-1.5">
          <span className="px-1 text-sm font-medium text-foreground">Pass policy</span>
          <Select value={scenario.policy} onValueChange={(value) => update({ policy: value === "score" ? "score" : "all" })}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Every evaluation passed</SelectItem>
              <SelectItem value="score">Passing score</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {scored ? (
          <Input
            className="w-44"
            label="Passing score, out of 100"
            type="number"
            min={0}
            max={100}
            value={String(scenario.passingScore)}
            onChange={(value) => {
              const next = Number(value);
              if (value.trim() && Number.isFinite(next)) update({ passingScore: Math.min(100, Math.max(0, next)) });
            }}
          />
        ) : null}
      </div>

      <CenterMorphModal open={importKind !== null} onOpenChange={(open) => { if (!open) setImportKind(null); }}>
        <CenterMorphModalContent
          ariaLabel={importKind === "evaluations" ? "Import evaluations from a document" : "Import scenarios from a document"}
          className="max-w-lg"
        >
          <form onSubmit={applyImport} className="flex flex-col gap-5 p-6">
            <div className="flex flex-col gap-1.5 pr-8">
              <h2 className="text-base font-medium text-foreground">
                {importKind === "evaluations" ? "Import evaluations from a document" : "Import scenarios from a document"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {importKind === "evaluations"
                  ? "Each line becomes an evaluation, in the document’s words. A weight is kept when the line says how much it counts. The document isn’t kept."
                  : "Each task in the document becomes a scenario, with an evaluation when a line says what must pass. The document isn’t kept."}
              </p>
            </div>
            <textarea
              aria-label="Document"
              value={documentText}
              placeholder="Paste a test plan, a spec, a checklist…"
              onChange={(event) => setDocumentText(event.target.value)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={readDroppedDocument}
              className="min-h-36 w-full resize-y rounded-[var(--radius-lg)] border border-border bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setImportKind(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!documentText.trim()} className="disabled:opacity-40">
                Import
              </Button>
            </div>
          </form>
        </CenterMorphModalContent>
      </CenterMorphModal>
    </div>
  );
}
