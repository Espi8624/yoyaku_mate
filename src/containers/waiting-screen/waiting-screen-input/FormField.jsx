import React from "react";

function FormField({ id, label, example, value, onChange, type = "text", required = false }) {
  return (
    <div className="input-field-group">
      <label htmlFor={id} className="input-field-label">
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
        className="input-field-value"
      />
    </div>
  );
}

export default FormField;