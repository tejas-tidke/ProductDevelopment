// src/pages/VendorManagement/VendorPage_Hooks/useVendors.ts

import { useEffect, useMemo, useState } from "react";
import jiraService, { ProductItem } from "../../../services/jiraService";
import { Vendor, SortColumn, SortOrder } from "../VendorVariable/vendor";

interface UseVendorsResult {
  vendors: Vendor[];

  search: string;
  setSearch: (s: string) => void;

  archivedFilter: boolean;
  toggleArchivedFilter: () => void;

  sortBy: SortColumn;
  sortOrder: SortOrder;
  toggleSort: (column: SortColumn) => void;

  selectedVendorIds: number[];
  toggleSelectVendor: (id: number) => void;
  toggleSelectAll: () => void;

  openEditVendor: (vendor: Vendor) => void;
  openNewVendor: () => void;
  closeForm: () => void;
  saveVendor: (values: Vendor) => Promise<void>;
  toggleArchiveVendor: (id: number) => Promise<void>;

  isFormOpen: boolean;
  editingVendor: Vendor | null;
}

// Map backend ProductItem (used by VendorList) into our Vendor shape
const productToVendor = (p: ProductItem): Vendor => {
  return {
    vendor_id: Number(p.id), // product id used as row id
    vendor_name: p.nameOfVendor || "",
    vendor_description: p.productName || "",
    vendor_website: p.productLink || "",
    vendor_archived: false,

    // other fields not stored in this API → left undefined
    vendor_account_number: null,
    vendor_account_manager: null,
    vendor_phone_country_code: null,
    vendor_phone: null,
    vendor_extension: null,
    vendor_email: null,
    vendor_hours: null,
    vendor_sla: null,
    vendor_code: null,
    vendor_notes: null,
    vendor_template_id: null,
    vendor_template_name: null,
  };
};

