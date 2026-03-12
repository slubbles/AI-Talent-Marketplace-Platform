import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../providers/auth-provider";

export default function TalentHomeScreen() {
  const { session, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Protected talent surface</Text>
      <Text style={styles.title}>Welcome, {session?.user.email}</Text>
      <Text style={styles.copy}>
        The mobile app now persists auth state locally and redirects unauthenticated users into the credentials flow.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Role</Text>
        <Text style={styles.cardValue}>{session?.user.role}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Access token active</Text>
        <Text style={styles.cardValue}>{session?.tokens.accessToken ? "Yes" : "No"}</Text>
      </View>
      <Pressable onPress={() => void signOut()} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonLabel}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 24,
    justifyContent: "center"
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
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12
  },
  copy: {
    color: "#cbd5e1",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20
  },
  card: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    marginBottom: 14
  },
  cardLabel: {
    color: "#7dd3fc",
    fontSize: 13,
    marginBottom: 6,
    textTransform: "uppercase"
  },
  cardValue: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "600"
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.24)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12
  },
  secondaryButtonLabel: {
    color: "#e0f2fe",
    fontSize: 16,
    fontWeight: "700"
  }
});