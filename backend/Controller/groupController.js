const Group = require("../models/groupSchema");
const Split= require("../models/splitSchema");
const Event = require("../models/Event");
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

    const group = await Group.create({
      name,
      admin: req.userId,
      members: [req.userId], 
      pendingInvites: invitedUserIds,
    });

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
      .lean(); 

    const myGroups = groups.map(group => ({
      ...group,
      isPendingInvite: group.pendingInvites.some(
        id => id.toString() === req.userId
      ),
    }));

    res.status(200).json(myGroups);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch groups",
      error: err.message,
    });
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



exports.createEvent = async (req, res) => {
  const { groupId } = req.params;
  const { name, members, startDate, endDate } = req.body;

  if (!name || !Array.isArray(members)) {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.admin.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Only the group admin can create events" });
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

    res.status(201).json({ message: "Event created", event });
  } catch (err) {
    console.error("Event creation failed:", err);
    res.status(500).json({ message: "Server error", error: err.message });
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
    console.error("Failed to fetch events:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



exports.setActiveEvent = async (req, res) => {
  try {
    const { groupId, eventId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.admin.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Only the group admin can set active events" });
    }


    if (!group.activeEvents.includes(eventId)) {
      group.activeEvents.push(eventId);
      await group.save();
    }


    res.json({
      message: "Event set as active",
      activeEvents: group.activeEvents
    });

  } catch (error) {
    console.error("Error in setActiveEvent:", error);
    res.status(500).json({ message: error.message });
  }
};


exports.removeActiveEvent = async (req, res) => {
  try {
    const { groupId, eventId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.admin.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Only the group admin can set active events" });
    }

    group.activeEvents = group.activeEvents.filter(id => id.toString() !== eventId);
    await group.save();

    res.json({ message: "Event removed from active", activeEvents: group.activeEvents });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getActiveEvents = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId).populate("activeEvents");
    if (!group) return res.status(404).json({ message: "Group not found" });

    res.json(group.activeEvents);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    res.status(500).json({
      error: "Failed to fetch active events",
      details: err.message,
    });
  }
};

exports.setTargetEvent = async (req, res) => {
  try {
    const userId = req.userId; 
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const event = await Event.findById(eventId).select("group");
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (user.targetEvent?.toString() === eventId) {
      user.targetEvent = null;
    } else {
      user.targetEvent = eventId;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: user.targetEvent ? "Target event set" : "Target event unset",
      targetEvent: user.targetEvent,
      grpId: user.targetEvent ? event.group : null, 
    });
  } catch (err) {
    console.error("Error setting target event:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
