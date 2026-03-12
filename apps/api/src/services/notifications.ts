import type { NotificationType } from "@atm/shared";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

type NotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
};

export const createNotification = async (input: NotificationInput) =>
  prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined
    }
  });

export const createNotifications = async (inputs: NotificationInput[]) => {
  const uniqueInputs = inputs.filter(
    (input, index, list) =>
      list.findIndex(
        (candidate) =>
          candidate.userId === input.userId &&
          candidate.type === input.type &&
          candidate.title === input.title &&
          candidate.body === input.body
      ) === index
  );

  return Promise.all(uniqueInputs.map((input) => createNotification(input)));
};