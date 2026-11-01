import { useState } from "react";
import { Copy, PanelRight, SquareTerminal, Trash2 } from "lucide-react";
import { Page } from "@/app/page-layout";
import { CodeBlock } from "@/components/agents/code-block";
import { Button } from "@/components/motion/button/base";
import { Input } from "@/components/motion/input";
import type { TableColumn } from "@/components/motion/table";
import { useOrgData, useStore, type CommandLineTool } from "@/data";
import {
  ACTIONS_COLUMN,
  AddButton,
  ConfirmModal,
  DetailDrawer,
  DetailList,
  DetailSection,
  FormModal,
  LibraryBody,
  LibraryEmpty,
  LibraryTable,
  LibraryToolbar,
  NameCell,
  RowActions,
  TextAreaField,
  matches,
  plural,
  useCopy,
  useRecord,
  useResetOnOpen,
} from "./shared";

const DESCRIPTION = "Install a program in your runs by adding it to the agent tools.";

function commandCount(script: string) {
  return script.split(/\n|&&|;/).filter((command) => command.trim()).length;
}

export function CommandLineTools() {
  const { orgId, tools } = useOrgData();
  const { addTool, removeTool } = useStore();
  const copy = useCopy();
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const details = useRecord(tools);
  const removal = useRecord(tools);

  const rows = tools.filter((tool) => matches(query, tool.name, tool.script));

  const columns: TableColumn<CommandLineTool>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      width: "30%",
      cell: (tool) => (
        <NameCell
          icon={SquareTerminal}
          name={tool.name}
          mono
          detail={plural(commandCount(tool.script), "command")}
          onOpen={() => details.show(tool.id)}
        />
      ),
    },
    {
      key: "script",
      header: "Install script",
      cell: (tool) => (
        <code className="block truncate font-mono text-xs text-muted-foreground">{tool.script.split("\n")[0]}</code>
      ),
    },
    {
      ...ACTIONS_COLUMN,
      cell: (tool) => (
        <RowActions
          name={tool.name}
          actions={[
            { label: "View install script", icon: PanelRight, onSelect: () => details.show(tool.id) },
            { label: "Copy install script", icon: Copy, onSelect: () => copy(tool.script, "Install script") },
            { label: "Remove", icon: Trash2, destructive: true, separated: true, onSelect: () => removal.show(tool.id) },
          ]}
        />
      ),
    },
  ];

  const open = details.item;
  const removing = removal.item;

  return (
    <Page
      title="Command-line tools"
      description={DESCRIPTION}
      actions={tools.length ? <AddButton label="Add command-line tool" onClick={() => setAdding(true)} /> : null}
    >
      {tools.length === 0 ? (
        <LibraryEmpty
          icon={SquareTerminal}
          title="Add your first command-line tool"
          description={DESCRIPTION}
          actionLabel="Add command-line tool"
          onAction={() => setAdding(true)}
        />
      ) : (
        <LibraryBody>
          <LibraryToolbar
            query={query}
            onQueryChange={setQuery}
            placeholder="Search command-line tools"
            summary={plural(tools.length, "tool")}
          />
          <LibraryTable rows={rows} columns={columns} noMatches={`No command-line tools match “${query.trim()}”.`} />
        </LibraryBody>
      )}

      <DetailDrawer
        open={details.open}
        onOpenChange={(next) => (next ? null : details.hide())}
        icon={SquareTerminal}
        title={open?.name ?? ""}
        mono
        subtitle="Command-line tool"
        footer={
          open ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  details.hide();
                  removal.show(open.id);
                }}
              >
                <Trash2 aria-hidden="true" className="size-3.5" />
                Remove
              </Button>
              <Button variant="secondary" size="sm" onClick={details.hide}>
                Close
              </Button>
            </>
          ) : null
        }
      >
        {open ? (
          <>
            <DetailList
              items={[
                { label: "Name", value: <span className="font-mono">{open.name}</span> },
                { label: "Commands", value: plural(commandCount(open.script), "command") },
              ]}
            />
            <DetailSection title="Install script" description="The install script runs before the agent starts.">
              <CodeBlock code={open.script} language="bash" filename="install.sh" maxHeight={420} />
            </DetailSection>
          </>
        ) : null}
      </DetailDrawer>

      <AddToolModal
        open={adding}
        onOpenChange={setAdding}
        existing={tools}
        onAdd={(input) => {
          addTool(orgId, input);
          setAdding(false);
        }}
      />

      <ConfirmModal
        open={removal.open}
        onOpenChange={(next) => (next ? null : removal.hide())}
        title="Remove command-line tool"
        confirmLabel="Remove tool"
        onConfirm={() => {
          if (removing) removeTool(removing.id);
          removal.hide();
        }}
      >
        <p>
          Remove <span className="font-mono font-medium text-foreground">{removing?.name}</span> from the agent tools?
          New runs stop installing it.
        </p>
      </ConfirmModal>
    </Page>
  );
}

function AddToolModal({
  open,
  onOpenChange,
  existing,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: CommandLineTool[];
  onAdd: (input: { name: string; script: string }) => void;
}) {
  const [name, setName] = useState("");
  const [script, setScript] = useState("");
  const [errors, setErrors] = useState<{ name?: string; script?: string }>({});

  useResetOnOpen(open, () => {
    setName("");
    setScript("");
    setErrors({});
  });

  const submit = () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Name the tool.";
    else if (existing.some((tool) => tool.name.toLowerCase() === name.trim().toLowerCase()))
      next.name = "A tool with this name already exists.";
    if (!script.trim()) next.script = "Add the commands that install it.";
    setErrors(next);
    if (Object.keys(next).length) return;
    onAdd({ name: name.trim(), script: script.trim() });
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add command-line tool"
      description="The install script runs before the agent starts."
      submitLabel="Add command-line tool"
      onSubmit={submit}
    >
      <Input
        label="Name"
        value={name}
        onChange={(value) => {
          setName(value);
          setErrors((current) => ({ ...current, name: undefined }));
        }}
        placeholder="pnpm"
        error={errors.name}
        autoComplete="off"
        classNames={{ input: "font-mono text-sm" }}
        autoFocus
      />
      <TextAreaField
        label="Install script"
        value={script}
        onChange={(value) => {
          setScript(value);
          setErrors((current) => ({ ...current, script: undefined }));
        }}
        placeholder="corepack enable && corepack prepare pnpm@10 --activate"
        error={errors.script}
        mono
        rows={5}
      />
    </FormModal>
  );
}
