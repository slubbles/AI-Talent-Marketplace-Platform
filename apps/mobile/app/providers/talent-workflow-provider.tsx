import type { AvailabilityWindow, InterviewResponseStatus, OfferStatus, TalentInterestStatus } from "@atm/shared";
import * as Notifications from "expo-notifications";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { graphQLRequest } from "../lib/graphql";
import { useAuth } from "./auth-provider";
import { useTalentProfile } from "./talent-profile-provider";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowAlert: true
  })
});

type WorkflowNotification = {
  id: string;
  type: "MATCH_READY" | "INTERVIEW_UPDATE" | "OFFER_UPDATE" | "SYSTEM";
  title: string;
  body: string;
  read: boolean;
  metadata: string | null;
  createdAt: string;
};

type WorkflowDemand = {
  id: string;
  title: string;
  description: string;
  location: string;
  remotePolicy: "ONSITE" | "HYBRID" | "REMOTE";
  budgetMin: number | null;
  budgetMax: number | null;
  currency: string;
  company: {
    name: string;
    industry: string;
  };
  requiredSkills: Array<{
    id: string;
    isRequired: boolean;
    minimumYears: number | null;
    skill: { id: string; displayName: string };
  }>;
};

type WorkflowOffer = {
  id: string;
  hourlyRate: number;
  startDate: string;
  endDate: string | null;
  status: OfferStatus;
  terms: string;
  createdAt: string;
};

type WorkflowInterview = {
  id: string;
  scheduledAt: string;
  duration: number;
  meetingUrl: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  talentResponseStatus: InterviewResponseStatus;
  offer: WorkflowOffer | null;
  createdAt: string;
};

export type WorkflowMatch = {
  id: string;
  matchScore: number;
  scoreBreakdown: string;
  aiExplanation: string;
  status: "AI_SUGGESTED" | "RECRUITER_REVIEWED" | "SHORTLISTED" | "REJECTED";
  talentStatus: TalentInterestStatus;
  demand: WorkflowDemand;
  interviews: WorkflowInterview[];
  createdAt: string;
};

type TalentWorkflowContextValue = {
  availability: AvailabilityWindow | null;
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isUpdatingAvailability: boolean;
  matches: WorkflowMatch[];
  notifications: WorkflowNotification[];
  refreshWorkflow: () => Promise<void>;
  respondToInterview: (interviewId: string, talentResponseStatus: Extract<InterviewResponseStatus, "ACCEPTED" | "DECLINED">) => Promise<void>;
  respondToMatch: (shortlistId: string, talentStatus: Extract<TalentInterestStatus, "INTERESTED" | "DECLINED">) => Promise<void>;
  setAvailability: (availability: Extract<AvailabilityWindow, "IMMEDIATE" | "TWO_WEEKS" | "ONE_MONTH" | "NOT_AVAILABLE">) => Promise<void>;
  acceptOffer: (offerId: string) => Promise<void>;
  declineOffer: (offerId: string) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  unreadCount: number;
};

const TalentWorkflowContext = createContext<TalentWorkflowContextValue | null>(null);

const workflowQuery = `#graphql
  query MobileTalentWorkflow($notificationsPagination: PaginationInput) {
    myProfile {
      availability
    }
    myMatches {
      id
      matchScore
      scoreBreakdown
      aiExplanation
      status
      talentStatus
      createdAt
      demand {
        id
        title
        description
        location
        remotePolicy
        budgetMin
        budgetMax
        currency
        company {
          name
          industry
        }
        requiredSkills {
          id
          isRequired
          minimumYears
          skill {
            id
            displayName
          }
        }
      }
      interviews {
        id
        scheduledAt
        duration
        meetingUrl
        status
        talentResponseStatus
        createdAt
        offer {
          id
          hourlyRate
          startDate
          endDate
          status
          terms
          createdAt
        }
      }
    }
    notifications(pagination: $notificationsPagination) {
      edges {
        node {
          id
          type
          title
          body
          read
          metadata
          createdAt
        }
      }
    }
    unreadCount
  }
`;

