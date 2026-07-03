const ALLOWED_RATIOS = new Set(['1:1', '4:5', '9:16', '16:9']);
const STYLES = {
  advertising: 'high-end commercial advertising photography, polished art direction, realistic lighting',
  minimal: 'minimalist premium design, clean composition, elegant negative space',
  premium: 'luxury editorial advertising, sophisticated materials, dramatic refined lighting',
  cinematic: 'cinematic commercial scene, rich contrast, atmospheric lighting, highly detailed',
  illustration: 'modern editorial illustration, bold shapes, refined color palette, professional advertising design'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error: 'Позволени са само POST заявки.'});
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({error: 'GEMINI_API_KEY не е настроен във Vercel.'});
  const requiredCode = process.env.APP_ACCESS_CODE;
  if (requiredCode && req.headers['x-access-code'] !== requiredCode) return res.status(401).json({error: 'Невалиден код за достъп.'});

  const {prompt, headline = '', aspectRatio = '1:1', style = 'advertising'} = req.body || {};
  if (typeof prompt !== 'string' || prompt.trim().length < 5) return res.status(400).json({error: 'Добави по-подробно описание.'});
  if (prompt.length > 1800 || String(headline).length > 100) return res.status(400).json({error: 'Описанието е прекалено дълго.'});
  const ratio = ALLOWED_RATIOS.has(aspectRatio) ? aspectRatio : '1:1';
  const fullPrompt = [prompt.trim(), `Visual style: ${STYLES[style] || STYLES.advertising}.`, 'Create a finished social media advertising visual with a strong focal point and professional composition.', headline ? `Include exactly this Bulgarian headline, clearly legible and correctly spelled: "${String(headline).trim()}".` : 'Do not add any text, logos, signatures or watermarks.'].join(' ');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 115000);
  try {
    const gemini = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST', headers: {'Content-Type':'application/json', 'x-goog-api-key':apiKey},
      body: JSON.stringify({model:'gemini-3.1-flash-image', input:fullPrompt, response_format:{type:'image', mime_type:'image/png', aspect_ratio:ratio, image_size:'1K'}}), signal: controller.signal
    });
    const data = await gemini.json();
    if (!gemini.ok) return res.status(gemini.status).json({error:data?.error?.message || 'Gemini не успя да генерира изображение.'});
    let image = data.output_image;
    if (!image?.data) for (const step of data.steps || []) { const found=(step.content || []).find(item=>item.type==='image' && item.data); if(found) image=found; }
    if (!image?.data) return res.status(502).json({error:'Gemini не върна изображение.'});
    const buffer = Buffer.from(image.data, 'base64');
    res.setHeader('Content-Type', image.mime_type || image.mimeType || 'image/png');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(500).json({error:error.name === 'AbortError' ? 'Gemini отговори твърде бавно. Опитай отново.' : 'Временна грешка при връзката с Gemini.'});
  } finally { clearTimeout(timeout); }
}
