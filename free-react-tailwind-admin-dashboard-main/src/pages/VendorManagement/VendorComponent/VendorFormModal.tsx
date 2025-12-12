// src/components/VendorFormModal.tsx
import React, { useEffect, useState } from "react";
import { Vendor } from "../VendorVariable/vendor";
import "../vendors.css";


type TabKey = "details" | "support" | "notes";

interface VendorFormModalProps {
  open: boolean;
  vendor: Vendor | null;
  onClose: () => void;
  onSave: (values: Vendor) => void;
}

const VendorFormModal: React.FC<VendorFormModalProps> = ({
  open,
  vendor,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [formValues, setFormValues] = useState<Vendor | null>(vendor);

  useEffect(() => {
    setFormValues(vendor);
    setActiveTab("details");
  }, [vendor]);

  if (!open || !formValues) return null;

  const isNew = formValues.vendor_id === 0;

  const handleChange =
    (field: keyof Vendor) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFormValues((prev) =>
        prev ? { ...prev, [field]: e.target.value } : prev
      );
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formValues);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <div className="modal-title">
            <i className="fa fa-building mr-2" />
            {isNew
              ? "New vendor"
              : `Editing vendor: ${formValues.vendor_name || ""}`}
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Tabs */}
          <div className="modal-tabs">
            <button
              type="button"
              className={`modal-tab ${
                activeTab === "details" ? "active" : ""
              }`}
              onClick={() => setActiveTab("details")}
            >
              Details
            </button>
            <button
              type="button"
              className={`modal-tab ${
                activeTab === "support" ? "active" : ""
              }`}
              onClick={() => setActiveTab("support")}
            >
              Support
            </button>
            <button
              type="button"
              className={`modal-tab ${activeTab === "notes" ? "active" : ""}`}
              onClick={() => setActiveTab("notes")}
            >
              Notes
            </button>
          </div>

          <div className="modal-body">
            {activeTab === "details" && (
              <>
                <div className="form-group">
                  <label>
                    Vendor Name <span className="text-danger">*</span>
                  </label>
                  <div className="input-with-icon">
                    <span className="input-icon">
                      <i className="fa fa-building" />
                    </span>
                    <input
                      required
                      className="form-control"
                      value={formValues.vendor_name || ""}
                      onChange={handleChange("vendor_name")}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <div className="input-with-icon">
                    <span className="input-icon">
                      <i className="fa fa-angle-right" />
                    </span>
                    <input
                      className="form-control"
                      value={formValues.vendor_description || ""}
                      onChange={handleChange("vendor_description")}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Account Number</label>
                  <div className="input-with-icon">
                    <span className="input-icon">
                      <i className="fa fa-fingerprint" />
                    </span>
                    <input
                      className="form-control"
                      value={formValues.vendor_account_number || ""}
                      onChange={handleChange("vendor_account_number")}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Account Manager</label>
                  <div className="input-with-icon">
                    <span className="input-icon">
                      <i className="fa fa-user" />
                    </span>
                    <input
                      className="form-control"
                      value={formValues.vendor_account_manager || ""}
                      onChange={handleChange("vendor_account_manager")}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Template Base</label>
                  <div className="input-with-icon">
                    <span className="input-icon">
                      <i className="fa fa-puzzle-piece" />
                    </span>
                    <select
                      className="form-control"
                      value={formValues.vendor_template_id ?? ""}
                      onChange={(e) =>
                        setFormValues((prev) =>
                          prev
                            ? {
                                ...prev,
                                vendor_template_id:
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value),
                              }
                            : prev
                        )
                      }
                    >
                      <option value="">- None -</option>
                      <option value={1}>Sample Template 1</option>
                      <option value={2}>Sample Template 2</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {activeTab === "support" && (
              <>
                <div className="form-group">
                  <label>Support Phone / Extension</label>
                  <div className="support-phone-row">
                    <div className="input-with-icon small">
                      <span className="input-icon">
                        <i className="fa fa-phone" />
                      </span>
                      <input
                        className="form-control"
                        placeholder="+"
                        value={formValues.vendor_phone_country_code || ""}
                        onChange={handleChange("vendor_phone_country_code")}
                      />
                    </div>
                    <input
                      className="form-control flex-grow"
                      placeholder="Phone Number"
                      value={formValues.vendor_phone || ""}
                      onChange={handleChange("vendor_phone")}
                    />
                    <input
                      className="form-control small"
                      placeholder="ext."
                      value={formValues.vendor_extension || ""}
                      onChange={handleChange("vendor_extension")}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Support Hours</label>
                  <div className="input-with-icon">
                    <span className="input-icon">
                      <i className="fa fa-calendar" />
                    </span>
                    <input
                      className="form-control"
                      placeholder="Support Hours"
                      value={formValues.vendor_hours || ""}
                      onChange={handleChange("vendor_hours")}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Support Email</label>
                  <div className="input-with-icon">
                    <span className="input-icon">
                      <i className="fa fa-envelope" />
                    </span>
                    <input
                      className="form-control"
                      placeholder="Support Email"
                      value={formValues.vendor_email || ""}
                      onChange={handleChange("vendor_email")}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Support Website URL</label>
                  <div className="input-with-icon">
                    <span className="input-icon">
                      <i className="fa fa-globe" />
                    </span>
                    <input
                      className="form-control"
                      placeholder="Do not include http(s)://"
                      value={formValues.vendor_website || ""}
                      onChange={handleChange("vendor_website")}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>SLA</label>
                  <div className="input-with-icon">
                    <span className="input-icon">
                      <i className="fa fa-handshake" />
                    </span>
                    <input
                      className="form-control"
                      placeholder="SLA Response Time"
                      value={formValues.vendor_sla || ""}
                      onChange={handleChange("vendor_sla")}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Pin/Code</label>
                  <div className="input-with-icon">
                    <span className="input-icon">
                      <i className="fa fa-key" />
                    </span>
                    <input
                      className="form-control"
                      placeholder="Access Code or Pin"
                      value={formValues.vendor_code || ""}
                      onChange={handleChange("vendor_code")}
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === "notes" && (
              <>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    className="form-control"
                    rows={6}
                    placeholder="Enter some notes"
                    value={formValues.vendor_notes || ""}
                    onChange={handleChange("vendor_notes")}
                  />
                </div>
                {!isNew && (
                  <div className="text-right text-muted">
                    Vendor ID: {formValues.vendor_id}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="submit" className="btn btn-primary">
              <i className="fa fa-check mr-1" />
              Save
            </button>
            <button
              type="button"
              className="btn btn-default ml-2"
              onClick={onClose}
            >
              <i className="fa fa-times mr-1" />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorFormModal;
