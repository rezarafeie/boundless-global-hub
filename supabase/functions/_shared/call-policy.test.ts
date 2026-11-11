import { validProcessingStage,requiresAiPermission,tehranFollowupUtc } from './call-policy.ts'
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
Deno.test('unrecognized processing stage cannot fall through to paid analysis',()=>assertEquals(validProcessingStage('arbitrary'),false))
Deno.test('automatic pipeline requires AI permission',()=>assertEquals(requiresAiPermission('auto'),true))
Deno.test('analysis requires AI permission',()=>assertEquals(requiresAiPermission('analysis'),true))
Deno.test('follow-up stores Tehran local time as UTC',()=>assertEquals(tehranFollowupUtc('2026-11-11T15:23'),'2026-11-11T11:53:00.000Z'))