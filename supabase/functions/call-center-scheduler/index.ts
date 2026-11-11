import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { admin, invokeFn, getSettings, json } from '../_shared/callcenter.ts'

// Public requests can wake only work already authorized by the database timer.
// They cannot enqueue work, change its type, supply call IDs, or bypass settings.
Deno.serve(async req => {
  if(req.method==='OPTIONS') return new Response('ok',{headers:corsHeaders})
  if(req.method!=='POST') return json({error:'Method not allowed'},405,corsHeaders)
  const {data:job,error}=await admin.rpc('callcenter_claim_scheduled_job')
  if(error) return json({success:false,error:'Scheduler claim failed'},500,corsHeaders)
  if(!job?.length) return json({success:true,idle:true},200,corsHeaders)
  const task=job[0]
  const run=async()=>{
    try{
      const settings=await getSettings()
      const enabled=settings.enabled && (task.kind==='sync'?settings.auto_sync_enabled:task.kind==='recording'?settings.recording_sync_enabled:task.kind==='transcript'?settings.transcription_enabled:task.kind==='analysis'?settings.ai_analysis_enabled:true)
      let outcome:any={skipped:!enabled}
      if(enabled){
        const targets:Record<string,string>={sync:'sync-daftareshoma-calls',recording:'process-call-recording',transcript:'transcribe-call',analysis:'analyze-call',followups:'process-call-automations',attribution:'call-attribution'}
        if(task.kind==='events'){
          const {data:events,error}=await admin.from('call_events').select('id').eq('status','failed').order('received_at').limit(2)
          if(error) throw new Error(error.message)
          for(const e of events??[]) await invokeFn('daftareshoma-webhook',{retryEventId:e.id})
          outcome={processed:events?.length??0}
        }else{
          const target=targets[task.kind]
          if(!target) throw new Error('Unsupported scheduled task')
          const response=await invokeFn(target,{pending:['recording','transcript','analysis'].includes(task.kind)})
          outcome=await response.json()
          if(outcome.success===false) throw new Error(outcome.error||'Processing failed')
        }
      }
      const {error}=await admin.from('call_center_jobs').update({status:'completed',finished_at:new Date().toISOString(),result:outcome,error:null}).eq('id',task.id)
      if(error) throw new Error(error.message)
    }catch(e){await admin.from('call_center_jobs').update({status:'failed',finished_at:new Date().toISOString(),error:(e as Error).message}).eq('id',task.id)}
  }
  EdgeRuntime.waitUntil(run())
  return json({success:true,accepted:true},202,corsHeaders)
})