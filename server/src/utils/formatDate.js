function formatDateFields(obj, fields) {
  if (!obj) return obj;
  fields.forEach(f => {
    if (obj[f] instanceof Date) {
      obj[f] = obj[f].toISOString().slice(0, 10);
    }
  });
  return obj;
}

function toMySQLDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

module.exports = {
  formatDateFields,
  toMySQLDate
};
