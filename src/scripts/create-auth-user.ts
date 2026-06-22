import { prisma } from '../config/database';
import { encryptText } from '../shared/utils/crypto';
import { hashPassword } from '../shared/utils/password';

type ParsedArgs = {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  adminApiKey: string;
};

function parseArgs(): ParsedArgs {
  const entries = process.argv.slice(2).reduce<Record<string, string>>((acc, arg) => {
    const [key, value] = arg.split('=');

    if (key?.startsWith('--') && value) {
      acc[key.slice(2)] = value;
    }

    return acc;
  }, {});

  const requiredKeys: Array<keyof ParsedArgs> = ['firstName', 'lastName', 'username', 'password', 'adminApiKey'];

  for (const key of requiredKeys) {
    if (!entries[key]) {
      throw new Error(`Falta el argumento --${key}=...`);
    }
  }

  return entries as ParsedArgs;
}

async function main() {
  const input = parseArgs();

  await prisma.appUser.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      username: input.username,
      passwordHash: hashPassword(input.password),
      adminApiKeyEncrypted: encryptText(input.adminApiKey),
    },
  });

  console.log(`Usuario ${input.username} creado correctamente.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
