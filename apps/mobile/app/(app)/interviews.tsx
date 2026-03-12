import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTalentWorkflow } from "../providers/talent-workflow-provider";

export default function InterviewsScreen() {
  const { error, matches, respondToInterview } = useTalentWorkflow();

  const interviews = matches
    .flatMap((match) =>
      match.interviews.map((interview) => ({
        interview,
        match
      }))
    )
    .sort((left, right) => new Date(left.interview.scheduledAt).getTime() - new Date(right.interview.scheduledAt).getTime());

  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.screen}>
      <Text style={styles.eyebrow}>Interview queue</Text>
      <Text style={styles.title}>Manage upcoming recruiter sessions</Text>
      <Text style={styles.copy}>Accept confirmed interviews, decline conflicts, and keep meeting details close at hand.</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {interviews.length ? (
        interviews.map(({ interview, match }) => (
          <View key={interview.id} style={styles.card}>
            <Text style={styles.cardTitle}>{match.demand.title}</Text>
            <Text style={styles.cardMeta}>{match.demand.company.name} • {new Date(interview.scheduledAt).toLocaleString()}</Text>
            <Text style={styles.cardMeta}>Duration: {interview.duration} minutes • Status: {interview.status}</Text>
            <Text style={styles.cardMeta}>Response: {interview.talentResponseStatus}</Text>
            {interview.meetingUrl ? <Text style={styles.linkLabel}>{interview.meetingUrl}</Text> : null}

            {interview.status === "SCHEDULED" && interview.talentResponseStatus === "PENDING" ? (
              <View style={styles.actionRow}>
                <Pressable
                  style={styles.primaryButton}
                  onPress={() => void respondToInterview(interview.id, "ACCEPTED").catch((mutationError) => {
                    Alert.alert("Could not accept interview", mutationError instanceof Error ? mutationError.message : "Try again.");
                  })}
                >
                  <Text style={styles.primaryButtonLabel}>Accept</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => void respondToInterview(interview.id, "DECLINED").catch((mutationError) => {
                    Alert.alert("Could not decline interview", mutationError instanceof Error ? mutationError.message : "Try again.");
                  })}
                >
                  <Text style={styles.secondaryButtonLabel}>Decline</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ))
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No interviews yet</Text>
          <Text style={styles.copy}>Interview requests will appear here as soon as recruiters move you forward.</Text>
        </View>
      )}
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
    marginBottom: 10
  },
  copy: {
    color: "#cbd5e1",
    fontSize: 16,
    lineHeight: 23
  },
  error: {
    color: "#fecaca",
    marginVertical: 12
  },
  card: {
    marginTop: 16,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)"
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8
  },
  cardMeta: {
    color: "#cbd5e1",
    marginBottom: 6
  },
  linkLabel: {
    color: "#7dd3fc",
    marginTop: 8
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14
  },
  primaryButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "#38bdf8",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14
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
    paddingVertical: 14
  },
  secondaryButtonLabel: {
    color: "#e0f2fe",
    fontWeight: "700"
  }
});