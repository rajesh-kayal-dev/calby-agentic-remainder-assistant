import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { resolve } from "node:path";

let _memoryStore: LibSQLStore | null = null;

export function getMemoryStore(): LibSQLStore {
  if (!_memoryStore) {
    const dbPath = resolve(process.cwd(), "mastra.db");
    _memoryStore = new LibSQLStore({
      id: "meeting-assistant-memory",
      url: `file:${dbPath}`,
    });
  }
  return _memoryStore;
}

export function createAgentMemory(): Memory {
  return new Memory({
    storage: getMemoryStore(),
    options: {
      lastMessages: 20,
      workingMemory: {
        enabled: true,
        scope: "resource",
        template: `# Meeting preferences
- Timezone:
- Default meeting length (minutes):
- Preferred meeting hours:
- Usual invitees:
- Notes:
`,
      },
    },
  });
}

