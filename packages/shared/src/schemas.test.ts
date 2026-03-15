import {
  registerInputSchema,
  loginInputSchema,
  createTalentProfileInputSchema,
  createDemandInputSchema,
  scheduleInterviewInputSchema,
  createOfferInputSchema,
  uploadAssetInputSchema,
  smartTalentSearchFiltersSchema,
  envSchema,
  userRoles,
  seniorityLevels,
  demandStatuses,
  offerStatuses,
  interviewStatuses
} from "./index.js";

describe("Shared Zod schemas", () => {

  describe("registerInputSchema", () => {
    it("accepts valid registration data", () => {
      const result = registerInputSchema.safeParse({
        email: "test@example.com",
        password: "StrongPass1!",
        role: "TALENT"
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = registerInputSchema.safeParse({
        email: "not-an-email",
        password: "StrongPass1!",
        role: "TALENT"
      });
      expect(result.success).toBe(false);
    });

    it("rejects short password", () => {
      const result = registerInputSchema.safeParse({
        email: "test@example.com",
        password: "short",
        role: "TALENT"
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing required fields", () => {
      const result = registerInputSchema.safeParse({
        email: "test@example.com"
      });
      expect(result.success).toBe(false);
    });
  });

  describe("loginInputSchema", () => {
    it("accepts valid login data", () => {
      const result = loginInputSchema.safeParse({
        email: "recruiter@marketplace.example",
        password: "Password1!"
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty password", () => {
      const result = loginInputSchema.safeParse({
        email: "recruiter@marketplace.example",
        password: ""
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createTalentProfileInputSchema", () => {
    it("accepts a minimal valid profile", () => {
      const result = createTalentProfileInputSchema.safeParse({
        firstName: "Amina",
        lastName: "Khaled",
        headline: "Senior Full-Stack Engineer",
        summary: "10+ years in web development",
        seniorityLevel: "SENIOR",
        availability: "IMMEDIATE"
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid seniority level", () => {
      const result = createTalentProfileInputSchema.safeParse({
        firstName: "A",
        lastName: "B",
        headline: "Dev",
        summary: "Work",
        seniorityLevel: "INTERN",
        availability: "IMMEDIATE"
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createDemandInputSchema", () => {
    it("accepts a valid demand", () => {
      const result = createDemandInputSchema.safeParse({
        companyId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Senior React Developer",
        description: "Build frontend features for enterprise SaaS",
        experienceLevel: "SENIOR",
        location: "Dubai, UAE",
        remotePolicy: "HYBRID"
      });
      expect(result.success).toBe(true);
    });

    it("rejects non-uuid companyId", () => {
      const result = createDemandInputSchema.safeParse({
        companyId: "not-a-uuid",
        title: "Dev",
        description: "Work",
        experienceLevel: "SENIOR",
        location: "Dubai",
        remotePolicy: "REMOTE"
      });
      expect(result.success).toBe(false);
    });
  });

  describe("scheduleInterviewInputSchema", () => {
    it("accepts valid interview data", () => {
      const result = scheduleInterviewInputSchema.safeParse({
        shortlistId: "550e8400-e29b-41d4-a716-446655440000",
        scheduledAt: "2026-04-01T10:00:00Z",
        duration: 60
      });
      expect(result.success).toBe(true);
    });

    it("rejects duration under 15 minutes", () => {
      const result = scheduleInterviewInputSchema.safeParse({
        shortlistId: "550e8400-e29b-41d4-a716-446655440000",
        scheduledAt: "2026-04-01T10:00:00Z",
        duration: 5
      });
      expect(result.success).toBe(false);
    });
  });

  describe("uploadAssetInputSchema", () => {
    it("accepts a valid PDF upload", () => {
      const result = uploadAssetInputSchema.safeParse({
        fileName: "resume.pdf",
        mimeType: "application/pdf",
        contentBase64: "JVBERi0xLjcK...",
        assetType: "RESUME"
      });
      expect(result.success).toBe(true);
    });

    it("rejects disallowed MIME types", () => {
      const result = uploadAssetInputSchema.safeParse({
        fileName: "script.sh",
        mimeType: "application/x-sh",
        contentBase64: "IyEvYmluL2Jhc2g=",
        assetType: "RESUME"
      });
      expect(result.success).toBe(false);
    });
  });

  describe("smartTalentSearchFiltersSchema", () => {
    it("accepts empty filters with defaults", () => {
      const result = smartTalentSearchFiltersSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.skills).toEqual([]);
        expect(result.data.skillMode).toBe("AND");
      }
    });

    it("accepts full filters", () => {
      const result = smartTalentSearchFiltersSchema.safeParse({
        skills: ["React", "TypeScript"],
        skillMode: "OR",
        seniorityLevel: "SENIOR",
        availability: "IMMEDIATE",
        location: "Dubai",
        minHourlyRate: 50,
        maxHourlyRate: 150
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Enums", () => {
    it("has 4 user roles", () => {
      expect(userRoles).toEqual(["TALENT", "RECRUITER", "ADMIN", "HEADHUNTER"]);
    });

    it("has 5 seniority levels", () => {
      expect(seniorityLevels).toHaveLength(5);
      expect(seniorityLevels).toContain("JUNIOR");
      expect(seniorityLevels).toContain("EXECUTIVE");
    });

    it("has 5 demand statuses", () => {
      expect(demandStatuses).toHaveLength(5);
    });

    it("has 5 offer statuses", () => {
      expect(offerStatuses).toHaveLength(5);
    });

    it("has 4 interview statuses", () => {
      expect(interviewStatuses).toHaveLength(4);
    });
  });
});
