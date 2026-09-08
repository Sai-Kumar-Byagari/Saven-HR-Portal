const { Team, TeamMember, Project, ProjectUpdate, ProjectMessage, User } = require('../models');
const { createNotification } = require('../services/notification.service');
const { Op } = require('sequelize');

// ─── TEAMS ────────────────────────────────────────────────────────────────────

async function createTeam(req, res, next) {
  try {
    const { name, description, color } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Team name required.', errors: [] });
    const team = await Team.create({ name, description, color, manager_id: req.user.id });
    return res.status(201).json({ success: true, message: 'Team created.', data: team });
  } catch (err) { next(err); }
}

async function getMyTeams(req, res, next) {
  try {
    const teams = await Team.findAll({
      where: { manager_id: req.user.id },
      include: [
        { model: TeamMember, as: 'members',
          include: [{ model: User, as: 'employee', attributes: ['id','first_name','last_name','work_email','role','profile_photo'] }] },
        { model: Project, as: 'projects',
          include: [{ model: ProjectUpdate, as: 'updates', limit: 1, order: [['created_at','DESC']] }] },
      ],
      order: [['created_at', 'DESC']],
    });
    return res.status(200).json({ success: true, message: 'Teams fetched.', data: teams });
  } catch (err) { next(err); }
}

async function getTeamById(req, res, next) {
  try {
    const { id } = req.params;
    const team = await Team.findOne({
      where: { id, manager_id: req.user.id },
      include: [
        { model: TeamMember, as: 'members',
          include: [{ model: User, as: 'employee', attributes: ['id','first_name','last_name','work_email','role','profile_photo'] }] },
        { model: Project, as: 'projects',
          include: [
            { model: ProjectUpdate, as: 'updates', limit: 5, order: [['created_at','DESC']],
              include: [{ model: User, as: 'author', attributes: ['id','first_name','last_name'] }] },
            { model: ProjectMessage, as: 'messages',
              where: { parent_id: null }, // root messages only
              required: false,
              order: [['created_at','DESC']],
              include: [
                { model: User, as: 'sender', attributes: ['id','first_name','last_name','role'] },
                { model: User, as: 'targetUser', attributes: ['id','first_name','last_name'], required: false },
                { model: ProjectMessage, as: 'replies',
                  include: [{ model: User, as: 'sender', attributes: ['id','first_name','last_name','role'] }],
                  order: [['created_at','ASC']] },
              ] },
          ] },
      ],
    });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found.', errors: [] });
    return res.status(200).json({ success: true, message: 'Team fetched.', data: team });
  } catch (err) { next(err); }
}

async function updateTeam(req, res, next) {
  try {
    const { id } = req.params;
    const team = await Team.findOne({ where: { id, manager_id: req.user.id } });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found.', errors: [] });
    await team.update({ name: req.body.name || team.name, description: req.body.description, color: req.body.color });
    return res.status(200).json({ success: true, message: 'Team updated.', data: team });
  } catch (err) { next(err); }
}

async function deleteTeam(req, res, next) {
  try {
    const { id } = req.params;
    const team = await Team.findOne({ where: { id, manager_id: req.user.id } });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found.', errors: [] });
    await team.destroy();
    return res.status(200).json({ success: true, message: 'Team deleted.', data: { id } });
  } catch (err) { next(err); }
}

// ─── TEAM MEMBERS ─────────────────────────────────────────────────────────────

async function addMember(req, res, next) {
  try {
    const { id } = req.params;
    const { user_id, tech_role, responsibilities, member_deadline } = req.body;
    const team = await Team.findOne({ where: { id, manager_id: req.user.id } });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found.', errors: [] });

    const [member, created] = await TeamMember.findOrCreate({
      where: { team_id: id, user_id },
      defaults: { team_id: id, user_id, tech_role, responsibilities, member_deadline },
    });
    if (!created) await member.update({ tech_role, responsibilities, member_deadline });

    await createNotification({
      userId: user_id,
      title: `Added to Team: ${team.name}`,
      message: `You have been added to the team "${team.name}"${tech_role ? ` as ${tech_role}` : ''}. Check your assigned responsibilities.`,
      type: 'general',
      navigateTo: '/my-projects',
    });
    return res.status(201).json({ success: true, message: 'Member added.', data: member });
  } catch (err) { next(err); }
}

