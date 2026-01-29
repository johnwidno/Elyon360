// Utility hook for table pagination/limiting
import { useState } from 'react';

export const useTableLimit = (initialLimit = 10) => {
    const [showAll, setShowAll] = useState(false);

    const limitData = (data) => {
        if (!showAll && data && data.length > initialLimit) {
            return data.slice(0, initialLimit);
        }
        return data;
    };

    const toggleShowAll = () => setShowAll(!showAll);

    const shouldShowButton = (dataLength) => dataLength > initialLimit;

    return {
        showAll,
        limitData,
        toggleShowAll,
        shouldShowButton
    };
};
