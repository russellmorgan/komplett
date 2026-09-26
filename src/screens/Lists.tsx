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

  function moveFolder(index: number, direction: -1 | 1) {
    const sortOrder = movedSortOrder(sortedFolders, index, direction);
    const folder = sortedFolders[index];
    if (sortOrder !== null && folder) updateFolder(folder.id, { sortOrder });
  }

  function moveList(siblings: typeof lists, index: number, direction: -1 | 1) {
    const sortOrder = movedSortOrder(siblings, index, direction);
    const list = siblings[index];
    if (sortOrder !== null && list) updateList(list.id, { sortOrder });
  }

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
        {topLists.map((list, i) => (
          <ListRow
            key={list.id}
            list={list}
            folders={folders}
            first={i === 0}
            last={i === topLists.length - 1}
            onMove={(dir) => moveList(topLists, i, dir)}
          />
        ))}

        {sortedFolders.map((folder, i) => {
          const folderLists = sortByOrder(lists.filter((l) => l.folderId === folder.id));
          return (
            <div key={folder.id} className="folder">
              <div className="folder-row">
                <Reorder
                  label={`folder ${folder.name}`}
                  first={i === 0}
                  last={i === sortedFolders.length - 1}
                  onMove={(dir) => moveFolder(i, dir)}
                />
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
                {folderLists.map((list, j) => (
                  <ListRow
                    key={list.id}
                    list={list}
                    folders={folders}
                    first={j === 0}
                    last={j === folderLists.length - 1}
                    onMove={(dir) => moveList(folderLists, j, dir)}
                  />
                ))}
                <button type="button" className="link" onClick={() => createList(folder.id)}>
                  <Icon name="plus" size={12} /> New list in {folder.name}
                </button>
              </div>
            </div>
          );
        })}
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

function Reorder({
  label,
  first,
  last,
  onMove,
}: {
  label: string;
  first: boolean;
  last: boolean;
  onMove: (direction: -1 | 1) => void;
}) {
  return (
    <span className="reorder">
      <button
        type="button"
        className="ghost"
        disabled={first}
        onClick={() => onMove(-1)}
        aria-label={`Move ${label} up`}
      >
        <Icon name="up" size={12} />
      </button>
      <button
        type="button"
        className="ghost"
        disabled={last}
        onClick={() => onMove(1)}
        aria-label={`Move ${label} down`}
      >
        <Icon name="down" size={12} />
      </button>
    </span>
  );
}

function ListRow({
  list,
  folders,
  first,
  last,
  onMove,
}: {
  list: ReturnType<typeof useLists>[number];
  folders: ReturnType<typeof useFolders>;
  first: boolean;
  last: boolean;
  onMove: (direction: -1 | 1) => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div>
      <div className="list-row">
        <Reorder label={list.name} first={first} last={last} onMove={onMove} />
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
