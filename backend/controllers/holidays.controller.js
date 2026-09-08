const { validationResult } = require('express-validator');
const { HolidayCalendar } = require('../models');
const { Op } = require('sequelize');
const { getFYDates, getFinancialYear } = require('../utils/dateHelpers');

async function getHolidays(req, res, next) {
  try {
    const { year } = req.query;
    const fy = year || getFinancialYear();
    const { startDate, endDate } = getFYDates(fy);

    const holidays = await HolidayCalendar.findAll({
      where: { date: { [Op.between]: [startDate, endDate] } },
      order: [['date', 'ASC']],
    });

    return res.status(200).json({ success: true, message: 'Holidays fetched.', data: holidays });
  } catch (err) {
    next(err);
  }
}

async function createHoliday(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation error.', errors: errors.array() });
    }

    const { date, name, type } = req.body;
    const existing = await HolidayCalendar.findOne({ where: { date } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Holiday already exists for this date.', errors: [] });
    }

    const holiday = await HolidayCalendar.create({ date, name, type, created_by: req.user.id });
    return res.status(201).json({ success: true, message: 'Holiday created.', data: holiday });
  } catch (err) {
    next(err);
  }
}

async function updateHoliday(req, res, next) {
  try {
    const { id } = req.params;
    const holiday = await HolidayCalendar.findByPk(id);
    if (!holiday) return res.status(404).json({ success: false, message: 'Holiday not found.', errors: [] });

    const { name, type } = req.body;
    await holiday.update({ name, type });
    return res.status(200).json({ success: true, message: 'Holiday updated.', data: holiday });
  } catch (err) {
    next(err);
  }
}

async function deleteHoliday(req, res, next) {
  try {
    const { id } = req.params;
    const holiday = await HolidayCalendar.findByPk(id);
    if (!holiday) return res.status(404).json({ success: false, message: 'Holiday not found.', errors: [] });
    await holiday.destroy();
    return res.status(200).json({ success: true, message: 'Holiday deleted.', data: { id } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHolidays, createHoliday, updateHoliday, deleteHoliday };
