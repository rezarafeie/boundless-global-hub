import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting user email cleanup process...');

    // Step 1: Set empty emails to NULL
    const { data: emptyEmailUsers, error: emptyEmailError } = await supabase
      .from('chat_users')
      .update({ email: null })
      .eq('email', '')
      .select('id, name, phone');

    if (emptyEmailError) {
      console.error('Error setting empty emails to NULL:', emptyEmailError);
      throw emptyEmailError;
    }

    console.log(`Set ${emptyEmailUsers?.length || 0} empty emails to NULL`);

    // Step 2: Find and merge duplicate users with same phone but different email status
    const { data: duplicatePhones, error: duplicateError } = await supabase
      .from('chat_users')
      .select('phone')
      .not('phone', 'eq', '')
      .group('phone')
      .having('count(*) > 1');

    console.log('Found duplicate phones:', duplicatePhones?.length || 0);

    // Step 3: For each duplicate phone, prioritize user with email
    for (const phoneGroup of duplicatePhones || []) {
      const { data: usersWithSamePhone, error: fetchError } = await supabase
        .from('chat_users')
        .select('*')
        .eq('phone', phoneGroup.phone)
        .order('email', { ascending: false, nullsLast: true });

      if (fetchError || !usersWithSamePhone || usersWithSamePhone.length < 2) {
        continue;
      }

      console.log(`Processing ${usersWithSamePhone.length} users with phone: ${phoneGroup.phone}`);

      // Keep the user with email (first in the ordered list)
      const userToKeep = usersWithSamePhone[0];
      const usersToMerge = usersWithSamePhone.slice(1);

      console.log(`Keeping user ${userToKeep.id} (${userToKeep.email || 'no email'})`);

      // Update messages to point to the user we're keeping
      for (const userToMerge of usersToMerge) {
        console.log(`Merging user ${userToMerge.id} into ${userToKeep.id}`);

        // Update messages where this user is sender
        await supabase
          .from('messenger_messages')
          .update({ sender_id: userToKeep.id })
          .eq('sender_id', userToMerge.id);

        // Update messages where this user is recipient
        await supabase
          .from('messenger_messages')
          .update({ recipient_id: userToKeep.id })
          .eq('recipient_id', userToMerge.id);

        // Update private conversations
        await supabase
          .from('private_conversations')
          .update({ user1_id: userToKeep.id })
          .eq('user1_id', userToMerge.id);

        await supabase
          .from('private_conversations')
          .update({ user2_id: userToKeep.id })
          .eq('user2_id', userToMerge.id);

        // Update support conversations
        await supabase
          .from('support_conversations')
          .update({ user_id: userToKeep.id })
          .eq('user_id', userToMerge.id);

        // Update user sessions
        await supabase
          .from('user_sessions')
          .update({ user_id: userToKeep.id })
          .eq('user_id', userToMerge.id);

        // Delete the duplicate user
        await supabase
          .from('chat_users')
          .delete()
          .eq('id', userToMerge.id);

        console.log(`Deleted duplicate user ${userToMerge.id}`);
      }
    }

    // Step 4: Clean up any remaining empty or invalid emails
    const { data: invalidEmails, error: invalidError } = await supabase
      .from('chat_users')
      .update({ email: null })
      .or('email.eq.,email.is.null')
      .select('id, name, phone');

    console.log('Cleanup completed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'User email cleanup completed',
      emptyEmailsFixed: emptyEmailUsers?.length || 0,
      duplicatePhonesProcessed: duplicatePhones?.length || 0,
      invalidEmailsFixed: invalidEmails?.length || 0
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in user email cleanup:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
};

serve(handler);
