import { useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { MatchCard } from "./components/match-card";
import { useTalentWorkflow, type WorkflowMatch } from "../providers/talent-workflow-provider";

const tabs = ["INTERESTED", "SHORTLISTED", "INTERVIEW", "OFFER"] as const;

type ApplicationsTab = (typeof tabs)[number];

const hasOffer = (match: WorkflowMatch) => match.interviews.some((interview) => interview.offer);
const hasInterview = (match: WorkflowMatch) => match.interviews.length > 0;

export default function ApplicationsScreen() {
  const { matches } = useTalentWorkflow();
  const [activeTab, setActiveTab] = useState<ApplicationsTab>("INTERESTED");

  const filteredMatches = matches.filter((match) => {
    if (activeTab === "INTERESTED") {
      return match.talentStatus === "INTERESTED";
    }

    if (activeTab === "SHORTLISTED") {
      return ["RECRUITER_REVIEWED", "SHORTLISTED"].includes(match.status) && !hasInterview(match) && !hasOffer(match);
    }

    if (activeTab === "INTERVIEW") {
      return hasInterview(match);
    }

    return hasOffer(match);
  });

  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.screen}>
      <Text style={styles.eyebrow}>Application tracker</Text>
      <Text style={styles.title}>Track every recruiter touchpoint</Text>
      <Text style={styles.copy}>Move between interest, shortlist, interview, and offer states without leaving the mobile app.</Text>

      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab ? styles.tabActive : null]}>
            <Text style={[styles.tabLabel, activeTab === tab ? styles.tabLabelActive : null]}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      {filteredMatches.length ? (
        filteredMatches.map((match) => <MatchCard key={match.id} match={match} />)
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No items in {activeTab.toLowerCase()}</Text>
          <Text style={styles.emptyCopy}>This bucket will populate as recruiters review your profile and progress opportunities.</Text>
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
    lineHeight: 23,
    marginBottom: 18
  },
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18
  },
  tab: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.24)",
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  tabActive: {
    backgroundColor: "#38bdf8",
    borderColor: "#38bdf8"
  },
  tabLabel: {
    color: "#e0f2fe",
    fontSize: 12,
    fontWeight: "700"
  },
  tabLabelActive: {
    color: "#082f49"
  },
  emptyCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)"
  },
  emptyTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6
  },
  emptyCopy: {
    color: "#cbd5e1",
    lineHeight: 22
  }
});