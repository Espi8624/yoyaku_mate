import React from "react";
import styles from "./WaitingScreenInput.module.css";

function FormField({ id, label, example, value, onChange, type = "text", required = false }) {
  return (
    <div className={styles["input-field-group"]}>
      <label htmlFor={id} className={styles["input-field-label"]}>
        {label}
      </label>
      <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={example}
        className={styles["input-field-value"]}
      />
    </div>
  );
}

export default FormField;