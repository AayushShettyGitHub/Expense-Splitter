const Group = require("../models/groupSchema");
const Split = require("../models/splitSchema");
const Event = require("../models/Event");
const Settlement = require("../models/settlement");
const { User } = require("../models/schema");

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

    const group = await Group.create({
      name,
      admin: req.userId,
      members: [req.userId], 
      pendingInvites: invitedUserIds,
    });

    res.status(201).json({ message: "Group created successfully", group });
  } catch (err) {
    res.status(500).json({ message: "Failed to create group" });
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
      .lean(); 

    const myGroups = groups.map(group => ({
      ...group,
      isPendingInvite: group.pendingInvites.some(
        id => id.toString() === req.userId
      ),
    }));

    res.status(200).json(myGroups);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch groups" });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const groupId = req.params.id;
    const group = await Group.findById(groupId)
      .populate('admin', 'name')
      .populate('members', 'name')
      .lean();

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.status(200).json(group);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch group particulars" });
  }
};

exports.acceptInvite = async (req, res) => {
  const groupId = req.params.id;
  const userId = req.userId;

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.pendingInvites.includes(userId)) {
      return res.status(400).json({ message: "Invite not found" });
    }

    group.pendingInvites = group.pendingInvites.filter(id => id.toString() !== userId);
    group.members.push(userId);

    await group.save();
    res.status(200).json({ message: "Invite accepted", group });
  } catch (err) {
    res.status(500).json({ message: "Error accepting invite" });
  }
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
      return res.status(400).json({ message: "User is already invited" });
    }

    group.pendingInvites.push(userToInvite._id);
    await group.save();
    res.status(200).json({ message: "Invite sent successfully", group });
  } catch (err) {
    res.status(500).json({ message: "Failed to send invitation" });
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
      return res.status(403).json({ message: "Only administrators can remove members" });
    }

    if (userIdToKick === currentUserId) {
      return res.status(400).json({ message: "You cannot remove yourself as an administrator" });
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
    res.status(500).json({ message: "Failed to remove user" });
  }
};

exports.createEvent = async (req, res) => {
  const { groupId } = req.params;
  const { name, members, startDate, endDate } = req.body;

  if (!name || !Array.isArray(members)) {
    return res.status(400).json({ message: "Please provide valid trip details" });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.admin.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Only administrators can create trips" });
    }
    const eventMembers = await User.find({ _id: { $in: members } });
    const eventMemberIds = eventMembers.map(user => user._id);
    let event = new Event({
      group: groupId,
      name,
      members: eventMemberIds,
      startDate,
      endDate
    });

    await event.save();
    event = await Event.findById(event._id).populate("members", "name email");

    res.status(201).json({ message: "Trip created successfully", event });
  } catch (err) {
    res.status(500).json({ message: "Failed to create trip" });
  }
};

exports.getEventsByGroup = async (req, res) => {
  const { groupId } = req.params;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const events = await Event.find({ group: groupId })
      .populate("members", "name email")
      .lean();

    res.status(200).json({ groupId, events });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch trips" });
  }
};

exports.setActiveEvent = async (req, res) => {
  try {
    const { groupId, eventId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.admin.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Only administrators can activate trips" });
    }

    if (!group.activeEvents.includes(eventId)) {
      group.activeEvents.push(eventId);
      await group.save();
    }

    res.json({
      message: "Trip is now active",
      activeEvents: group.activeEvents
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to activate trip" });
  }
};

exports.removeActiveEvent = async (req, res) => {
  try {
    const { groupId, eventId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.admin.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Only administrators can deactivate trips" });
    }

    group.activeEvents = group.activeEvents.filter(id => id.toString() !== eventId);
    await group.save();

    res.json({ message: "Trip deactivated", activeEvents: group.activeEvents });
  } catch (error) {
    res.status(500).json({ message: "Failed to deactivate trip" });
  }
};

exports.getActiveEvents = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId).populate("activeEvents");
    if (!group) return res.status(404).json({ message: "Group not found" });

    res.json(group.activeEvents);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch active trip history" });
  }
};

exports.getUserActiveEvents = async (req, res) => {
  try {
    const userId = req.userId;
    const groups = await Group.find({ members: userId })
      .select("name activeEvents")
      .populate("activeEvents", "name group"); 

    if (!groups.length) {
      return res.status(200).json([]);
    }

    const activeEvents = [];
    groups.forEach((group) => {
      group.activeEvents.forEach((event) => {
        activeEvents.push({
          _id: event._id,
          name: event.name,
          group: { _id: group._id, name: group.name },
        });
      });
    });

    res.status(200).json(activeEvents);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch your active trips" });
  }
};

exports.setTargetEvent = async (req, res) => {
  try {
    const userId = req.userId; 
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ message: "Trip selection is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const event = await Event.findById(eventId).select("group");
    if (!event) {
      return res.status(404).json({ message: "Trip not found" });
    }
    if (user.targetEvent?.toString() === eventId) {
      user.targetEvent = null;
    } else {
      user.targetEvent = eventId;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: user.targetEvent ? "Focused on new trip" : "Focus removed",
      targetEvent: user.targetEvent,
      grpId: user.targetEvent ? event.group : null, 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Focus change failed" });
  }
};

exports.deleteEvent = async (req, res) => {
  const { groupId, eventId } = req.params;
  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.admin.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Only administrators can delete trips" });
    }

    await Event.findByIdAndDelete(eventId);
    await Split.deleteMany({ event: eventId });
    await Settlement.deleteMany({ event: eventId });

    res.json({ message: "Trip history permanently deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete trip history" });
  }
};
