const Group = require("../models/groupSchema");


const {User} = require("../models/schema");

exports.createGroup = async (req, res) => {
  const { name, invitees } = req.body;

  if (!name || !Array.isArray(invitees)) {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    // Get current user
    const currentUser = await User.findById(req.userId);

    // Find invitee users by email, excluding current user
    const invitedUsers = await User.find({
      email: { $in: invitees },
      _id: { $ne: req.userId }
    });

    const invitedUserIds = invitedUsers.map(user => user._id);

    const group = new Group({
      name,
      admin: req.userId,
      members: [req.userId], // Only creator for now
      pendingInvites: invitedUserIds, // Others will accept
    });

    await group.save();

    res.status(201).json({ message: "Group created", group });
  } catch (err) {
    console.error("Group creation failed:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [
        { admin: req.userId },
        { members: req.userId },
        { pendingInvites: req.userId },
      ],
    })
      .populate("admin", "name email")
      .populate("members", "name email")
      .lean(); // use .lean() to modify the object directly

    const enrichedGroups = groups.map(group => ({
      ...group,
      isPendingInvite: group.pendingInvites.some(
        id => id.toString() === req.userId
      ),
    }));

    res.status(200).json(enrichedGroups);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch groups",
      error: err.message,
    });
  }
};

// GET /auth/group/:groupId
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate("admin", "name email")
      .populate("members", "name email");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.status(200).json(group);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch group", error: err.message });
  }
};


exports.acceptInvite = async (req, res) => {
  const groupId = req.params.groupId;
  const userId = req.userId;

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ message: "Group not found" });

  if (!group.pendingInvites.includes(userId)) {
    return res.status(400).json({ message: "No invite for this user" });
  }

  
  group.pendingInvites = group.pendingInvites.filter(id => id.toString() !== userId);
  group.members.push(userId);

  await group.save();
  res.status(200).json({ message: "Invite accepted", group });
};


