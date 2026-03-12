import { ProfileEditor } from "../components/profile-editor";

export default function ProfileReviewScreen() {
  return (
    <ProfileEditor
      description="Review the AI-generated draft, fix anything inaccurate, add verification documents, and complete your talent profile before it goes live."
      eyebrow="Profile review"
      submitLabel="Complete onboarding"
      title="Review your generated profile"
    />
  );
}