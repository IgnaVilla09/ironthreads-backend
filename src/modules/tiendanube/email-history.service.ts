import { randomUUID } from 'crypto';
import { prisma } from '../../config/database';

export type EmailSendLog = {
  id: string;
  type: 'single' | 'bulk';
  recipient: string | null;
  recipientCount: number;
  suppressedCount: number;
  subject: string;
  providerId: string | null;
  createdAt: Date;
};

export const emailHistoryService = {
  async list(): Promise<EmailSendLog[]> {
    return prisma.$queryRaw<EmailSendLog[]>`
      SELECT id, type, recipient, recipient_count AS "recipientCount", suppressed_count AS "suppressedCount",
             subject, provider_id AS "providerId", created_at AS "createdAt"
      FROM email_send_logs
      ORDER BY created_at DESC
      LIMIT 100
    `;
  },

  async create(input: Omit<EmailSendLog, 'id' | 'createdAt'> & { sentById: string }) {
    await prisma.$executeRaw`
      INSERT INTO email_send_logs (id, type, recipient, recipient_count, suppressed_count, subject, provider_id, sent_by_id)
      VALUES (${randomUUID()}::uuid, ${input.type}, ${input.recipient}, ${input.recipientCount}, ${input.suppressedCount}, ${input.subject}, ${input.providerId}, ${input.sentById}::uuid)
    `;
  },
};
