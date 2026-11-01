import { useEffect, useState, type FormEvent } from "react";
import { Cloud, Triangle } from "lucide-react";
import { Page } from "@/app/page-layout";
import { RouterButtonLink } from "@/app/router-link";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Button } from "@/components/motion/button/base";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/motion/card";
import {
  CenterMorphModal,
  CenterMorphModalClose,
  CenterMorphModalContent,
} from "@/components/motion/center-morph-modal";
import { Input } from "@/components/motion/input";
import { useOrgData, useStore, type TrafficProvider, type TrafficSource } from "@/data";
import { PROVIDER_COPY, suggestedTarget, trackedSources } from "./model";

const PROVIDER_ICON: Record<TrafficProvider, typeof Cloud> = { Vercel: Triangle, Cloudflare: Cloud };

export function Sources() {
  const { orgId, sources } = useOrgData();
  const { connectSource, disconnectSource } = useStore();
  const [connecting, setConnecting] = useState<TrafficSource | null>(null);
  const [disconnecting, setDisconnecting] = useState<TrafficSource | null>(null);
  const anyTracked = trackedSources(sources).length > 0;

  return (
    <Page
      title="Sources"
      description="We track one Vercel project, or one Cloudflare zone and all of its subdomains."
      actions={
        anyTracked ? (
          <RouterButtonLink to={`/${orgId}/analytics/traffic`} variant="secondary" size="sm">
            Back to Traffic
          </RouterButtonLink>
        ) : null
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {sources.map((source) => (
          <SourceCard
            key={source.provider}
            source={source}
            onConnect={() => setConnecting(source)}
            onDisconnect={() => setDisconnecting(source)}
          />
        ))}
      </div>

      <ConnectModal
        source={connecting}
        orgId={orgId}
        onOpenChange={(open) => !open && setConnecting(null)}
        onConnect={(target) => {
          if (!connecting) return;
          connectSource(orgId, connecting.provider, target);
          setConnecting(null);
        }}
      />
      <DisconnectModal
        source={disconnecting}
        onOpenChange={(open) => !open && setDisconnecting(null)}
        onDisconnect={() => {
          if (!disconnecting) return;
          disconnectSource(orgId, disconnecting.provider);
          setDisconnecting(null);
        }}
      />
    </Page>
  );
}

function SourceCard({
  source,
  onConnect,
  onDisconnect,
}: {
  source: TrafficSource;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const copy = PROVIDER_COPY[source.provider];
  const Icon = PROVIDER_ICON[source.provider];
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2" className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted">
            <Icon className="size-4 text-foreground" aria-hidden />
          </span>
          {source.provider}
        </CardTitle>
        <CardAction>
          <AnimatedBadge status={source.tracked ? "success" : "neutral"} size="sm" pulse={source.tracked}>
            {source.tracked ? "Tracking" : "Not connected"}
          </AnimatedBadge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-muted-foreground">{copy.pitch}</p>
        {source.tracked ? (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2.5">
            <span className="text-muted-foreground">{copy.field}</span>
            <span className="min-w-0 truncate font-mono text-xs text-foreground">{source.target}</span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{copy.scope}</p>
        )}
      </CardContent>
      <CardFooter className="mt-auto">
        {source.tracked ? (
          <>
            <Button variant="secondary" size="sm" onClick={onDisconnect}>
              Disconnect
            </Button>
            <Button variant="ghost" size="sm" onClick={onConnect}>
              Change {copy.field.toLowerCase()}
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={onConnect}>
            Connect {source.provider}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function ConnectModal({
  source,
  orgId,
  onOpenChange,
  onConnect,
}: {
  source: TrafficSource | null;
  orgId: string;
  onOpenChange: (open: boolean) => void;
  onConnect: (target: string) => void;
}) {
  const [target, setTarget] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Keep the last provider while the modal folds closed.
  const [shown, setShown] = useState<TrafficSource | null>(source);
  if (source && source !== shown) setShown(source);

  useEffect(() => {
    if (!source) return;
    setTarget(source.target || suggestedTarget(source.provider, orgId));
    setError(null);
  }, [source, orgId]);

  const provider = shown?.provider ?? "Vercel";
  const copy = PROVIDER_COPY[provider];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!target.trim()) {
      setError(copy.missing);
      return;
    }
    onConnect(target.trim());
  };

  return (
    <CenterMorphModal open={source !== null} onOpenChange={onOpenChange}>
      <CenterMorphModalContent ariaLabel={`Connect ${provider}`} className="max-w-md">
        <form onSubmit={submit} className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-1 pr-8">
            <h2 className="text-lg font-semibold text-foreground">Connect {provider}</h2>
            <p className="text-sm text-muted-foreground">{copy.scope}</p>
          </div>
          <Input
            label={copy.field}
            value={target}
            onChange={(value) => {
              setTarget(value);
              setError(null);
            }}
            error={error ?? undefined}
            classNames={{ input: "font-mono" }}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <CenterMorphModalClose>
              <Button type="button" variant="ghost" size="sm">
                Cancel
              </Button>
            </CenterMorphModalClose>
            <Button type="submit" size="sm">
              Track
            </Button>
          </div>
        </form>
      </CenterMorphModalContent>
    </CenterMorphModal>
  );
}

function DisconnectModal({
  source,
  onOpenChange,
  onDisconnect,
}: {
  source: TrafficSource | null;
  onOpenChange: (open: boolean) => void;
  onDisconnect: () => void;
}) {
  const [shown, setShown] = useState<TrafficSource | null>(source);
  if (source && source !== shown) setShown(source);
  const provider = shown?.provider ?? "Vercel";

  return (
    <CenterMorphModal open={source !== null} onOpenChange={onOpenChange}>
      <CenterMorphModalContent ariaLabel={`Disconnect ${provider}`} className="max-w-md">
        <div className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-1 pr-8">
            <h2 className="text-lg font-semibold text-foreground">Disconnect {provider}?</h2>
            <p className="text-sm text-muted-foreground">
              We stop tracking <span className="font-mono text-foreground">{shown?.target}</span>. You can connect it
              again at any time.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <CenterMorphModalClose>
              <Button type="button" variant="ghost" size="sm">
                Cancel
              </Button>
            </CenterMorphModalClose>
            <Button variant="primary" size="sm" onClick={onDisconnect}>
              Disconnect
            </Button>
          </div>
        </div>
      </CenterMorphModalContent>
    </CenterMorphModal>
  );
}
