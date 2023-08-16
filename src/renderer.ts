import { App } from "obsidian";
import { ISettings } from "./settings";
import { ISubTask, ITask } from "./things";
import { getTab } from "./textUtils";

export class LogbookRenderer {
  private app: App;
  private settings: ISettings;

  constructor(app: App, settings: ISettings) {
    this.app = app;
    this.settings = settings;
    this.renderTask = this.renderTask.bind(this);
  }

  renderTask(task: ITask): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vault = this.app.vault as any;
    const tab = getTab(vault.getConfig("useTab"), vault.getConfig("tabSize"));
    const prefix = this.settings.tagPrefix;

    const tags = task.tags
      .filter((tag) => !!tag)
      .map((tag) => tag.replace(/\s+/g, "-").toLowerCase())
      .map((tag) => `#${prefix}${tag}`)
      .join(" ");

    const taskTitle =
      `${task.title} [ ](things:///show?id=${task.uuid}) ${tags}`.trimEnd();

    const notes = this.settings.doesSyncNoteBody
      ? String(task.notes || "")
          .trimEnd()
          .split("\n")
          .filter((line) => !!line)
          .map((noteLine) => `${tab}${noteLine}`)
      : "";

    // TODO: Bring this into the settings
    let mark = "x";
    if (task.cancelled) {
      mark = this.settings.canceledMark;
    } else if (task.tags.includes("Meeting") || task.tags.includes("Call")) {
      mark = '"';
    } else if (task.tags.includes("Event")) {
      mark = "l";
    } else if (task.tags.includes("Journal")) {
      mark = "i";
    } else if (task.tags.includes("Idea")) {
      mark = "I";
    } else if (task.tags.includes("Book")) {
      mark = "b";
    } else if (task.tags.includes("Notable")) {
      mark = '"';
    } else if (task.tags.includes("Positive")) {
      mark = "u";
    } else if (task.tags.includes("Negative")) {
      mark = "d";
    } else if (task.tags.includes("Question")) {
      mark = "?";
    }

    return [
      `- [${mark}] ${taskTitle}`,
      ...notes,
      ...task.subtasks.map(
        (subtask: ISubTask) =>
          `${tab}- [${subtask.completed ? "x" : " "}] ${subtask.title}`
      ),
    ]
      .filter((line) => !!line)
      .join("\n");
  }

  public render(tasks: ITask[]): string {
    const { sectionHeading } = this.settings;

    const output = [sectionHeading];
    const projects: Record<string, ITask> = {};
    tasks.forEach((task) => {
      if (task.type == "1") {
        projects[task.title] = task;
      }
    });

    tasks.forEach((task) => {
      // If a tasks project is completed today, don't include it
      const project = projects[task.project];
      if (project) {
        return;
      }

      // Task is a heading and not an actual task
      if (task.type == "2") {
        return;
      }

      output.push(this.renderTask(task));
    });

    return output.join("\n");
  }
}
