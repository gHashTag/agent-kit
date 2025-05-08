import { createScraper } from './index';
import { InstagramPost } from './types'; // Импортируем тип
import fs from 'fs/promises';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require('dotenv');

console.log(`[DEBUG] Current working directory for dotenv: ${process.cwd()}`);
const dotenvResult = dotenv.config();

if (dotenvResult.error) {
  console.error('[DEBUG] Error loading .env file:', dotenvResult.error);
} else {
  console.log('[DEBUG] .env file loaded successfully. Parsed variables:', dotenvResult.parsed);
}

async function main() {
  let instagramUrl = process.argv[2];
  // Handle the case where pnpm passes "--" as an argument
  if (instagramUrl === '--' && process.argv.length > 3) {
    instagramUrl = process.argv[3];
  } else if (instagramUrl === '--') {
    // If only "--" is passed without a subsequent URL
    // The next check `if (!instagramUrl)` will handle this case
  }

  if (!instagramUrl) {
    console.error('Пожалуйста, укажите URL Instagram как аргумент командной строки.');
    console.error('Пример: pnpm exec ts-node src/run-scraper.ts https://www.instagram.com/p/C8_ohdOR/');
    process.exit(1);
  }

  // Пытаемся получить токен из .env файла или переменных окружения
  // Для этого примера, если токен не найден, будем использовать заглушку,
  // так как основная цель - проверить логику сохранения файла.
  // В реальном приложении токен должен быть обязательным.
  const apiToken = process.env.APIFY_TOKEN || 'YOUR_DUMMY_APIFY_TOKEN';
  console.log(`Используемый APIFY_TOKEN: ${apiToken}`); // Выводим токен сразу после определения

  if (apiToken === 'YOUR_DUMMY_APIFY_TOKEN') {
    console.warn('ВНИМАНИЕ: Используется фиктивный API токен. Запросы к Apify, скорее всего, не будут успешными.');
    console.warn('Для реального тестирования установите APIFY_TOKEN в переменных окружения или в .env файле.');
  }

  const scraper = createScraper(apiToken);

  // Добавим проверку, что instagramUrl действительно строка перед вызовом скрепера
  if (typeof instagramUrl !== 'string') {
    console.error('Ошибка: URL Instagram не был корректно определен. Завершение работы.');
    process.exit(1);
  }

  console.log(`Запускаем скрепинг для URL: ${instagramUrl}`);

  try {
    // Вызываем реальный метод скрепинга
    console.log('Вызов scraper.scrapeInstagram...');
    // Установим небольшой лимит для теста, например, 2 поста
    const posts: InstagramPost[] = await scraper.scrapeInstagram(instagramUrl, { limit: 20 });

    console.log(`Скрепинг завершен. Получено постов: ${posts.length}`);
    if (posts.length > 0) {
      console.log('Пример первого поста:', JSON.stringify(posts[0], null, 2));
    }

  } catch (error) {
    console.error('Ошибка при выполнении скрейпинга:', error);
  }
}

main().catch(error => {
  console.error('Непредвиденная ошибка в main:', error);
});