export const useVendors = (): UseVendorsResult => {
  // raw list built from Jira vendor+product data
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);

  // filters / sorting
  const [search, setSearch] = useState("");
  const [archivedFilter, setArchivedFilter] = useState(false);
  const [sortBy, setSortBy] = useState<SortColumn>("vendor_name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("ASC");

  // selection
  const [selectedVendorIds, setSelectedVendorIds] = useState<number[]>([]);

  // modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // ---------------- LOAD FROM SAME API AS VendorList ----------------

  useEffect(() => {
    let cancelled = false;

    const loadFromApi = async () => {
      try {
        // 1) Get vendor names (same as VendorList)
        const vendorNames: string[] = await jiraService.getVendors();

        // 2) For each vendor, get its products
        const productPromises = vendorNames.map(async (vendorName) => {
          try {
            const products: ProductItem[] = await jiraService.getProductsByVendor(
              vendorName
            );
            return products || [];
          } catch (err) {
            console.warn(`Failed to fetch products for vendor ${vendorName}`, err);
            return [];
          }
        });

        const productResults = await Promise.all(productPromises);
        const allProducts = productResults.flat();

        // 3) Convert products -> vendors, dedupe by vendor_name
        const vendorMap = new Map<string, Vendor>();

        for (const p of allProducts) {
          const v = productToVendor(p);
          if (!vendorMap.has(v.vendor_name)) {
            vendorMap.set(v.vendor_name, v);
          }
        }

        if (!cancelled) {
          setAllVendors(Array.from(vendorMap.values()));
        }
      } catch (err) {
        console.error("Failed to load vendors from Jira API", err);
      }
    };

    loadFromApi();
    return () => {
      cancelled = true;
    };
  }, []);

  // -------------- FILTER + SORT FOR TABLE --------------

  const vendors = useMemo(() => {
    // Note: your existing Jira API has no "archive" flag.
    // We'll treat archivedFilter=false as "show all existing rows"
    let result = allVendors.filter(
      (v) => (v.vendor_archived ?? false) === archivedFilter
    );

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((v) => {
        const name = (v.vendor_name || "").toLowerCase();
        const desc = (v.vendor_description || "").toLowerCase();
        const contact = (v.vendor_account_manager || "").toLowerCase();
        return (
          name.includes(q) ||
          desc.includes(q) ||
          contact.includes(q)
        );
      });
    }

    result.sort((a, b) => {
      const dir = sortOrder === "ASC" ? 1 : -1;

      const field = (v: Vendor): string => {
        switch (sortBy) {
          case "vendor_name":
            return v.vendor_name || "";
          case "vendor_description":
            return v.vendor_description || "";
          case "vendor_contact_name":
            return v.vendor_account_manager || "";
          case "vendor_website":
            return v.vendor_website || "";
          default:
            return "";
        }
      };

      const av = field(a).toLowerCase();
      const bv = field(b).toLowerCase();
      return av.localeCompare(bv) * dir;
    });

    return result;
  }, [allVendors, search, archivedFilter, sortBy, sortOrder]);

  // -------------- SORT / FILTER TOGGLES --------------

  const toggleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(column);
      setSortOrder("ASC");
    }
  };

  const toggleArchivedFilter = () => {
    // There is no "archive" in the existing API; we only keep a local flag.
    // If you want true archive/unarchive, you'll need backend support.
    setArchivedFilter((prev) => !prev);
  };

  // -------------- SELECTION --------------

  const toggleSelectVendor = (id: number) => {
    setSelectedVendorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (vendors.length > 0 && selectedVendorIds.length === vendors.length) {
      setSelectedVendorIds([]);
    } else {
      setSelectedVendorIds(vendors.map((v) => v.vendor_id));
    }
  };

  // -------------- MODAL OPEN / CLOSE --------------

  const openEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setIsFormOpen(true);
  };

  const openNewVendor = () => {
    const blank: Vendor = {
      vendor_id: 0,
      vendor_name: "",
      vendor_archived: false,
    };
    setEditingVendor(blank);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
  };

  // -------------- SAVE (CREATE) USING SAME API AS VendorList --------------

  const saveVendor = async (values: Vendor) => {
    try {
      if (!values.vendor_name || !values.vendor_name.trim()) {
        alert("Vendor Name is required.");
        return;
      }

      if (values.vendor_id === 0) {
        // ✅ CREATE using existing VendorList API
        const created = await jiraService.createVendor({
          nameOfVendor: values.vendor_name.trim(),
          // we don't have explicit productName in this modal,
          // so we'll use description or fallback to vendor name
          productName:
            (values.vendor_description || "").trim() ||
            values.vendor_name.trim(),
          productLink: (values.vendor_website || "").trim(),
          // Your existing API expects string productType – choose a default
          productType: "License Based",
        });

        // created is ProductItem → map to Vendor
        const newVendor = productToVendor(created as ProductItem);
        setAllVendors((prev) => [...prev, newVendor]);
      } else {
        // ❗ There is NO update endpoint in your current Jira vendor API
        // We can only update locally, but it won't persist to DB.
        // For now, warn and just update UI.
        alert(
          "Updating an existing vendor is not yet supported on the backend. Only new vendors are saved to the database."
        );

        setAllVendors((prev) =>
          prev.map((v) =>
            v.vendor_id === values.vendor_id ? { ...v, ...values } : v
          )
        );
      }

      setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to save vendor", err);
      alert("Failed to save vendor. Please try again.");
    }
  };

  // -------------- "Archive" → actually DELETE (same as VendorList) --------------

  const toggleArchiveVendor = async (id: number) => {
    try {
      // there is no real archive/unarchive – only deleteVendorProduct
      await jiraService.deleteVendorProduct(id);
      setAllVendors((prev) => prev.filter((v) => v.vendor_id !== id));
    } catch (err) {
      console.error("Failed to delete vendor product", err);
      alert("Failed to delete vendor. Please try again.");
    }
  };

  return {
    vendors,
    search,
    setSearch,
    archivedFilter,
    toggleArchivedFilter,
    sortBy,
    sortOrder,
    toggleSort,
    selectedVendorIds,
    toggleSelectVendor,
    toggleSelectAll,
    openEditVendor,
    openNewVendor,
    closeForm,
    saveVendor,
    toggleArchiveVendor,
    isFormOpen,
    editingVendor,
  };
};
