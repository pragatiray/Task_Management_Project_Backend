import Task from "../models/task.model.js";

// Create Task
export const createTask = async (req, res) => {
  const task = await Task.create({
    ...req.body,
    createdBy: req.user.id,
  });

  res.json(task);
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

// Update Task
export const updateTask = async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) return res.status(404).json({ message: "Not found" });

  if (
    req.user.role !== "admin" &&
    task.createdBy.toString() !== req.user.id &&
    task.assignedTo?.toString() !== req.user.id
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }

  Object.assign(task, req.body);
  await task.save();

  res.json(task);
};

// Delete Task
export const deleteTask = async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) return res.status(404).json({ message: "Not found" });

  if (
    req.user.role !== "admin" &&
    task.createdBy.toString() !== req.user.id
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await task.deleteOne();

  res.json({ message: "Deleted" });
};