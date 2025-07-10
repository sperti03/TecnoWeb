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
    <form onSubmit={handleSubmit} className="notes-form">
      <div className="form-group">
        <input
          type="text"
          placeholder="Titolo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <textarea
          placeholder="Scrivi la tua nota... (markdown supportato)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Tipo di accesso:</label>
        <select
          value={accessType}
          onChange={(e) => setAccessType(e.target.value as any)}
        >
          <option value="public">Pubblica</option>
          <option value="private">Privata</option>
          <option value="limited">Limitata</option>
        </select>
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
                style={{ marginRight: 4 }}
              />
              <span
                style={{
                  flex: 1,
                  textDecoration: todo.checked ? "line-through" : undefined,
                  color: todo.checked ? "#b0b0b0" : undefined,
                  wordBreak: "break-word",
                }}
              >
                {todo.text}
              </span>
              {todo.deadline && (
                <small style={{ marginLeft: 8 }}>
                  Scadenza: {todo.deadline}
                </small>
              )}
              <button
                type="button"
                aria-label="Elimina to-do"
                onClick={() => handleDeleteTodo(idx)}
                style={{
                  marginLeft: "auto",
                  background: "#fff",
                  border: "none",
                  color: "#b0b0b0",
                  fontSize: "1.1em",
                  cursor: "pointer",
                  position: "relative",
                  zIndex: 1,
                  boxShadow: "0 1px 3px #e0e0e022",
                  borderRadius: "50%",
                }}
              >
                &times;
              </button>
            </label>
          ))}
        </div>
      </div>
      <button type="submit" className="save-btn">
        {note ? "Aggiorna Nota" : "Salva Nota"}
      </button>
    </form>
  );
};

export default NoteForm;
