export type HouseguestId = string;
export type LeagueId = string;
export type ManagerId = string;

export type HouseguestStatus = "active" | "evicted";

export type WeekEventType =
  | "hoh"
  | "veto"
  | "nominated"
  | "evicted"
  | "survival";

export interface Houseguest {
  id: HouseguestId;
  name: string;
  status: HouseguestStatus;
  evictionWeek?: number;
  /** Final placement: 1 = winner */
  placement?: number;
}

export interface LeagueMember {
  id: string;
  name: string;
  joinedAt: string;
  managerId?: ManagerId;
}

export interface Manager {
  id: ManagerId;
  name: string;
  draftPosition: number;
  /** Member who claimed this manager slot (live draft / invites). */
  memberId?: string;
}

export interface DraftPick {
  managerId: ManagerId;
  houseguestId: HouseguestId;
  pickNumber: number;
}

export interface WeekEvent {
  id: string;
  week: number;
  houseguestId: HouseguestId;
  type: WeekEventType;
}

export interface League {
  id: LeagueId;
  name: string;
  seasonLabel: string;
  createdAt: string;
  /** ISO timestamp for last-write-wins sync (defaults to createdAt when missing). */
  updatedAt?: string;
  managers: Manager[];
  houseguests: Houseguest[];
  picks: DraftPick[];
  events: WeekEvent[];
  currentWeek: number;
  draftComplete: boolean;
  /** Houseguests each manager drafts */
  rosterSize: number;
  /** Stable code for /league/join/[inviteCode] */
  inviteCode?: string;
  members?: LeagueMember[];
  /** Optional gate for public join links */
  passcode?: string;
  /** Member id of league commissioner (undo, settings) */
  commissionerMemberId?: string;
  /** Set when first pick is made or draft goes live */
  draftStartedAt?: string;
}

export interface ManagerStanding {
  managerId: ManagerId;
  managerName: string;
  totalPoints: number;
  roster: { houseguest: Houseguest; points: number }[];
  rank: number;
}

export interface ScoringRules {
  survivalPerWeek: number;
  hohWin: number;
  vetoWin: number;
  nominated: number;
  placementPoints: Record<number, number>;
}
