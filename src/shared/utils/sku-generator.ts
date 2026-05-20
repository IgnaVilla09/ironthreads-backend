const MAX_NAME_LENGTH = 10;

function sanitizeName(name: string): string {
  return name
    .toUpperCase()
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, MAX_NAME_LENGTH);
}

export function generateSku(name: string, colorName: string, sizeName: string): string {
  const namePart = sanitizeName(name);
  const colorPart = colorName.toUpperCase();
  const sizePart = sizeName.toUpperCase();

  return `${namePart}-${colorPart}-${sizePart}`;
}
