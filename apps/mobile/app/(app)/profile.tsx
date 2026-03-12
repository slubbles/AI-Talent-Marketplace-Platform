import { ProfileEditor } from "./components/profile-editor";

export default function TalentProfileScreen() {
  return (
    <ProfileEditor
      description="Keep your talent profile current so recruiters see accurate availability, rates, skills, and verification documents."
      eyebrow="Talent profile"
      submitLabel="Save profile changes"
      title="Manage your talent profile"
    />
  );
}