const respondToMatchMutation = `#graphql
  mutation MobileRespondToMatch($input: RespondToMatchInput!) {
    respondToMatch(input: $input) {
      id
    }
  }
`;

const respondToInterviewMutation = `#graphql
  mutation MobileRespondToInterview($input: RespondToInterviewInput!) {
    respondToInterview(input: $input) {
      id
    }
  }
`;

const acceptOfferMutation = `#graphql
  mutation MobileAcceptOffer($id: ID!) {
    acceptOffer(id: $id) {
      id
    }
  }
`;

const declineOfferMutation = `#graphql
  mutation MobileDeclineOffer($id: ID!) {
    declineOffer(id: $id) {
      id
    }
  }
`;

const updateAvailabilityMutation = `#graphql
  mutation MobileUpdateAvailability($input: UpdateAvailabilityInput!) {
    updateAvailability(input: $input) {
      id
      availability
      availableFrom
    }
  }
`;

const markNotificationReadMutation = `#graphql
  mutation MobileMarkNotificationRead($input: MarkNotificationReadInput!) {
    markNotificationRead(input: $input) {
      id
      read
    }
  }
`;

const notificationPageSize = { first: 12 };

const normalizeError = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export function TalentWorkflowProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { profile, refreshProfile } = useTalentProfile();
  const [matches, setMatches] = useState<WorkflowMatch[]>([]);
  const [notifications, setNotifications] = useState<WorkflowNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [availability, setAvailabilityState] = useState<AvailabilityWindow | null>(profile?.availability ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const didBootstrapNotificationsRef = useRef(false);
  const surfacedNotificationIdsRef = useRef<Set<string>>(new Set());
  const notificationsEnabledRef = useRef(false);

  const accessToken = session?.tokens.accessToken;

  const hydrateWorkflow = async () => {
    if (!accessToken || !profile) {
      setMatches([]);
      setNotifications([]);
      setUnreadCount(0);
      setAvailabilityState(profile?.availability ?? null);
      setIsLoading(false);
      return;
    }

    const response = await graphQLRequest<{
      myProfile: { availability: AvailabilityWindow } | null;
      myMatches: WorkflowMatch[];
      notifications: { edges: Array<{ node: WorkflowNotification }> };
      unreadCount: number;
    }>(workflowQuery, { notificationsPagination: notificationPageSize }, accessToken);

    setMatches(response.myMatches);
    setNotifications(response.notifications.edges.map((edge) => edge.node));
    setUnreadCount(response.unreadCount);
    setAvailabilityState(response.myProfile?.availability ?? profile.availability);
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await hydrateWorkflow();
      } catch (loadError) {
        setError(normalizeError(loadError, "Could not load your talent workflow."));
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [accessToken, profile?.id]);

  useEffect(() => {
    if (!accessToken || !profile) {
      return;
    }

    const intervalId = setInterval(() => {
      void hydrateWorkflow().catch(() => undefined);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [accessToken, profile?.id]);

  useEffect(() => {
    const requestPermissions = async () => {
      const permissions = await Notifications.getPermissionsAsync();

      if (permissions.status === "granted") {
        notificationsEnabledRef.current = true;
        return;
      }

      const nextPermissions = await Notifications.requestPermissionsAsync();
      notificationsEnabledRef.current = nextPermissions.status === "granted";
    };

    void requestPermissions();
  }, []);

  useEffect(() => {
    if (!notifications.length) {
      return;
    }

    if (!didBootstrapNotificationsRef.current) {
      surfacedNotificationIdsRef.current = new Set(notifications.map((notification) => notification.id));
      didBootstrapNotificationsRef.current = true;
      return;
    }

    if (!notificationsEnabledRef.current) {
      return;
    }

    const unseenUnread = notifications.filter(
      (notification) => !notification.read && !surfacedNotificationIdsRef.current.has(notification.id)
    );

    unseenUnread.forEach((notification) => {
      surfacedNotificationIdsRef.current.add(notification.id);
      void Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body
        },
        trigger: null
      });
    });
  }, [notifications]);

  const refreshWorkflow = async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      await Promise.all([hydrateWorkflow(), refreshProfile()]);
    } catch (refreshError) {
      setError(normalizeError(refreshError, "Could not refresh talent activity."));
    } finally {
      setIsRefreshing(false);
    }
  };

  const runMutation = async (query: string, variables?: Record<string, unknown>) => {
    if (!accessToken) {
      throw new Error("Sign in again to continue.");
    }

    await graphQLRequest<Record<string, unknown>>(query, variables, accessToken);
  };

  const updateFromMutation = async (query: string, variables?: Record<string, unknown>) => {
    if (!accessToken) {
      throw new Error("Sign in again to continue.");
    }

    await graphQLRequest<Record<string, unknown>>(query, variables, accessToken);
    await hydrateWorkflow();
    await refreshProfile();
  };

  const respondToMatch = async (
    shortlistId: string,
    talentStatus: Extract<TalentInterestStatus, "INTERESTED" | "DECLINED">
  ) => {
    setError(null);

    try {
      await updateFromMutation(respondToMatchMutation, { input: { shortlistId, talentStatus } });
    } catch (mutationError) {
      setError(normalizeError(mutationError, "Could not update interest status."));
      throw mutationError;
    }
  };

  const respondToInterview = async (
    interviewId: string,
    talentResponseStatus: Extract<InterviewResponseStatus, "ACCEPTED" | "DECLINED">
  ) => {
    setError(null);

    try {
      await updateFromMutation(respondToInterviewMutation, { input: { interviewId, talentResponseStatus } });
    } catch (mutationError) {
      setError(normalizeError(mutationError, "Could not update interview response."));
      throw mutationError;
    }
  };

  const acceptOffer = async (offerId: string) => {
    setError(null);

    try {
      await updateFromMutation(acceptOfferMutation, { id: offerId });
    } catch (mutationError) {
      setError(normalizeError(mutationError, "Could not accept offer."));
      throw mutationError;
    }
  };

  const declineOffer = async (offerId: string) => {
    setError(null);

    try {
      await updateFromMutation(declineOfferMutation, { id: offerId });
    } catch (mutationError) {
      setError(normalizeError(mutationError, "Could not decline offer."));
      throw mutationError;
    }
  };

  const setAvailability = async (
    nextAvailability: Extract<AvailabilityWindow, "IMMEDIATE" | "TWO_WEEKS" | "ONE_MONTH" | "NOT_AVAILABLE">
  ) => {
    if (!accessToken) {
      throw new Error("Sign in again to continue.");
    }

    setIsUpdatingAvailability(true);
    setError(null);

    try {
      await graphQLRequest<{ updateAvailability: { availability: AvailabilityWindow } }>(
        updateAvailabilityMutation,
        { input: { availability: nextAvailability } },
        accessToken
      );
      setAvailabilityState(nextAvailability);
      await refreshProfile();
      await hydrateWorkflow();
    } catch (mutationError) {
      setError(normalizeError(mutationError, "Could not update availability."));
      throw mutationError;
    } finally {
      setIsUpdatingAvailability(false);
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    setError(null);

    try {
      await runMutation(markNotificationReadMutation, { input: { notificationId } });
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId ? { ...notification, read: true } : notification
        )
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (mutationError) {
      setError(normalizeError(mutationError, "Could not mark notification as read."));
      throw mutationError;
    }
  };

  const value = useMemo(
    () => ({
      availability,
      error,
      isLoading,
      isRefreshing,
      isUpdatingAvailability,
      matches,
      notifications,
      refreshWorkflow,
      respondToInterview,
      respondToMatch,
      setAvailability,
      acceptOffer,
      declineOffer,
      markNotificationRead,
      unreadCount
    }),
    [availability, error, isLoading, isRefreshing, isUpdatingAvailability, matches, notifications, unreadCount]
  );

  return <TalentWorkflowContext.Provider value={value}>{children}</TalentWorkflowContext.Provider>;
}

export function useTalentWorkflow() {
  const value = useContext(TalentWorkflowContext);

  if (!value) {
    throw new Error("useTalentWorkflow must be used within TalentWorkflowProvider.");
  }

  return value;
}