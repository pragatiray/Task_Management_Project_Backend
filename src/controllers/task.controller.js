import Task from "../models/task.model.js";

// ── CREATE ────────────────────────────────────────────────────
export const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assignedTo, remarks } = req.body;

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      remarks,                               // ✅ add remarks
      createdBy: req.user._id,               // who created it
      assignedTo: assignedTo ?? req.user._id, // who does it — default self
      assignedBy: req.user._id,              // who assigned it
    });

    const populated = await task.populate([
      { path: "createdBy", select: "name email" },
      { path: "assignedTo", select: "name email" },
      { path: "assignedBy", select: "name email" },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// ── LIST (search + filter + pagination + role scope) ──────────
export const listTasks = async (req, res) => {
  try {
    console.log("List tasks for user:", req.user); 
    const { search, status, priority, page = 1, limit = 10 } = req.query;

    // 1️⃣ Role-based filter
    const filter = req.user.role === 'admin'
      ? {}  // admin sees all tasks
      : { createdBy: req.user._id };  // normal user sees only their tasks

    // 2️⃣ Add search filter (if provided)
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // 3️⃣ Add status and priority filters
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // 4️⃣ Pagination
    const skip = (page - 1) * limit;
    const total = await Task.countDocuments(filter);

    // 5️⃣ Fetch tasks
    const tasks = await Task.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ dueDate: 1 })
      .skip(Number(skip))
      .limit(Number(limit));

    // 6️⃣ Response
    res.json({
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        tasks,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET ONE ───────────────────────────────────────────────────
export const getTask = async (req, res) => {
  try {
    const { id } = req.params;
    let filter;
    if (req.user.role === 'admin') {
      // Admin sees ALL tasks
      filter = { _id: id };
    } else {
      // User sees only: their created tasks OR assigned tasks
      filter = {
        _id: id,
        $or: [
          { createdBy: req.user._id },  // Tasks they created
          { assignedTo: req.user._id }  // Tasks assigned to them
        ]
      };
    }

    const task = await Task.findOne(filter)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!task) {
      return res.status(404).json({ 
        success: false,
        error: 'Task not found or access denied' 
      });
    }

    // // 📊 Permissions for frontend
    // const permissions = {
    //   canEdit: req.user.role === 'admin' || 
    //            req.user._id.toString() === task.createdBy._id.toString(),
    //   canDelete: req.user.role === 'admin' || 
    //              req.user._id.toString() === task.createdBy._id.toString(),
    //   isOwner: req.user._id.toString() === task.createdBy._id.toString(),
    //   isAssignee: req.user._id.toString() === task.assignedTo?._id?.toString()
    // };

    res.json({
      success: true,
      task,
      // permissions
        });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
};

// ── UPDATE ────────────────────────────────────────────────────
export const updateTask = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Admins only' });
    }

    const updates = { ...req.body };

    // Update task by ID
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task updated successfully', task });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── DELETE ────────────────────────────────────────────────────
export const deleteTask = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Admins only' });
    }

    // Delete task by ID
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
