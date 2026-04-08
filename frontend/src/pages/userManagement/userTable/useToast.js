import { useState, useCallback } from "react";

export default function useToast() {
  const [toast, setToast] = useState(null);

  const show = useCallback((msg, kind = "success") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3000);
  }, []); // empty deps → created once, never changes

  return { toast, show };
}