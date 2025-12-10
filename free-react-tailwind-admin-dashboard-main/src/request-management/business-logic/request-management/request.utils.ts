import { Issue } from "./request.types";

// Helper: safe field reader (tries many key variants)
export const getFieldValue = (issue: Issue, keys: string[]): string => {
  if (!issue || !issue.fields) return '';
  for (const k of keys) {
    const val = issue.fields[k];
    if (val === undefined || val === null || val === '') continue;

    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      return String(val);
    }

    // Jira object shapes: { value } or { displayName } or { name } or array
    if (typeof val === 'object') {
      // Type guard for objects with value property
      if (val && typeof val === 'object' && 'value' in val && val.value !== undefined) {
        return String(val.value);
      }
      // Type guard for objects with displayName property
      if (val && typeof val === 'object' && 'displayName' in val && val.displayName !== undefined) {
        return String(val.displayName);
      }
      // Type guard for objects with name property
      if (val && typeof val === 'object' && 'name' in val && val.name !== undefined) {
        return String(val.name);
      }
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') return val[0];
      // nested reporter email example: issue.fields.reporter?.emailAddress
      if (k.includes('.') && k.split('.').length > 1) {
        // support 'reporter.emailAddress'
        const parts = k.split('.');
        let cur: Record<string, unknown> = issue.fields;
        for (const p of parts) {
          if (!cur) break;
          cur = cur[p] as Record<string, unknown>;
        }
        if (cur) return String(cur);
      }
      try {
        return JSON.stringify(val);
      } catch {
        return String(val);
      }
    }
  }
  return '';
};

// Date formatter
export const formatDate = (val?: string) => {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString();
};

// Billing helpers per issue (returns booleans)
export const hasBillingInfo = (issue: Issue): boolean => {
  const billingType = getFieldValue(issue, ['customfield_10292']);
  const currentLicenseCount = getFieldValue(issue, ['customfield_10293']);
  const currentUsageCount = getFieldValue(issue, ['customfield_10294']);
  
  return !!(billingType || currentLicenseCount || currentUsageCount);
};

export const hasRenewalInfo = (issue: Issue): boolean => {
  const renewalDate = getFieldValue(issue, ['customfield_10303']);
  return !!renewalDate;
};