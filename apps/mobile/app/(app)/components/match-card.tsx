import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { WorkflowMatch } from "../../providers/talent-workflow-provider";

const formatCurrencyRange = (match: WorkflowMatch) => {
  const { budgetMin, budgetMax, currency } = match.demand;

  if (budgetMin == null && budgetMax == null) {
    return "Comp disclosed later";
  }

  if (budgetMin != null && budgetMax != null) {
    return `${currency} ${budgetMin.toFixed(0)}-${budgetMax.toFixed(0)}`;
  }

  return `${currency} ${(budgetMin ?? budgetMax ?? 0).toFixed(0)}`;
};

export function MatchCard({ match }: { match: WorkflowMatch }) {
  const topSkills = match.demand.requiredSkills.slice(0, 3).map((skill) => skill.skill.displayName);

  return (
    <Link asChild href={`/matches/${match.id}`}>
      <Pressable style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{match.demand.title}</Text>
            <Text style={styles.company}>{match.demand.company.name}</Text>
          </View>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreLabel}>{Math.round(match.matchScore)}%</Text>
          </View>
        </View>

        <Text style={styles.meta}>
          {match.demand.location} • {match.demand.remotePolicy.toLowerCase()} • {formatCurrencyRange(match)}
        </Text>

        <View style={styles.skillRow}>
          {topSkills.map((skill) => (
            <View key={skill} style={styles.skillChip}>
              <Text style={styles.skillChipLabel}>{skill}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.statusLine}>
          Talent status: {match.talentStatus.replace(/_/g, " ")} • Recruiter stage: {match.status.replace(/_/g, " ")}
        </Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)",
    padding: 18,
    marginBottom: 12
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8
  },
  headerCopy: {
    flex: 1,
    gap: 4
  },
  title: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700"
  },
  company: {
    color: "#7dd3fc",
    fontSize: 14,
    fontWeight: "600"
  },
  scoreBadge: {
    minWidth: 58,
    borderRadius: 999,
    backgroundColor: "rgba(56, 189, 248, 0.18)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center"
  },
  scoreLabel: {
    color: "#bae6fd",
    fontWeight: "700"
  },
  meta: {
    color: "#cbd5e1",
    marginBottom: 12,
    lineHeight: 21
  },
  skillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10
  },
  skillChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "rgba(8, 47, 73, 0.9)"
  },
  skillChipLabel: {
    color: "#e0f2fe",
    fontSize: 12,
    fontWeight: "600"
  },
  statusLine: {
    color: "#94a3b8",
    fontSize: 12,
    textTransform: "uppercase"
  }
});