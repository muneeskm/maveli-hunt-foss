-- FOSS Mavelli Hunt - seed (PLACEHOLDER content, replace before the event)

insert into public.games (id, phase, gate_answer, gate_slots)
values ('11111111-1111-1111-1111-111111111111', 'setup',
  array['NORTH','TEMPLE','CLOCK','BANYAN','THREE'],
  array['Word 1','Word 2','Word 3','Word 4','Word 5'])
on conflict (id) do nothing;

insert into public.locations (id, ord, type, name, token, word, word_clue, photo_url, clue_text, hint_text) values
  ('s1', 1, 'sighting', 'Sighting 01 - The Mapillary View', 's1-kappa', 'TEMPLE',
   'A place of worship. He is not inside it, but near it.',
   'https://picsum.photos/seed/mavelli-sighting-1/1200/900',
   'Mavelli was last seen somewhere around the campus. The only image we recovered is a Mapillary street view. Open the Mapillary app or website, find this exact view, and identify the landmark it shows. That is where evidence marker 01 is waiting.',
   'Look for a tall landmark with a distinctive shape. The Mapillary view was captured from a road on the east side of the campus.'),
  ('s2', 2, 'sighting', 'Sighting 02', 's2-epsilon', 'NORTH',
   'A direction. Check a compass before you move on.',
   'https://picsum.photos/seed/mavelli-sighting-2/1200/900',
   'Mavelli was seen here carrying a small compass. He kept glancing at the needle and muttering about which way to go next.',
   'The building on the left faces north. Look at the wall clock''s shadow.'),
  ('s3', 3, 'sighting', 'Sighting 03', 's3-lambda', 'THREE',
   'A small number. Count your steps from the landmark.',
   'https://picsum.photos/seed/mavelli-sighting-3/1200/900',
   'A student saw Mavelli here counting out loud. Three of something, then a pause, then three again. He seemed to be measuring.',
   'Count the arches. Then count the benches in the shade.'),
  ('s4', 4, 'sighting', 'Sighting 04', 's4-sigma', 'BANYAN',
   'A tree with hanging roots. It shades the courtyard.',
   'https://picsum.photos/seed/mavelli-sighting-4/1200/900',
   'Mavelli was seen resting in the shade of an old tree. The gardener says he spoke to it like an old friend.',
   'Look for the oldest tree on campus. It has more roots than branches.'),
  ('s5', 5, 'sighting', 'Sighting 05', 's5-tau', 'CLOCK',
   'It tells time. It stands tall near the entrance.',
   'https://picsum.photos/seed/mavelli-sighting-5/1200/900',
   'The last sighting. Mavelli stood in front of this landmark for a long time, checked his watch against it, and then walked away into the dark.',
   'It chimes every hour, and it faces the main gate.'),
  ('sos', 6, 'sos', 'Emergency Transmission', 'sos-delta', '', '',
   '', 'Search this block. Somewhere inside it, Mavelli''s emergency signal is broadcasting. Find the transmission poster and scan the code on it.',
   'Check the notice boards near the stairwells.'),
  ('fin', 7, 'final', 'Final Location', 'fin-omega', '', '',
   '', 'This is where Mavelli is hiding. Reconstruct the instruction from the five words you collected and prove it at the gate.', '')
on conflict (id) do nothing;

insert into public.settings (id, volunteer_phone, volunteer_whatsapp, instagram_url, bitchat_guide, bitchat_code, admin_code, sos_lock_seconds, mapillary_note)
values (1,
  '+91 00000 00000',
  'https://wa.me/910000000000',
  'https://instagram.com',
  'Mavelli has been broadcasting on BitChat. Open the BitChat app, find the account named in the SOS, and read the latest message. It contains a code. Enter that code here.',
  'MERIDIAN',
  'mavelli-admin',
  4,
  'Open Mapillary (app or mapillary.com), search this campus, and find the view that matches the photo above.')
on conflict (id) do nothing;
