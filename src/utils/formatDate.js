function formatDate (dateObj) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const day = dayNames[dateObj.getDay()];
    const date = dateObj.getDate(); // date of the month
    const month = dateObj.getMonth() + 1; // month is 0-indexed
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');

    return `${day}, ${month}/${date}/${year} ${hours}:${minutes}`;
}

module.exports = {
    formatDate 
};