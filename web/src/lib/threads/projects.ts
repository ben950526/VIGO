/**
 * Threads 工作室帳號（@blazeatlas.studio）替哪些專案發文。
 * 值要和 038_threads_project.sql 的 check 一致。
 */
export const THREADS_PROJECTS = ["vigo", "med", "storybook", "logicgym"] as const;

export type ThreadsProject = (typeof THREADS_PROJECTS)[number];

export const THREADS_PROJECT_LABEL: Record<ThreadsProject, string> = {
  vigo: "Vigo",
  med: "吃藥小幫手",
  storybook: "我們的故事書",
  logicgym: "Logic Gym",
};

export function isThreadsProject(value: unknown): value is ThreadsProject {
  return typeof value === "string" && (THREADS_PROJECTS as readonly string[]).includes(value);
}

/** 防封：帶連結的貼文，最近幾篇內只能有 1 篇（含這篇共 4 篇） */
export const LINK_POST_WINDOW = 4;

/** 主文或留言裡有沒有網址（含沒寫 https 的網域） */
export function containsLink(...texts: (string | null | undefined)[]): boolean {
  return texts.some(
    (text) =>
      !!text &&
      /(https?:\/\/|www\.|\b[a-z0-9-]+\.(?:vercel\.app|workers\.dev|com|tw|io|app|net|org)\b)/i.test(text),
  );
}
