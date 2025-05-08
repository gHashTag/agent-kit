// /Users/playra/agent-kit/examples/api-scraper-agent/src/__tests__/instagram.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { createScraper } from '../index';
import dotenv from 'dotenv';
import path from 'path';

// Загружаем переменные окружения из .env файла в корневой директории api-scraper-agent
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // Путь к .env в корне api-scraper-agent

describe('Instagram Profile Scraper Test', () => {
  let scraper: ReturnType<typeof createScraper>;
  const apiToken = process.env.APIFY_TOKEN;

  beforeAll(() => {
    if (!apiToken) {
      throw new Error('Переменная окружения APIFY_TOKEN не установлена. Пожалуйста, убедитесь, что она задана в файле .env в корне проекта api-scraper-agent.');
    }
    scraper = createScraper(apiToken);
  });

  it('should scrape Reels from a profile URL', async () => {
    const testProfileUrl = 'https://www.instagram.com/neuro_coder/';
    const expectedUsername = 'neuro_coder';
    const testLimit = 3; // Запросим несколько постов для проверки

    console.log(`[TEST_INFO] Запускаем скрейпинг для профиля: ${testProfileUrl} с лимитом: ${testLimit}`);
    
    try {
      const results = await scraper.scrapeInstagram(testProfileUrl, { limit: testLimit, timeout: 400 }); // Таймаут ~6.5 минут
      
      console.log(`[TEST_INFO] Скрейпинг завершен. Получено ${results.length} элементов.`);
      // console.log('[TEST_INFO] Результаты:', JSON.stringify(results, null, 2));

      expect(results).toBeInstanceOf(Array);
      expect(results).toBeDefined();

      // Ожидаем, что будет получено какое-то количество результатов, но не более testLimit
      // Если профиль новый или не имеет Reels, results.length может быть 0.
      // Если профиль имеет меньше Reels, чем testLimit, будет возвращено доступное количество.
      if (results.length > 0) {
        expect(results.length).toBeLessThanOrEqual(testLimit);

        // Проверяем каждый полученный элемент
        results.forEach(item => {
          expect(item).toHaveProperty('id');
          // expect(item).toHaveProperty('videoUrl'); // Раскомментируйте, если это поле всегда ожидается
          expect(item).toHaveProperty('ownerUsername');
          // Важно: API может возвращать username в разных регистрах или с вариациями.
          // Для надежности можно привести к нижнему регистру перед сравнением, если это допустимо.
          // Однако, если actor xMc5Ga1oCONPmWJIa возвращает точное имя пользователя из URL, точное сравнение подойдет.
          if (item.ownerUsername) { // Add null check for ownerUsername
            expect(item.ownerUsername.toLowerCase()).toBe(expectedUsername.toLowerCase());
          } else {
            // Handle the case where ownerUsername is undefined, e.g., by failing the test or logging a warning
            // For now, let's assume if ownerUsername is a property, it should have a value for this test case.
            // If it can be legitimately undefined for some items, the test logic might need adjustment.
            expect(item.ownerUsername).toBeDefined(); // This will fail if ownerUsername is undefined, highlighting the issue.
          }
        });
      } else {
        console.warn(`[TEST_WARN] Не получено результатов для профиля: ${testProfileUrl}. Это может быть нормально, если у профиля нет Reels или API не вернул данные.`);
      }

    } catch (error) {
      console.error('[TEST_ERROR] Ошибка во время тестового скрейпинга профиля:', error);
      throw error;
    }
  }, 400000); // Увеличенный таймаут для теста Vitest (~6.5 минут)
});