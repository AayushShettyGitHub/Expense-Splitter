const Group = require("../models/groupSchema");
const Split= require("../models/splitSchema");

const {User} = require("../models/schema");

exports.createGroup = async (req, res) => {
  const { name, invitees } = req.body;

  if (!name || !Array.isArray(invitees)) {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
 
    const currentUser = await User.findById(req.userId);

    
    const invitedUsers = await User.find({
      email: { $in: invitees },
      _id: { $ne: req.userId }
    });

    const invitedUserIds = invitedUsers.map(user => user._id);

    const group = new Group({
      name,
      admin: req.userId,
      members: [req.userId], 
      pendingInvites: invitedUserIds,
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
    const groupId = req.params.id;
    console.log("Requested group ID:", groupId);

    const group = await Group.findById(groupId)
      .populate('admin', 'name')
      .populate('members', 'name')
      .lean();

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const expenses = await Split.find({ group: groupId })
      .populate({ path: 'paidBy', select: 'name' })
      .populate({ path: 'splitBetween', select: 'name' })
      .lean();

    console.log("Expenses with populated fields:", JSON.stringify(expenses, null, 2));

    group.expenses = expenses;

    res.status(200).json(group);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch group", error: err.message });
  }
};



exports.acceptInvite = async (req, res) => {
  const groupId = req.params.id;
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


exports.sendInvite = async (req, res) => {
  const { email } = req.body;
  const groupId = req.params.id;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const userToInvite = await User.findOne({ email });
    if (!userToInvite) {
      return res.status(404).json({ message: "User not found" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    
    const isMember = group.members.includes(userToInvite._id);
    const isPending = group.pendingInvites.includes(userToInvite._id);

    if (isMember) {
      return res.status(400).json({ message: "User is already a member" });
    }
    if (isPending) {
      return res.status(400).json({ message: "User already invited" });
    }

    
    group.pendingInvites.push(userToInvite._id);
    await group.save();

    res.status(200).json({ message: "Invite sent", group });
  } catch (err) {
    console.error("Failed to send invite:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



exports.kickUser = async (req, res) => {
  const groupId = req.params.groupId;
  const userIdToKick = req.params.userId;
  const currentUserId = req.userId;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.admin.toString() !== currentUserId) {
      return res.status(403).json({ message: "Only the admin can kick members" });
    }

    if (userIdToKick === currentUserId) {
      return res.status(400).json({ message: "Admin cannot kick themselves" });
    }

    const isMember = group.members.includes(userIdToKick);
    const isPending = group.pendingInvites.includes(userIdToKick);

    if (!isMember && !isPending) {
      return res.status(400).json({ message: "User is not in the group" });
    }

    group.members = group.members.filter(id => id.toString() !== userIdToKick);
    group.pendingInvites = group.pendingInvites.filter(id => id.toString() !== userIdToKick);

    await group.save();

    res.status(200).json({ message: "User removed from group", group });
  } catch (err) {
    console.error("Failed to remove user:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