async function removeMember(req, res, next) {
  try {
    const { id, userId } = req.params;
    const team = await Team.findOne({ where: { id, manager_id: req.user.id } });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found.', errors: [] });
    await TeamMember.destroy({ where: { team_id: id, user_id: userId } });
    return res.status(200).json({ success: true, message: 'Member removed.', data: {} });
  } catch (err) { next(err); }
}

async function updateMemberRole(req, res, next) {
  try {
    const { id, userId } = req.params;
    const { tech_role, responsibilities, member_deadline } = req.body;
    const member = await TeamMember.findOne({ where: { team_id: id, user_id: userId } });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found.', errors: [] });
    await member.update({ tech_role, responsibilities, member_deadline });
    return res.status(200).json({ success: true, message: 'Member details updated.', data: member });
  } catch (err) { next(err); }
}

// ─── PROJECTS ─────────────────────────────────────────────────────────────────

async function createProject(req, res, next) {
  try {
    const { team_id, name, description, status, start_date, end_date, tech_stack } = req.body;
    const team = await Team.findOne({ where: { id: team_id, manager_id: req.user.id } });
    if (!team) return res.status(403).json({ success: false, message: 'Not your team.', errors: [] });
    const project = await Project.create({ team_id, manager_id: req.user.id, name, description, status: status || 'active', start_date, end_date, tech_stack });

    // Notify all team members
    const members = await TeamMember.findAll({ where: { team_id } });
    for (const m of members) {
      await createNotification({
        userId: m.user_id,
        title: `New Project: ${name}`,
        message: `A new project "${name}" has been created in team "${team.name}". Check your responsibilities.`,
        type: 'general',
        navigateTo: '/my-projects',
      });
    }
    return res.status(201).json({ success: true, message: 'Project created.', data: project });
  } catch (err) { next(err); }
}

async function getProjectDetail(req, res, next) {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id, {
      include: [
        { model: Team, as: 'team',
          include: [{ model: TeamMember, as: 'members',
            include: [{ model: User, as: 'employee', attributes: ['id','first_name','last_name','role','profile_photo'] }] }] },
        { model: ProjectUpdate, as: 'updates', order: [['created_at','DESC']], limit: 30,
          include: [{ model: User, as: 'author', attributes: ['id','first_name','last_name','role','profile_photo'] }] },
        { model: ProjectMessage, as: 'messages', where: { parent_id: null }, required: false,
          order: [['created_at','DESC']],
          include: [
            { model: User, as: 'sender', attributes: ['id','first_name','last_name','role'] },
            { model: User, as: 'targetUser', attributes: ['id','first_name','last_name'], required: false },
            { model: ProjectMessage, as: 'replies', order: [['created_at','ASC']],
              include: [{ model: User, as: 'sender', attributes: ['id','first_name','last_name','role'] }] },
          ] },
      ],
    });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.', errors: [] });
    return res.status(200).json({ success: true, message: 'Project fetched.', data: project });
  } catch (err) { next(err); }
}

async function updateProject(req, res, next) {
  try {
    const { id } = req.params;
    const project = await Project.findOne({ where: { id, manager_id: req.user.id } });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.', errors: [] });
    await project.update(req.body);
    return res.status(200).json({ success: true, message: 'Project updated.', data: project });
  } catch (err) { next(err); }
}

async function deleteProject(req, res, next) {
  try {
    const { id } = req.params;
    const project = await Project.findOne({ where: { id, manager_id: req.user.id } });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.', errors: [] });
    await project.destroy();
    return res.status(200).json({ success: true, message: 'Project deleted.', data: { id } });
  } catch (err) { next(err); }
}

