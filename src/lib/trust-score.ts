/**
 * Trust score milestones and scoring logic.
 * Score is capped at 100. "Verified Traveler" badge requires score >= 70.
 */

export type TrustMilestoneId =
  | "email_verified"
  | "profile_photo"
  | "linked_social"
  | "first_safety_tip"
  | "profile_complete";

export type TrustMilestone = {
  id: TrustMilestoneId;
  label: string;
  points: number;
  completed: boolean;
};

export const TRUST_MILESTONES_DEF: { id: TrustMilestoneId; label: string; points: number }[] = [
  { id: "email_verified", label: "Email Verified", points: 10 },
  { id: "profile_photo", label: "Profile Photo Added", points: 10 },
  { id: "linked_social", label: "Linked Social Media", points: 20 },
  { id: "first_safety_tip", label: "First Safety Tip Contributed", points: 15 },
  { id: "profile_complete", label: "Profile complete (name, bio, country)", points: 15 },
];

const VERIFIED_THRESHOLD = 70;
const MAX_SCORE = 100;

export type TrustInputs = {
  emailVerified: boolean;
  profilePhotoAdded: boolean;
  linkedSocialMedia: boolean;
  firstSafetyTipContributed: boolean;
  profileComplete: boolean;
};

export function computeTrustMilestones(inputs: TrustInputs): TrustMilestone[] {
  return TRUST_MILESTONES_DEF.map((def) => ({
    id: def.id,
    label: def.label,
    points: def.points,
    completed:
      (def.id === "email_verified" && inputs.emailVerified) ||
      (def.id === "profile_photo" && inputs.profilePhotoAdded) ||
      (def.id === "linked_social" && inputs.linkedSocialMedia) ||
      (def.id === "first_safety_tip" && inputs.firstSafetyTipContributed) ||
      (def.id === "profile_complete" && inputs.profileComplete),
  }));
}

export function computeTrustScore(milestones: TrustMilestone[]): number {
  const total = milestones.filter((m) => m.completed).reduce((sum, m) => sum + m.points, 0);
  return Math.min(MAX_SCORE, total);
}

export function isVerifiedTraveler(score: number): boolean {
  return score >= VERIFIED_THRESHOLD;
}
