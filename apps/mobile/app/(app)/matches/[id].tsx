import { useLocalSearchParams } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTalentWorkflow } from "../../providers/talent-workflow-provider";

const parseBreakdown = (scoreBreakdown: string) => {
  try {
    const parsed = JSON.parse(scoreBreakdown) as Record<string, number>;
    return Object.entries(parsed).map(([label, value]) => ({
      label,
      value: Math.round(Number(value) * 100)
    }));
  } catch {
    return [];
  }
};

export default function MatchDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { matches, respondToMatch } = useTalentWorkflow();
  const match = matches.find((entry) => entry.id === params.id);

  if (!match) {
    return (
      <View style={styles.missingState}>
        <Text style={styles.title}>Match not found</Text>
        <Text style={styles.copy}>Refresh the match feed and try again.</Text>
      </View>
    );
  }

  const breakdown = parseBreakdown(match.scoreBreakdown);

  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.screen}>
      <Text style={styles.eyebrow}>Role detail</Text>
      <Text style={styles.title}>{match.demand.title}</Text>
      <Text style={styles.company}>{match.demand.company.name} • {match.demand.location}</Text>
      <Text style={styles.copy}>{match.demand.description}</Text>

      <View style={styles.scoreCard}>
        <Text style={styles.sectionTitle}>Why you matched</Text>
        <Text style={styles.scoreValue}>{Math.round(match.matchScore)}% match</Text>
        <Text style={styles.scoreCopy}>{match.aiExplanation}</Text>
      </View>

      {breakdown.length ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Score breakdown</Text>
          {breakdown.map((item) => (
            <View key={item.label} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{item.label}</Text>
              <View style={styles.breakdownTrack}>
                <View style={[styles.breakdownFill, { width: `${Math.min(100, item.value)}%` }]} />
              </View>
              <Text style={styles.breakdownValue}>{item.value}%</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Required skills</Text>
        <View style={styles.skillRow}>
          {match.demand.requiredSkills.map((skill) => (
            <View key={skill.id} style={styles.skillChip}>
              <Text style={styles.skillChipLabel}>{skill.skill.displayName}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => void respondToMatch(match.id, "INTERESTED").catch((mutationError) => {
            Alert.alert("Could not register interest", mutationError instanceof Error ? mutationError.message : "Try again.");
          })}
        >
          <Text style={styles.primaryButtonLabel}>Express Interest</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => void respondToMatch(match.id, "DECLINED").catch((mutationError) => {
            Alert.alert("Could not decline match", mutationError instanceof Error ? mutationError.message : "Try again.");
          })}
        >
          <Text style={styles.secondaryButtonLabel}>Not Interested</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020617"
  },
  container: {
    padding: 24,
    paddingBottom: 40
  },
  missingState: {
    flex: 1,
    backgroundColor: "#020617",
    justifyContent: "center",
    padding: 24
  },
  eyebrow: {
    color: "#38bdf8",
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10
  },
  title: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8
  },
  company: {
    color: "#7dd3fc",
    fontSize: 15,
    marginBottom: 14
  },
  copy: {
    color: "#cbd5e1",
    fontSize: 16,
    lineHeight: 24
  },
  scoreCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "rgba(8, 47, 73, 0.9)"
  },
  sectionCard: {
    marginTop: 16,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)"
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12
  },
  scoreValue: {
    color: "#bae6fd",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10
  },
  scoreCopy: {
    color: "#e0f2fe",
    lineHeight: 22
  },
  breakdownRow: {
    marginBottom: 12
  },
  breakdownLabel: {
    color: "#cbd5e1",
    marginBottom: 6,
    textTransform: "capitalize"
  },
  breakdownTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(148, 163, 184, 0.16)",
    overflow: "hidden"
  },
  breakdownFill: {
    height: "100%",
    backgroundColor: "#38bdf8"
  },
  breakdownValue: {
    color: "#7dd3fc",
    marginTop: 4,
    textAlign: "right"
  },
  skillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  skillChip: {
    borderRadius: 999,
    backgroundColor: "rgba(8, 47, 73, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  skillChipLabel: {
    color: "#e0f2fe",
    fontWeight: "700"
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18
  },
  primaryButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "#38bdf8",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15
  },
  primaryButtonLabel: {
    color: "#082f49",
    fontWeight: "700"
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.24)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15
  },
  secondaryButtonLabel: {
    color: "#e0f2fe",
    fontWeight: "700"
  }
});