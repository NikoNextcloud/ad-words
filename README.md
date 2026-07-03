# TrendCraft BG · Vercel + Gemini

Приложение за Google Trends, ключови думи, рекламни текстове и Gemini AI изображения.

## Публикуване във Vercel

1. Качете всички файлове от тази папка в основната папка на GitHub хранилище.
2. Във Vercel изберете **Add New → Project → Import Git Repository**.
3. Оставете Framework Preset на **Other** и Root Directory на `./`, след което натиснете **Deploy**.
4. Отворете **Project → Settings → Environment Variables**.
5. Добавете `GEMINI_API_KEY` със стойността на ключа от Google AI Studio.
6. Добавете `APP_ACCESS_CODE` с личен код по ваш избор. Този код се въвежда в приложението при генериране.
7. Маркирайте Production, Preview и Development, запазете и направете **Redeploy**.

Важно: не поставяйте `GEMINI_API_KEY` или `APP_ACCESS_CODE` в GitHub файловете.

## Как работи защитата

Браузърът изпраща описанието до `/api/generate-image`. Vercel функцията проверява личния код и използва скрития `GEMINI_API_KEY`. Ключът никога не достига до браузъра.

## GitHub Pages

Текстовата част продължава да работи в GitHub Pages. Gemini изображенията изискват Vercel функцията.

Google Trends показва относителен интерес, а не точен брой месечни търсения. Gemini може да начислява цена за генерираните изображения според активния API план.
