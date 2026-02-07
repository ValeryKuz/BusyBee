import { supabase } from '../lib/supabase';
import { getLocalDate } from '../utils/dateUtils';

const getFamilyId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
};

export const fetchChildren = async () => {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

export const addChild = async (name, avatar, birthday = null) => {
  const familyId = await getFamilyId();
  const { data, error } = await supabase
    .from('children')
    .insert([{ name, avatar, birthday, family_id: familyId }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateChild = async (id, updates) => {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
  if (updates.birthday !== undefined) dbUpdates.birthday = updates.birthday;

  const { data, error } = await supabase
    .from('children')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteChild = async (id) => {
  const { error } = await supabase
    .from('children')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const fetchEntries = async () => {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const addEntry = async (childId, type, icon, date = null, note = '', honey = 0) => {
  const familyId = await getFamilyId();
  const entryDate = date || getLocalDate();
  const { data, error } = await supabase
    .from('entries')
    .insert([{
      child_id: childId,
      entry_date: entryDate,
      type,
      icon,
      note,
      honey,
      family_id: familyId
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateEntry = async (id, updates) => {
  const dbUpdates = {};
  if (updates.type !== undefined) dbUpdates.type = updates.type;
  if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
  if (updates.note !== undefined) dbUpdates.note = updates.note;
  if (updates.honey !== undefined) dbUpdates.honey = updates.honey;
  if (updates.date !== undefined) dbUpdates.entry_date = updates.date;

  const { data, error } = await supabase
    .from('entries')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteEntry = async (id) => {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const getChildHoneyForDate = async (childId, date) => {
  const { data, error } = await supabase
    .from('entries')
    .select('honey')
    .eq('child_id', childId)
    .eq('entry_date', date);
  
  if (error) throw error;
  return (data || []).reduce((sum, entry) => sum + entry.honey, 0);
};

export const getChildTodayHoney = async (childId) => {
  return getChildHoneyForDate(childId, getLocalDate());
};

export const getChildTotalHoney = async (childId) => {
  const { data, error } = await supabase
    .from('entries')
    .select('honey')
    .eq('child_id', childId);
  
  if (error) throw error;
  return (data || []).reduce((sum, entry) => sum + entry.honey, 0);
};

export const fetchEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

export const addEvent = async (title, date, icon, note = '') => {
  const familyId = await getFamilyId();
  const { data, error } = await supabase
    .from('events')
    .insert([{
      title,
      event_date: date,
      icon,
      note,
      family_id: familyId
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateEvent = async (id, updates) => {
  const dbUpdates = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.date !== undefined) dbUpdates.event_date = updates.date;
  if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
  if (updates.note !== undefined) dbUpdates.note = updates.note;

  const { data, error } = await supabase
    .from('events')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteEvent = async (id) => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const getSetting = async (key) => {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  
  if (error) throw error;
  return data?.value || null;
};

export const setSetting = async (key, value) => {
  const familyId = await getFamilyId();
  const { data, error } = await supabase
    .from('settings')
    .upsert({ key, value, family_id: familyId }, { onConflict: 'key,family_id' })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};
