-- FOSS Mavelli Hunt - seed (PLACEHOLDER content, replace before the event)
-- Idempotent: safe to re-run. Run AFTER schema.db.
--
-- Day 1 mechanic: every sighting points teams at a Mapillary view and shows
-- a modified copy of the image on the site. The answer word is the ONE word
-- that differs between the two. Replace the mapillary_url, photo_url, words,
-- and clue text with real content before the event.

insert into public.games (id, phase, gate_answer, gate_slots)
values ('11111111-1111-1111-1111-111111111111', 'setup',
  array['NORTH','TEMPLE','CLOCK','BANYAN','THREE'],
  array['Word 1','Word 2','Word 3','Word 4','Word 5'])
on conflict (id) do nothing;

insert into public.locations (id, ord, type, name, token, word, word_clue, photo_url, mapillary_url, clue_text, hint_text) values
  ('s1', 1, 'sighting', 'Sighting 01 - Main Gate', 's1-kappa', 'TEMPLE',
   'A place of entrance and guidance.',
   '/locations/s1-main-gate.jpg',
   '',
   'Maveli was spotted near the main entrance arch of Christ College of Engineering. Scan the QR code located near the main gate.',
   'Check the stone arch pillars near Gate 1.'),
  ('s2', 2, 'sighting', 'Sighting 02 - Cake Farm Cafe', 's2-epsilon', 'NORTH',
   'A direction marker.',
   '/locations/s2-cake-farm.jpg',
   '',
   'Maveli stopped by Cake Farm Cafe courtyard. Find the QR code stationed near the cafe stall.',
   'Look around the cafe seating and ordering counter.'),
  ('s3', 3, 'sighting', 'Sighting 03 - Green Umbrella', 's3-lambda', 'THREE',
   'A key number in the trail.',
   '/locations/s3-umbrella.jpg',
   '',
   'Maveli took shade under the green outdoor umbrella seating. Scan the QR code placed by the umbrella table.',
   'Check the circular umbrella seating area near the garden.'),
  ('s4', 4, 'sighting', 'Sighting 04 - St. Mary''s Block', 's4-sigma', 'BANYAN',
   'Strong rooted foundation.',
   '/locations/s4-st-marys-block.jpg',
   '',
   'Maveli was seen walking across the courtyard toward St. Mary''s Block. Locate the QR code near the building entrance.',
   'Look near the front portico pillars of St. Mary''s Block.'),
  ('s5', 5, 'sighting', 'Sighting 05 - Techies Park', 's5-tau', 'CLOCK',
   'Time is ticking to find the king.',
   '/locations/s5-techies-park.jpg',
   '',
   'The final sighting was at Techies Park. Scan the QR code on the signboard to decrypt the last sighting.',
   'Check the green Techies Park board beside the walkway.'),
  ('sos', 6, 'sos', 'Emergency Transmission', 'sos-delta', '', '',
   '', '',
   'Search this block. Somewhere inside it, Maveli''s emergency signal is broadcasting. Find the transmission poster and scan the code on it.',
   'Check the notice boards near the stairwells.'),
  ('fin', 7, 'final', 'Final Sanctuary', 'fin-omega', '', '',
   '', '',
   'This is where Maveli is hiding. Reconstruct the instruction from the five words you collected and prove it at the gate.', '')
on conflict (id) do update
  set name = excluded.name, word = excluded.word, word_clue = excluded.word_clue,
      photo_url = excluded.photo_url, mapillary_url = excluded.mapillary_url,
      clue_text = excluded.clue_text, hint_text = excluded.hint_text;

insert into public.settings (id, volunteer_phone, volunteer_whatsapp, instagram_url, bitchat_guide, bitchat_code, admin_code, sos_lock_seconds, mapillary_note)
values (1,
  '+91 00000 00000',
  'https://wa.me/910000000000',
  'https://instagram.com',
  'Mavelli has been broadcasting on BitChat. Open the BitChat app, find the account named in the SOS, and read the latest message. It contains a code. Enter that code here.',
  'MERIDIAN',
  'FOSSCCE@MaveliFiles',
  4,
  'Open Mapillary (app or mapillary.com) and find the view for this spot. Compare it with the photo on this site and type the one word that differs.')
on conflict (id) do update
  set volunteer_phone = excluded.volunteer_phone, volunteer_whatsapp = excluded.volunteer_whatsapp,
      instagram_url = excluded.instagram_url, bitchat_guide = excluded.bitchat_guide,
      bitchat_code = excluded.bitchat_code, admin_code = excluded.admin_code,
      sos_lock_seconds = excluded.sos_lock_seconds, mapillary_note = excluded.mapillary_note;
