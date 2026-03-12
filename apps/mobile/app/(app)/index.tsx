import { Link } from "expo-router";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { MatchCard } from "./components/match-card";
import { useAuth } from "../providers/auth-provider";
import { useTalentProfile } from "../providers/talent-profile-provider";
import { useTalentWorkflow } from "../providers/talent-workflow-provider";

const quickAvailability = ["IMMEDIATE", "TWO_WEEKS", "ONE_MONTH", "NOT_AVAILABLE"] as const;

export default function TalentHomeScreen() {
  const { session, signOut } = useAuth();
  const { draft, isLoading, profile } = useTalentProfile();
  const {
    availability,
    error,
    isRefreshing,
    isUpdatingAvailability,
    matches,
    refreshWorkflow,
    setAvailability,
    unreadCount
  } = useTalentWorkflow();

  if (isLoading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator color="#38bdf8" size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Talent onboarding</Text>
        <Text style={styles.title}>Welcome, {draft.firstName || session?.user.email}</Text>
        <Text style={styles.copy}>
          Your mobile onboarding is ready: upload a resume, review the AI-generated profile, then add identity and certification documents for verification.
        </Text>

        <View style={styles.stageCard}>
          <Text style={styles.stageTitle}>1. Upload resume</Text>
          <Text style={styles.stageCopy}>Pick a PDF and let the AI engine turn it into a draft talent profile.</Text>
        </View>
        <View style={styles.stageCard}>
          <Text style={styles.stageTitle}>2. Review profile</Text>
          <Text style={styles.stageCopy}>Edit skills, experience, education, pricing, and availability before publishing.</Text>
        </View>
        <View style={styles.stageCard}>
          <Text style={styles.stageTitle}>3. Upload verification docs</Text>
          <Text style={styles.stageCopy}>Attach passport or ID files plus certifications for admin verification.</Text>
        </View>

        <Link href="/onboarding/resume" style={styles.primaryLink}>Start onboarding</Link>
        <Link href="/onboarding/profile-review" style={styles.secondaryLink}>Skip to profile review</Link>

        <Pressable onPress={() => void signOut()} style={styles.signOutButton}>
          <Text style={styles.signOutLabel}>Sign out</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refreshWorkflow()} tintColor="#38bdf8" />}
      style={styles.scrollView}
    >
      <Text style={styles.eyebrow}>Match feed</Text>
      <Text style={styles.title}>Welcome back, {profile.firstName}</Text>
      <Text style={styles.copy}>Review new roles, confirm your availability, and stay on top of interviews, offers, and recruiter updates.</Text>

      <View style={styles.metricGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Live matches</Text>
          <Text style={styles.metricValue}>{matches.length}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Unread alerts</Text>
          <Text style={styles.metricValue}>{unreadCount}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Verification</Text>
          <Text style={styles.metricValue}>{profile.verificationStatus}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Profile</Text>
          <Text style={styles.metricValue}>{profile.profileCompleteness}%</Text>
        </View>
      </View>

      <View style={styles.stageCard}>
        <Text style={styles.stageTitle}>Availability quick-toggle</Text>
        <Text style={styles.stageCopy}>Keep recruiters synced to your actual start window.</Text>
        <View style={styles.chipRow}>
          {quickAvailability.map((option) => (
            <Pressable
              key={option}
              onPress={() => void setAvailability(option)}
              style={[styles.availabilityChip, availability === option ? styles.availabilityChipActive : null]}
              disabled={isUpdatingAvailability}
            >
              <Text style={[styles.availabilityChipLabel, availability === option ? styles.availabilityChipLabelActive : null]}>
                {option.replace(/_/g, " ")}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.linkGrid}>
        <Link href="/applications" style={styles.navLink}>Applications</Link>
        <Link href="/interviews" style={styles.navLink}>Interviews</Link>
        <Link href="/offers" style={styles.navLink}>Offers</Link>
        <Link href="/notifications" style={styles.navLink}>Notifications</Link>
        <Link href="/profile" style={styles.navLink}>Profile</Link>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Top matches</Text>
        <Pressable onPress={() => void refreshWorkflow()}>
          <Text style={styles.inlineAction}>Refresh</Text>
        </Pressable>
      </View>

      {matches.length ? (
        matches.map((match) => <MatchCard key={match.id} match={match} />)
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.stageTitle}>No active matches yet</Text>
          <Text style={styles.stageCopy}>Your feed will populate as approved roles are matched against your updated profile.</Text>
        </View>
      )}

      <Pressable onPress={() => void signOut()} style={styles.signOutButton}>
        <Text style={styles.signOutLabel}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 24,
    justifyContent: "center"
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#020617"
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#020617"
  },
  eyebrow: {
    color: "#38bdf8",
    marginBottom: 12,
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1.2
  },
  title: {
    color: "#f8fafc",
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 10
  },
  copy: {
    color: "#cbd5e1",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 18
  },
  stageCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)",
    marginBottom: 12
  },
  stageTitle: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6
  },
  stageCopy: {
    color: "#cbd5e1",
    lineHeight: 22
  },
  primaryLink: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: "#38bdf8",
    textAlign: "center",
    textAlignVertical: "center",
    color: "#082f49",
    fontSize: 16,
    fontWeight: "700",
    overflow: "hidden",
    paddingVertical: 16,
    marginTop: 10
  },
  secondaryLink: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.24)",
    textAlign: "center",
    textAlignVertical: "center",
    color: "#e0f2fe",
    fontSize: 16,
    fontWeight: "700",
    overflow: "hidden",
    paddingVertical: 16,
    marginTop: 10
  },
  signOutButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14
  },
  signOutLabel: {
    color: "#fca5a5",
    fontWeight: "700"
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18
  },
  metricCard: {
    width: "47%",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)"
  },
  metricLabel: {
    color: "#7dd3fc",
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: 6
  },
  metricValue: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700"
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14
  },
  availabilityChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.24)",
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  availabilityChipActive: {
    backgroundColor: "#38bdf8",
    borderColor: "#38bdf8"
  },
  availabilityChipLabel: {
    color: "#e0f2fe",
    fontWeight: "700",
    fontSize: 12
  },
  availabilityChipLabelActive: {
    color: "#082f49"
  },
  linkGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18
  },
  navLink: {
    minWidth: "47%",
    borderRadius: 14,
    backgroundColor: "rgba(8, 47, 73, 0.9)",
    textAlign: "center",
    color: "#e0f2fe",
    fontWeight: "700",
    overflow: "hidden",
    paddingVertical: 14
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 19,
    fontWeight: "700"
  },
  inlineAction: {
    color: "#7dd3fc",
    fontWeight: "700"
  },
  emptyCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)",
    backgroundColor: "rgba(15, 23, 42, 0.92)"
  },
  error: {
    color: "#fecaca",
    marginBottom: 12
  }
});