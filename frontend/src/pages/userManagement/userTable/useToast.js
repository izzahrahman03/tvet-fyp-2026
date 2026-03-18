// components/userTable/useToast.js
import { useState } from "react";

export default function useToast() {
  const [toast, setToast] = useState(null);

  const show = (msg, kind = "success") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3000);
  };

  return { toast, show };
}