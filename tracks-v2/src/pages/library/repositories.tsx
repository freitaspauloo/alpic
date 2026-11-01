import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, ExternalLink, FolderGit2, GitBranch, PanelRight, Trash2 } from "lucide-react";
import { Page } from "@/app/page-layout";
import { CodeBlock } from "@/components/agents/code-block";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Button } from "@/components/motion/button/base";
import { Input } from "@/components/motion/input";
import type { TableColumn } from "@/components/motion/table";
import { useOrgData, useStore, type Experiment, type Repository } from "@/data";
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
  matches,
  plural,
  useCopy,
  useRecord,
  useResetOnOpen,
} from "./shared";

const DESCRIPTION = "Start your variants' runs from codebases representative of your users.";
const GITHUB_URL = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/;

function repoName(url: string) {
  const match = GITHUB_URL.exec(url.trim());
  return match ? `${match[1]}/${match[2]}` : "";
}

function RefBadge({ value }: { value: string }) {
  return (
    <AnimatedBadge status="neutral" size="sm" icon={<GitBranch className="h-3 w-3" />} className="font-mono">
      {value}
    </AnimatedBadge>
  );
}

export function Repositories() {
  const { orgId, repositories, experiments } = useOrgData();
  const { addRepository, removeRepository } = useStore();
  const copy = useCopy();
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const details = useRecord(repositories);
  const removal = useRecord(repositories);

  const usage = useMemo(() => {
    const byRepo = new Map<string, Experiment[]>();
    for (const experiment of experiments) {
      if (!experiment.repositoryId) continue;
      byRepo.set(experiment.repositoryId, [...(byRepo.get(experiment.repositoryId) ?? []), experiment]);
    }
    return byRepo;
  }, [experiments]);

  const rows = repositories.filter((repo) => matches(query, repo.name, repo.url, repo.ref));

  const columns: TableColumn<Repository>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (repo) => (
        <NameCell
          icon={FolderGit2}
          name={repo.name}
          detail={<span className="font-mono">{repo.url.replace(/^https:\/\//, "")}</span>}
          onOpen={() => details.show(repo.id)}
        />
      ),
    },
    { key: "ref", header: "Ref", width: "160px", sortable: true, cell: (repo) => <RefBadge value={repo.ref} /> },
    {
      key: "usage",
      header: "Used by",
      width: "150px",
      sortValue: (repo) => usage.get(repo.id)?.length ?? 0,
      sortable: true,
      cell: (repo) => {
        const count = usage.get(repo.id)?.length ?? 0;
        return (
          <span className={count ? "text-foreground" : "text-muted-foreground"}>
            {count ? plural(count, "experiment") : "No experiments"}
          </span>
        );
      },
    },
    {
      ...ACTIONS_COLUMN,
      cell: (repo) => (
        <RowActions
          name={repo.name}
          actions={[
            { label: "View details", icon: PanelRight, onSelect: () => details.show(repo.id) },
            { label: "Open on GitHub", icon: ExternalLink, onSelect: () => window.open(repo.url, "_blank", "noopener") },
            { label: "Copy URL", icon: Copy, onSelect: () => copy(repo.url, "Repository URL") },
            { label: "Remove", icon: Trash2, destructive: true, separated: true, onSelect: () => removal.show(repo.id) },
          ]}
        />
      ),
    },
  ];

  const open = details.item;
  const openUsage = open ? (usage.get(open.id) ?? []) : [];
  const removing = removal.item;
  const removingUsage = removing ? (usage.get(removing.id)?.length ?? 0) : 0;

  return (
    <Page
      title="Repositories"
      description={DESCRIPTION}
      actions={repositories.length ? <AddButton label="Add repository" onClick={() => setAdding(true)} /> : null}
    >
      {repositories.length === 0 ? (
        <LibraryEmpty
          icon={FolderGit2}
          title="Add your first repository"
          description={DESCRIPTION}
          actionLabel="Add repository"
          onAction={() => setAdding(true)}
        />
      ) : (
        <LibraryBody>
          <LibraryToolbar
            query={query}
            onQueryChange={setQuery}
            placeholder="Search repositories"
            summary={plural(repositories.length, "repository", "repositories")}
          />
          <LibraryTable rows={rows} columns={columns} noMatches={`No repositories match “${query.trim()}”.`} />
        </LibraryBody>
      )}

      <DetailDrawer
        open={details.open}
        onOpenChange={(next) => (next ? null : details.hide())}
        icon={FolderGit2}
        title={open?.name ?? ""}
        subtitle="GitHub repository"
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
              <Button variant="secondary" size="sm" onClick={() => window.open(open.url, "_blank", "noopener")}>
                <ExternalLink aria-hidden="true" className="size-3.5" />
                Open on GitHub
              </Button>
            </>
          ) : null
        }
      >
        {open ? (
          <>
            <DetailList
              items={[
                { label: "Name", value: open.name },
                {
                  label: "URL",
                  value: (
                    <a
                      href={open.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate font-mono text-xs text-primary underline-offset-4 hover:underline"
                    >
                      {open.url}
                    </a>
                  ),
                },
                { label: "Ref", value: <RefBadge value={open.ref} /> },
              ]}
            />
            <DetailSection title="Checkout" description="Each run starts from a fresh clone of this ref.">
              <CodeBlock
                code={`git clone --depth 1 --branch ${open.ref} \\\n  ${open.url}.git`}
                language="bash"
                filename="checkout"
                showLineNumbers={false}
              />
            </DetailSection>
            <DetailSection
              title="Used by"
              description={openUsage.length ? "Experiments whose runs start from this repository." : "No experiment starts from this repository yet."}
            >
              {openUsage.length ? (
                <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border">
                  {openUsage.map((experiment) => (
                    <li key={experiment.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <Link
                        to={`/${orgId}/experiments/${experiment.id}`}
                        className="truncate text-primary underline-offset-4 hover:underline"
                      >
                        {experiment.name}
                      </Link>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {plural(experiment.scenarios.length, "scenario")}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </DetailSection>
          </>
        ) : null}
      </DetailDrawer>

      <AddRepositoryModal
        open={adding}
        onOpenChange={setAdding}
        existing={repositories}
        onAdd={(input) => {
          addRepository(orgId, input);
          setAdding(false);
        }}
      />

      <ConfirmModal
        open={removal.open}
        onOpenChange={(next) => (next ? null : removal.hide())}
        title="Remove repository"
        confirmLabel="Remove repository"
        onConfirm={() => {
          if (removing) removeRepository(removing.id);
          removal.hide();
        }}
      >
        <p>
          Remove <span className="font-medium text-foreground">{removing?.name}</span> from the library?
        </p>
        <p>
          {removingUsage
            ? `${plural(removingUsage, "experiment")} that start from it will start without a repository.`
            : "No experiment starts from it."}{" "}
          Runs that already used it keep their history.
        </p>
      </ConfirmModal>
    </Page>
  );
}

function AddRepositoryModal({
  open,
  onOpenChange,
  existing,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: Repository[];
  onAdd: (input: { name: string; url: string; ref: string }) => void;
}) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [nameEdited, setNameEdited] = useState(false);
  const [ref, setRef] = useState("main");
  const [errors, setErrors] = useState<{ url?: string; name?: string; ref?: string }>({});

  useResetOnOpen(open, () => {
    setUrl("");
    setName("");
    setNameEdited(false);
    setRef("main");
    setErrors({});
  });

  const submit = () => {
    const cleanUrl = url.trim().replace(/\.git$/, "").replace(/\/$/, "");
    const cleanName = name.trim() || repoName(cleanUrl);
    const next: typeof errors = {};
    if (!GITHUB_URL.test(cleanUrl)) next.url = "Enter a public GitHub repository URL, like https://github.com/acme/app.";
    else if (existing.some((repo) => repo.url.toLowerCase() === cleanUrl.toLowerCase()))
      next.url = "This repository is already in the library.";
    else if (!cleanName) next.name = "Name the repository.";
    if (!ref.trim()) next.ref = "Enter a branch, tag or commit.";
    setErrors(next);
    if (Object.keys(next).length) return;
    onAdd({ name: cleanName, url: cleanUrl, ref: ref.trim() });
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add repository"
      description="Enter a public GitHub repository URL, like https://github.com/acme/app"
      submitLabel="Add repository"
      onSubmit={submit}
    >
      <Input
        label="URL"
        value={url}
        onChange={(value) => {
          setUrl(value);
          if (!nameEdited) setName(repoName(value));
          setErrors((current) => ({ ...current, url: undefined, name: nameEdited ? current.name : undefined }));
        }}
        placeholder="https://github.com/acme/app"
        error={errors.url}
        inputMode="url"
        autoComplete="off"
        autoFocus
      />
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_10rem]">
        <Input
          label="Name"
          value={name}
          onChange={(value) => {
            setName(value);
            setNameEdited(true);
            setErrors((current) => ({ ...current, name: undefined }));
          }}
          placeholder="acme/app"
          error={errors.name}
          autoComplete="off"
        />
        <Input
          label="Ref"
          value={ref}
          onChange={(value) => {
            setRef(value);
            setErrors((current) => ({ ...current, ref: undefined }));
          }}
          placeholder="main"
          error={errors.ref}
          leftIcon={<GitBranch />}
          autoComplete="off"
          classNames={{ input: "font-mono text-sm" }}
        />
      </div>
    </FormModal>
  );
}
