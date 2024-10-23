import { Message } from "./MessageTypes";
import React, { useState } from "react";
import express from "express";
import mongoose from "mongoose";
import { SendMessageToUser, getMessagesForUser } from "./MessageService";
import User from "./../backend/UserModel";

const MessageList: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newContent, setNewContent] = useState(""); // Stato per il nuovo messaggio
  const [dest, setDest] = useState("");
  const [activeTab, setActiveTab] = useState("send"); // Stato per gestire la scheda attiva

  const toggleMessageList = () => {
    setIsOpen(!isOpen);
  };

  const handleGetMessage = async () => {
    setActiveTab("received");
    const messages = await getMessagesForUser(""); // Passa l'ID dell'utente se necessario
    setMessages(messages);
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newContent.trim() === "" || dest.trim() === "") {
      alert("Nome destinatario e contenuto non possono essere vuoti");
      return;
    }

    try {
      await SendMessageToUser(newContent, dest);
      setNewContent("");
      setDest("");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <button onClick={toggleMessageList}>
        <i className="bi bi-chat"></i>
      </button>

      {isOpen && (
        <div className="message-list">
          <button className="close-button" onClick={toggleMessageList}>
            &times; {/* Icona della X */}
          </button>
          <div className="tab-headers">
            <h3
              onClick={() => setActiveTab("send")}
              className={activeTab === "send" ? "active" : ""}
            >
              Invia Messaggio
            </h3>
            <h3
              onClick={() => {
                handleGetMessage(); // Recupera messaggi quando clicchi sulla scheda
              }}
              className={activeTab === "received" ? "active" : ""}
            >
              Messaggi Ricevuti
            </h3>
          </div>

          {/* Sezione Invia Messaggio */}
          {activeTab === "send" && (
            <div className="message-send">
              <h3>Invia un messaggio</h3>
              <form onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Nome destinatario"
                  value={dest}
                  onChange={(e) => setDest(e.target.value)}
                  required
                />
                <textarea
                  placeholder="Scrivi un messaggio..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  required
                ></textarea>
                <button type="submit">Invia</button>
              </form>
            </div>
          )}

          {/* Sezione Messaggi Ricevuti */}
          {activeTab === "received" && (
            <div className="message-received">
              <h3>Messaggi ricevuti</h3>
              <ul>
                {messages.map((message) => (
                  <li key={message._id}>
                    <strong>{message.senderId}:</strong> {message.content}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default MessageList;
