import React from "react";
import ReadmeViewer from "../components/ReadmeViewer";

export default function DocumentationPage(): JSX.Element {
  return (
    <div style={{ padding: 24 }}>
      <h1>Project Documentation</h1>
      <ReadmeViewer />
    </div>
  );
}