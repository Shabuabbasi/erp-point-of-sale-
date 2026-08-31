const Sale = require('../models/Sale');

const generateInvoiceNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `INV-${dateStr}-`;

  const lastSale = await Sale.findOne({
    invoiceNumber: { $regex: `^${prefix}` },
  }).sort({ createdAt: -1 });

  let sequence = 1;
  if (lastSale) {
    const lastSeq = parseInt(lastSale.invoiceNumber.split('-').pop(), 10);
    sequence = lastSeq + 1;
  }

  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

module.exports = { generateInvoiceNumber };
