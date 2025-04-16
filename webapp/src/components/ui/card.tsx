import React from "react";
import { cn } from "../../lib/utils.ts";

export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("rounded-xl border shadow-md bg-white", className)} {...props} />
  );
};

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("p-4", className)} {...props} />
  );
};
