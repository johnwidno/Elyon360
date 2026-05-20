const db = require('../models');

/**
 * Get all permissions in a domain
 */
exports.listPermissions = async (req, res) => {
  try {
    const { domain } = req.query;

    const where = {};
    if (domain) {
      where.domain = domain;
    }

    const permissions = await db.Permission.findAll({
      where: { ...where, isActive: true },
      attributes: ['id', 'name', 'displayName', 'description', 'domain', 'category', 'resource', 'action'],
    });

    res.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error('listPermissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list permissions',
    });
  }
};

/**
 * Get all roles for a church (church domain)
 */
exports.listChurchRoles = async (req, res) => {
  try {
    const { churchId } = req.params;

    const roles = await db.Role.findAll({
      where: {
        churchId,
        domain: 'church',
        isActive: true,
      },
      attributes: ['id', 'name', 'displayName', 'description', 'permissionIds', 'isSystemRole'],
    });

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error('listChurchRoles error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list church roles',
    });
  }
};

/**
 * Create a new role for a church
 */
exports.createChurchRole = async (req, res) => {
  try {
    const { churchId } = req.params;
    const { name, displayName, description, permissionIds } = req.body;

    // Validate input
    if (!name || !displayName) {
      return res.status(400).json({
        success: false,
        error: 'name and displayName are required',
      });
    }

    // Check if role already exists
    const existing = await db.Role.findOne({
      where: { churchId, name, domain: 'church' },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Role already exists',
      });
    }

    const role = await db.Role.create({
      churchId,
      name,
      displayName,
      description,
      permissionIds: permissionIds || [],
      domain: 'church',
      isSystemRole: false,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: role,
    });
  } catch (error) {
    console.error('createChurchRole error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create church role',
    });
  }
};

/**
 * Update a role
 */
exports.updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { displayName, description, permissionIds } = req.body;

    const role = await db.Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
      });
    }

    // Prevent modification of system roles
    if (role.isSystemRole) {
      return res.status(403).json({
        success: false,
        error: 'System roles cannot be modified',
      });
    }

    // Update role
    await role.update({
      displayName: displayName || role.displayName,
      description: description !== undefined ? description : role.description,
      permissionIds: permissionIds || role.permissionIds,
      updatedBy: req.user.id,
    });

    res.json({
      success: true,
      data: role,
    });
  } catch (error) {
    console.error('updateRole error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update role',
    });
  }
};

/**
 * Delete a role
 */
exports.deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    const role = await db.Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
      });
    }

    // Prevent deletion of system roles
    if (role.isSystemRole) {
      return res.status(403).json({
        success: false,
        error: 'System roles cannot be deleted',
      });
    }

    // Check if any users have this role
    const userCount = await db.UserRole.count({
      where: { roleId, isActive: true },
    });

    if (userCount > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete role: ${userCount} user(s) have this role`,
      });
    }

    // Soft delete: mark as inactive
    await role.update({ isActive: false });

    res.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    console.error('deleteRole error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete role',
    });
  }
};

/**
 * Assign a role to a user
 */
exports.assignRoleToUser = async (req, res) => {
  try {
    const { userId, roleId } = req.body;
    const { churchId } = req.params;

    // Validate input
    if (!userId || !roleId) {
      return res.status(400).json({
        success: false,
        error: 'userId and roleId are required',
      });
    }

    // Verify role exists and belongs to this church
    const role = await db.Role.findByPk(roleId);
    if (!role || role.churchId !== parseInt(churchId, 10)) {
      return res.status(404).json({
        success: false,
        error: 'Role not found for this church',
      });
    }

    // Verify user exists
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if assignment already exists
    const existing = await db.UserRole.findOne({
      where: { userId, roleId, churchId, isActive: true },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'User already has this role',
      });
    }

    // Create assignment
    const assignment = await db.UserRole.create({
      userId,
      roleId,
      churchId,
      assignedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error('assignRoleToUser error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign role',
    });
  }
};

/**
 * Remove a role from a user
 */
exports.removeRoleFromUser = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await db.UserRole.findByPk(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Role assignment not found',
      });
    }

    // Soft delete: mark as inactive
    await assignment.update({ isActive: false });

    res.json({
      success: true,
      message: 'Role removed successfully',
    });
  } catch (error) {
    console.error('removeRoleFromUser error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove role',
    });
  }
};

/**
 * Get all roles assigned to a user in a church
 */
exports.getUserRolesInChurch = async (req, res) => {
  try {
    const { churchId, userId } = req.params;

    const roles = await db.UserRole.findAll({
      where: { userId, churchId, isActive: true },
      include: [
        {
          model: db.Role,
          as: 'role',
          attributes: ['id', 'name', 'displayName', 'permissionIds'],
        },
      ],
    });

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error('getUserRolesInChurch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user roles',
    });
  }
};

/**
 * Get network roles
 */
exports.listNetworkRoles = async (req, res) => {
  try {
    const { networkId } = req.params;

    const roles = await db.Role.findAll({
      where: {
        networkId,
        domain: 'network',
        isActive: true,
      },
      attributes: ['id', 'name', 'displayName', 'description', 'permissionIds'],
    });

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error('listNetworkRoles error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list network roles',
    });
  }
};
