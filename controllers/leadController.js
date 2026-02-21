const LeadRequest = require("../models/LeadRequest");
const { generateLeads } = require("../services/leadService");
const XLSX = require("xlsx");


const User = require("../models/User");


exports.createLeads = async (req, res) => {
  try {
    const { location, businessType, count } = req.body;

    if (!location || !businessType || !count) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (count > 50) {
      return res.status(400).json({ message: "Maximum 50 leads allowed per request" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔥 MONTHLY RESET LOGIC
    const now = new Date();
    const resetDate = new Date(user.monthlyResetDate);

    if (
      now.getMonth() !== resetDate.getMonth() ||
      now.getFullYear() !== resetDate.getFullYear()
    ) {
      user.monthlyLeadsUsed = 0;
      user.monthlyResetDate = now;
      await user.save();
    }

    // 🔥 PLAN LIMITS
    const planLimits = {
      free: 20,
      pro: 200,
      premium: 1000
    };

    const limit = planLimits[user.plan];

    if (user.monthlyLeadsUsed + count > limit) {
      return res.status(403).json({
        message: `Monthly limit exceeded. Your ${user.plan} plan allows ${limit} leads per month.`
      });
    }

    // 🔥 Generate leads
    const rawLeads = await generateLeads(location, businessType, count);

    const formattedLeads = rawLeads.map((lead) => ({
      Name: lead.name || "",
      Phone: lead.phone || "",
      Address: lead.address || ""
    }));

    const saved = await LeadRequest.create({
      userId: user._id,
      location,
      businessType,
      count,
      leads: formattedLeads
    });

    // 🔥 Update usage
    user.monthlyLeadsUsed += formattedLeads.length;
    await user.save();

    res.json({
      requestId: saved._id,
      totalLeads: formattedLeads.length,
      monthlyUsed: user.monthlyLeadsUsed,
      monthlyLimit: limit,
      leads: formattedLeads
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.downloadExcel = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await LeadRequest.findOne({
      _id: id,
      userId: req.user.id
    }).lean();   // 👈 VERY IMPORTANT

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (!request.leads || request.leads.length === 0) {
      return res.status(400).json({ message: "No leads found" });
    }

    const plainLeads = request.leads.map(lead => ({
      Name: lead.Name,
      Phone: lead.Phone,
      Address: lead.Address
    }));

    const worksheet = XLSX.utils.json_to_sheet(plainLeads);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${request.location}-leads.xlsx`
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
