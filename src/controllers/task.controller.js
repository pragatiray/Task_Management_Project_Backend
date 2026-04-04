import Task from "../models/task.model.js";

// ── CREATE ────────────────────────────────────────────────────
export const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assignedTo } = req.body;
    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      createdBy:  req.user._id,              // who created it
      assignedTo: assignedTo ?? req.user._id, // who does it — default self
      assignedBy: req.user._id,              // who assigned it
    });
     const populated = await task.populate([
      { path: "createdBy",  select: "name email" },
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
    const { search, status, priority, page = 1, limit = 10 } = req.query;
    const filter = {
      ...scopeByRole(req.user),
      ...buildFilters({ search, status, priority }),
    };

    const skip  = (page - 1) * limit;
    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .populate('createdBy',  'name email')
      .populate('assignedTo', 'name email')
      .sort({ dueDate: 1 })
      .skip(Number(skip))
      .limit(Number(limit));

    res.json({
      total,
      page:  Number(page),
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
    const task = await Task.findOne({
      _id: req.params.id,
      ...scopeByRole(req.user),
    })
      .populate('createdBy',  'name email')
      .populate('assignedTo', 'name email');

    if (!task) return res.status(404).json({ error: 'Task not found or access denied' });

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── UPDATE ────────────────────────────────────────────────────
export const updateTask = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Only admins can reassign a task to someone else
    if (updates.assignedTo && req.user.role !== 'admin') {
      delete updates.assignedTo;
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, ...scopeByRole(req.user) },
      updates,
      { new: true, runValidators: true }
    );

    if (!task) return res.status(404).json({ error: 'Task not found or access denied' });

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── DELETE ────────────────────────────────────────────────────
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      ...scopeByRole(req.user),
    });

    if (!task) return res.status(404).json({ error: 'Task not found or access denied' });

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// Get Tasks (with filters + pagination)
export const getTasks = async (req, res) => {
  const { page = 1, limit = 10, status, priority, search } = req.query;

  let query = {};

  // Role-based access
  if (req.user.role !== "admin") {
    query.$or = [
      { createdBy: req.user.id },
      { assignedTo: req.user.id },
    ];
  }

  if (status) query.status = status;
  if (priority) query.priority = priority;

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const tasks = await Task.find(query)
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json(tasks);
};

// // Update Task
// export const updateTask = async (req, res) => {
//   const task = await Task.findById(req.params.id);

//   if (!task) return res.status(404).json({ message: "Not found" });

//   if (
//     req.user.role !== "admin" &&
//     task.createdBy.toString() !== req.user.id &&
//     task.assignedTo?.toString() !== req.user.id
//   ) {
//     return res.status(403).json({ message: "Forbidden or access denied" });
//   }

//   Object.assign(task, req.body);
//   await task.save();

//   res.json(task);
// };

// // Delete Task
// export const deleteTask = async (req, res) => {
//   const task = await Task.findById(req.params.id);

//   if (!task) return res.status(404).json({ message: "Not found" });

//   if (
//     req.user.role !== "admin" &&
//     task.createdBy.toString() !== req.user.id
//   ) {
//     return res.status(403).json({ message: "Forbidden" });
//   }

//   await task.deleteOne();

//   res.json({ message: "Deleted" });
// };