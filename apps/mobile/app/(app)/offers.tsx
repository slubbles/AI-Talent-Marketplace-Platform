import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTalentWorkflow } from "../providers/talent-workflow-provider";

export default function OffersScreen() {
  const { acceptOffer, declineOffer, error, matches } = useTalentWorkflow();

  const offers = matches
    .flatMap((match) =>
      match.interviews
        .filter((interview) => interview.offer)
        .map((interview) => ({
          match,
          offer: interview.offer
        }))
    )
    .sort((left, right) => new Date(right.offer?.createdAt ?? 0).getTime() - new Date(left.offer?.createdAt ?? 0).getTime());

  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.screen}>
      <Text style={styles.eyebrow}>Offer desk</Text>
      <Text style={styles.title}>Review terms and take action</Text>
      <Text style={styles.copy}>Offers stay tied to the matched role so you can compare compensation, dates, and terms before responding.</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {offers.length ? (
        offers.map(({ match, offer }) => (
          <View key={offer?.id} style={styles.card}>
            <Text style={styles.cardTitle}>{match.demand.title}</Text>
            <Text style={styles.cardMeta}>{match.demand.company.name}</Text>
            <Text style={styles.cardMeta}>Hourly rate: {match.demand.currency} {offer?.hourlyRate.toFixed(0)}</Text>
            <Text style={styles.cardMeta}>Start: {offer?.startDate.slice(0, 10)} {offer?.endDate ? `• End: ${offer.endDate.slice(0, 10)}` : ""}</Text>
            <Text style={styles.cardMeta}>Status: {offer?.status}</Text>
            <Text style={styles.terms}>{offer?.terms}</Text>

            {offer?.status === "SENT" ? (
              <View style={styles.actionRow}>
                <Pressable
                  style={styles.primaryButton}
                  onPress={() => void acceptOffer(offer.id).catch((mutationError) => {
                    Alert.alert("Could not accept offer", mutationError instanceof Error ? mutationError.message : "Try again.");
                  })}
                >
                  <Text style={styles.primaryButtonLabel}>Accept</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => void declineOffer(offer.id).catch((mutationError) => {
                    Alert.alert("Could not decline offer", mutationError instanceof Error ? mutationError.message : "Try again.");
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
          <Text style={styles.cardTitle}>No offers yet</Text>
          <Text style={styles.copy}>Accepted interviews and recruiter decisions will surface here when offers are sent.</Text>
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
  terms: {
    color: "#e2e8f0",
    marginTop: 10,
    lineHeight: 22
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