// ─── PROJECT UPDATES (employee daily progress) ────────────────────────────────

async function addProjectUpdate(req, res, next) {
  try {
    const { project_id } = req.params;
    const { message, progress_pct } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Update message required.', errors: [] });
    }

    // Verify user is a member of this project's team
    const project = await Project.findByPk(project_id, { include: [{ model: Team, as: 'team' }] });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.', errors: [] });

    const isMember = await TeamMember.findOne({ where: { team_id: project.team_id, user_id: req.user.id } });
    const isManager = project.manager_id === req.user.id;
    if (!isMember && !isManager) {
      return res.status(403).json({ success: false, message: 'Not a member of this project.', errors: [] });
    }

    const update = await ProjectUpdate.create({
      project_id,
      user_id: req.user.id,
      message: message.trim(),
      progress_pct: progress_pct != null ? Math.min(100, Math.max(0, parseInt(progress_pct))) : null,
    });

    // Notify manager (if employee posted update)
    if (!isManager) {
      const updater = await User.findByPk(req.user.id, { attributes: ['first_name','last_name'] });
      await createNotification({
        userId: project.manager_id,
        title: `Project Update: ${project.name}`,
        message: `${updater.first_name} ${updater.last_name} posted a daily update for "${project.name}": ${message.substring(0, 80)}`,
        type: 'general',
        navigateTo: `/teams/${project.team_id}`,
      });
    }

    const withAuthor = await ProjectUpdate.findByPk(update.id, {
      include: [{ model: User, as: 'author', attributes: ['id','first_name','last_name','role','profile_photo'] }],
    });
    return res.status(201).json({ success: true, message: 'Update posted.', data: withAuthor });
  } catch (err) { next(err); }
}

async function getProjectUpdates(req, res, next) {
  try {
    const { project_id } = req.params;
    const updates = await ProjectUpdate.findAll({
      where: { project_id },
      include: [{ model: User, as: 'author', attributes: ['id','first_name','last_name','role','profile_photo'] }],
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    return res.status(200).json({ success: true, message: 'Updates fetched.', data: updates });
  } catch (err) { next(err); }
}

// ─── PROJECT MESSAGES (manager announces / queries; team replies) ─────────────

async function postProjectMessage(req, res, next) {
  try {
    const { project_id } = req.params;
    const { message, type, target_user_id } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message required.', errors: [] });
    }

    const project = await Project.findByPk(project_id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.', errors: [] });

    // Only manager can post announcements/queries (not replies)
    if (req.user.id !== project.manager_id && (type === 'announcement' || type === 'query')) {
      return res.status(403).json({ success: false, message: 'Only the project manager can post announcements or queries.', errors: [] });
    }

    const msg = await ProjectMessage.create({
      project_id,
      sender_id: req.user.id,
      target_user_id: target_user_id || null,
      parent_id: null,
      message: message.trim(),
      type: type || 'announcement',
    });

    // Notify — broadcast or specific
    const members = await TeamMember.findAll({ where: { team_id: project.team_id } });
    const sender = await User.findByPk(req.user.id, { attributes: ['first_name','last_name'] });
    const senderName = `${sender.first_name} ${sender.last_name}`;
    const typeLabel = type === 'query' ? '❓ Query' : '📢 Announcement';
    const notifTitle = `${typeLabel}: ${project.name}`;
    const notifMsg = `${senderName}: ${message.substring(0, 80)}`;

    if (target_user_id) {
      // Specific member notification
      await createNotification({
        userId: parseInt(target_user_id),
        title: notifTitle,
        message: notifMsg,
        type: 'general',
        navigateTo: '/my-projects',
      });
    } else {
      // Notify all team members
      for (const m of members) {
        if (m.user_id !== req.user.id) {
          await createNotification({
            userId: m.user_id,
            title: notifTitle,
            message: notifMsg,
            type: 'general',
            navigateTo: '/my-projects',
          });
        }
      }
    }

    const withSender = await ProjectMessage.findByPk(msg.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id','first_name','last_name','role'] },
        { model: User, as: 'targetUser', attributes: ['id','first_name','last_name'], required: false },
        { model: ProjectMessage, as: 'replies' },
      ],
    });
    return res.status(201).json({ success: true, message: 'Message posted.', data: withSender });
  } catch (err) { next(err); }
}

