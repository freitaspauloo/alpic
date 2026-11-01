import { useState } from "react";
import { BookOpenText, Copy, FileText, FolderGit2, PanelRight, Trash2, Upload } from "lucide-react";
import { Page } from "@/app/page-layout";
import { CodeBlock } from "@/components/agents/code-block";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Button } from "@/components/motion/button/base";
import { Input } from "@/components/motion/input";
import type { TableColumn } from "@/components/motion/table";
import { useOrgData, useStore, type Skill } from "@/data";
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
  wrapText,
} from "./shared";

const DESCRIPTION = "Give the agent instructions on how to interact with your product.";

function skillFile(skill: Skill) {
  return `# ${skill.name}\n\n${skill.description}\n`;
}

function skillPreview(skill: Skill) {
  return wrapText(skillFile(skill), 64);
}

function SourceBadge({ source }: { source: string }) {
  const github = source === "GitHub";
  return (
    <AnimatedBadge
      status="neutral"
      size="sm"
      icon={github ? <FolderGit2 className="h-3 w-3" /> : <Upload className="h-3 w-3" />}
    >
      {source}
    </AnimatedBadge>
  );
}

export function Skills() {
  const { orgId, skills } = useOrgData();
  const { addSkill, removeSkill } = useStore();
  const copy = useCopy();
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const details = useRecord(skills);
  const removal = useRecord(skills);

  const rows = skills.filter((skill) => matches(query, skill.name, skill.description, skill.source));

  const columns: TableColumn<Skill>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (skill) => (
        <NameCell
          icon={BookOpenText}
          name={skill.name}
          detail={skill.description}
          onOpen={() => details.show(skill.id)}
        />
      ),
    },
    { key: "source", header: "Source", width: "140px", sortable: true, cell: (skill) => <SourceBadge source={skill.source} /> },
    {
      key: "files",
      header: "Files",
      width: "96px",
      align: "right",
      sortable: true,
      cell: (skill) => <span className="tabular-nums text-muted-foreground">{skill.files}</span>,
    },
    {
      ...ACTIONS_COLUMN,
      cell: (skill) => (
        <RowActions
          name={skill.name}
          actions={[
            { label: "View SKILL.md", icon: PanelRight, onSelect: () => details.show(skill.id) },
            { label: "Copy SKILL.md", icon: Copy, onSelect: () => copy(skillFile(skill), "SKILL.md") },
            { label: "Remove", icon: Trash2, destructive: true, separated: true, onSelect: () => removal.show(skill.id) },
          ]}
        />
      ),
    },
  ];

  const open = details.item;
  const removing = removal.item;

  return (
    <Page
      title="Skills"
      description={DESCRIPTION}
      actions={skills.length ? <AddButton label="Add skill" onClick={() => setAdding(true)} /> : null}
    >
      {skills.length === 0 ? (
        <LibraryEmpty
          icon={BookOpenText}
          title="Add your first skill"
          description={DESCRIPTION}
          actionLabel="Add skill"
          onAction={() => setAdding(true)}
        />
      ) : (
        <LibraryBody>
          <LibraryToolbar
            query={query}
            onQueryChange={setQuery}
            placeholder="Search skills"
            summary={plural(skills.length, "skill")}
          />
          <LibraryTable rows={rows} columns={columns} noMatches={`No skills match “${query.trim()}”.`} />
        </LibraryBody>
      )}

      <DetailDrawer
        open={details.open}
        onOpenChange={(next) => (next ? null : details.hide())}
        icon={BookOpenText}
        title={open?.name ?? ""}
        subtitle={open ? `${open.source} skill` : undefined}
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
                { label: "Source", value: <SourceBadge source={open.source} /> },
                {
                  label: "Files",
                  value: (
                    <span className="inline-flex items-center gap-1.5">
                      <FileText aria-hidden="true" className="size-3.5 text-muted-foreground" />
                      {plural(open.files, "file")}
                    </span>
                  ),
                },
                { label: "Description", value: <span className="text-pretty">{open.description}</span> },
              ]}
            />
            <DetailSection title="SKILL.md" description="The instructions agents load before they start.">
              <CodeBlock code={skillPreview(open)} language="text" filename="SKILL.md" maxHeight={360} />
            </DetailSection>
          </>
        ) : null}
      </DetailDrawer>

      <AddSkillModal
        open={adding}
        onOpenChange={setAdding}
        existing={skills}
        onAdd={(input) => {
          addSkill(orgId, input);
          setAdding(false);
        }}
      />

      <ConfirmModal
        open={removal.open}
        onOpenChange={(next) => (next ? null : removal.hide())}
        title="Remove skill"
        confirmLabel="Remove skill"
        onConfirm={() => {
          if (removing) removeSkill(removing.id);
          removal.hide();
        }}
      >
        <p>
          Remove <span className="font-mono font-medium text-foreground">{removing?.name}</span> from the library?
          Agents stop loading it in new runs.
        </p>
      </ConfirmModal>
    </Page>
  );
}

function AddSkillModal({
  open,
  onOpenChange,
  existing,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: Skill[];
  onAdd: (input: { name: string; description: string }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  useResetOnOpen(open, () => {
    setName("");
    setDescription("");
    setErrors({});
  });

  const submit = () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Name the skill.";
    else if (existing.some((skill) => skill.name.toLowerCase() === name.trim().toLowerCase()))
      next.name = "A skill with this name already exists.";
    if (!description.trim()) next.description = "Describe when the agent should use it.";
    setErrors(next);
    if (Object.keys(next).length) return;
    onAdd({ name: name.trim(), description: description.trim() });
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add skill"
      description="Uploaded as SKILL.md. You can refresh a GitHub skill later."
      submitLabel="Add skill"
      onSubmit={submit}
    >
      <Input
        label="Name"
        value={name}
        onChange={(value) => {
          setName(value);
          setErrors((current) => ({ ...current, name: undefined }));
        }}
        placeholder="checkout-policy"
        error={errors.name}
        autoComplete="off"
        autoFocus
      />
      <TextAreaField
        label="Description"
        value={description}
        onChange={(value) => {
          setDescription(value);
          setErrors((current) => ({ ...current, description: undefined }));
        }}
        placeholder="How to judge a checkout: prices, fees, and where the agent stopped."
        error={errors.description}
        rows={3}
      />
    </FormModal>
  );
}
