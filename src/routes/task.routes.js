import express from "express";
import protect from "../middleware/auth.middleware.js";
import {
  createTask,
  listTasks,
  updateTask,
  deleteTask,
  getTask
} from "../controllers/task.controller.js";

const router = express.Router();

router.use(protect);

router.post("/create",createTask);
router.get("/view",listTasks);
router.get("/:id",getTask);

router.patch('/:id', updateTask);

router.delete("/:id", deleteTask);

export default router;