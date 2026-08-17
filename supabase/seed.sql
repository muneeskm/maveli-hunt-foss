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
  ('s1', 1, 'sighting', 'Sighting 01 - The Main Gate', 's1-kappa', 'TEMPLE',
   'A place of worship. He is not inside it, but near it.',
   'https://picsum.photos/seed/mavelli-website-1/1200/900',
   'https://www.mapillary.com/app/?pKey=REPLACE_WITH_REAL_VIEW_1',
   'Mavelli was last seen near the main gate. Open the Mapillary view of this spot, then compare it with the photo on this site. One word has been changed. Type the word that differs to recover the evidence.',
   'Look at the signage in the photo. One word on the board is different from the Mapillary capture.'),
  ('s2', 2, 'sighting', 'Sighting 02 - The Compass Corner', 's2-epsilon', 'NORTH',
   'A direction. Check a compass before you move on.',
   'https://picsum.photos/seed/mavelli-website-2/1200/900',
   'https://www.mapillary.com/app/?pKey=REPLACE_WITH_REAL_VIEW_2',
   'Mavelli was seen here carrying a small compass. Open the Mapillary view of this spot and compare it with the photo here. One word has been changed. Type it to recover the evidence.',
   'The direction marker on the wall differs between the two images.'),
  ('s3', 3, 'sighting', 'Sighting 03 - The Arches', 's3-lambda', 'THREE',
   'A small number. Count your steps from the landmark.',
   'https://picsum.photos/seed/mavelli-website-3/1200/900',
   'https://www.mapillary.com/app/?pKey=REPLACE_WITH_REAL_VIEW_3',
   'A student saw Mavelli here counting out loud. Open the Mapillary view and compare it with the photo here. One word has been changed. Type it to recover the evidence.',
   'The plaque under the arches has one extra word on this site.'),
  ('s4', 4, 'sighting', 'Sighting 04 - The Old Tree', 's4-sigma', 'BANYAN',
   'A tree with hanging roots. It shades the courtyard.',
   'https://picsum.photos/seed/mavelli-website-4/1200/900',
   'https://www.mapillary.com/app/?pKey=REPLACE_WITH_REAL_VIEW_4',
   'Mavelli was seen resting in the shade of an old tree. Open the Mapillary view and compare it with the photo here. One word has been changed. Type it to recover the evidence.',
   'The board beside the tree names the species differently in the two images.'),
  ('s5', 5, 'sighting', 'Sighting 05 - The Clock Tower', 's5-tau', 'CLOCK',
   'It tells time. It stands tall near the entrance.',
   'https://picsum.photos/seed/mavelli-website-5/1200/900',
   'https://www.mapillary.com/app/?pKey=REPLACE_WITH_REAL_VIEW_5',
   'The last sighting. Mavelli stood in front of this landmark for a long time, checking his watch against it. Open the Mapillary view and compare it with the photo here. One word has been changed. Type it to recover the final evidence.',
   'The inscription at the base of the tower differs by one word.'),
  ('sos', 6, 'sos', 'Emergency Transmission', 'sos-delta', '', '',
   '', '',
   'Search this block. Somewhere inside it, Mavelli''s emergency signal is broadcasting. Find the transmission poster and scan the code on it.',
   'Check the notice boards near the stairwells.'),
  ('fin', 7, 'final', 'Final Location', 'fin-omega', '', '',
   '', '',
   'This is where Mavelli is hiding. Reconstruct the instruction from the five words you collected and prove it at the gate.', '')
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
  'mavelli-admin',
  4,
  'Open Mapillary (app or mapillary.com) and find the view for this spot. Compare it with the photo on this site and type the one word that differs.')
on conflict (id) do update
  set volunteer_phone = excluded.volunteer_phone, volunteer_whatsapp = excluded.volunteer_whatsapp,
      instagram_url = excluded.instagram_url, bitchat_guide = excluded.bitchat_guide,
      bitchat_code = excluded.bitchat_code, admin_code = excluded.admin_code,
      sos_lock_seconds = excluded.sos_lock_seconds, mapillary_note = excluded.mapillary_note;
