// Node.js crypto НЕ совместим с Edge runtime!
// Переписано с использованием Web Crypto API

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Хелпер для получения HMAC-SHA256 (Web Crypto API)
async function hmacSHA256(keyStr: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyStr);
  const dataBuf = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );

  const sigBuf = await crypto.subtle.sign("HMAC", key, dataBuf);

  // Вернуть hex строку
  return Array.from(new Uint8Array(sigBuf)).map(x => x.toString(16).padStart(2, "0")).join("");
}

/**
 * Validates Telegram Web App initData
 * @param initData - The initData string from Telegram Web App
 * @param botToken - Your Telegram Bot token
 * @returns Parsed user data if valid, null if invalid
 */
export async function validateTelegramWebAppData(initData: string, botToken: string): Promise<TelegramUser | null> {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) return null;

    urlParams.delete('hash');
    const dataCheckArr: string[] = [];
    urlParams.forEach((value, key) => {
      dataCheckArr.push(`${key}=${value}`);
    });
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');

    // Секретный ключ для HMAC
    const secretKey = await hmacSHA256('WebAppData', botToken);

    // Хэшируем строку параметров
    const calculatedHash = await hmacSHA256(secretKey, dataCheckString);

    if (calculatedHash !== hash) return null;

    // Парсим user
    const userParam = urlParams.get('user');
    if (!userParam) return null;

    const user = JSON.parse(userParam);

    // Проверяем дату авторизации
    const authDate = parseInt(urlParams.get('auth_date') || '0');
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) return null;

    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      photo_url: user.photo_url,
      auth_date: authDate,
      hash
    };
  } catch (error) {
    console.error('Telegram auth validation error:', error);
    return null;
  }
}

/**
 * Simpler validation for development/testing
 * WARNING: Only use in development!
 */
export function validateTelegramWebAppDataDev(initData: string): TelegramUser | null {
  try {
    const urlParams = new URLSearchParams(initData);
    const userParam = urlParams.get('user');
    if (!userParam) return null;

    const user = JSON.parse(userParam);

    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      photo_url: user.photo_url,
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'dev'
    };
  } catch (error) {
    console.error('Telegram auth validation error:', error);
    return null;
  }
}