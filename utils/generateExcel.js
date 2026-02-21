const XLSX = require("xlsx");

exports.generateExcelBuffer = (data) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx"
  });
};
