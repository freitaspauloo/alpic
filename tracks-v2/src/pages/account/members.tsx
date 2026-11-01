import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Crown, User, UserMinus, UserPlus } from "lucide-react";
import { Page } from "@/app/page-layout";
import { useToast } from "@/app/toast";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Avatar, AvatarGroup } from "@/components/motion/avatar-group";
import { Button } from "@/components/motion/button/base";
import { Card, CardContent } from "@/components/motion/card";
import {
  CenterMorphModal,
  CenterMorphModalClose,
  CenterMorphModalContent,
} from "@/components/motion/center-morph-modal";
import { Input } from "@/components/motion/input";
import { Table, type TableColumn } from "@/components/motion/table";
import { useOrgData, useStore, type Member } from "@/data";
import { ConfirmModal, EmptyState, ModalHeading, RowMenu, tableHeight, ROW_HEIGHT, useModalTarget } from "./shared";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Members() {
  const { org, orgId, members } = useOrgData();
  const { you, inviteMember, removeMember } = useStore();
  const { toast } = useToast();
  const [inviting, setInviting] = useState(false);
  const removal = useModalTarget<Member>();

  const owners = members.filter((member) => member.role === "Owner").length;

  const columns = useMemo<TableColumn<Member>[]>(
    () => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        cell: (member) => (
          <span className="flex min-w-0 items-center gap-3">
            <Avatar name={member.name} size="sm" />
            <span className="truncate font-medium">{member.name}</span>
            {member.email === you.email ? (
              <AnimatedBadge status="info" size="sm" showIcon={false}>
                You
              </AnimatedBadge>
            ) : null}
          </span>
        ),
      },
      {
        key: "email",
        header: "Email",
        sortable: true,
        cell: (member) => <span className="text-muted-foreground">{member.email}</span>,
      },
      {
        key: "role",
        header: "Role",
        sortable: true,
        width: "130px",
        cell: (member) =>
          member.role === "Owner" ? (
            <AnimatedBadge status="info" size="sm" icon={<Crown className="h-3 w-3" />}>
              Owner
            </AnimatedBadge>
          ) : (
            <AnimatedBadge status="neutral" size="sm" icon={<User className="h-3 w-3" />}>
              Member
            </AnimatedBadge>
          ),
      },
      {
        key: "actions",
        header: <span className="sr-only">Actions</span>,
        align: "right",
        width: "72px",
        cell: (member) =>
          member.role === "Owner" ? null : (
            <RowMenu
              label={`Actions for ${member.name}`}
              items={[{ label: "Remove member", icon: UserMinus, onSelect: () => removal.show(member) }]}
            />
          ),
      },
    ],
    [you.email, removal.show],
  );

  const confirmRemoval = () => {
    if (!removal.target) return;
    const result = removeMember(removal.target.id);
    removal.setOpen(false);
    if (!result.ok) toast({ title: "Couldn't remove member", description: result.error, status: "error" });
  };

  return (
    <Page
      title="Members"
      description="People who share this organization's balance, API keys, library and experiments."
      actions={
        <Button size="sm" onClick={() => setInviting(true)}>
          <UserPlus aria-hidden="true" className="size-4" /> Invite
        </Button>
      }
    >
      {members.length === 0 ? (
        <EmptyState
          title="No members yet"
          action={
            <Button size="sm" onClick={() => setInviting(true)}>
              <UserPlus aria-hidden="true" className="size-4" /> Invite
            </Button>
          }
        >
          Invite people to share {org?.name ?? "this organization"}'s balance, API keys, library and experiments.
        </EmptyState>
      ) : (
        <>
          <Card size="compact">
            <CardContent className="flex min-w-0 items-center gap-4">
              <AvatarGroup members={members} max={5} label={`${org?.name ?? "Organization"} members`} />
              <div className="flex min-w-0 flex-col">
                <span className="font-medium text-foreground">
                  {members.length} {members.length === 1 ? "person" : "people"} in {org?.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {owners} {owners === 1 ? "owner" : "owners"} · {members.length - owners}{" "}
                  {members.length - owners === 1 ? "member" : "members"}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Table
              data={members}
              columns={columns}
              getRowId={(member) => member.id}
              rowHeight={ROW_HEIGHT}
              height={tableHeight(members.length)}
              className="rounded-2xl"
            />
            <p className="px-1 text-xs text-muted-foreground">Removing a member revokes the API keys they created.</p>
          </div>
        </>
      )}

      <InviteModal
        open={inviting}
        onOpenChange={setInviting}
        taken={members.map((member) => member.email.toLowerCase())}
        onInvite={(email) => {
          inviteMember(orgId, email);
          setInviting(false);
        }}
      />

      <ConfirmModal
        open={removal.open}
        onOpenChange={removal.setOpen}
        title={`Remove ${removal.target?.name ?? "member"}?`}
        description={`${removal.target?.name ?? "They"} loses access to ${org?.name ?? "this organization"}'s balance, API keys, library and experiments. The API keys they created are revoked.`}
        confirmLabel="Remove member"
        onConfirm={confirmRemoval}
      />
    </Page>
  );
}

function InviteModal({
  open,
  onOpenChange,
  taken,
  onInvite,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taken: string[];
  onInvite: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setEmail("");
      setError(null);
    }
  }, [open]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const address = email.trim();
    if (!address) return setError("Enter an email address.");
    if (!EMAIL.test(address)) return setError("Enter a valid email, like name@company.com.");
    if (taken.includes(address.toLowerCase())) return setError(`${address} is already a member.`);
    onInvite(address);
  };

  return (
    <CenterMorphModal open={open} onOpenChange={onOpenChange}>
      <CenterMorphModalContent ariaLabel="Invite a member" className="max-w-md">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5 p-6">
          <ModalHeading title="Invite a member" description="They get a link to join this organization." />
          <Input
            label="Email"
            type="email"
            autoComplete="off"
            placeholder="name@company.com"
            value={email}
            onChange={(value) => {
              setEmail(value);
              setError(null);
            }}
            error={error ?? undefined}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <CenterMorphModalClose>
              <Button variant="ghost" size="sm">
                Cancel
              </Button>
            </CenterMorphModalClose>
            <Button type="submit" size="sm">
              Send invite
            </Button>
          </div>
        </form>
      </CenterMorphModalContent>
    </CenterMorphModal>
  );
}
