-- ============================================================================
-- FOSS Maveli Hunt - Canonical Database Seed (supabase/seed.sql)
-- ============================================================================
-- Idempotent: safe to re-run. Run AFTER schema.db.
-- This file initializes the game, canonical campus locations, answers,
-- gate sequence, and event settings.
-- ============================================================================

-- Clean up any obsolete location ids from older revisions
delete from public.locations where id not in ('s1', 's2', 's3', 's4', 'sos', 'fin');

insert into public.games (id, phase, gate_answer, gate_slots)
values ('11111111-1111-1111-1111-111111111111', 'setup',
  array['CAKE', 'FARM', '12:13', 'BANYAN'],
  array['Word 1', 'Word 2', 'Word 3', 'Word 4'])
on conflict (id) do update
  set gate_answer = excluded.gate_answer,
      gate_slots = excluded.gate_slots;

insert into public.locations (id, ord, type, name, token, word, word_clue, photo_url, mapillary_url, clue_text, hint_text, mapillary_note) values
  ('s1', 1, 'sighting', 'Sighting 01 - The Arrival (Main Gate)', 's1-kappa', 'CAKE',
   'Sponsor poster difference discovered at the main entrance.',
   '/locations/s1-main-gate.jpg',
   'https://www.mapillary.com/app/?lat=10.354009631796927&lng=76.21246825414289&z=17&pKey=510423848695905&focus=photo&x=0.5065599523580567&y=0.5078155992984406&zoom=0',
   'Maveli remembers entering through the campus main gate. Compare the street-level Mapillary view of the entrance with the website photo to spot what changed, then proceed to that sponsor location to continue the search.',
   'Compare the poster boards near the entrance. One shows the Cake Farm Cafe logo.',
   'Open Mapillary for an interactive 360° capture of the entrance. Compare it with the photo on this site to identify the altered sponsor poster.'),
  ('s2', 2, 'sighting', 'Sighting 02 - Cake Farm Cafe', 's2-epsilon', 'FARM',
   'QR Checkpoint confirmed at Cake Farm Cafe.',
   '/locations/s2-cake-farm.jpg',
   '',
   'Maveli stopped by Cake Farm Cafe courtyard. Find and scan the QR code stationed at Cake Farm Cafe to unlock Maveli''s campus timeline and Instagram channel.',
   'Look around the cafe seating and ordering counter for the QR code sheet.',
   'Scan the QR code on-site at Cake Farm Cafe to unlock Maveli''s Instagram transmission channel.'),
  ('s3', 3, 'sighting', 'Sighting 03 - Christ Cafe', 's3-lambda', '12:13',
   'Disconnection timestamp verified from Maveli''s Instagram transmission.',
   '/locations/s3-umbrella.jpg',
   '',
   'Maveli was last tracked near Christ Cafe before losing connection. Check his Instagram feed (@maveli.thamburan_) to discover the exact disconnection timestamp.',
   'Inspect Maveli''s Instagram posts to find the timestamp of his last transmission.',
   'Enter the exact timestamp (12:13) from Maveli''s Instagram post to verify his disconnection point.'),
  ('s4', 4, 'sighting', 'Sighting 04 - St. Mary''s Block', 's4-sigma', 'BANYAN',
   'Final Day 1 reception checkpoint locked at St. Mary''s Block.',
   '/locations/s4-st-marys-block.jpg',
   '',
   'Maveli was last seen in front of the reception at St. Mary''s Block on his Instagram feed. Find and scan the QR code located in front of the reception to conclude Day 1.',
   'Check the reception counter area inside the St. Mary''s Block entrance portico.',
   'Scan the QR code in front of the St. Mary''s Block reception to lock in Day 1 evidence.'),
  ('sos', 5, 'sos', 'Emergency Transmission', 'sos-delta', '',
   '',
   '',
   '',
   'Search this block. Somewhere inside it, Maveli''s emergency signal is broadcasting. Find the transmission poster and scan the code on it.',
   'Check the notice boards near the stairwells.',
   ''),
  ('fin', 6, 'final', 'Final Sanctuary', 'fin-omega', '',
   '',
   '',
   '',
   'This is where Maveli is hiding. Reconstruct the instruction from the recovered clues and prove it at the gate.',
   '',
   '')
on conflict (id) do update
  set ord = excluded.ord, type = excluded.type, name = excluded.name,
      token = excluded.token, word = excluded.word, word_clue = excluded.word_clue,
      photo_url = excluded.photo_url, mapillary_url = excluded.mapillary_url,
      clue_text = excluded.clue_text, hint_text = excluded.hint_text,
      mapillary_note = excluded.mapillary_note;

insert into public.settings (id, volunteer_phone, volunteer_whatsapp, instagram_url, bitchat_guide, bitchat_code, admin_code, sos_lock_seconds, mapillary_note)
values (1,
  '+91 00000 00000',
  'https://chat.whatsapp.com/FFQ517Asdpv13omB9ArMwv',
  'https://www.instagram.com/maveli.thamburan_?igsh=MWo1ZW5mc3h3bTllOA==&igsi=MWo1ZW5mc3h3bTllOA==',
  'Maveli has been broadcasting on BitChat. Open the BitChat app, find the account named in the SOS, and read the latest message. It contains a code. Enter that code here.',
  'MERIDIAN',
  'FOSSCCE@MaveliFiles',
  4,
  'Open Mapillary for an interactive 360° capture of the entrance. Compare it with the photo on this site to identify the altered sponsor poster.')
on conflict (id) do update
  set volunteer_phone = excluded.volunteer_phone, volunteer_whatsapp = excluded.volunteer_whatsapp,
      instagram_url = excluded.instagram_url, bitchat_guide = excluded.bitchat_guide,
      bitchat_code = excluded.bitchat_code, admin_code = excluded.admin_code,
      sos_lock_seconds = excluded.sos_lock_seconds, mapillary_note = excluded.mapillary_note;

