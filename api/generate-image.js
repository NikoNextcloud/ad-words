const SIZES = {
  '1:1': [1024, 1024],
  '4:5': [896, 1120],
  '9:16': [768, 1360],
  '16:9': [1360, 768]
};

const STYLES = {
  advertising: 'high-end commercial advertising photography, polished art direction, realistic lighting',
  minimal: 'minimalist premium design, clean composition, elegant negative space',
  premium: 'luxury editorial advertising, sophisticated materials, dramatic refined lighting',
  cinematic: 'cinematic commercial scene, rich contrast, atmospheric lighting, highly detailed',
  illustration: 'modern editorial illustration, bold shapes, refined color palette, professional advertising design'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error: 'Позволени са само POST заявки.'});

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    return res.status(503).json({error: 'Липсват CLOUDFLARE_ACCOUNT_ID или CLOUDFLARE_API_TOKEN във Vercel.'});
  }

  const requiredCode = process.env.APP_ACCESS_CODE;
  if (requiredCode && req.headers['x-access-code'] !== requiredCode) {
    return res.status(401).json({error: 'Невалиден код за достъп.'});
  }

  const {prompt, headline = '', aspectRatio = '1:1', style = 'advertising'} = req.body || {};
  if (typeof prompt !== 'string' || prompt.trim().length < 5) return res.status(400).json({error: 'Добави по-подробно описание.'});
  if (prompt.length > 1800 || String(headline).length > 100) return res.status(400).json({error: 'Описанието е прекалено дълго.'});

  const [width, height] = SIZES[aspectRatio] || SIZES['1:1'];
  const fullPrompt = [
    prompt.trim(),
    `Visual style: ${STYLES[style] || STYLES.advertising}.`,
    'Create a finished social media advertising visual with a strong focal point, professional composition and realistic detail.',
    headline ? `Include exactly this Bulgarian headline, large and clearly legible: "${String(headline).trim()}".` : 'Do not add text, logos, signatures or watermarks.'
  ].join(' ');

  const form = new FormData();
  form.append('prompt', fullPrompt);
  form.append('width', String(width));
  form.append('height', String(height));
  form.append('guidance', '4');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 115000);
  try {
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/@cf/black-forest-labs/flux-2-klein-9b`;
    const cloudflare = await fetch(endpoint, {
      method: 'POST',
      headers: {Authorization: `Bearer ${apiToken}`},
      body: form,
      signal: controller.signal
    });
    const data = await cloudflare.json();
    if (!cloudflare.ok || data.success === false) {
      const message = data?.errors?.[0]?.message || data?.error || 'Cloudflare не успя да генерира изображение.';
      return res.status(cloudflare.status || 502).json({error: message});
    }

    const base64 = data?.result?.image || data?.image;
    if (!base64) return res.status(502).json({error: 'Cloudflare FLUX не върна изображение.'});
    const buffer = Buffer.from(base64, 'base64');
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(500).json({error: error.name === 'AbortError' ? 'FLUX отговори твърде бавно. Опитай отново.' : 'Временна грешка при връзката с Cloudflare AI.'});
  } finally {
    clearTimeout(timeout);
  }
}
