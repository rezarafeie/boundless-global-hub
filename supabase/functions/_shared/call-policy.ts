export function validProcessingStage(stage: unknown): stage is 'auto'|'recording'|'transcript'|'analysis' {
  return ['auto','recording','transcript','analysis'].includes(String(stage))
}
export function requiresAiPermission(stage: string) { return stage==='analysis'||stage==='auto' }
export function tehranFollowupUtc(value:string) { return new Date(`${value}:00+03:30`).toISOString() }