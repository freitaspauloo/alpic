import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { RouterButtonLink } from "@/app/router-link";
import { useToast } from "@/app/toast";
import { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle } from "@/components/motion/alert";
import { Avatar } from "@/components/motion/avatar-group";
import { Button } from "@/components/motion/button/base";
import { StatefulButton, type ButtonState } from "@/components/motion/button/stateful";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/motion/card";
import { TextReveal } from "@/components/motion/text-reveal";
import { initial, useStore } from "@/data";
import { StandaloneHeader, useFontsReady } from "./shared";

/** Outside the shell: rendered full-screen at /invitations/:invitation. */
export function Invitation() {
  const { invitation: invitationId = "" } = useParams();
  const { you, invitations, organizations, members, acceptInvitation, declineInvitation } = useStore();
  const { toast } = useToast();
  const [accepting, setAccepting] = useState<ButtonState>("idle");
  const [joinedOrgId, setJoinedOrgId] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useFontsReady();

  const invitation = invitations.find((item) => item.id === invitationId);
  const homeOrgId =
    members.find((member) => member.email === you.email)?.orgId ?? organizations[0]?.id ?? "acme";

  const accept = () => {
    if (!invitation) return;
    setAccepting("loading");
    timer.current = window.setTimeout(() => {
      const result = acceptInvitation(invitation.id);
      if (!result.ok) {
        setAccepting("error");
        toast({ title: "Couldn't join", description: result.error, status: "error" });
        return;
      }
      setJoinedOrgId(result.orgId);
      setAccepting("success");
    }, 600);
  };

  return (
    <main className="flex min-h-svh flex-col bg-background">
      <StandaloneHeader />
      <section className="flex flex-1 flex-col items-center justify-center gap-4 px-4 pt-6 pb-24">
        {invitation ? (
          <Card className="w-full max-w-md gap-7 py-8">
            <CardHeader className="justify-items-center gap-4 text-center">
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="grid size-16 place-items-center rounded-[22px] bg-primary text-2xl font-semibold text-primary-foreground"
                >
                  {initial(invitation.orgName)}
                </span>
                <Avatar name={invitation.invitedBy} size="sm" className="absolute -right-2 -bottom-2" />
              </div>
              <div className="flex flex-col gap-2">
                <TextReveal
                  key={invitation.status}
                  as="h1"
                  text={
                    invitation.status === "accepted" ? `Welcome to ${invitation.orgName}` : `Join ${invitation.orgName}`
                  }
                  className="text-3xl font-semibold tracking-tight text-foreground"
                />
                <CardDescription className="text-balance">
                  {invitation.invitedBy} invited {invitation.email} to share this organization's balance, API keys,
                  library and experiments.
                </CardDescription>
              </div>
            </CardHeader>

            {invitation.status === "pending" && invitation.email !== you.email ? (
              <CardContent>
                <Alert variant="warning">
                  <AlertIcon />
                  <AlertContent>
                    <AlertTitle>Sent to another address</AlertTitle>
                    <AlertDescription>
                      You're signed in as {you.email}. Accepting adds this account to {invitation.orgName}.
                    </AlertDescription>
                  </AlertContent>
                </Alert>
              </CardContent>
            ) : null}

            {invitation.status === "accepted" ? (
              <CardContent>
                <Alert variant="success">
                  <AlertIcon />
                  <AlertContent>
                    <AlertTitle>You joined {invitation.orgName}.</AlertTitle>
                    <AlertDescription>Its experiments, library and balance are in your sidebar now.</AlertDescription>
                  </AlertContent>
                </Alert>
              </CardContent>
            ) : invitation.status === "declined" ? (
              <CardContent>
                <Alert>
                  <AlertIcon />
                  <AlertContent>
                    <AlertTitle>Invitation declined.</AlertTitle>
                    <AlertDescription>Ask {invitation.invitedBy} for a new invite if you change your mind.</AlertDescription>
                  </AlertContent>
                </Alert>
              </CardContent>
            ) : null}

            <CardFooter className="justify-center">
              {invitation.status === "pending" ? (
                <div className="grid w-full grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    disabled={accepting === "loading"}
                    onClick={() => declineInvitation(invitation.id)}
                  >
                    Decline
                  </Button>
                  <StatefulButton state={accepting} loadingText="Joining" onClick={accept}>
                    Accept
                  </StatefulButton>
                </div>
              ) : invitation.status === "accepted" ? (
                <RouterButtonLink to={`/${joinedOrgId ?? invitation.orgId}/experiments`} className="w-full">
                  Open {invitation.orgName} <ArrowRight aria-hidden="true" className="size-4" />
                </RouterButtonLink>
              ) : (
                <RouterButtonLink to={`/${homeOrgId}/experiments`} variant="secondary" className="w-full">
                  Back to Tracks
                </RouterButtonLink>
              )}
            </CardFooter>
          </Card>
        ) : (
          <Card className="w-full max-w-md py-8">
            <CardHeader className="justify-items-center text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Invitation not found</h1>
              <CardDescription>This invitation no longer exists. Ask whoever invited you to send a new one.</CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <RouterButtonLink to={`/${homeOrgId}/experiments`} variant="secondary" className="w-full">
                Back to Tracks
              </RouterButtonLink>
            </CardFooter>
          </Card>
        )}
        <p className="text-xs text-muted-foreground">Signed in as {you.email}</p>
      </section>
    </main>
  );
}
