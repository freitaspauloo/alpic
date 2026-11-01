import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { TableColumn } from "@/components/motion/table";
import { passRate, useStore, type Experiment, type Scenario } from "../store";
import {
  Button,
  ChipToggle,
  Dialog,
  Empty,
  FormActions,
  FormShell,
  MenuButton,
  Page,
  SimpleDataTable,
  Status,
  TextField,
} from "../ui";

const starters = [
  {
    label: "find pricing",
    name: "Find the price",
    prompt:
      "I’m considering using {website}. Find the published prices and explain what I would pay, including any stated billing period or mandatory fees. Link to your sources. If prices aren’t published, explain how to obtain them.",
  },
  {
    label: "get started",
    name: "Get started",
    prompt:
      "I’m new to {website}. Explain what it offers and find the official instructions or entry point for getting started. Give me the first actionable steps and link to the relevant pages.",
  },
  {
    label: "create an account",
    name: "Create an account",
    prompt:
      "Create an account on {website} using the supplied test identity. Complete verification using the supplied resources. Report whether the account is usable, and exactly where you stopped if you couldn’t finish.",
  },
  {
    label: "get support",
    name: "Get support",
    prompt:
      "I need help with {website}. Find an official way to get support or contact the business. Give me the working link or contact details and any instructions needed to use it.",
  },
];

export function Experiments() {
  const { org = "" } = useParams();
  const store = useStore();
  const navigate = useNavigate();
  const experiments = store.experiments.filter((item) => item.orgId === org);
  const [creating, setCreating] = useState(false);
  const [fromDoc, setFromDoc] = useState(false);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [picked, setPicked] = useState<string[]>(["find pricing"]);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const removing = experiments.find((item) => item.id === removeId);

  function startScratch(event: FormEvent) {
    event.preventDefault();
    const id = store.createExperiment(org, name, []);
    setCreating(false);
    setName("");
    navigate(`/${org}/experiments/${id}/edit`);
  }

  const columns = useMemo((): TableColumn<Experiment>[] => {
    return [
      {
        key: "name",
        header: "Name",
        sortable: true,
        sortValue: (row) => row.name,
        cell: (experiment) => (
          <Link className="font-medium text-foreground underline-offset-4 hover:underline" to={`/${org}/experiments/${experiment.id}`}>
            {experiment.name}
          </Link>
        ),
      },
      {
        key: "scenarios",
        header: "Scenarios",
        sortable: true,
        align: "left",
        sortValue: (row) => row.scenarios.length,
        cell: (experiment) => (
          <span className="text-muted-foreground">
            {experiment.scenarios.length === 1 ? "1 scenario" : `${experiment.scenarios.length} scenarios`}
          </span>
        ),
      },
      {
        key: "latest",
        header: "Latest execution",
        cell: (experiment) => {
          const latest = store.executions.find((item) => item.experimentId === experiment.id);
          if (!latest) return <span className="text-muted-foreground">Not launched yet</span>;
          const runs = store.runs.filter((item) => item.executionId === latest.id);
          const rate = passRate(runs);
          return (
            <span className="inline-flex items-center gap-2">
              <Status status={latest.status} />
              {rate !== null ? <span className="text-muted-foreground">{Math.round(rate * 100)}% pass</span> : null}
            </span>
          );
        },
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        width: "220px",
        cell: (experiment) => (
          <span className="inline-flex flex-wrap justify-end gap-1">
            <MenuButton onClick={() => navigate(`/${org}/experiments/${experiment.id}/edit`)}>Edit</MenuButton>
            <MenuButton onClick={() => store.duplicateExperiment(experiment.id)}>Duplicate</MenuButton>
            <MenuButton onClick={() => setRemoveId(experiment.id)}>Remove</MenuButton>
          </span>
        ),
      },
    ];
  }, [navigate, org, store]);

  function startFromDocument(event: FormEvent) {
    event.preventDefault();
    const host = website.trim() || "your-business.com";
    const chosen = starters.filter((item) => picked.includes(item.label));
    const scenarios: Scenario[] = chosen.map((item) => ({
      id: `sc_${item.label.replace(/\s/g, "_")}`,
      name: item.name,
      prompt: item.prompt.replaceAll("{website}", host),
    }));
    const id = store.createExperiment(org, chosen[0]?.name ?? "Untitled experiment", scenarios);
    setFromDoc(false);
    navigate(`/${org}/experiments/${id}`);
  }

  return (
    <Page
      title="Experiments"
      description="Compare how agents perform your scenarios across variants."
      action={
        <>
          <Button type="button" variant="secondary" onClick={() => setFromDoc(true)}>
            From a document
          </Button>
          <Button type="button" onClick={() => setCreating(true)}>
            New experiment
          </Button>
        </>
      }
    >
      {experiments.length === 0 ? (
        <Empty title="What would you like to test?">
          <p>Start from a few questions about your website, or write the scenarios yourself.</p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {starters.map((item) => (
              <ChipToggle key={item.label} onClick={() => setFromDoc(true)}>
                {item.label}
              </ChipToggle>
            ))}
          </div>
          <div className="pt-4">
            <Button type="button" onClick={() => setCreating(true)}>
              Start from scratch
            </Button>
          </div>
        </Empty>
      ) : (
        <SimpleDataTable
          data={experiments}
          columns={columns}
          getRowId={(row) => row.id}
          defaultSort={{ key: "name", direction: "asc" }}
          emptyState="No experiments yet"
        />
      )}

      {creating ? (
        <Dialog title="New experiment" description="From scratch. You’ll add scenarios and agents next." onClose={() => setCreating(false)}>
          <form onSubmit={startScratch}>
            <FormShell>
              <TextField
                id="exp-name"
                label="Name"
                value={name}
                onChange={setName}
                placeholder="Untitled experiment"
                autoFocus
                required
              />
              <FormActions onCancel={() => setCreating(false)} submitLabel="Create" />
            </FormShell>
          </form>
        </Dialog>
      ) : null}

      {fromDoc ? (
        <Dialog title="Import scenarios from a document" description="Pick the questions to ask about a website. Tracks writes one scenario for each." onClose={() => setFromDoc(false)} wide>
          <form onSubmit={startFromDocument}>
            <FormShell>
              <TextField
                id="website"
                label="Website"
                value={website}
                onChange={setWebsite}
                placeholder="your-business.com"
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                {starters.map((item) => (
                  <ChipToggle
                    key={item.label}
                    pressed={picked.includes(item.label)}
                    onClick={() =>
                      setPicked((current) =>
                        current.includes(item.label) ? current.filter((label) => label !== item.label) : [...current, item.label],
                      )
                    }
                  >
                    {item.label}
                  </ChipToggle>
                ))}
              </div>
              <FormActions onCancel={() => setFromDoc(false)} submitLabel="Create experiment" submitDisabled={!picked.length} />
            </FormShell>
          </form>
        </Dialog>
      ) : null}

      {removing ? (
        <Dialog title={`Remove ${removing.name}?`} description="Its scenarios and settings are lost, and its executions are no longer shown." onClose={() => setRemoveId(null)}>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setRemoveId(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                store.removeExperiment(removing.id);
                setRemoveId(null);
              }}
            >
              Remove
            </Button>
          </div>
        </Dialog>
      ) : null}
    </Page>
  );
}
