/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as referralReward } from './referral-reward.tsx'
import { template as dataDeletionWarning } from './data-deletion-warning.tsx'
import { template as dataDeleted } from './data-deleted.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'referral-reward': referralReward,
  'data-deletion-warning': dataDeletionWarning,
  'data-deleted': dataDeleted,
}
