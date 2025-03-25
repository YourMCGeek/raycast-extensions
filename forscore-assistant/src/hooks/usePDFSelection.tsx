import { useEffect, useState } from "react";

export function usePDFSelection() {
    const [selection, setSelection] = useState<string | null>(null);

    useEffect(() => {
        const handleSelection = (event: ClipboardEvent) => {
        }
}