async function replyToMessage(req, res, next) {
  try {
    const { project_id, message_id } = req.params;
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Reply message required.', errors: [] });
    }

    const parent = await ProjectMessage.findByPk(message_id, {
      include: [{ model: User, as: 'sender', attributes: ['id','first_name','last_name'] }],
    });
    if (!parent) return res.status(404).json({ success: false, message: 'Message not found.', errors: [] });

    const project = await Project.findByPk(project_id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.', errors: [] });

    // Verify user is a member or manager
    const isMember = await TeamMember.findOne({ where: { team_id: project.team_id, user_id: req.user.id } });
    const isManager = project.manager_id === req.user.id;
    if (!isMember && !isManager) {
      return res.status(403).json({ success: false, message: 'Not a member of this project.', errors: [] });
    }

    const reply = await ProjectMessage.create({
      project_id,
      sender_id: req.user.id,
      target_user_id: null,
      parent_id: message_id,
      message: message.trim(),
      type: 'reply',
    });

    // Notify the original sender (if not same person)
    if (parent.sender_id !== req.user.id) {
      const replier = await User.findByPk(req.user.id, { attributes: ['first_name','last_name'] });
      await createNotification({
        userId: parent.sender_id,
        title: `Reply on ${project.name}`,
        message: `${replier.first_name} ${replier.last_name} replied: ${message.substring(0, 80)}`,
        type: 'general',
        navigateTo: `/teams/${project.team_id}`,
      });
    }

    const withSender = await ProjectMessage.findByPk(reply.id, {
      include: [{ model: User, as: 'sender', attributes: ['id','first_name','last_name','role'] }],
    });
    return res.status(201).json({ success: true, message: 'Reply posted.', data: withSender });
  } catch (err) { next(err); }
}

async function getProjectMessages(req, res, next) {
  try {
    const { project_id } = req.params;
    const messages = await ProjectMessage.findAll({
      where: { project_id, parent_id: null },
      include: [
        { model: User, as: 'sender', attributes: ['id','first_name','last_name','role'] },
        { model: User, as: 'targetUser', attributes: ['id','first_name','last_name'], required: false },
        { model: ProjectMessage, as: 'replies', order: [['created_at','ASC']],
          include: [{ model: User, as: 'sender', attributes: ['id','first_name','last_name','role'] }] },
      ],
      order: [['created_at', 'DESC']],
    });
    return res.status(200).json({ success: true, message: 'Messages fetched.', data: messages });
  } catch (err) { next(err); }
}

// ─── EMPLOYEE self-service ────────────────────────────────────────────────────

async function getMyProjects(req, res, next) {
  try {
    // Get all teams this employee belongs to
    const memberships = await TeamMember.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Team, as: 'team',
        include: [{
          model: Project, as: 'projects',
          include: [
            { model: ProjectUpdate, as: 'updates', limit: 5, order: [['created_at','DESC']],
              include: [{ model: User, as: 'author', attributes: ['id','first_name','last_name','role'] }] },
            { model: ProjectMessage, as: 'messages', where: { parent_id: null }, required: false,
              order: [['created_at','DESC']],
              include: [
                { model: User, as: 'sender', attributes: ['id','first_name','last_name','role'] },
                { model: User, as: 'targetUser', attributes: ['id','first_name','last_name'], required: false },
                { model: ProjectMessage, as: 'replies', order: [['created_at','ASC']],
                  include: [{ model: User, as: 'sender', attributes: ['id','first_name','last_name','role'] }] },
              ] },
            { model: User, as: 'manager', attributes: ['id','first_name','last_name'] },
          ],
        }],
      }],
    });

    const data = memberships.map(m => ({
      membership: {
        id: m.id, tech_role: m.tech_role,
        responsibilities: m.responsibilities,
        member_deadline: m.member_deadline,
        joined_at: m.joined_at,
      },
      team: { id: m.team.id, name: m.team.name, color: m.team.color },
      projects: m.team.projects,
    }));

    return res.status(200).json({ success: true, message: 'My projects fetched.', data });
  } catch (err) { next(err); }
}

