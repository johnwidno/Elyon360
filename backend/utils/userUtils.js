const generateMemberCode = (user, church) => {
    if (!user || !church) return null;

    // DW initials
    const initials = (user.firstName?.[0] || 'X').toUpperCase() + (user.lastName?.[0] || 'X').toUpperCase();

    // YY last 2 digits of joinDate or current year
    const dateToUse = user.joinDate ? new Date(user.joinDate) : new Date();
    const year = dateToUse.getFullYear().toString().slice(-2);

    // ID from database
    const id = user.id || '';

    // Church acronym (e.g., EEG)
    const acronym = (church.acronym || '').toUpperCase();

    return `${initials}${year}${id}${acronym}`;
};

module.exports = {
    generateMemberCode
};
