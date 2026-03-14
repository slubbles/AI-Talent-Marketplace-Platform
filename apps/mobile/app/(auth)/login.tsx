import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../providers/auth-provider";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("amina.khaled.talent@example.com");
  const [password, setPassword] = useState("demo-hash");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    try {
      setError(null);
      await signIn(email, password);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not sign in.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Talent mobile auth</Text>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.copy}>This flow uses the same GraphQL credentials API as the recruiter web app.</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable onPress={onSubmit} style={styles.primaryButton}>
        <Text style={styles.primaryButtonLabel}>Sign in</Text>
      </Pressable>
      <Pressable style={styles.linkedInButton} disabled>
        <Text style={styles.linkedInLabel}>Sign in with LinkedIn</Text>
        <Text style={styles.comingSoon}>(Coming Soon)</Text>
      </Pressable>
      <View style={styles.links}>
        <Link href="/register" style={styles.link}>Create talent account</Link>
        <Link href="/forgot-password" style={styles.link}>Forgot password</Link>
      </View>
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
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 12
  },
  copy: {
    color: "#cbd5e1",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.24)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#f8fafc",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    marginBottom: 12
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#38bdf8",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8
  },
  primaryButtonLabel: {
    color: "#082f49",
    fontSize: 16,
    fontWeight: "700"
  },
  links: {
    marginTop: 18,
    gap: 10
  },
  link: {
    color: "#7dd3fc"
  },
  error: {
    color: "#fca5a5",
    marginBottom: 8
  },
  linkedInButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.24)",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    opacity: 0.5,
    flexDirection: "row",
    gap: 8,
  },
  linkedInLabel: {
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: "600",
  },
  comingSoon: {
    color: "#64748b",
    fontSize: 12,
  },
});