import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowDownLeft, ArrowUpRight, DollarSign, Plus } from "lucide-react";
import { Page, PageSection } from "@/app/page-layout";
import { BarChart, BarChartPlot, BarChartTooltip } from "@/components/charts/bar-chart";
import { Sparkline } from "@/components/charts/sparkline";
import {
  Alert,
  AlertAction,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@/components/motion/alert";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { Button } from "@/components/motion/button/base";
import { StatefulButton, type ButtonState } from "@/components/motion/button/stateful";
import {
  CARD_TARGET_CLASS,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/motion/card";
import {
  CenterMorphModal,
  CenterMorphModalClose,
  CenterMorphModalContent,
} from "@/components/motion/center-morph-modal";
import { Input } from "@/components/motion/input";
import { RadioGroup, RadioGroupItem } from "@/components/motion/radio";
import { Table, type TableColumn } from "@/components/motion/table";
import { TODAY, money, useOrgData, useStore, type Transaction } from "@/data";
import { cn } from "@/lib/utils";
import { ModalHeading, ROW_HEIGHT, dateValue, tableHeight } from "./shared";

const SPEND_DAYS = 14;
const PRESETS = ["25", "50", "100", "250"];
const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** Daily spend in cents for the last SPEND_DAYS days, ending on TODAY. */
function dailySpend(transactions: Transaction[]) {
  const end = new Date(dateValue(TODAY));
  const days = Array.from({ length: SPEND_DAYS }, (_, index) => {
    const day = new Date(end);
    day.setDate(end.getDate() - (SPEND_DAYS - 1 - index));
    return {
      key: day.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      label: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  });
  const totals = new Map<string, number>();
  for (const item of transactions) {
    if (item.cents < 0) totals.set(item.date, (totals.get(item.date) ?? 0) + Math.abs(item.cents));
  }
  return { labels: days.map((day) => day.label), cents: days.map((day) => totals.get(day.key) ?? 0) };
}

export function Billing() {
  const { org, orgId, transactions } = useOrgData();
  const { addFunds } = useStore();
  const [adding, setAdding] = useState(false);

  const spend = transactions.filter((item) => item.cents < 0).reduce((sum, item) => sum + Math.abs(item.cents), 0);
  const topUps = transactions.filter((item) => item.cents > 0);
  const topUpTotal = topUps.reduce((sum, item) => sum + item.cents, 0);
  const lastTopUp = [...topUps].sort((a, b) => dateValue(b.date) - dateValue(a.date))[0];
  const daily = useMemo(() => dailySpend(transactions), [transactions]);
  const dailyDollars = daily.cents.map((cents) => cents / 100);
  const recentSpend = daily.cents.reduce((sum, cents) => sum + cents, 0);
  const cumulativeDollars = dailyDollars.reduce<number[]>(
    (running, value) => [...running, (running[running.length - 1] ?? 0) + value],
    [],
  );

  const columns = useMemo<TableColumn<Transaction>[]>(
    () => [
      {
        key: "date",
        header: "Date",
        sortable: true,
        width: "140px",
        sortValue: (item) => dateValue(item.date),
        cell: (item) => <span className="text-muted-foreground">{item.date}</span>,
      },
      {
        key: "label",
        header: "Transaction",
        cell: (item) => (
          <span className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-lg bg-muted",
                item.cents > 0 ? "text-success" : "text-muted-foreground",
              )}
            >
              {item.cents > 0 ? (
                <ArrowDownLeft aria-hidden="true" className="size-3.5" />
              ) : (
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              )}
            </span>
            <span className="truncate font-medium">{item.label}</span>
          </span>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        align: "right",
        sortable: true,
        width: "140px",
        sortValue: (item) => item.cents,
        cell: (item) => (
          <span className={cn("tabular-nums", item.cents < 0 ? "text-foreground" : "text-success")}>
            {item.cents > 0 ? "+" : ""}
            {money(item.cents)}
          </span>
        ),
      },
      {
        key: "invoice",
        header: "Invoice",
        width: "140px",
        cell: (item) =>
          item.invoice ? (
            <span className="font-mono text-xs text-muted-foreground">{item.invoice}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
    ],
    [],
  );

  if (!org) return null;
  const empty = org.balanceCents <= 0;

  return (
    <Page
      title="Billing"
      description="Runs are paid from your balance. Add funds by card."
      actions={
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus aria-hidden="true" className="size-4" /> Add funds
        </Button>
      }
    >
      {org.blocked ? (
        <Alert variant="destructive">
          <AlertIcon />
          <AlertContent>
            <AlertTitle>This organization is blocked</AlertTitle>
            <AlertDescription>Its new runs are refused until it's unblocked.</AlertDescription>
          </AlertContent>
        </Alert>
      ) : empty ? (
        <Alert variant="warning">
          <AlertIcon />
          <AlertContent>
            <AlertTitle>Your balance is {money(org.balanceCents)}</AlertTitle>
            <AlertDescription>Add funds by card to launch experiments and one-off runs.</AlertDescription>
            <AlertAction>
              <Button size="sm" onClick={() => setAdding(true)}>
                Add funds
              </Button>
            </AlertAction>
          </AlertContent>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Balance</CardDescription>
            <CardTitle>
              <AnimatedNumber
                value={org.balanceCents}
                format={(cents) => money(Math.round(cents))}
                className={cn("text-3xl font-semibold tracking-tight", empty && "text-destructive")}
              />
            </CardTitle>
            <CardAction>
              {org.blocked ? (
                <AnimatedBadge status="danger" size="sm">Blocked</AnimatedBadge>
              ) : empty ? (
                <AnimatedBadge status="warning" size="sm">Empty</AnimatedBadge>
              ) : (
                <AnimatedBadge status="success" size="sm">Active</AnimatedBadge>
              )}
            </CardAction>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            {empty ? "No run starts until you add funds." : "What's left to spend on runs."}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Spend</CardDescription>
            <CardTitle>
              <AnimatedNumber
                value={spend}
                format={(cents) => money(Math.round(cents))}
                className="text-3xl font-semibold tracking-tight"
              />
            </CardTitle>
          </CardHeader>
          {recentSpend > 0 ? (
            <CardContent>
              <Sparkline
                data={cumulativeDollars}
                labels={daily.labels}
                label={`Cumulative spend, last ${SPEND_DAYS} days`}
                variant="area"
                color="var(--primary)"
                height={32}
                formatValue={(value) => money(Math.round(value * 100))}
              />
            </CardContent>
          ) : (
            <CardContent className="text-muted-foreground">
              {spend > 0 ? `Nothing spent in the last ${SPEND_DAYS} days.` : "No runs paid for yet."}
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Top-ups</CardDescription>
            <CardTitle>
              <AnimatedNumber
                value={topUpTotal}
                format={(cents) => money(Math.round(cents))}
                className="text-3xl font-semibold tracking-tight"
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            {lastTopUp ? `Last top-up on ${lastTopUp.date}.` : "No top-ups yet."}
          </CardContent>
        </Card>
      </div>

      <PageSection
        title="Daily spend"
        description={`${money(recentSpend)} on runs in the last ${SPEND_DAYS} days.`}
      >
        {recentSpend > 0 ? (
          <Card>
            <CardContent>
              <BarChart
                series={[{ id: "spend", name: "Spend", color: "var(--primary)", values: dailyDollars }]}
                categories={daily.labels}
                label={`Spend per day, last ${SPEND_DAYS} days`}
                formatValue={(value) => money(Math.round(value * 100))}
                formatTick={(value) => (Number.isInteger(value) ? dollars.format(value) : money(Math.round(value * 100)))}
              >
                <BarChartPlot height={180} />
                <BarChartTooltip />
              </BarChart>
            </CardContent>
          </Card>
        ) : (
          <Card variant="muted">
            <CardContent className="py-2 text-center text-muted-foreground">
              Launches and one-off runs show up here by day.
            </CardContent>
          </Card>
        )}
      </PageSection>

      <PageSection title="Transactions">
        {transactions.length === 0 ? (
          <Card variant="muted">
            <CardContent className="py-2 text-center text-muted-foreground">
              No transactions yet. Top-ups and runs show up here.
            </CardContent>
          </Card>
        ) : (
          <Table
            data={transactions}
            columns={columns}
            getRowId={(item) => item.id}
            defaultSort={{ key: "date", direction: "desc" }}
            rowHeight={ROW_HEIGHT}
            height={tableHeight(transactions.length, 10)}
            className="rounded-2xl"
          />
        )}
      </PageSection>

      <AddFundsModal
        open={adding}
        onOpenChange={setAdding}
        balanceCents={org.balanceCents}
        firstTopUp={topUps.length === 0}
        onAdd={(cents) => {
          addFunds(orgId, cents);
          setAdding(false);
        }}
      />
    </Page>
  );
}

function AddFundsModal({
  open,
  onOpenChange,
  balanceCents,
  firstTopUp,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balanceCents: number;
  firstTopUp: boolean;
  onAdd: (cents: number) => void;
}) {
  const [amount, setAmount] = useState("50.00");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<ButtonState>("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (open) {
      setAmount("50.00");
      setError(null);
      setState("idle");
    }
  }, [open]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const parsed = Number(amount.replace(/[$,\s]/g, ""));
  const cents = Number.isFinite(parsed) ? Math.round(parsed * 100) : NaN;
  const preset = PRESETS.find((value) => Number(value) * 100 === cents) ?? "";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!amount.trim() || !Number.isFinite(cents)) return setError("Enter an amount in USD, like 50.00.");
    if (cents < 100) return setError("The minimum top-up is $1.00.");
    setState("loading");
    // Stands in for the round trip to Stripe Checkout.
    timer.current = window.setTimeout(() => onAdd(cents), 900);
  };

  return (
    <CenterMorphModal open={open} onOpenChange={onOpenChange}>
      <CenterMorphModalContent ariaLabel="Add funds" dismissible={state !== "loading"} className="max-w-md">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5 p-6">
          <ModalHeading
            title="Add funds"
            description="You pay by card on Stripe, then come back here. Tax is added at payment. This prototype records the top-up locally."
          />
          <RadioGroup
            value={preset}
            onValueChange={(value) => {
              setAmount(`${value}.00`);
              setError(null);
            }}
            orientation="horizontal"
            aria-label="Amount presets"
            className="grid grid-cols-4 gap-2"
          >
            {PRESETS.map((value) => (
              <Card key={value} size="compact" interactive selected={preset === value} className="py-3">
                <CardContent className="px-3">
                  <RadioGroupItem
                    value={value}
                    label={`$${value}`}
                    disabled={state === "loading"}
                    className={CARD_TARGET_CLASS}
                  />
                </CardContent>
              </Card>
            ))}
          </RadioGroup>
          <div className="flex flex-col gap-1.5">
            <Input
              label="Amount"
              inputMode="decimal"
              leftIcon={<DollarSign />}
              value={amount}
              onChange={(value) => {
                setAmount(value);
                setError(null);
              }}
              error={error ?? undefined}
              disabled={state === "loading"}
            />
            {error ? null : (
              <p className="px-1 text-xs text-muted-foreground">{firstTopUp ? "Your first top-up" : "USD"}</p>
            )}
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3 text-sm">
            <span className="text-muted-foreground">New balance</span>
            <AnimatedNumber
              value={balanceCents + (Number.isFinite(cents) && cents > 0 ? cents : 0)}
              format={(value) => money(Math.round(value))}
              duration={0.4}
              startOnView={false}
              className="font-medium text-foreground"
            />
          </div>
          <div className="flex justify-end gap-2">
            <CenterMorphModalClose>
              <Button variant="ghost" size="sm" disabled={state === "loading"}>
                Cancel
              </Button>
            </CenterMorphModalClose>
            <StatefulButton type="submit" size="sm" state={state} loadingText="Opening Stripe">
              Continue
            </StatefulButton>
          </div>
        </form>
      </CenterMorphModalContent>
    </CenterMorphModal>
  );
}
