import { NextRequest, NextResponse } from 'next/server'

const N8N_URL = process.env.N8N_WEBHOOK_ONBOARD

interface KBJson {
  niche?: string
  services?: string[]
  hero_headline?: string
  brand_color_hint?: string
}

interface DemoData {
  business_name?: string
  brand_color?: string
  kb_json?: KBJson
  id?: string
  el_agent_id?: string
  scraped_by?: string
}

function extractMeta(html: string, name: string, isOG = false): string {
  const attr = isOG ? 'property' : 'name'
  const re1 = new RegExp(`<meta[^>]+${attr}=["']${name}["'][^>]+content=["']([^"']{1,400})["']`, 'i')
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']{1,400})["'][^>]+${attr}=["']${name}["']`, 'i')
  return (html.match(re1) || html.match(re2) || [])[1]?.trim() ?? ''
}

function extractTag(html: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  return (html.match(re) || [])[1]?.replace(/<[^>]+>/g, '').trim() ?? ''
}

const NICHES: [RegExp, string][] = [
  [/dental|dentist|orthodont/i,                   'Dental Practice'],
  [/law\s*firm|attorney|legal\s*service|lawyer/i, 'Law Firm'],
  [/restaurant|cafe|dining|bistro|eatery/i,        'Restaurant'],
  [/salon|hair\s*cut|beauty\s*spa|nail\s*studio/i, 'Beauty & Spa'],
  [/real\s*estate|realtor|property\s*agent/i,      'Real Estate'],
  [/medical\s*clinic|health\s*care|doctor|physician/i, 'Medical Practice'],
  [/gym|fitness\s*center|yoga|personal\s*train/i,  'Fitness Studio'],
  [/plumb|hvac|electrician|contractor|roofing/i,   'Home Services'],
  [/accounting|cpa|tax\s*prep|bookkeeping/i,       'Accounting'],
  [/insurance\s*agency/i,                          'Insurance'],
  [/digital\s*marketing|seo\s*agency|marketing\s*agency/i, 'Digital Agency'],
  [/ecommerce|online\s*store|shopify/i,            'eCommerce'],
  [/consult|coach|mentor/i,                        'Consulting'],
]

async function scrapeUrl(rawUrl: string): Promise<DemoData> {
  let targetUrl = rawUrl
  if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()

    // ── Metadata extraction ────────────────────────────────────────────
    const title      = extractTag(html, 'title')
    const desc       = extractMeta(html, 'description')
    const ogTitle    = extractMeta(html, 'og:title', true)
    const ogDesc     = extractMeta(html, 'og:description', true)
    const themeColor = extractMeta(html, 'theme-color')

    // ── Headings ──────────────────────────────────────────────────────
    const allH1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)]
      .map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
    const allH2 = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
      .map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
    const allH3 = [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)]
      .map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean)

    // ── Business name ─────────────────────────────────────────────────
    let bizName = (ogTitle || title || '').replace(/\s*[-|–—]\s*.+$/, '').trim()
    if (!bizName || bizName.length < 2) {
      try { bizName = new URL(targetUrl).hostname.replace(/^www\./, '') } catch {}
    }

    // ── Niche detection ──────────────────────────────────────────────
    const corpus = [title, desc, ogDesc, ...allH1, ...allH2].join(' ')
    let niche = 'Business'
    for (const [re, label] of NICHES) {
      if (re.test(corpus)) { niche = label; break }
    }

    // ── Services (from H2/H3) ─────────────────────────────────────────
    const SKIP = /copyright|privacy|terms|faq|contact|about\s*us|^home$|nav|menu|sign\s*in|login|register|back|next|click|read\s*more/i
    const services = [...allH2, ...allH3]
      .filter(s => s.length > 3 && s.length < 80 && !SKIP.test(s))
      .slice(0, 6)

    // ── Hero headline ─────────────────────────────────────────────────
    const heroHeadline = (allH1[0] || ogTitle || title || '').slice(0, 120)

    // ── Brand color ───────────────────────────────────────────────────
    let brandColor = themeColor
    if (!brandColor || !brandColor.startsWith('#')) {
      // Try CSS color properties in style blocks
      const styleBlocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join(' ')
      const hexMatch = styleBlocks.match(/(?:--primary|--brand|--accent|--color-primary|background)[^;]*?:\s*(#[0-9a-fA-F]{6})\b/)
      brandColor = hexMatch ? hexMatch[1] : ''
    }

    return {
      business_name: bizName,
      brand_color: brandColor || '',
      scraped_by: 'built-in',
      kb_json: {
        niche,
        services,
        hero_headline: heroHeadline,
        brand_color_hint: brandColor || '',
      },
    }
  } finally {
    clearTimeout(timeout)
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { url } = body as { url?: string }

  // ── Try n8n first ─────────────────────────────────────────────────
  if (N8N_URL) {
    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      })
      if (res.ok) {
        const data = await res.json() as DemoData
        // Only use n8n response if it has meaningful content
        if (data && (data.business_name || data.kb_json?.services?.length)) {
          return NextResponse.json(data, { status: 200 })
        }
      }
    } catch (err) {
      console.warn('[onboard] n8n unreachable, falling back to built-in scraper:', err)
    }
  }

  // ── Built-in scraper fallback ─────────────────────────────────────
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    const scraped = await scrapeUrl(url)
    return NextResponse.json(scraped, { status: 200 })
  } catch (err) {
    console.error('[onboard] built-in scraper error:', err)
    // Return minimal shell so the demo still renders
    let fallbackName = ''
    try { fallbackName = new URL(url.startsWith('http') ? url : 'https://' + url).hostname.replace(/^www\./, '') } catch {}
    return NextResponse.json({
      business_name: fallbackName || 'Your Business',
      brand_color: '',
      scraped_by: 'fallback',
      kb_json: { niche: 'Business', services: [], hero_headline: '', brand_color_hint: '' },
    }, { status: 200 })
  }
}
