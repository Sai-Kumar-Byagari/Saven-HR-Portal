const { OnboardingTask, User, EmployeeProfile } = require('../models');
const { createNotification } = require('../services/notification.service');

async function getOnboardingTasks(req, res, next) {
  try {
    const userId = req.params.userId || req.user.id;
    const tasks = await OnboardingTask.findAll({
      where: { user_id: userId },
      order: [['order_index', 'ASC']],
    });
    return res.status(200).json({ success: true, message: 'Tasks fetched.', data: tasks });
  } catch (err) {
    next(err);
  }
}

async function completeOnboarding(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (user.employee_type !== 'new') {
      return res.status(400).json({ success: false, message: 'Onboarding is only for new employees.', errors: [] });
    }

    // Mark all tasks complete
    await OnboardingTask.update(
      { is_completed: true, completed_at: new Date() },
      { where: { user_id: userId } }
    );

    await user.update({ onboarding_complete: true });

    // Notify HR
    const hrUsers = await User.findAll({ where: { role: 'hr', is_active: true }, attributes: ['id'] });
    for (const hr of hrUsers) {
      await createNotification({
        userId: hr.id,
        title: 'Onboarding Completed',
        message: `${user.first_name} ${user.last_name} has completed their onboarding process.`,
        type: 'onboarding',
        referenceId: user.id,
        referenceType: 'user',
        navigateTo: `/employees/${user.id}`,
      });
    }

    // Notify super admins
    const admins = await User.findAll({ where: { role: 'super_admin', is_active: true }, attributes: ['id'] });
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        title: 'Employee Onboarding Complete',
        message: `${user.first_name} ${user.last_name} has completed onboarding.`,
        type: 'onboarding',
        navigateTo: `/employees/${user.id}`,
      });
    }

    return res.status(200).json({ success: true, message: 'Onboarding completed.', data: { onboardingComplete: true } });
  } catch (err) {
    next(err);
  }
}

async function updateTaskStatus(req, res, next) {
  try {
    const { taskId } = req.params;
    const { is_completed } = req.body;

    const task = await OnboardingTask.findOne({ where: { id: taskId, user_id: req.user.id } });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.', errors: [] });

    await task.update({
      is_completed: !!is_completed,
      completed_at: is_completed ? new Date() : null,
    });

    return res.status(200).json({ success: true, message: 'Task updated.', data: task });
  } catch (err) {
    next(err);
  }
}

async function getOnboardingSummary(req, res, next) {
  try {
    const { page, limit, offset } = require('../utils/paginate').getPagination(req.query);
    const pendingUsers = await User.findAndCountAll({
      where: { employee_type: 'new', onboarding_complete: false, is_active: true },
      attributes: ['id', 'first_name', 'last_name', 'work_email', 'doj'],
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      message: 'Onboarding summary fetched.',
      data: pendingUsers.rows,
      pagination: require('../utils/paginate').getPaginationMeta(pendingUsers.count, 1, limit),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getOnboardingTasks, completeOnboarding, updateTaskStatus, getOnboardingSummary };
