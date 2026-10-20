import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router";
import type { AuthUser } from "../data/auth";
import {
  addFolder,
  addList,
  deleteFolder,
  deleteList,
  updateFolder,
  updateList,
  useFolders,
  useLists,
} from "../data/lists";
import { LIST_COLORS, type ListColor, listColorCss, sortByOrder } from "../domain/lists";
import { movedSortOrder, nextSortOrder } from "../domain/tasks";
import { Icon } from "../icons";
import { Grip, useReorder } from "../reorder";

// Lists screen: Inbox, top-level lists, and folders (with their lists nested). Create/rename/
// delete/reorder/move-to-folder/color live here, behind each row's edit button.
export function Lists({ user }: { user: AuthUser }) {
  const lists = useLists(user.uid);
  const folders = useFolders(user.uid);
  const topLists = sortByOrder(lists.filter((l) => !l.isInbox && l.folderId === null));
  const sortedFolders = sortByOrder(folders);
  // ponytail: not persisted; per-device localStorage if folders should stay collapsed across visits
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setCollapsed((c) => {
      const next = new Set(c);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  // One modal serves create-list, create-project and edit-project.
  type Dialog =
    | { kind: "list"; folderId: string | null }
    | { kind: "project"; folder?: (typeof folders)[number] };
  const [dialog, setDialog] = useState<Dialog | null>(null);

  const folderReorder = useReorder(sortedFolders.length, (from, to) => {
    const sortOrder = movedSortOrder(sortedFolders, from, to);
    const folder = sortedFolders[from];
    if (sortOrder !== null && folder) updateFolder(folder.id, { sortOrder });
  });

  return (
    <div className="stack">
      <h1>
        Lists <span className="faint">{lists.length}</span>
      </h1>
      <section className="card lists">
        <div className="list-row">
          <span />
          <span className="swatch big" style={{ background: "var(--list-slate)" }} />
          <NavLink to="/" end className="list-name">
            Inbox
          </NavLink>
        </div>
        <div className="list-row">
          <span />
          <span className="swatch big" style={{ background: "var(--list-amber)" }} />
          <NavLink to="/today" className="list-name">
            Today
          </NavLink>
        </div>
        <ListGroup lists={topLists} folders={folders} />

        <div>
          {sortedFolders.map((folder, i) => {
            const folderLists = sortByOrder(lists.filter((l) => l.folderId === folder.id));
            return (
              <div key={folder.id} className="folder" {...folderReorder.row(i)}>
                <div className="folder-row">
                  <button {...folderReorder.handle(i, `project ${folder.name}`)}>
                    <Grip />
                  </button>
                  <button
                    type="button"
                    className="week-toggle folder-name"
                    aria-expanded={!collapsed.has(folder.id)}
                    onClick={() => toggle(folder.id)}
                  >
                    <Icon name="down" size={14} />
                    {folder.name}
                  </button>
                  <button
                    type="button"
                    className="ghost icon"
                    aria-label={`Edit project ${folder.name}`}
                    onClick={() => setDialog({ kind: "project", folder })}
                  >
                    <Icon name="edit" size={15} />
                  </button>
                  <button
                    type="button"
                    className="ghost icon"
                    aria-label={`Delete project ${folder.name}`}
                    title="Delete project, keep its lists"
                    onClick={() => deleteFolder(folder.id)}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
                {folder.description && <p className="muted folder-desc">{folder.description}</p>}
                {!collapsed.has(folder.id) && (
                  <div className="folder-lists">
                    <ListGroup lists={folderLists} folders={folders} />
                    <button
                      type="button"
                      className="link"
                      onClick={() => setDialog({ kind: "list", folderId: folder.id })}
                    >
                      <Icon name="plus" size={12} /> New list in {folder.name}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
      <div className="button-row">
        <button
          type="button"
          className="outline"
          onClick={() => setDialog({ kind: "list", folderId: null })}
        >
          <Icon name="plus" size={12} /> New list
        </button>
        <button type="button" className="outline" onClick={() => setDialog({ kind: "project" })}>
          <Icon name="plus" size={12} /> New project
        </button>
      </div>
      {dialog?.kind === "list" && (
        <NameDialog
          title="New list"
          onClose={() => setDialog(null)}
          onSave={(name, description) =>
            addList(
              { ownerId: user.uid, name, description, folderId: dialog.folderId },
              nextSortOrder(lists.filter((l) => l.folderId === dialog.folderId)),
            )
          }
        />
      )}
      {dialog?.kind === "project" && (
        <NameDialog
          title={dialog.folder ? "Edit project" : "New project"}
          name={dialog.folder?.name}
          description={dialog.folder?.description}
          onClose={() => setDialog(null)}
          onSave={(name, description) =>
            dialog.folder
              ? updateFolder(dialog.folder.id, { name, description })
              : addFolder(user.uid, name, nextSortOrder(folders), description)
          }
        />
      )}
    </div>
  );
}

// Native modal <dialog> with a name and an optional description.
function NameDialog({
  title,
  name = "",
  description = "",
  onSave,
  onClose,
}: {
  title: string;
  name?: string;
  description?: string;
  onSave: (name: string, description: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => ref.current?.showModal(), []);
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape already closes a modal dialog; the click is only the backdrop.
    <dialog
      ref={ref}
      className="modal"
      aria-label={title}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
    >
      <form
        className="modal-form"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const trimmed = String(data.get("name")).trim();
          if (!trimmed) return;
          onSave(trimmed, String(data.get("description")).trim());
          ref.current?.close();
        }}
      >
        <h2>{title}</h2>
        <label className="field">
          <span>Name</span>
          <input name="name" defaultValue={name} required />
        </label>
        <label className="field">
          <span>Description</span>
          <textarea name="description" rows={3} placeholder="Optional" defaultValue={description} />
        </label>
        <div className="button-row">
          <button type="submit" className="primary">
            Save
          </button>
          <button type="button" className="outline" onClick={() => ref.current?.close()}>
            Cancel
          </button>
        </div>
      </form>
    </dialog>
  );
}

// One run of sibling lists (top level, or one folder's), reorderable among themselves.
function ListGroup({
  lists,
  folders,
}: {
  lists: ReturnType<typeof useLists>;
  folders: ReturnType<typeof useFolders>;
}) {
  const reorder = useReorder(lists.length, (from, to) => {
    const sortOrder = movedSortOrder(lists, from, to);
    const list = lists[from];
    if (sortOrder !== null && list) updateList(list.id, { sortOrder });
  });
  return (
    <div className="list-group">
      {lists.map((list, i) => (
        <ListRow key={list.id} list={list} folders={folders} reorder={reorder} index={i} />
      ))}
    </div>
  );
}

function ListRow({
  list,
  folders,
  reorder,
  index,
}: {
  list: ReturnType<typeof useLists>[number];
  folders: ReturnType<typeof useFolders>;
  reorder: ReturnType<typeof useReorder>;
  index: number;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div {...reorder.row(index)}>
      <div className="list-row">
        <button {...reorder.handle(index, list.name)}>
          <Grip />
        </button>
        <span className="swatch big" style={{ background: listColorCss(list.color) }} />
        <div className="list-text">
          <NavLink to={`/list/${list.id}`} className="list-name">
            {list.name}
          </NavLink>
          {list.description && <span className="muted">{list.description}</span>}
        </div>
        <button
          type="button"
          className="ghost icon"
          aria-label={`Edit ${list.name}`}
          aria-expanded={editing}
          onClick={() => setEditing(!editing)}
        >
          <Icon name="edit" size={15} />
        </button>
      </div>
      {editing && (
        <form
          className="list-edit"
          onSubmit={(e) => {
            e.preventDefault();
            // Name and description otherwise save on blur; this catches anything still unsaved.
            const data = new FormData(e.currentTarget);
            const name = String(data.get("name")).trim();
            const description = String(data.get("description")).trim();
            const patch: { name?: string; description?: string } = {};
            if (name && name !== list.name) patch.name = name;
            if (description !== (list.description ?? "")) patch.description = description;
            if (Object.keys(patch).length) updateList(list.id, patch);
            setEditing(false);
          }}
        >
          <label className="field">
            <span>Name</span>
            <input
              name="name"
              defaultValue={list.name}
              onBlur={(e) => {
                const name = e.target.value.trim();
                if (name && name !== list.name) updateList(list.id, { name });
              }}
            />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea
              name="description"
              rows={3}
              placeholder="Optional"
              defaultValue={list.description ?? ""}
              onBlur={(e) => {
                const description = e.target.value.trim();
                if (description !== (list.description ?? "")) updateList(list.id, { description });
              }}
            />
          </label>
          <div className="field">
            <span>Color</span>
            <div className="swatches">
              {LIST_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  aria-pressed={list.color === c}
                  onClick={() => updateList(list.id, { color: c as ListColor })}
                >
                  <span className="swatch" style={{ background: listColorCss(c) }} />
                </button>
              ))}
              {/* change fires when the picker closes; React's onChange fires on every drag step. */}
              <label className="custom-swatch" data-selected={list.color.startsWith("#")}>
                <span
                  className="swatch"
                  style={{
                    background: listColorCss(list.color.startsWith("#") ? list.color : "slate"),
                  }}
                />
                <input
                  type="color"
                  aria-label="Custom color"
                  defaultValue={list.color.startsWith("#") ? list.color : "#6366f1"}
                  ref={(el) => {
                    if (el)
                      el.onchange = () => updateList(list.id, { color: el.value as ListColor });
                  }}
                />
              </label>
            </div>
          </div>
          <label className="field">
            <span>Project</span>
            <select
              value={list.folderId ?? ""}
              onChange={(e) => updateList(list.id, { folderId: e.target.value || null })}
            >
              <option value="">No project</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <div className="button-row">
            <button type="submit" className="primary">
              Save changes
            </button>
            <button
              type="button"
              className="outline"
              onClick={() => {
                if (window.confirm(`Delete "${list.name}" and all its tasks?`)) deleteList(list.id);
              }}
            >
              <Icon name="trash" size={15} /> Delete list
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
