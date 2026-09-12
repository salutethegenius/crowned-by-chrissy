import "server-only";

import { prisma } from "./db";
import { Prisma } from "@prisma/client";

export async function audit(params: {
  actor: string;
  action: string;
  appointmentId?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditEvent.create({
    data: {
      actor: params.actor,
      action: params.action,
      appointmentId: params.appointmentId,
      metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}
