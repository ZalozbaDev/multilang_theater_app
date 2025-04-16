import React from "react";

export const Select = ({ value, onValueChange, children }) => {
  return (
    <div>
      <select
        className="border p-2 rounded-md"
        value={value}
        onChange={e => onValueChange(e.target.value)}
      >
        {React.Children.map(children, child =>
          React.cloneElement(child, { selected: child.props.value === value })
        )}
      </select>
    </div>
  );
};

export const SelectTrigger = ({ children }) => <>{children}</>;
export const SelectValue = ({ placeholder }) => <>{placeholder}</>;
export const SelectContent = ({ children }) => <>{children}</>;
export const SelectItem = ({ value, children }) => (
  <option value={value}>{children}</option>
);
