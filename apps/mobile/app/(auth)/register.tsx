import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../providers/auth-provider";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    try {
      setError(null);
      await register(email, password, firstName, lastName);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not create account.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Talent registration</Text>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.copy}>Phase 1 uses email/password. Phone OTP remains explicitly deferred to Phase 2.</Text>
      <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor="#64748b" />
      <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor="#64748b" />
      <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable onPress={onSubmit} style={styles.primaryButton}>
        <Text style={styles.primaryButtonLabel}>Create account</Text>
      </Pressable>
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
  link: {
    color: "#7dd3fc",
    marginTop: 18
  },
  error: {
    color: "#fca5a5",
    marginBottom: 8
  }
});