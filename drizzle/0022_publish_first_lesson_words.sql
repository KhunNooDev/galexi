UPDATE "words"
SET
  "is_public" = true,
  "updated_at" = now()
WHERE
  (lower("word"), lower("part_of_speech")) IN (
    ('accomplish', 'verb'),
    ('curious', 'adjective'),
    ('improve', 'verb'),
    ('opportunity', 'noun'),
    ('reliable', 'adjective'),
    ('essential', 'adjective')
  );
