export interface CallerFacts {
  isStudent?: boolean
  assignedAgentId?: number | null
  activeConsultationAgentId?: number | null
  recentWebinarOrCheckout?: boolean
  openSupportAgentId?: number | null
  agentAvailability?: Record<string, boolean | { available?: boolean }>
}
export interface RoutingConfig {
  mode?: string
  default_destination?: string
  student_destination?: string
  sales_destination?: string
  webinar_destination?: string
  consultation_enabled?: boolean
  business_hours?: { days: number[]; start: string; end: string }
  after_hours_destination?: string
  unavailable_fallback?: string
  unknown_destination?: string
  priority?: ('support' | 'consultation' | 'assigned_agent' | 'student' | 'webinar')[]
  agent_destinations?: Record<string, string>
  response_template?: unknown
}
export function decideRoute(facts: CallerFacts, config: RoutingConfig, now: Date = new Date()) {
  const result = (destination: string | undefined, rule: string) => ({
    destination: destination || config.default_destination || '', reason: rule, matched_rule: rule,
  })
  const hours = config.business_hours
  if (hours) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tehran', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now)
    const get = (type: string) => parts.find(p => p.type === type)?.value || ''
    const day = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(get('weekday'))
    const time = `${get('hour')}:${get('minute')}`
    const overnight = hours.start > hours.end
    const previous = (day + 6) % 7
    const open = overnight
      ? (hours.days.includes(day) && time >= hours.start) || (hours.days.includes(previous) && time < hours.end)
      : hours.days.includes(day) && time >= hours.start && time < hours.end
    if (!open) return result(config.after_hours_destination, 'after_hours')
  }
  const agent = (id: number | null | undefined, rule: string) => {
    if (id == null) return null
    const available = facts.agentAvailability?.[String(id)]
    if (available === false || (typeof available === 'object' && available.available === false)) return result(config.unavailable_fallback, 'agent_unavailable')
    const destination = config.agent_destinations?.[String(id)]
    return destination ? result(destination, rule) : result(config.unavailable_fallback, 'agent_unmapped')
  }
  for (const rule of config.priority ?? ['support','consultation','assigned_agent','student','webinar']) {
    let choice = null
    if (rule === 'support') choice = agent(facts.openSupportAgentId, rule)
    if (rule === 'consultation' && config.consultation_enabled !== false) choice = agent(facts.activeConsultationAgentId, rule)
    if (rule === 'assigned_agent') choice = agent(facts.assignedAgentId, rule)
    if (rule === 'student' && facts.isStudent) choice = result(config.student_destination, rule)
    if (rule === 'webinar' && facts.recentWebinarOrCheckout) choice = result(config.webinar_destination || config.sales_destination, rule)
    if (choice) return choice
  }
  return result(config.unknown_destination || config.sales_destination, 'unknown')
}
/** Replace placeholders in string values, never in serialized JSON. */
export function renderResponse(template: unknown, destination: string): unknown {
  if (typeof template === 'string') return template.replaceAll('{{destination}}', destination)
  if (Array.isArray(template)) return template.map(v => renderResponse(v, destination))
  if (template && typeof template === 'object') return Object.fromEntries(Object.entries(template).map(([k,v]) => [k, renderResponse(v,destination)]))
  return template
}
