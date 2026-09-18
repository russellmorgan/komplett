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

// Lists screen: Inbox, top-level lists, and folders (with their lists nested). Create/rename/
// delete/reorder/move-to-folder/color live here; task rows link back via a plain <select>.
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
    <div className="lists">
      <h1>Lists</h1>
      <NavLink to="/" end className="list-name">
        Inbox
      </NavLink>

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

      <button type="button" onClick={() => createList(null)}>
        + New list
      </button>

      {sortedFolders.map((folder, i) => {
        const folderLists = sortByOrder(lists.filter((l) => l.folderId === folder.id));
        return (
          <div key={folder.id} className="folder">
            <div className="list-row">
              <strong>{folder.name}</strong>
              <span className="move">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => moveFolder(i, -1)}
                  aria-label="Move folder up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={i === sortedFolders.length - 1}
                  onClick={() => moveFolder(i, 1)}
                  aria-label="Move folder down"
                >
                  ↓
                </button>
              </span>
              <button
                type="button"
                onClick={() => {
                  const name = window.prompt("Rename folder", folder.name);
                  if (name?.trim()) updateFolder(folder.id, { name: name.trim() });
                }}
              >
                Rename
              </button>
              <button type="button" onClick={() => deleteFolder(folder.id)}>
                Delete
              </button>
            </div>
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
            <button type="button" onClick={() => createList(folder.id)}>
              + New list in {folder.name}
            </button>
          </div>
        );
      })}

      <button type="button" onClick={createFolder}>
        + New folder
      </button>
    </div>
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
  return (
    <div className="list-row">
      <NavLink
        to={`/list/${list.id}`}
        className="list-name"
        style={{ color: `var(--list-${list.color})` }}
      >
        {list.name}
      </NavLink>
      <select
        aria-label={`${list.name} color`}
        value={list.color}
        onChange={(e) => updateList(list.id, { color: e.target.value as ListColor })}
      >
        {LIST_COLORS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        aria-label={`Move ${list.name} to folder`}
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
      <span className="move">
        <button
          type="button"
          disabled={first}
          onClick={() => onMove(-1)}
          aria-label={`Move ${list.name} up`}
        >
          ↑
        </button>
        <button
          type="button"
          disabled={last}
          onClick={() => onMove(1)}
          aria-label={`Move ${list.name} down`}
        >
          ↓
        </button>
      </span>
      <button
        type="button"
        onClick={() => {
          const name = window.prompt("Rename list", list.name);
          if (name?.trim()) updateList(list.id, { name: name.trim() });
        }}
      >
        Rename
      </button>
      <button
        type="button"
        onClick={() => {
          if (window.confirm(`Delete "${list.name}" and all its tasks?`)) deleteList(list.id);
        }}
      >
        Delete
      </button>
    </div>
  );
}
