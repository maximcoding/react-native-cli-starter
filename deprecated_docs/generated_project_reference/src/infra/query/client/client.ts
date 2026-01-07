// src/infra/query/client/client.ts
import { createQueryClient } from './query-client';

// ✅ One QueryClient for the whole app lifetime
export const queryClient = createQueryClient();
