import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Session 1 scaffold</Text>
      <Text style={styles.title}>Talent app ready for onboarding flows</Text>
      <Text style={styles.copy}>
        Expo Router is configured so Session 16 can focus directly on registration,
        resume upload, and profile review.
      </Text>
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
    lineHeight: 24
  }
});
