import { prisma } from '../../config/database';
import { randomUUID } from 'crypto';

export type EmailSuppression = {
  id: string;
  email: string;
  reason: string | null;
  createdAt: Date;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export const emailSuppressionService = {
  async list(): Promise<EmailSuppression[]> {
    return prisma.$queryRaw<EmailSuppression[]>`
      SELECT id, email, reason, created_at AS "createdAt"
      FROM email_suppressions
      ORDER BY created_at DESC
    `;
  },

  async add(email: string, reason: string | undefined, createdById: string): Promise<EmailSuppression> {
    const normalizedEmail = normalizeEmail(email);
    await prisma.$executeRaw`
      INSERT INTO email_suppressions (id, email, reason, created_by_id)
      VALUES (${randomUUID()}::uuid, ${normalizedEmail}, ${reason?.trim() || null}, ${createdById}::uuid)
      ON CONFLICT (email) DO UPDATE SET reason = EXCLUDED.reason
    `;
    const [suppression] = await prisma.$queryRaw<EmailSuppression[]>`
      SELECT id, email, reason, created_at AS "createdAt"
      FROM email_suppressions
      WHERE email = ${normalizedEmail}
    `;
    return suppression;
  },

  async remove(id: string) {
    return prisma.$executeRaw`DELETE FROM email_suppressions WHERE id = ${id}::uuid`;
  },

  async findEmails(emails: string[]) {
    if (!emails.length) return new Set<string>();
    const rows = await prisma.$queryRaw<Array<{ email: string }>>`
      SELECT email FROM email_suppressions WHERE email = ANY(${emails})
    `;
    return new Set(rows.map((row) => row.email));
  },
};
