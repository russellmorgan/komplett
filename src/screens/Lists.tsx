import { useState } from "react";
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
import { LIST_COLORS, type ListColor, sortByOrder } from "../domain/lists";
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

  function createList(folderId: string | null) {
    const name = window.prompt("List name");
    if (!name?.trim()) return;
    addList(
      { ownerId: user.uid, name: name.trim(), folderId },
      nextSortOrder(lists.filter((l) => l.folderId === folderId)),
    );
  }

  function createFolder() {
    const name = window.prompt("Folder name");
    if (!name?.trim()) return;
    addFolder(user.uid, name.trim(), nextSortOrder(folders));
  }

  const folderReorder = useReorder(sortedFolders.length, (from, to) => {
    const sortOrder = movedSortOrder(sortedFolders, from, to);
    const folder = sortedFolders[from];
    if (sortOrder !== null && folder) updateFolder(folder.id, { sortOrder });
  });

  return (
    <div className="stack">
      <h1>Lists</h1>
      <section className="card lists">
        <div className="list-row">
          <span />
          <span className="swatch big" style={{ background: "var(--list-slate)" }} />
          <NavLink to="/" end className="list-name">
            Inbox
          </NavLink>
        </div>
        <ListGroup lists={topLists} folders={folders} />

        <div>
          {sortedFolders.map((folder, i) => {
            const folderLists = sortByOrder(lists.filter((l) => l.folderId === folder.id));
            return (
              <div key={folder.id} className="folder" {...folderReorder.row(i)}>
                <div className="folder-row">
                  <button {...folderReorder.handle(i, `folder ${folder.name}`)}>
                    <Grip />
                  </button>
                  <span className="folder-name">{folder.name}</span>
                  <button
                    type="button"
                    className="ghost icon"
                    aria-label={`Rename folder ${folder.name}`}
                    onClick={() => {
                      const name = window.prompt("Rename folder", folder.name);
                      if (name?.trim()) updateFolder(folder.id, { name: name.trim() });
                    }}
                  >
                    <Icon name="edit" size={15} />
                  </button>
                  <button
                    type="button"
                    className="ghost icon"
                    aria-label={`Delete folder ${folder.name}`}
                    title="Delete folder, keep its lists"
                    onClick={() => deleteFolder(folder.id)}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
                <div className="folder-lists">
                  <ListGroup lists={folderLists} folders={folders} />
                  <button type="button" className="link" onClick={() => createList(folder.id)}>
                    <Icon name="plus" size={12} /> New list in {folder.name}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <div className="button-row">
        <button type="button" className="outline" onClick={() => createList(null)}>
          <Icon name="plus" size={12} /> New list
        </button>
        <button type="button" className="outline" onClick={createFolder}>
          <Icon name="plus" size={12} /> New folder
        </button>
      </div>
    </div>
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
        <span className="swatch big" style={{ background: `var(--list-${list.color})` }} />
        <NavLink to={`/list/${list.id}`} className="list-name">
          {list.name}
        </NavLink>
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
        <div className="list-edit">
          <label className="field">
            <span>Name</span>
            <input
              defaultValue={list.name}
              onBlur={(e) => {
                const name = e.target.value.trim();
                if (name && name !== list.name) updateList(list.id, { name });
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
                  <span className="swatch" style={{ background: `var(--list-${c})` }} />
                </button>
              ))}
            </div>
          </div>
          <label className="field">
            <span>Folder</span>
            <select
              value={list.folderId ?? ""}
              onChange={(e) => updateList(list.id, { folderId: e.target.value || null })}
            >
              <option value="">No folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
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
      )}
    </div>
  );
}
