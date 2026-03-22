export function createMigrationGate(migrate: () => Promise<void>) {
  let migrationPromise: Promise<void> | null = null

  return async function ensureReady() {
    if (!migrationPromise) {
      migrationPromise = migrate()
    }
    await migrationPromise
  }
}
