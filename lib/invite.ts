import { newId } from "./storage";
import type { League, LeagueMember, Manager, ManagerId } from "./types";

const INVITE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateInviteCode(length = 8): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => INVITE_ALPHABET[b % INVITE_ALPHABET.length]).join(
    "",
  );
}

export function ensureInviteCode(league: League): League {
  if (league.inviteCode) return league;
  return { ...league, inviteCode: generateInviteCode() };
}

export function unclaimedManagers(league: League): Manager[] {
  return league.managers.filter((m) => !m.memberId);
}

export function claimedMemberCount(league: League): number {
  return league.managers.filter((m) => m.memberId).length;
}

export function isLeagueFull(league: League): boolean {
  return claimedMemberCount(league) >= league.managers.length;
}

export function findManagerByMemberId(
  league: League,
  memberId: string,
): Manager | undefined {
  return league.managers.find((m) => m.memberId === memberId);
}

export function getMemberById(
  league: League,
  memberId: string,
): LeagueMember | undefined {
  return league.members?.find((m) => m.id === memberId);
}

export function isCommissioner(league: League, memberId: string | null): boolean {
  if (!memberId) return false;
  if (league.commissionerMemberId) {
    return league.commissionerMemberId === memberId;
  }
  const first = league.members?.[0];
  return first?.id === memberId;
}

export function joinLeagueAsManager(
  league: League,
  input: {
    displayName: string;
    managerId?: ManagerId;
    passcode?: string;
  },
): { league: League; member: LeagueMember; managerId: ManagerId } | { error: string } {
  const name = input.displayName.trim();
  if (!name) return { error: "Enter your manager name." };

  if (league.passcode && league.passcode.length > 0) {
    if (input.passcode?.trim() !== league.passcode) {
      return { error: "Incorrect league passcode." };
    }
  }

  if (isLeagueFull(league)) {
    return { error: "This league is full." };
  }

  const members = league.members ?? [];
  const existingMember = members.find(
    (m) => m.name.toLowerCase() === name.toLowerCase(),
  );
  if (existingMember?.managerId) {
    return {
      league,
      member: existingMember,
      managerId: existingMember.managerId,
    };
  }

  let targetManager: Manager | undefined;

  if (input.managerId) {
    targetManager = league.managers.find((m) => m.id === input.managerId);
    if (!targetManager) return { error: "Invalid manager slot." };
    if (targetManager.memberId) return { error: "That slot is already taken." };
  } else {
    const byName = league.managers.find(
      (m) =>
        !m.memberId && m.name.toLowerCase() === name.toLowerCase(),
    );
    if (byName) {
      targetManager = byName;
    } else if (unclaimedManagers(league).length === 1) {
      targetManager = unclaimedManagers(league)[0];
    } else if (unclaimedManagers(league).length > 1) {
      return { error: "Pick your manager slot from the list." };
    } else {
      return { error: "No open manager slots." };
    }
  }

  const member: LeagueMember = existingMember ?? {
    id: newId("member"),
    name,
    joinedAt: new Date().toISOString(),
  };

  member.managerId = targetManager!.id;
  member.name = name;

  const nextMembers = existingMember
    ? members.map((m) => (m.id === member.id ? member : m))
    : [...members, member];

  const managers = league.managers.map((m) =>
    m.id === targetManager!.id ? { ...m, memberId: member.id, name } : m,
  );

  let commissionerMemberId = league.commissionerMemberId;
  if (!commissionerMemberId && nextMembers.length === 1) {
    commissionerMemberId = member.id;
  }

  const draftStartedAt =
    league.draftStartedAt ??
    (league.picks.length > 0 ? new Date().toISOString() : undefined);

  return {
    league: {
      ...league,
      members: nextMembers,
      managers,
      commissionerMemberId,
      draftStartedAt,
    },
    member,
    managerId: targetManager!.id,
  };
}

export function invitePath(inviteCode: string): string {
  return `/league/join/${inviteCode}`;
}
