// /Users/playra/agent-kit/examples/api-scraper-agent/src/run_scraper.ts
import { createScraper } from './index';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require('dotenv');

// Загружаем переменные окружения из .env файла в корневой директории api-scraper-agent
dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

async function main() {
  const apiUrl = process.argv[2];
  if (!apiUrl) {
    console.error("Пожалуйста, укажите URL Instagram в качестве аргумента командной строки.");
    process.exit(1);
  }

  const apiToken = process.env.APIFY_TOKEN;
  if (!apiToken) {
    console.error("Переменная окружения APIFY_TOKEN не установлена. Пожалуйста, убедитесь, что она задана в файле .env в корне проекта api-scraper-agent.");
    process.exit(1);
  }

  console.log(`[INFO] Запускаем скрейпер для URL: ${apiUrl}`);
  const scraper = createScraper(apiToken);

  try {
    // Устанавливаем лимит постов, например, 10, для теста. Можно изменить или убрать для получения всех.
    const results = await scraper.scrapeInstagram(apiUrl, { limit: 10, timeout: 1200 }); // Увеличен таймаут до 20 минут (1200 секунд)
    console.log(`[INFO] Скрейпинг завершен. Получено ${results.length} элементов.`);
    // Для подробного вывода результатов, раскомментируйте следующую строку:
    // console.log('[INFO] Результаты:', JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('[ERROR] Ошибка во время скрейпинга:', error);
  }
}

main();