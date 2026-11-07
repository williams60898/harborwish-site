CREATE TABLE IF NOT EXISTS daily_animal_counts (
  day TEXT NOT NULL,
  animal TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, animal)
);
