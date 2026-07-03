# TrendCraft BG · Vercel + Cloudflare FLUX

Приложение за Google Trends, ключови думи, рекламни текстове и безплатно AI генериране на изображения.

## Публикуване във Vercel

1. Качете всички файлове от тази папка в основната папка на GitHub хранилище.
2. Във Vercel изберете **Add New → Project → Import Git Repository**.
3. Оставете Framework Preset на **Other** и Root Directory на `./`, след което натиснете **Deploy**.
4. Отворете **Project → Settings → Environment Variables**.
5. Добавете `CLOUDFLARE_ACCOUNT_ID` със стойността от Cloudflare Workers AI → Use REST API.
6. Добавете `CLOUDFLARE_API_TOKEN` със създадения Workers AI API Token.
7. Добавете `APP_ACCESS_CODE` с личен код по ваш избор.
8. Маркирайте Production, Preview и Development, запазете и направете **Redeploy**.

Важно: не поставяйте Account ID, API Token или APP_ACCESS_CODE в GitHub файловете.

## Как работи защитата

Браузърът изпраща описанието до `/api/generate-image`. Vercel функцията проверява личния код и извиква Cloudflare Workers AI с модела `@cf/black-forest-labs/flux-2-klein-9b`. API Token никога не достига до браузъра.

## Безплатна квота

Cloudflare Workers AI предоставя 10 000 neurons дневно. Едно изображение около 1 MP с FLUX 2 Klein 9B използва приблизително 1364 neurons, така че 3–4 изображения дневно са в безплатната квота.

Google Trends показва относителен интерес, а не точен брой месечни търсения.
