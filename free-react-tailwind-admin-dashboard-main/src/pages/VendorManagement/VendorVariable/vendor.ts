
export interface Vendor {
  vendor_id: number;

  vendor_name: string;
  vendor_description?: string | null;

  vendor_account_number?: string | null;
  vendor_account_manager?: string | null;

  vendor_phone_country_code?: string | null;
  vendor_phone?: string | null;
  vendor_extension?: string | null;

  vendor_email?: string | null;
  vendor_website?: string | null;

  vendor_hours?: string | null;
  vendor_sla?: string | null;
  vendor_code?: string | null;

  vendor_notes?: string | null;

  vendor_template_id?: number | null;
  vendor_template_name?: string | null;

  vendor_archived?: boolean | null;
}

export type SortColumn =
  | "vendor_name"
  | "vendor_description"
  | "vendor_contact_name"
  | "vendor_website";

export type SortOrder = "ASC" | "DESC";
