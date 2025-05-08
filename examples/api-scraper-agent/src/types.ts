export interface InstagramPost {
  // Определим некоторые общие поля, которые могут присутствовать в посте Instagram
  // Вы можете расширить этот интерфейс на основе фактических данных, которые вы ожидаете
  id: string;
  url: string;
  caption?: string;
  timestamp: string; // Или Date, если вы будете преобразовывать
  likesCount?: number;
  commentsCount?: number;
  videoViewCount?: number;
  ownerUsername?: string;
  ownerProfilePicUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  childPosts?: InstagramPost[]; // Для каруселей
  // Добавьте другие поля по мере необходимости
  [key: string]: any; // Позволяет иметь любые другие поля, так как API может возвращать много данных
}