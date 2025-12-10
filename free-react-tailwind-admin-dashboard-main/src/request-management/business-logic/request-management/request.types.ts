// Types for request management
export interface Project {
  id: string;
  key: string;
  name: string;
  description: string;
  projectTypeKey: string;
}

export interface JiraIssueType {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
}

export interface JiraField {
  id: string;
  name: string;
  custom: boolean;
  orderable: boolean;
  navigable: boolean;
  searchable: boolean;
  clauseNames: string[];
}

export interface Issue {
  id: string;
  key: string;
  fields: {
    summary?: string;
    project?: {
      name?: string;
      key?: string;
    };
    assignee?: {
      displayName?: string;
    } | null;
    issuetype?: {
      name?: string;
    };
    status?: {
      name?: string;
    };
    priority?: {
      name?: string;
    };
    created?: string;
    updated?: string;
    reporter?: {
      displayName?: string;
      emailAddress?: string;
    };
    [k: string]: unknown;
  };
}

export interface Column {
  key: string;
  title: string;
  isSortable: boolean;
  isSelected: boolean;
}