import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useTalentProfile } from "../../providers/talent-profile-provider";

async function readFile(uri: string) {
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

export default function ResumeUploadScreen() {
  const router = useRouter();
  const { draft, isUploadingResume, uploadResumeAsset } = useTalentProfile();

  const pickResume = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      multiple: false
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    try {
      const contentBase64 = await readFile(asset.uri);
      await uploadResumeAsset(asset.name, asset.mimeType ?? "application/pdf", contentBase64);
      router.replace("/onboarding/profile-review");
    } catch (uploadError) {
      Alert.alert("Resume upload failed", uploadError instanceof Error ? uploadError.message : "Could not parse your resume.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Resume upload</Text>
      <Text style={styles.title}>Let the AI draft your profile</Text>
      <Text style={styles.copy}>
        Upload a PDF resume and the mobile app will parse skills, summary, experience, certifications, and education into your talent profile.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Current resume</Text>
        <Text style={styles.cardValue}>{draft.resumeUrl ? "Uploaded and parsed" : "Not uploaded yet"}</Text>
      </View>

      <Pressable onPress={() => void pickResume()} style={styles.primaryButton}>
        {isUploadingResume ? <ActivityIndicator color="#082f49" /> : <Text style={styles.primaryButtonLabel}>Pick PDF Resume</Text>}
      </Pressable>

      <Pressable onPress={() => router.replace("/onboarding/profile-review")} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonLabel}>Continue to profile review</Text>
      </Pressable>

      <Text style={styles.loadingHint}>{isUploadingResume ? "AI is analyzing your resume..." : "You can continue without a resume, then fill the profile manually."}</Text>
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
  card: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)",
    marginBottom: 16
  },
  cardLabel: {
    color: "#7dd3fc",
    textTransform: "uppercase",
    fontSize: 12,
    marginBottom: 6
  },
  cardValue: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700"
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: "#38bdf8",
    alignItems: "center",
    justifyContent: "center"
  },
  primaryButtonLabel: {
    color: "#082f49",
    fontSize: 16,
    fontWeight: "700"
  },
  secondaryButton: {
    minHeight: 54,
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
  },
  loadingHint: {
    color: "#cbd5e1",
    marginTop: 14,
    lineHeight: 22
  }
});