async function getProjectDetailForMember(req, res, next) {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id, {
      include: [
        { model: Team, as: 'team',
          include: [{ model: TeamMember, as: 'members',
            include: [{ model: User, as: 'employee', attributes: ['id','first_name','last_name','role','profile_photo'] }] }] },
        { model: User, as: 'manager', attributes: ['id','first_name','last_name'] },
        { model: ProjectUpdate, as: 'updates', order: [['created_at','DESC']], limit: 50,
          include: [{ model: User, as: 'author', attributes: ['id','first_name','last_name','role','profile_photo'] }] },
        { model: ProjectMessage, as: 'messages', where: { parent_id: null }, required: false,
          order: [['created_at','DESC']],
          include: [
            { model: User, as: 'sender', attributes: ['id','first_name','last_name','role'] },
            { model: User, as: 'targetUser', attributes: ['id','first_name','last_name'], required: false },
            { model: ProjectMessage, as: 'replies', order: [['created_at','ASC']],
              include: [{ model: User, as: 'sender', attributes: ['id','first_name','last_name','role'] }] },
          ] },
      ],
    });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.', errors: [] });

    // Confirm user is a member or manager
    const isMember = await TeamMember.findOne({ where: { team_id: project.team_id, user_id: req.user.id } });
    const isManager = project.manager_id === req.user.id;
    if (!isMember && !isManager) {
      return res.status(403).json({ success: false, message: 'Access denied.', errors: [] });
    }

    // Also fetch this member's own details
    let myMembership = null;
    if (isMember) {
      myMembership = await TeamMember.findOne({
        where: { team_id: project.team_id, user_id: req.user.id },
      });
    }

    return res.status(200).json({ success: true, message: 'Project fetched.', data: { ...project.toJSON(), myMembership } });
  } catch (err) { next(err); }
}

// ─── MANAGER OVERVIEW ────────────────────────────────────────────────────────

async function getTeamProgress(req, res, next) {
  try {
    const teams = await Team.findAll({
      where: { manager_id: req.user.id },
      include: [
        { model: TeamMember, as: 'members',
          include: [{ model: User, as: 'employee', attributes: ['id','first_name','last_name','work_email','role','profile_photo'] }] },
        { model: Project, as: 'projects',
          include: [
            { model: ProjectUpdate, as: 'updates', limit: 3, order: [['created_at','DESC']],
              include: [{ model: User, as: 'author', attributes: ['id','first_name','last_name'] }] },
          ] },
      ],
    });

    const summary = teams.map(team => ({
      team: { id: team.id, name: team.name, color: team.color },
      memberCount: team.members.length,
      members: team.members,
      projectCount: team.projects.length,
      projects: team.projects.map(p => ({
        id: p.id, name: p.name, status: p.status, tech_stack: p.tech_stack,
        start_date: p.start_date, end_date: p.end_date,
        recentUpdates: p.updates,
      })),
    }));
    return res.status(200).json({ success: true, message: 'Team progress fetched.', data: summary });
  } catch (err) { next(err); }
}

module.exports = {
  createTeam, getMyTeams, getTeamById, updateTeam, deleteTeam,
  addMember, removeMember, updateMemberRole,
  createProject, getProjectDetail, updateProject, deleteProject,
  addProjectUpdate, getProjectUpdates,
  postProjectMessage, replyToMessage, getProjectMessages,
  getMyProjects, getProjectDetailForMember, getTeamProgress,
};
