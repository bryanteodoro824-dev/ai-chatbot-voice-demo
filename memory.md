# Bryan's Claude Code Memory

## Identity & Business
- Name: Bryan
- Business: BryanTech Systems (bryantechsystems.com)
- Location: Philippines (UTC+8)
- Role: AI Automation Specialist & Agency Owner

## Active Stack
- **n8n**: Self-hosted at bryantechautomation.seltechai.com
- **CRM**: GoHighLevel (GHL) — Admin Specialist level
- **Voice**: Vapi.ai + ElevenLabs
- **Database**: Supabase (Postgres + Edge Functions)
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Comms**: Twilio (SMS/Voice)

## n8n Patterns & Conventions
- HTTP Request nodes: always use **Raw body** mode
- Expression syntax for Claude API calls: `{{ JSON.stringify({...}) }}`
- Code nodes: sanitize email/input content before passing to HTTP nodes
- Timezone: always use `Asia/Singapore` (not UTC+8 label)
- Gmail OAuth: Testing mode, explicit test user, match redirect URI exactly

## Anthropic API Required Headers
```json
{
  "x-api-key": "...",
  "anthropic-version": "2023-06-01",
  "content-type": "application/json"
}
```

## Active Projects
- **BryanTech Systems**: Full agency demo pipeline (n8n + GHL + Vapi + Supabase + ElevenLabs)
- **Wainwright Facades**: Email inbox automation via n8n (workflows built, pending client handover)

## Credentials Style
- Never hardcode API keys in workflows — use n8n credentials manager
- GHL API calls via HTTP Request node (not native GHL node)

## Communication Preferences
- Direct and technical — skip the fluff
- Lean Six Sigma mindset: structured, documented, repeatable
- Apple-standard documentation quality when writing client-facing content
