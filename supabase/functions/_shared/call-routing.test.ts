import { decideRoute, renderResponse, type RoutingConfig } from './call-routing.ts'
const config: RoutingConfig = {default_destination:'default',unknown_destination:'unknown',student_destination:'student',sales_destination:'sales',webinar_destination:'webinar',after_hours_destination:'closed',unavailable_fallback:'fallback',agent_destinations:{'1':'agent1','2':'agent2'},consultation_enabled:true}
function equal(actual: unknown, expected: unknown) { if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${JSON.stringify(actual)} != ${JSON.stringify(expected)}`) }
Deno.test('priority support then consultation then assignment',()=>{
 equal(decideRoute({openSupportAgentId:1,activeConsultationAgentId:2},config).destination,'agent1')
 equal(decideRoute({activeConsultationAgentId:2,assignedAgentId:1},config).destination,'agent2')
 equal(decideRoute({assignedAgentId:1},config).destination,'agent1')
})
Deno.test('student webinar unknown and unavailable',()=>{
 equal(decideRoute({isStudent:true},config).destination,'student')
 equal(decideRoute({recentWebinarOrCheckout:true},config).destination,'webinar')
 equal(decideRoute({},config).destination,'unknown')
 equal(decideRoute({assignedAgentId:1,agentAvailability:{'1':false}},config).destination,'fallback')
 equal(decideRoute({assignedAgentId:99},config).destination,'fallback')
})
Deno.test('custom priority and disabled consultation',()=>{
 equal(decideRoute({isStudent:true,assignedAgentId:1},{...config,priority:['student','assigned_agent']}).destination,'student')
 equal(decideRoute({activeConsultationAgentId:2},{...config,consultation_enabled:false}).destination,'unknown')
})
Deno.test('Tehran business hours start inclusive end exclusive',()=>{
 const c = {...config,business_hours:{days:[1],start:'09:00',end:'18:00'}}
 equal(decideRoute({},c,new Date('2025-01-06T05:29:00Z')).destination,'closed')
 equal(decideRoute({},c,new Date('2025-01-06T05:30:00Z')).destination,'unknown')
 equal(decideRoute({},c,new Date('2025-01-06T14:30:00Z')).destination,'closed')
 equal(decideRoute({},c,new Date('2025-01-07T08:00:00Z')).destination,'closed')
})
Deno.test('overnight uses previous business day',()=>{
 const c = {...config,business_hours:{days:[1],start:'22:00',end:'02:00'}}
 equal(decideRoute({},c,new Date('2025-01-06T21:30:00Z')).destination,'unknown')
 equal(decideRoute({},c,new Date('2025-01-07T21:30:00Z')).destination,'closed')
})
Deno.test('response substitution safely preserves JSON strings',()=>{
 equal(renderResponse({to:'{{destination}}'},'a"b'),{to:'a"b'})
})
