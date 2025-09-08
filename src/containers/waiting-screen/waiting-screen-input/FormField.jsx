import React from "react";

function FormField({ id, label, example, value, onChange, type = "text", required = false }) {
  return (
    <>
      <label htmlFor={id} className="preview-item-label">
        {label}
      </label>
      <div className="input-example">{example}</div>
      <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        required={required}
        className="preview-item-value"
      />
    </>
  );
}

export default FormField;