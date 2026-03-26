const { Expense } = require("../models/schema");

const getNextDate = (date, type) => {
  const next = new Date(date);
  switch (type) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
};

const processRecurringExpenses = async () => {
  const now = new Date();

  try {
    const dueExpenses = await Expense.find({
      isRecurring: true,
      isActive: true,
      nextOccurrence: { $lte: now },
      $or: [{ endDate: null }, { endDate: { $gte: now } }],
    });

    let generated = 0;

    for (const recurring of dueExpenses) {
      const newExpense = new Expense({
        userId: recurring.userId,
        amount: recurring.amount,
        category: recurring.category,
        date: recurring.nextOccurrence,
        description: `[Auto] ${recurring.description || recurring.category}`,
        paymentMode: recurring.paymentMode,
        isRecurring: false,
      });

      await newExpense.save();
      generated++;

      recurring.nextOccurrence = getNextDate(recurring.nextOccurrence, recurring.recurrenceType);

      if (recurring.endDate && recurring.nextOccurrence > recurring.endDate) {
        recurring.isActive = false;
      }

      await recurring.save();
    }

    if (generated > 0) {
      console.log(`[Recurring] Generated ${generated} expense(s) at ${now.toISOString()}`);
    }
  } catch (err) {
    console.error("[Recurring] Error processing:", err.message);
  }
};

module.exports = { processRecurringExpenses };
