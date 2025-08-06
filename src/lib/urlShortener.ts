import { supabase } from "@/integrations/supabase/client";

export interface ShortLink {
  id: string;
  slug: string;
  original_url: string;
  title?: string;
  clicks: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ShortLinkInsert {
  slug?: string;
  original_url: string;
  title?: string;
  created_by?: string;
}

// Base-52 alphabet: a-z (26) + A-Z (26) = 52 characters
const BASE52_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Generate base-52 short code from a number
 */
export function generateBase52Code(num: number): string {
  if (num === 0) return BASE52_ALPHABET[0];
  
  let result = '';
  while (num > 0) {
    result = BASE52_ALPHABET[num % 52] + result;
    num = Math.floor(num / 52);
  }
  return result;
}

/**
 * Get the next available short code
 */
export async function getNextShortCode(): Promise<string> {
  const { data: existingLinks, error } = await supabase
    .from('short_links')
    .select('slug')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching existing links:', error);
    return generateBase52Code(0);
  }

  // Find the next available code by checking sequence
  let counter = 0;
  while (true) {
    const candidateCode = generateBase52Code(counter);
    const exists = existingLinks?.some(link => link.slug === candidateCode);
    if (!exists) {
      return candidateCode;
    }
    counter++;
  }
}

/**
 * Create a short link
 */
export async function createShortLink(data: ShortLinkInsert): Promise<ShortLink | null> {
  try {
    // If no slug provided, generate one
    const slug = data.slug || await getNextShortCode();

    const { data: result, error } = await supabase
      .from('short_links')
      .insert({
        slug,
        original_url: data.original_url,
        title: data.title,
        created_by: data.created_by,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating short link:', error);
      return null;
    }

    return result;
  } catch (error) {
    console.error('Error in createShortLink:', error);
    return null;
  }
}

/**
 * Get all short links
 */
export async function getAllShortLinks(): Promise<ShortLink[]> {
  const { data, error } = await supabase
    .from('short_links')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching short links:', error);
    return [];
  }

  return data || [];
}

/**
 * Get short link by slug
 */
export async function getShortLinkBySlug(slug: string): Promise<ShortLink | null> {
  const { data, error } = await supabase
    .from('short_links')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching short link:', error);
    return null;
  }

  return data;
}

/**
 * Update short link
 */
export async function updateShortLink(id: string, updates: Partial<ShortLinkInsert>): Promise<ShortLink | null> {
  const { data, error } = await supabase
    .from('short_links')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating short link:', error);
    return null;
  }

  return data;
}

/**
 * Delete short link
 */
export async function deleteShortLink(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('short_links')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting short link:', error);
    return false;
  }

  return true;
}

/**
 * Increment click count
 */
export async function incrementClickCount(slug: string): Promise<void> {
  const { error } = await supabase.rpc('increment_short_link_clicks', {
    link_slug: slug
  });

  if (error) {
    console.error('Error incrementing click count:', error);
  }
}