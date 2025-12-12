// src/pages/VendorManagement/VendorPage_Component/VendorsPage.tsx
import React from "react";
import { useVendors } from "../VendorHook/useVendors";
import { Vendor } from "../VendorVariable/vendor";
import VendorFormModal from "./VendorFormModal";
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
            <button className="btn btn-primary" onClick={openNewVendor}>
              <i className="fa fa-plus mr-1" />
              New Vendor
            </button>
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
                <button className="btn btn-dark" type="button">
                  <i className="fa fa-search" />
                </button>
              </div>
            </div>
          </div>

          <div className="col-md-8">
            <div className="btn-group float-right">
              <button
                type="button"
                className={`btn btn-${archivedFilter ? "primary" : "default"}`}
                onClick={toggleArchivedFilter}
              >
                <i className="fa fa-archive mr-1" />
                Archived
              </button>
            </div>
          </div>
        </div>

        <hr />

        {/* Table */}
        <div className="table-responsive-sm">
          <table className="table table-striped table-borderless table-hover">
            <thead className="text-dark text-nowrap">
              <tr>
                <td className="pr-0">
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
                </td>
                <th>
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
                </th>
                <th>
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
                </th>
                <th>
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
                </th>
                <th>
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
                </th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted">
                    No vendors found.
                  </td>
                </tr>
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
                  <tr key={vendor.vendor_id}>
                    <td className="pr-0">
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
                    </td>
                    <td>
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
                    </td>
                    <td>{description}</td>
                    <td>
                      {contact !== "-" && (
                        <>
                          <i className="fa fa-user text-secondary mr-2" />
                          {contact}
                        </>
                      )}
                      {contact === "-" && "-"}
                    </td>
                    <td>{website}</td>
                    <td>
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
