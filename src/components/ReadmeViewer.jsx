import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./ReadmeViewer.css";

export default function ReadmeViewer(): JSX.Element {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/README.md")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => setContent(text))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="readme-error">Failed to load README: {error}</div>;
  if (content === null) return <div className="readme-loading">Loading README…</div>;

  return (
    <div className="readme-container">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}