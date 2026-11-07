// Anonymous daily counts: (UTC day, animal slug) → count. Nothing else is stored.

/** The part of the D1 binding this module uses. */
interface D1Like {
  prepare(sql: string): { bind(...values: unknown[]): { run(): Promise<unknown> } };
}

export interface StatsEnv {
  DB?: D1Like;
}

export const utcDay = (d = new Date()) => d.toISOString().slice(0, 10);

export async function recordAnimal(env: StatsEnv, animal: string): Promise<void> {
  if (!env.DB) return;
  try {
    await env.DB.prepare(
      'INSERT INTO daily_animal_counts (day, animal, count) VALUES (?1, ?2, 1) ' +
        'ON CONFLICT(day, animal) DO UPDATE SET count = count + 1',
    )
      .bind(utcDay(), animal)
      .run();
  } catch {
    console.error('stats write failed');
  }
}
