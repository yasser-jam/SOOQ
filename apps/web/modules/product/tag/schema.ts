import * as z from 'zod';

import { requiredString, optionalString } from '@/lib/schema';

export const productTagSchema = z.object({
  id: optionalString(),
  tagName: requiredString("اسم العلامة"),
  slug: requiredString("الاسم المختصر"),
  createdAt: optionalString(),
  updatedAt: optionalString(),
});
  