// src/pages/VendorManagement/VendorPage_Component/VendorsPage.tsx
import React from "react";
import { useVendors } from "../VendorHook/useVendors";
import { Vendor } from "../VendorVariable/vendor";
import VendorFormModal from "./VendorFormModal";
import { PrimaryButton, SecondaryButton } from "../../../components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../../components/ui/table";
import "../vendors.css";


const VendorsPage: React.FC = () => {
  const {
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
  } = useVendors();

  const orderIcon = sortOrder === "ASC" ? "▲" : "▼";

  const handleClickVendorName = (vendor: Vendor) => {
    openEditVendor(vendor);
  };

  return (
    <div className="card card-dark vendors-card">
      {/* Header bar */}
      <div className="card-header">
        <h3 className="card-title">
          <i className="fa fa-building mr-2" />
          Vendors
        </h3>
        <div className="card-tools">
          <div className="btn-group">
            <PrimaryButton onClick={openNewVendor}>
              <i className="fa fa-plus mr-1" />
              New Vendor
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="card-body">
        {/* Search + archived */}
        <div className="row">
          <div className="col-md-4">
            <div className="input-group mb-3">
              <input
                type="search"
                className="form-control"
                placeholder="Search Vendors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="input-group-append">
                <SecondaryButton type="button" className="flex items-center">
                  <i className="fa fa-search" />
                </SecondaryButton>
              </div>
            </div>
          </div>

          <div className="col-md-8">
            <div className="btn-group float-right">
              <SecondaryButton
                type="button"
                onClick={toggleArchivedFilter}
                className="flex items-center gap-2"
              >
                <i className="fa fa-archive mr-1" />
                Archived
              </SecondaryButton>
            </div>
          </div>
        </div>

        <hr />

        {/* Table */}
        <div className="table-responsive-sm">
          <Table className="table table-striped table-borderless table-hover">
            <TableHeader>
              <TableRow>
                <TableCell isHeader={true} className="pr-0">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={
                        vendors.length > 0 &&
                        selectedVendorIds.length === vendors.length
                      }
                    />
                  </div>
                </TableCell>
                <TableCell isHeader={true}>
                  <button
                    type="button"
                    className="btn btn-link p-0 text-secondary"
                    onClick={() => toggleSort("vendor_name")}
                  >
                    Vendor{" "}
                    {sortBy === "vendor_name" && (
                      <span className="sort-icon">{orderIcon}</span>
                    )}
                  </button>
                </TableCell>
                <TableCell isHeader={true}>
                  <button
                    type="button"
                    className="btn btn-link p-0 text-secondary"
                    onClick={() => toggleSort("vendor_description")}
                  >
                    Description{" "}
                    {sortBy === "vendor_description" && (
                      <span className="sort-icon">{orderIcon}</span>
                    )}
                  </button>
                </TableCell>
                <TableCell isHeader={true}>
                  <button
                    type="button"
                    className="btn btn-link p-0 text-secondary"
                    onClick={() => toggleSort("vendor_contact_name")}
                  >
                    Contact{" "}
                    {sortBy === "vendor_contact_name" && (
                      <span className="sort-icon">{orderIcon}</span>
                    )}
                  </button>
                </TableCell>
                <TableCell isHeader={true}>
                  <button
                    type="button"
                    className="btn btn-link p-0 text-secondary"
                    onClick={() => toggleSort("vendor_website")}
                  >
                    Website{" "}
                    {sortBy === "vendor_website" && (
                      <span className="sort-icon">{orderIcon}</span>
                    )}
                  </button>
                </TableCell>
                <TableCell isHeader={true} className="text-center">Action</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.length === 0 && (
                <TableRow>
                  <TableCell isHeader={false} className="text-center text-muted" colSpan={6}>
                    No vendors found.
                  </TableCell>
                </TableRow>
              )}

              {vendors.map((vendor) => {
                const accountLine = vendor.vendor_account_number ? (
                  <div className="text-secondary">
                    Account #: {vendor.vendor_account_number}
                  </div>
                ) : null;

                const description =
                  vendor.vendor_description && vendor.vendor_description.trim()
                    ? vendor.vendor_description
                    : "-";

                const contact =
                  vendor.vendor_account_manager &&
                  vendor.vendor_account_manager.trim()
                    ? vendor.vendor_account_manager
                    : "-";

                const website =
                  vendor.vendor_website && vendor.vendor_website.trim()
                    ? vendor.vendor_website
                    : "-";

                const isSelected = selectedVendorIds.includes(
                  vendor.vendor_id
                );

                return (
                  <TableRow key={vendor.vendor_id}>
                    <TableCell isHeader={false} className="pr-0">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            toggleSelectVendor(vendor.vendor_id)
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell isHeader={false}>
                      <button
                        type="button"
                        className="btn btn-link text-dark p-0 text-left w-100"
                        onClick={() => handleClickVendorName(vendor)}
                      >
                        <div className="media">
                          <i className="fa fa-2x fa-building mr-3" />
                          <div className="media-body">
                            <div>{vendor.vendor_name}</div>
                            {accountLine}
                          </div>
                        </div>
                      </button>
                    </TableCell>
                    <TableCell isHeader={false}>{description}</TableCell>
                    <TableCell isHeader={false}>
                      {contact !== "-" && (
                        <>
                          <i className="fa fa-user text-secondary mr-2" />
                          {contact}
                        </>
                      )}
                      {contact === "-" && "-"}
                    </TableCell>
                    <TableCell isHeader={false}>{website}</TableCell>
                    <TableCell isHeader={false}>
                      <div className="dropdown dropleft text-center vendor-actions">
                        <button
                          className="btn btn-secondary btn-sm dropdown-toggle-icon"
                          type="button"
                        >
                          <span className="dots">⋯</span>
                        </button>
                        <div className="dropdown-menu">
                          <button
                            className="dropdown-item"
                            type="button"
                            onClick={() => openEditVendor(vendor)}
                          >
                            Edit
                          </button>
                          <button
                            className="dropdown-item"
                            type="button"
                            onClick={() =>
                              toggleArchiveVendor(vendor.vendor_id)
                            }
                          >
                            {vendor.vendor_archived ? "Unarchive" : "Archive"}
                          </button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal form */}
      <VendorFormModal
        open={isFormOpen}
        vendor={editingVendor}
        onClose={closeForm}
        onSave={saveVendor}
      />
    </div>
  );
};

export default VendorsPage;
