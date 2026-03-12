import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useTalentProfile } from "../../providers/talent-profile-provider";

const availabilityOptions = ["IMMEDIATE", "TWO_WEEKS", "ONE_MONTH", "THREE_MONTHS", "NOT_AVAILABLE"] as const;
const proficiencyOptions = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;

type ProfileEditorProps = {
  description: string;
  eyebrow: string;
  submitLabel: string;
  title: string;
};

const toCsv = (values: string[]) => values.join(", ");
const fromCsv = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const nextProficiency = (current: (typeof proficiencyOptions)[number]) => {
  const currentIndex = proficiencyOptions.indexOf(current);
  return proficiencyOptions[(currentIndex + 1) % proficiencyOptions.length];
};

const createDraftId = () => Math.random().toString(36).slice(2, 11);

async function readPickedFile(uri: string) {
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

export function ProfileEditor({ description, eyebrow, submitLabel, title }: ProfileEditorProps) {
  const router = useRouter();
  const { draft, error, isSaving, saveProfile, searchSkills, setDraft, uploadSupportingDocument } = useTalentProfile();
  const [industryInput, setIndustryInput] = useState(toCsv(draft.industries));
  const [locationInput, setLocationInput] = useState(toCsv(draft.locationPreferences));
  const [visaInput, setVisaInput] = useState(toCsv(draft.workVisaEligibility));
  const [portfolioInput, setPortfolioInput] = useState(toCsv(draft.portfolioUrls));
  const [skillSearch, setSkillSearch] = useState("");
  const [skillOptions, setSkillOptions] = useState<Array<{ id: string; displayName: string }>>([]);
  const [uploadingDocument, setUploadingDocument] = useState<"IDENTITY" | "CERTIFICATION" | null>(null);

  useEffect(() => {
    setIndustryInput(toCsv(draft.industries));
    setLocationInput(toCsv(draft.locationPreferences));
    setVisaInput(toCsv(draft.workVisaEligibility));
    setPortfolioInput(toCsv(draft.portfolioUrls));
  }, [draft.industries, draft.locationPreferences, draft.portfolioUrls, draft.workVisaEligibility]);

  useEffect(() => {
    if (skillSearch.trim().length < 2) {
      setSkillOptions([]);
      return;
    }

    let active = true;
    const timeoutId = setTimeout(async () => {
      const results = await searchSkills(skillSearch);
      if (active) {
        setSkillOptions(results.filter((option) => !draft.skills.some((skill) => skill.skillId === option.id)));
      }
    }, 220);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [draft.skills, searchSkills, skillSearch]);

  const pickAndUploadDocument = async (kind: "IDENTITY" | "CERTIFICATION") => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: false,
      type: ["application/pdf", "image/*"]
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    setUploadingDocument(kind);

    try {
      const contentBase64 = await readPickedFile(asset.uri);
      await uploadSupportingDocument(asset.name, asset.mimeType ?? "application/octet-stream", contentBase64, kind);
    } catch (uploadError) {
      Alert.alert("Upload failed", uploadError instanceof Error ? uploadError.message : "Could not upload document.");
    } finally {
      setUploadingDocument(null);
    }
  };

  const submit = async () => {
    try {
      const profile = await saveProfile();
      if (profile) {
        router.replace("/profile");
      }
    } catch {
      return;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.copy}>{description}</Text>

      <View style={styles.progressCard}>
        <Text style={styles.progressLabel}>Profile completeness</Text>
        <Text style={styles.progressValue}>{Math.round(([
          draft.firstName,
          draft.lastName,
          draft.headline,
          draft.summary,
          draft.resumeUrl,
          draft.identityDocumentUrls.length ? "1" : "",
          draft.skills.length ? "1" : "",
          draft.experiences.length ? "1" : "",
          draft.educationEntries.length ? "1" : ""
        ].filter(Boolean).length / 9) * 100)}%</Text>
        <Text style={styles.progressMeta}>Verification status: {draft.identityDocumentUrls.length > 0 ? "Documents ready for review" : "Pending document upload"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic profile</Text>
        <TextInput style={styles.input} value={draft.firstName} onChangeText={(value) => setDraft((current) => ({ ...current, firstName: value }))} placeholder="First name" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={draft.lastName} onChangeText={(value) => setDraft((current) => ({ ...current, lastName: value }))} placeholder="Last name" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={draft.headline} onChangeText={(value) => setDraft((current) => ({ ...current, headline: value }))} placeholder="Headline" placeholderTextColor="#64748b" />
        <TextInput
          multiline
          numberOfLines={5}
          style={[styles.input, styles.textArea]}
          value={draft.summary}
          onChangeText={(value) => setDraft((current) => ({ ...current, summary: value }))}
          placeholder="Professional summary"
          placeholderTextColor="#64748b"
        />
        <TextInput style={styles.input} value={draft.careerTrajectory} onChangeText={(value) => setDraft((current) => ({ ...current, careerTrajectory: value }))} placeholder="Career trajectory" placeholderTextColor="#64748b" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Availability and pricing</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionRow}>
          {availabilityOptions.map((option) => (
            <Pressable key={option} onPress={() => setDraft((current) => ({ ...current, availability: option }))} style={[styles.optionChip, draft.availability === option ? styles.optionChipActive : null]}>
              <Text style={[styles.optionChipLabel, draft.availability === option ? styles.optionChipLabelActive : null]}>{option.replace(/_/g, " ")}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <TextInput style={styles.input} value={draft.availableFrom} onChangeText={(value) => setDraft((current) => ({ ...current, availableFrom: value }))} placeholder="Available from (YYYY-MM-DD)" placeholderTextColor="#64748b" />
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.rowInput]} value={draft.hourlyRateMin} onChangeText={(value) => setDraft((current) => ({ ...current, hourlyRateMin: value }))} placeholder="Min hourly rate" keyboardType="numeric" placeholderTextColor="#64748b" />
          <TextInput style={[styles.input, styles.rowInput]} value={draft.hourlyRateMax} onChangeText={(value) => setDraft((current) => ({ ...current, hourlyRateMax: value }))} placeholder="Max hourly rate" keyboardType="numeric" placeholderTextColor="#64748b" />
        </View>
        <TextInput style={styles.input} value={draft.currency} onChangeText={(value) => setDraft((current) => ({ ...current, currency: value.toUpperCase() }))} placeholder="Currency" placeholderTextColor="#64748b" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <TextInput style={styles.input} value={industryInput} onChangeText={(value) => { setIndustryInput(value); setDraft((current) => ({ ...current, industries: fromCsv(value) })); }} placeholder="Industries, comma separated" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={locationInput} onChangeText={(value) => { setLocationInput(value); setDraft((current) => ({ ...current, locationPreferences: fromCsv(value) })); }} placeholder="Location preferences" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={visaInput} onChangeText={(value) => { setVisaInput(value); setDraft((current) => ({ ...current, workVisaEligibility: fromCsv(value) })); }} placeholder="Visa eligibility" placeholderTextColor="#64748b" />
        <TextInput style={styles.input} value={portfolioInput} onChangeText={(value) => { setPortfolioInput(value); setDraft((current) => ({ ...current, portfolioUrls: fromCsv(value) })); }} placeholder="Portfolio URLs" placeholderTextColor="#64748b" />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Verification documents</Text>
          <Pressable style={styles.secondaryButton} onPress={() => void pickAndUploadDocument("IDENTITY")}>
            {uploadingDocument === "IDENTITY" ? <ActivityIndicator color="#e0f2fe" /> : <Text style={styles.secondaryButtonLabel}>Upload ID</Text>}
          </Pressable>
        </View>
        {draft.identityDocumentUrls.map((url) => (
          <View key={url} style={styles.documentRow}>
            <Text style={styles.documentLabel}>Identity document</Text>
            <Text style={styles.documentValue} numberOfLines={1}>{url}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills</Text>
        <TextInput style={styles.input} value={skillSearch} onChangeText={setSkillSearch} placeholder="Search skills to add" placeholderTextColor="#64748b" />
        {skillOptions.map((option) => (
          <Pressable
            key={option.id}
            onPress={() => {
              setDraft((current) => ({
                ...current,
                skills: [
                  ...current.skills,
                  {
                    id: createDraftId(),
                    skillId: option.id,
                    displayName: option.displayName,
                    proficiency: "ADVANCED",
                    yearsOfExperience: 3
                  }
                ]
              }));
              setSkillSearch("");
              setSkillOptions([]);
            }}
            style={styles.searchOption}
          >
            <Text style={styles.searchOptionLabel}>{option.displayName}</Text>
          </Pressable>
        ))}
        {draft.skills.map((skill) => (
          <View key={skill.id} style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.cardTitle}>{skill.displayName}</Text>
              <Pressable onPress={() => setDraft((current) => ({ ...current, skills: current.skills.filter((entry) => entry.id !== skill.id) }))}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => setDraft((current) => ({ ...current, skills: current.skills.map((entry) => entry.id === skill.id ? { ...entry, proficiency: nextProficiency(entry.proficiency) } : entry) }))} style={styles.optionChipInline}>
              <Text style={styles.optionChipLabel}>{skill.proficiency}</Text>
            </Pressable>
            <TextInput style={styles.input} value={String(skill.yearsOfExperience)} onChangeText={(value) => setDraft((current) => ({ ...current, skills: current.skills.map((entry) => entry.id === skill.id ? { ...entry, yearsOfExperience: Number(value || 0) } : entry) }))} keyboardType="numeric" placeholder="Years of experience" placeholderTextColor="#64748b" />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Experience</Text>
          <Pressable style={styles.secondaryButton} onPress={() => setDraft((current) => ({
            ...current,
            experiences: [...current.experiences, { id: createDraftId(), title: "", companyName: "", location: "", startDate: "", endDate: "", isCurrent: false, description: "" }]
          }))}>
            <Text style={styles.secondaryButtonLabel}>Add</Text>
          </Pressable>
        </View>
        {draft.experiences.map((experience) => (
          <View key={experience.id} style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.cardTitle}>Role entry</Text>
              <Pressable onPress={() => setDraft((current) => ({ ...current, experiences: current.experiences.filter((entry) => entry.id !== experience.id) }))}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
            <TextInput style={styles.input} value={experience.title} onChangeText={(value) => setDraft((current) => ({ ...current, experiences: current.experiences.map((entry) => entry.id === experience.id ? { ...entry, title: value } : entry) }))} placeholder="Title" placeholderTextColor="#64748b" />
            <TextInput style={styles.input} value={experience.companyName} onChangeText={(value) => setDraft((current) => ({ ...current, experiences: current.experiences.map((entry) => entry.id === experience.id ? { ...entry, companyName: value } : entry) }))} placeholder="Company" placeholderTextColor="#64748b" />
            <TextInput style={styles.input} value={experience.location} onChangeText={(value) => setDraft((current) => ({ ...current, experiences: current.experiences.map((entry) => entry.id === experience.id ? { ...entry, location: value } : entry) }))} placeholder="Location" placeholderTextColor="#64748b" />
            <View style={styles.row}>
              <TextInput style={[styles.input, styles.rowInput]} value={experience.startDate} onChangeText={(value) => setDraft((current) => ({ ...current, experiences: current.experiences.map((entry) => entry.id === experience.id ? { ...entry, startDate: value } : entry) }))} placeholder="Start date" placeholderTextColor="#64748b" />
              <TextInput style={[styles.input, styles.rowInput]} value={experience.endDate} onChangeText={(value) => setDraft((current) => ({ ...current, experiences: current.experiences.map((entry) => entry.id === experience.id ? { ...entry, endDate: value } : entry) }))} placeholder="End date" placeholderTextColor="#64748b" />
            </View>
            <Pressable onPress={() => setDraft((current) => ({ ...current, experiences: current.experiences.map((entry) => entry.id === experience.id ? { ...entry, isCurrent: !entry.isCurrent } : entry) }))} style={styles.optionChipInline}>
              <Text style={styles.optionChipLabel}>{experience.isCurrent ? "Current role" : "Mark current"}</Text>
            </Pressable>
            <TextInput multiline numberOfLines={4} style={[styles.input, styles.textArea]} value={experience.description} onChangeText={(value) => setDraft((current) => ({ ...current, experiences: current.experiences.map((entry) => entry.id === experience.id ? { ...entry, description: value } : entry) }))} placeholder="Description" placeholderTextColor="#64748b" />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          <Pressable style={styles.secondaryButton} onPress={() => void pickAndUploadDocument("CERTIFICATION")}>
            {uploadingDocument === "CERTIFICATION" ? <ActivityIndicator color="#e0f2fe" /> : <Text style={styles.secondaryButtonLabel}>Upload doc</Text>}
          </Pressable>
        </View>
        {draft.certifications.map((certification) => (
          <View key={certification.id} style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.cardTitle}>Certification</Text>
              <Pressable onPress={() => setDraft((current) => ({ ...current, certifications: current.certifications.filter((entry) => entry.id !== certification.id) }))}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
            <TextInput style={styles.input} value={certification.name} onChangeText={(value) => setDraft((current) => ({ ...current, certifications: current.certifications.map((entry) => entry.id === certification.id ? { ...entry, name: value } : entry) }))} placeholder="Name" placeholderTextColor="#64748b" />
            <TextInput style={styles.input} value={certification.issuer} onChangeText={(value) => setDraft((current) => ({ ...current, certifications: current.certifications.map((entry) => entry.id === certification.id ? { ...entry, issuer: value } : entry) }))} placeholder="Issuer" placeholderTextColor="#64748b" />
            <TextInput style={styles.input} value={certification.credentialUrl} onChangeText={(value) => setDraft((current) => ({ ...current, certifications: current.certifications.map((entry) => entry.id === certification.id ? { ...entry, credentialUrl: value } : entry) }))} placeholder="Credential URL" placeholderTextColor="#64748b" />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Education</Text>
          <Pressable style={styles.secondaryButton} onPress={() => setDraft((current) => ({
            ...current,
            educationEntries: [...current.educationEntries, { id: createDraftId(), institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", description: "" }]
          }))}>
            <Text style={styles.secondaryButtonLabel}>Add</Text>
          </Pressable>
        </View>
        {draft.educationEntries.map((entry) => (
          <View key={entry.id} style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.cardTitle}>Education entry</Text>
              <Pressable onPress={() => setDraft((current) => ({ ...current, educationEntries: current.educationEntries.filter((item) => item.id !== entry.id) }))}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
            <TextInput style={styles.input} value={entry.institution} onChangeText={(value) => setDraft((current) => ({ ...current, educationEntries: current.educationEntries.map((item) => item.id === entry.id ? { ...item, institution: value } : item) }))} placeholder="Institution" placeholderTextColor="#64748b" />
            <TextInput style={styles.input} value={entry.degree} onChangeText={(value) => setDraft((current) => ({ ...current, educationEntries: current.educationEntries.map((item) => item.id === entry.id ? { ...item, degree: value } : item) }))} placeholder="Degree" placeholderTextColor="#64748b" />
            <TextInput style={styles.input} value={entry.fieldOfStudy} onChangeText={(value) => setDraft((current) => ({ ...current, educationEntries: current.educationEntries.map((item) => item.id === entry.id ? { ...item, fieldOfStudy: value } : item) }))} placeholder="Field of study" placeholderTextColor="#64748b" />
          </View>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable onPress={() => void submit()} style={styles.primaryButton}>
        {isSaving ? <ActivityIndicator color="#082f49" /> : <Text style={styles.primaryButtonLabel}>{submitLabel}</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 48,
    backgroundColor: "#020617"
  },
  eyebrow: {
    color: "#38bdf8",
    marginBottom: 10,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1.1
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
    lineHeight: 23,
    marginBottom: 18
  },
  progressCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.18)",
    marginBottom: 18
  },
  progressLabel: {
    color: "#7dd3fc",
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: 6
  },
  progressValue: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "700"
  },
  progressMeta: {
    color: "#cbd5e1",
    marginTop: 6
  },
  section: {
    marginBottom: 18,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)"
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700"
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.22)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#f8fafc",
    backgroundColor: "rgba(2, 6, 23, 0.45)",
    marginBottom: 10
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top"
  },
  row: {
    flexDirection: "row",
    gap: 10
  },
  rowInput: {
    flex: 1
  },
  optionRow: {
    marginBottom: 12
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.2)",
    marginRight: 8
  },
  optionChipActive: {
    backgroundColor: "#38bdf8",
    borderColor: "#38bdf8"
  },
  optionChipLabel: {
    color: "#e0f2fe",
    fontSize: 12,
    fontWeight: "600"
  },
  optionChipLabelActive: {
    color: "#082f49"
  },
  optionChipInline: {
    alignSelf: "flex-start",
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.22)"
  },
  secondaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.24)"
  },
  secondaryButtonLabel: {
    color: "#e0f2fe",
    fontWeight: "700"
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "#38bdf8",
    alignItems: "center",
    justifyContent: "center"
  },
  primaryButtonLabel: {
    color: "#082f49",
    fontSize: 16,
    fontWeight: "700"
  },
  searchOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    marginBottom: 8
  },
  searchOptionLabel: {
    color: "#e0f2fe",
    fontWeight: "600"
  },
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(2, 6, 23, 0.45)",
    marginBottom: 10
  },
  cardTitle: {
    color: "#f8fafc",
    fontWeight: "700",
    fontSize: 15
  },
  removeText: {
    color: "#fca5a5",
    fontWeight: "600"
  },
  documentRow: {
    marginTop: 8
  },
  documentLabel: {
    color: "#7dd3fc",
    marginBottom: 4
  },
  documentValue: {
    color: "#cbd5e1"
  },
  error: {
    color: "#fca5a5",
    marginBottom: 16
  }
});