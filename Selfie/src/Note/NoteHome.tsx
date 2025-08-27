import React, { useEffect, useState, useRef } from "react";
import "./notestyle.css";

import {
  getNotesForUser,
  addNoteForUser,
  updateNoteForUser,
  deleteNoteForUser,
  getUsers,
  NoteCalendarIntegration,
} from "./NoteService"; // Funzioni note

import NoteForm from "./EditNoteForm";
import { SortCriteria, Note, TodoItem } from "./types";
import { marked } from "marked";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { MdEdit, MdDelete } from "react-icons/md";

type User = {
  _id: string;
  username: string;
};

const NoteHome: React.FC = () => {
  // Stati
  const [notes, setNotes] = useState<Note[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>("date");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newAccessType, setNewAccessType] = useState("public");
  const [newLimitedUsers, setNewLimitedUsers] = useState<string[]>([]);
  const [newTodos, setNewTodos] = useState<TodoItem[]>([]);
  const [todoText, setTodoText] = useState("");
  const [todoDeadline, setTodoDeadline] = useState("");

  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [isEditFormVisible, setEditFormVisible] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const addModalRef = useRef<HTMLDivElement>(null);

  // Calendar integration states
  const [calendarAutoSync, setCalendarAutoSync] = useState(
    NoteCalendarIntegration.isAutoSyncEnabled()
  );
  const [calendarEventsCount, setCalendarEventsCount] = useState(0);
  const [syncLoading, setSyncLoading] = useState(false);

  // Caricamento note e utenti all'inizio
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [fetchedNotes, fetchedUsers]: [Note[], User[]] =
          await Promise.all([getNotesForUser(""), getUsers()]);
        setNotes(fetchedNotes);
        setUsers(fetchedUsers);
        setUserSuggestions(fetchedUsers.map((u: User) => u.username));
      } catch (err) {
        setError("Errore nel recupero delle note o utenti");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Chiudi la modal cliccando fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isAddModalOpen &&
        addModalRef.current &&
        !addModalRef.current.contains(event.target as Node)
      ) {
        setAddModalOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAddModalOpen]);

  // Gestione blocco scroll quando la modal è aperta
  useEffect(() => {
    if (isAddModalOpen || isEditFormVisible) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isAddModalOpen, isEditFormVisible]);

  // Mappa userId -> username
  const userMap = React.useMemo(() => {
    const map: { [key: string]: string } = {};
    users.forEach((user) => {
      map[user._id] = user.username;
    });
    return map;
  }, [users]);

  // Funzioni gestione note

  const handleUpdateNote = async (
    noteId: string | null,
    title: string,
    content: string,
    accessType: "public" | "private" | "limited",
    accessList: string[],
    todos: TodoItem[]
  ) => {
    let safeAccessList = accessList;
    if (accessType === "limited") {
      if (username && !safeAccessList.includes(username)) {
        safeAccessList = [...safeAccessList, username];
      }
    }
    try {
      const updatedNote = await updateNoteForUser(
        noteId,
        title,
        content,
        accessType,
        safeAccessList,
        todos
      );
      setNotes(notes.map((note) => (note._id === noteId ? updatedNote : note)));
      setCurrentNote(null);
      setEditFormVisible(false);
    } catch (error) {
      console.error("Errore nell'aggiornamento della nota:", error);
    }
  };

  const handleEditNote = (note: Note) => {
    setCurrentNote(note);
    setEditFormVisible(true);
  };

  const handleAddNote = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!newNoteTitle || !newNoteContent) {
      setError("Il titolo e il contenuto sono obbligatori");
      return;
    }

    let accessList = newLimitedUsers;
    if (newAccessType === "limited") {
      // aggiungi lo username dell'autore se non già presente
      if (username && !accessList.includes(username)) {
        accessList = [...accessList, username];
      }
    }

    try {
      const newNote = await addNoteForUser(
        newNoteTitle,
        newNoteContent,
        newAccessType,
        accessList,
        newTodos
      );
      setNotes([...notes, newNote]);
      setNewNoteTitle("");
      setNewNoteContent("");
      setNewAccessType("public");
      setNewLimitedUsers([]);
      setNewTodos([]);
      setError(null);
      setAddModalOpen(false); // Chiudi la modal dopo l'aggiunta
    } catch (err) {
      setError("Errore durante l'aggiunta della nota");
      console.error(err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNoteForUser(noteId);
      setNotes(notes.filter((note) => note._id !== noteId));
    } catch (error) {
      setError("Errore durante l'eliminazione della nota");
      console.error(error);
    }
  };

  const handleSortChange = (criteria: SortCriteria) => {
    setSortCriteria(criteria);
    const sortedNotes = [...notes];
    switch (criteria) {
      case "title":
        sortedNotes.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "date":
        sortedNotes.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "length":
        sortedNotes.sort((a, b) => a.content.length - b.content.length);
        break;
      default:
        break;
    }
    setNotes(sortedNotes);
  };

  const handleAddTodo = () => {
    if (todoText.trim() !== "") {
      setNewTodos([
        ...newTodos,
        { text: todoText, checked: false, deadline: todoDeadline || undefined },
      ]);
      setTodoText("");
      setTodoDeadline("");
    }
  };

  const handleToggleTodo = (idx: number) => {
    setNewTodos(
      newTodos.map((todo, i) =>
        i === idx ? { ...todo, checked: !todo.checked } : todo
      )
    );
  };

  const handleDeleteTodo = (idx: number) => {
    setNewTodos(newTodos.filter((_, i) => i !== idx));
  };

  // Funzione per togglare il completamento di un to-do in una nota
  const handleToggleTodoInNote = async (note: Note, todoIdx: number) => {
    if (!note.todos) return;
    const updatedTodos = note.todos.map((todo, idx) =>
      idx === todoIdx ? { ...todo, checked: !todo.checked } : todo
    );
    await handleUpdateNote(
      note._id,
      note.title,
      note.content,
      note.accessType,
      note.accessList,
      updatedTodos
    );
  };

  // Calendar integration functions
  const handleToggleAutoSync = async (enabled: boolean) => {
    setCalendarAutoSync(enabled);
    NoteCalendarIntegration.setAutoSync(enabled);

    if (enabled) {
      // If enabling, sync all current notes
      setSyncLoading(true);
      let totalCreated = 0;
      try {
        for (const note of notes) {
          if (
            note.todos &&
            note.todos.some((todo) => todo.deadline && !todo.checked)
          ) {
            const result = await NoteCalendarIntegration.syncNoteToCalendar(
              note,
              false
            );
            totalCreated += result.created;
          }
        }
        await loadCalendarEventsCount();
        alert(
          `✅ Auto-sync attivato! Creati ${totalCreated} eventi calendario.`
        );
      } catch (error) {
        console.error("Errore durante sync:", error);
        alert("❌ Errore durante la sincronizzazione");
      } finally {
        setSyncLoading(false);
      }
    }
  };

  const handleManualSyncAll = async () => {
    setSyncLoading(true);
    let totalCreated = 0;
    let totalErrors = 0;

    try {
      for (const note of notes) {
        if (
          note.todos &&
          note.todos.some((todo) => todo.deadline && !todo.checked)
        ) {
          const result = await NoteCalendarIntegration.syncNoteToCalendar(
            note,
            true
          );
          totalCreated += result.created;
          totalErrors += result.errors;
        }
      }

      await loadCalendarEventsCount();

      if (totalErrors === 0) {
        alert(
          `✅ Sincronizzazione completata! ${totalCreated} eventi calendario aggiornati.`
        );
      } else {
        alert(
          `⚠️ Sincronizzazione completata con ${totalErrors} errori. ${totalCreated} eventi creati.`
        );
      }
    } catch (error) {
      console.error("Errore sync manuale:", error);
      alert("❌ Errore durante la sincronizzazione manuale");
    } finally {
      setSyncLoading(false);
    }
  };

  const loadCalendarEventsCount = async () => {
    try {
      const events = await NoteCalendarIntegration.getCalendarEventsFromNotes();
      setCalendarEventsCount(events.length);
    } catch (error) {
      console.error("Errore caricamento eventi calendario:", error);
    }
  };

  const handleSyncSingleNote = async (note: Note) => {
    if (
      !note.todos ||
      !note.todos.some((todo) => todo.deadline && !todo.checked)
    ) {
      alert("ℹ️ Questa nota non ha to-do con scadenze da sincronizzare");
      return;
    }

    try {
      const result = await NoteCalendarIntegration.syncNoteToCalendar(
        note,
        true
      );
      await loadCalendarEventsCount();

      if (result.errors === 0) {
        alert(
          `✅ Nota sincronizzata! ${result.created} eventi calendario creati.`
        );
      } else {
        alert(
          `⚠️ Nota sincronizzata con ${result.errors} errori. ${result.created} eventi creati.`
        );
      }
    } catch (error) {
      console.error("Errore sync nota:", error);
      alert("❌ Errore durante la sincronizzazione della nota");
    }
  };

  // Load calendar events count on component mount
  useEffect(() => {
    loadCalendarEventsCount();
  }, []);

  if (loading) {
    return <div>Caricamento in corso...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  // Estrai userId e username dal token JWT
  let userId = localStorage.getItem("userId") ?? "";
  let username = "";
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const decoded = jwtDecode(token) as JwtPayload & { username?: string };
      if (decoded && typeof decoded === "object" && decoded.username) {
        username = decoded.username;
      }
    } catch (e) {
      // ignore
    }
  }

  // Rimuovo i log di debug
  // console.log('userId:', userId, 'username:', username);
  // notes.forEach(note => {
  //   console.log('note', note._id, 'userId', note.userId, 'accessType', note.accessType);
  // });

  // Filtro note accessibili all'utente loggato
  const accessibleNotes = notes.filter((note) => {
    if (note.userId?.toString() === userId?.toString()) return true; // autore vede sempre le sue note
    if (note.accessType === "public") return true;
    if (note.accessType === "limited")
      return note.accessList.includes(username);
    return false;
  });

  return (
    <div className="notes-container">
      <h1>Le mie note</h1>

      {/* Calendar Integration Controls */}
      <div className="calendar-integration-panel">
        <div className="calendar-controls">
          <div className="calendar-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={calendarAutoSync}
                onChange={(e) => handleToggleAutoSync(e.target.checked)}
                disabled={syncLoading}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className="toggle-label">
              📅 Auto-sync to-do al calendario
            </span>
          </div>

          <div className="calendar-info">
            <span className="events-count">
              {calendarEventsCount} eventi da note nel calendario
            </span>
          </div>
        </div>

        <div className="calendar-actions">
          <button
            className="sync-btn"
            onClick={handleManualSyncAll}
            disabled={syncLoading}
            title="Sincronizza manualmente tutte le note con to-do"
          >
            {syncLoading ? "🔄" : "📅"}
            {syncLoading ? "Sincronizzando..." : "Sync Manuale"}
          </button>
        </div>
      </div>

      {/* Pulsante per aprire la modal */}
      <button className="add-note-btn" onClick={() => setAddModalOpen(true)}>
        + Nuova Nota
      </button>
      {/* Modal per aggiunta nota */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" ref={addModalRef}>
            <button
              className="modal-close"
              onClick={() => setAddModalOpen(false)}
            >
              &times;
            </button>
            <form onSubmit={handleAddNote} className="notes-form">
              <input
                type="text"
                placeholder="Titolo della nota"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                required
              />
              <textarea
                placeholder="Contenuto della nota"
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                required
              />
              <div>
                <label htmlFor="newAccessType">Tipo di accesso:</label>
                <select
                  id="newAccessType"
                  value={newAccessType}
                  onChange={(e) => setNewAccessType(e.target.value)}
                >
                  <option value="public">Pubblica</option>
                  <option value="private">Privata</option>
                  <option value="limited">Limitata</option>
                </select>
              </div>
              {newAccessType === "limited" && (
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="Aggiungi username"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                    }}
                    onFocus={() => setUserSearch("")}
                    autoComplete="off"
                  />
                  {userSearch && (
                    <ul
                      style={{
                        position: "absolute",
                        background: "#fff",
                        border: "1px solid #ccc",
                        zIndex: 10,
                        width: "100%",
                        maxHeight: 120,
                        overflowY: "auto",
                        listStyle: "none",
                        margin: 0,
                        padding: 0,
                      }}
                    >
                      {userSuggestions
                        .filter(
                          (u) =>
                            u
                              .toLowerCase()
                              .includes(userSearch.toLowerCase()) &&
                            !newLimitedUsers.includes(u)
                        )
                        .slice(0, 8)
                        .map((u, idx) => (
                          <li
                            key={idx}
                            style={{ padding: 8, cursor: "pointer" }}
                            onMouseDown={() => {
                              setNewLimitedUsers([...newLimitedUsers, u]);
                              setUserSearch("");
                            }}
                          >
                            {u}
                          </li>
                        ))}
                    </ul>
                  )}
                  <ul>
                    {newLimitedUsers.map((user, index) => (
                      <li key={index}>{user}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <label>To-Do List:</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Nuovo to-do"
                    value={todoText}
                    onChange={(e) => setTodoText(e.target.value)}
                  />
                  <input
                    type="date"
                    value={todoDeadline}
                    onChange={(e) => setTodoDeadline(e.target.value)}
                  />
                  <button type="button" onClick={handleAddTodo}>
                    Aggiungi
                  </button>
                </div>
                <ul className="todo-list">
                  {newTodos.map((todo, idx) => (
                    <li key={idx} className={todo.checked ? "completed" : ""}>
                      <input
                        type="checkbox"
                        checked={todo.checked}
                        onChange={() => handleToggleTodo(idx)}
                        style={{ marginRight: 6 }}
                      />
                      <span>{todo.text}</span>
                      {todo.deadline && (
                        <small>Scadenza: {todo.deadline}</small>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteTodo(idx)}
                        style={{ marginLeft: 8 }}
                      >
                        X
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <button type="submit">Aggiungi nota</button>
            </form>
          </div>
        </div>
      )}

      <div className="notes-sort">
        <label htmlFor="sort">Ordina per:</label>
        <select
          id="sort"
          value={sortCriteria}
          onChange={(e) => handleSortChange(e.target.value as SortCriteria)}
        >
          <option value="title">Titolo</option>
          <option value="date">Data</option>
          <option value="length">Lunghezza</option>
        </select>
      </div>

      <ul className="notes-list">
        {accessibleNotes.map((note) => {
          const previewTodos = note.todos ? note.todos.slice(0, 4) : [];
          const extraTodos =
            note.todos && note.todos.length > 4 ? note.todos.length - 4 : 0;
          return (
            <li key={note._id}>
              <div className="note-meta">
                <span className={`note-badge ${note.accessType}`}>
                  {note.accessType === "public"
                    ? "Pubblica"
                    : note.accessType === "private"
                    ? "Privata"
                    : "Limitata"}
                </span>
                <div className="note-footer">
                  <small>
                    Creato il: {new Date(note.createdAt).toLocaleDateString()}
                    {note.userId && (
                      <span className="note-author">
                        {" "}
                        &nbsp;|&nbsp; Autore:{" "}
                        {userMap[note.userId] || "Sconosciuto"}
                      </span>
                    )}
                  </small>
                </div>
              </div>
              <h3>{note.title}</h3>
              <div
                className="note-content-preview"
                dangerouslySetInnerHTML={{ __html: marked(note.content) }}
              ></div>
              {note.todos && note.todos.length > 0 && (
                <div className="todo-section todo-preview-row">
                  <strong style={{ marginRight: 8 }}>To-Do:</strong>
                  <div
                    className="todo-pill-row"
                    style={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "0.4em",
                    }}
                  >
                    {previewTodos.map((todo, idx) => (
                      <label
                        key={idx}
                        className={`todo-pill todo-pill-preview${
                          todo.checked ? " completed" : ""
                        }`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          cursor: "pointer",
                          padding: "0.18em 0.95em",
                          width: "100%",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={todo.checked}
                          disabled={note.userId?.toString() !== userId}
                          onChange={() =>
                            note.userId?.toString() === userId &&
                            handleToggleTodoInNote(note, idx)
                          }
                          style={{
                            marginRight: 4,
                            cursor:
                              note.userId?.toString() === userId
                                ? "pointer"
                                : "not-allowed",
                          }}
                        />
                        <span
                          style={{
                            textDecoration: todo.checked
                              ? "line-through"
                              : undefined,
                            color: todo.checked ? "#b0b0b0" : undefined,
                          }}
                        >
                          {todo.text}
                        </span>
                      </label>
                    ))}
                    {extraTodos > 0 && (
                      <span className="todo-pill todo-extra">
                        +{extraTodos} altro{extraTodos > 1 ? "i" : ""}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {note.userId?.toString() === userId && (
                <div className="note-actions note-actions-right">
                  {note.todos &&
                    note.todos.some(
                      (todo) => todo.deadline && !todo.checked
                    ) && (
                      <button
                        onClick={() => handleSyncSingleNote(note)}
                        title="Sincronizza to-do di questa nota al calendario"
                        className="sync-note-btn"
                      >
                        📅
                      </button>
                    )}
                  <button
                    onClick={() => handleEditNote(note)}
                    title="Modifica nota"
                  >
                    <MdEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note._id)}
                    title="Elimina nota"
                  >
                    <MdDelete />
                  </button>
                </div>
              )}
            </li>
          );
        })}
        {isEditFormVisible && currentNote && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button
                className="modal-close"
                onClick={() => setEditFormVisible(false)}
              >
                &times;
              </button>
              <NoteForm note={currentNote} onSave={handleUpdateNote} />
            </div>
          </div>
        )}
      </ul>
    </div>
  );
};

export const returnfirstNote = async (sortCriteria: SortCriteria) => {
  try {
    const notes = await getNotesForUser(""); // Ottieni le note dell'utente

    if (notes.length > 0) {
      // Ordina le note in base al criterio selezionato
      switch (sortCriteria) {
        case "title":
          notes.sort((a: Note, b: Note) => a.title.localeCompare(b.title));
          break;
        case "date":
          notes.sort(
            (a: Note, b: Note) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
        case "length":
          notes.sort((a: Note, b: Note) => a.content.length - b.content.length);
          break;
        default:
          break;
      }

      return notes[0]; // Restituisci la prima nota in base all'ordinamento
    } else {
      return null; // Nessuna nota trovata
    }
  } catch (error) {
    console.error("Errore nel recupero della prima nota:", error);
    return null;
  }
};

export default NoteHome;
