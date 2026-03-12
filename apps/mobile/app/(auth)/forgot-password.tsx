import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../providers/auth-provider";

export default function ForgotPasswordScreen() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    try {
      setError(null);
      const response = await forgotPassword(email);
      setMessage(response.message);
      setToken(response.developmentResetToken);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not generate reset token.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Password reset</Text>
      <Text style={styles.title}>Generate reset token</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <Pressable onPress={onSubmit} style={styles.primaryButton}>
        <Text style={styles.primaryButtonLabel}>Generate</Text>
      </Pressable>
      {message ? <Text style={styles.success}>{message}</Text> : null}
      {token ? <Text style={styles.token}>{token}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Link href="/login" style={styles.link}>Back to sign in</Link>
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
  success: {
    color: "#86efac",
    marginTop: 16
  },
  token: {
    color: "#e2e8f0",
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(15, 23, 42, 0.9)"
  },
  link: {
    color: "#7dd3fc",
    marginTop: 18
  },
  error: {
    color: "#fca5a5",
    marginTop: 10
  }
});