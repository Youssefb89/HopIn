const db = require("../config/db");

let mockReports = [];

exports.create = async (reportData) => {
  if (!db) {
    const report = {
      id: `report-${Date.now()}`,
      ...reportData
    };

    mockReports.push(report);
    return report;
  }

  const { data, error } = await db
    .from("reports")
    .insert([reportData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};
