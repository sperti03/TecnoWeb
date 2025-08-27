import React, { useState, useEffect } from "react";
import { Note, TodoItem } from "./types";
import "./notestyle.css";

interface NoteFormProps {
  note?: Note;
  onSave: (
    id: string | null,
    title: string,
    content: string,
    accessType: "public" | "private" | "limited",
    accessList: string[],
    todos: TodoItem[]
  ) => void;
}

const NoteForm: React.FC<NoteFormProps> = ({ note, onSave }) => {
  const [title, setTitle] = useState(note ? note.title : "");
  const [content, setContent] = useState(note ? note.content : "");
  const [accessType, setAccessType] = useState<
    "public" | "private" | "limited"
  >(note ? note.accessType : "public");
  const [accessList, setAccessList] = useState<string[]>(
    note ? note.accessList : []
  );
  const [todoText, setTodoText] = useState("");
  const [todoDeadline, setTodoDeadline] = useState("");
  const [todos, setTodos] = useState<TodoItem[]>(
    note && note.todos ? note.todos : []
  );

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setAccessType(note.accessType);
      setAccessList(note.accessList);
      setTodos(note.todos || []);
    }
  }, [note]);

  const handleAddTodo = () => {
    if (todoText.trim() !== "") {
      setTodos([
        ...todos,
        { text: todoText, checked: false, deadline: todoDeadline || undefined },
      ]);
      setTodoText("");
      setTodoDeadline("");
    }
  };

  const handleToggleTodo = (idx: number) => {
    setTodos(
      todos.map((todo, i) =>
        i === idx ? { ...todo, checked: !todo.checked } : todo
      )
    );
  };

  const handleDeleteTodo = (idx: number) => {
    setTodos(todos.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const noteId = note ? note._id : null;
    onSave(noteId, title, content, accessType, accessList, todos);
    if (!note) {
      setTitle("");
      setContent("");
      setAccessType("public");
      setAccessList([]);
      setTodos([]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="notes-form notes-edit-form">
      <div className="form-row">
        <div className="form-group">
          <label>Titolo</label>
          <input
            type="text"
            placeholder="Titolo della nota"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <small className="helper-text">{title.length} caratteri</small>
        </div>
        <div className="form-group">
          <label>Tipo di accesso</label>
          <select
            value={accessType}
            onChange={(e) => setAccessType(e.target.value as any)}
          >
            <option value="public">Pubblica</option>
            <option value="private">Privata</option>
            <option value="limited">Limitata</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Contenuto</label>
        <textarea
          placeholder="Scrivi la tua nota... (markdown supportato)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <small className="helper-text">{content.length} caratteri</small>
      </div>
      {accessType === "limited" && (
        <div className="form-group">
          <input
            type="text"
            placeholder="Aggiungi username"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const username = e.currentTarget.value.trim();
                if (username && !accessList.includes(username)) {
                  setAccessList([...accessList, username]);
                }
                e.currentTarget.value = "";
              }
            }}
          />
          <ul className="access-list">
            {accessList.map((user, idx) => (
              <li key={idx}>{user}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="form-group">
        <label>To-Do List:</label>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <input
            type="text"
            placeholder="Nuovo to-do"
            value={todoText}
            onChange={(e) => setTodoText(e.target.value)}
            style={{
              flex: 1,
              padding: "0.7rem 1rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              background: "rgba(255, 255, 255, 0.05)",
              color: "var(--text-color)",
            }}
          />
          <input
            type="date"
            value={todoDeadline}
            onChange={(e) => setTodoDeadline(e.target.value)}
            style={{
              width: "140px",
              padding: "0.7rem 0.5rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              background: "rgba(255, 255, 255, 0.05)",
              color: "var(--text-color)",
            }}
          />
          <button
            type="button"
            onClick={handleAddTodo}
            style={{
              background: "var(--primary-color)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "0.7rem 1rem",
              cursor: "pointer",
              fontWeight: 500,
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
            }}
          >
            Aggiungi
          </button>
        </div>
        <div
          className="todo-pill-row"
          style={{
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "0.3em",
          }}
        >
          {todos.map((todo, idx) => (
            <label
              key={idx}
              className={`todo-pill${todo.checked ? " completed" : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                padding: "0.18em 0.95em",
                marginBottom: "0.2em",
                width: "100%",
                boxSizing: "border-box",
                position: "relative",
              }}
            >
              <input
                type="checkbox"
                checked={todo.checked}
                onChange={() => handleToggleTodo(idx)}
                style={{
                  marginRight: 8,
                  accentColor: "var(--primary-color)",
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                }}
              />
              <span
                style={{
                  flex: 1,
                  textDecoration: todo.checked ? "line-through" : undefined,
                  color: todo.checked
                    ? "rgba(255, 255, 255, 0.5)"
                    : "var(--text-color)",
                  wordBreak: "break-word",
                  fontSize: "0.95rem",
                  transition: "all 0.2s ease",
                }}
              >
                {todo.text}
              </span>
              {todo.deadline && (
                <small
                  style={{
                    marginLeft: 8,
                    color: "var(--primary-color)",
                    fontSize: "0.85rem",
                    background: "rgba(59, 130, 246, 0.1)",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {todo.deadline}
                </small>
              )}
              <button
                type="button"
                aria-label="Elimina to-do"
                onClick={() => handleDeleteTodo(idx)}
                style={{
                  marginLeft: "auto",
                  background: "rgba(239, 68, 68, 0.2)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#ef4444",
                  fontSize: "1rem",
                  cursor: "pointer",
                  position: "relative",
                  zIndex: 1,
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
              >
                &times;
              </button>
            </label>
          ))}
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="save-btn">
          {note ? "Aggiorna Nota" : "Salva Nota"}
        </button>
      </div>
    </form>
  );
};

export default NoteForm;
