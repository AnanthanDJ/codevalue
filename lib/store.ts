export type Finding = {
  id: string;
  title: string;
  category: string;
  description: string;
  estimatedImpact: string;
  estimatedEarnings: string;
  file: string;
  difficulty: string;
  status: "open" | "claimed" | "resolved";
  claimedBy?: string;
};

export type Engineer = {
  id: string;
  name: string;
  claimed: Finding[];
  resolved: Finding[];
  totalEarnings: string;
};

// In-memory store for demo
export const store: {
  findings: Finding[];
  engineers: Record<string, Engineer>;
} = {
  findings: [],
  engineers: {
    alice: {
      id: "alice",
      name: "Alice Chen",
      claimed: [],
      resolved: [],
      totalEarnings: "$0",
    },
    bob: {
      id: "bob",
      name: "Bob Martinez",
      claimed: [],
      resolved: [],
      totalEarnings: "$0",
    },
  },
};
