import { prisma } from '../config/database';
import { encryptText } from '../shared/utils/crypto';

type ParsedArgs = {
  username: string;
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

  if (!entries.username || !entries.adminApiKey) {
    throw new Error('Faltan --username=... y/o --adminApiKey=...');
  }

  return {
    username: entries.username,
    adminApiKey: entries.adminApiKey,
  };
}

async function main() {
  const input = parseArgs();

  await prisma.appUser.update({
    where: {
      username: input.username,
    },
    data: {
      adminApiKeyEncrypted: encryptText(input.adminApiKey),
    },
  });

  console.log(`Admin API key re-cifrada correctamente para ${input.username}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
